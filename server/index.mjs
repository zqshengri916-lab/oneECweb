import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  articleFromRow,
  attachUserToSession,
  createSession,
  getCart,
  getCatalog,
  getFavorites,
  getOrders,
  getUserByEmail,
  openDatabase,
  orderFromRow,
  publicUser,
  readSession,
  resetCatalog,
} from "./db.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DATABASE = path.join(root, "data", "qingyu.db");
const SESSION_COOKIE = "qy_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(body);
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1
          ? [part, ""]
          : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

function sessionCookie(token, maxAge = SESSION_MAX_AGE_SECONDS) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

function ensureSession(db, req, res) {
  const cookies = parseCookies(req.headers.cookie);
  let session = readSession(db, cookies[SESSION_COOKIE]);
  if (!session) {
    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(
      Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    ).toISOString();
    createSession(db, token, expiresAt);
    session = { token, user: null };
    res.setHeader("Set-Cookie", sessionCookie(token));
  }
  return session;
}

function ownerKey(session) {
  return session.user ? `u:${session.user.id}` : `s:${session.token}`;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new HttpError(413, "请求内容过大");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "请求 JSON 格式不正确");
  }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${digest}`;
}

function passwordMatches(password, stored) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function assertEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function registerUser(db, req, res, session, body) {
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!name || !assertEmail(email) || password.length < 6) {
    throw new HttpError(400, "请填写称呼、有效邮箱和至少 6 位密码");
  }
  if (getUserByEmail(db, email)) {
    throw new HttpError(409, "该邮箱已注册");
  }
  const userId = `u-${randomUUID()}`;
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, joined_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, name, email, hashPassword(password), new Date().toISOString());
  attachUserToSession(db, session.token, userId);
  const user = publicUser(getUserByEmail(db, email));
  sendJson(res, 201, { user });
}

function loginUser(db, res, session, body) {
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!assertEmail(email) || password.length < 6) {
    throw new HttpError(400, "请输入有效邮箱和至少 6 位密码");
  }
  const row = getUserByEmail(db, email);
  if (!row || !passwordMatches(password, row.password_hash)) {
    throw new HttpError(401, "邮箱或密码不正确");
  }
  attachUserToSession(db, session.token, row.id);
  sendJson(res, 200, { user: publicUser(row) });
}

function validateProduct(body) {
  const product = {
    ...body,
    id: String(body.id ?? ""),
    slug: String(body.slug ?? "").trim(),
    name: String(body.name ?? "").trim(),
    category: String(body.category ?? ""),
    price: Number(body.price),
    originalPrice:
      body.originalPrice == null || body.originalPrice === ""
        ? null
        : Number(body.originalPrice),
    summary: String(body.summary ?? "").trim(),
    description: String(body.description ?? "").trim(),
    features: Array.isArray(body.features) ? body.features : [],
    specs: Array.isArray(body.specs) ? body.specs : [],
    rating: Number(body.rating ?? 0),
    reviewCount: Number(body.reviewCount ?? 0),
    inventory: Number(body.inventory ?? 0),
    art: String(body.art ?? "notebook"),
    color: String(body.color ?? "#617660"),
    badge: body.badge ? String(body.badge) : null,
    featured: Boolean(body.featured),
    createdAt: String(body.createdAt ?? new Date().toISOString().slice(0, 10)),
  };
  if (
    !product.id ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) ||
    !product.name ||
    !["study", "audio", "commute", "desk"].includes(product.category) ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    !Number.isInteger(product.inventory) ||
    product.inventory < 0
  ) {
    throw new HttpError(400, "商品字段不完整或格式不正确");
  }
  return product;
}

function saveProduct(db, body) {
  const product = validateProduct(body);
  db.prepare(
    `INSERT INTO products (
       id, slug, name, category, price, original_price, summary, description,
       features_json, specs_json, rating, review_count, inventory, art, color,
       badge, featured, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       name = excluded.name,
       category = excluded.category,
       price = excluded.price,
       original_price = excluded.original_price,
       summary = excluded.summary,
       description = excluded.description,
       features_json = excluded.features_json,
       specs_json = excluded.specs_json,
       rating = excluded.rating,
       review_count = excluded.review_count,
       inventory = excluded.inventory,
       art = excluded.art,
       color = excluded.color,
       badge = excluded.badge,
       featured = excluded.featured,
       created_at = excluded.created_at`,
  ).run(
    product.id,
    product.slug,
    product.name,
    product.category,
    product.price,
    product.originalPrice,
    product.summary,
    product.description,
    JSON.stringify(product.features),
    JSON.stringify(product.specs),
    product.rating,
    product.reviewCount,
    product.inventory,
    product.art,
    product.color,
    product.badge,
    product.featured ? 1 : 0,
    product.createdAt,
  );
  return product;
}

function validateArticle(body) {
  const article = {
    ...body,
    id: String(body.id ?? ""),
    slug: String(body.slug ?? "").trim(),
    category: String(body.category ?? ""),
    title: String(body.title ?? "").trim(),
    excerpt: String(body.excerpt ?? "").trim(),
    body: Array.isArray(body.body)
      ? body.body.map((paragraph) => String(paragraph).trim()).filter(Boolean)
      : [],
    publishedAt: String(body.publishedAt ?? ""),
    readTime: Number(body.readTime ?? 1),
    art: String(body.art ?? "notebook"),
    color: String(body.color ?? "#617660"),
  };
  if (
    !article.id ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) ||
    !article.title ||
    article.body.length === 0 ||
    !Number.isInteger(article.readTime) ||
    article.readTime < 1
  ) {
    throw new HttpError(400, "文章字段不完整或格式不正确");
  }
  return article;
}

function saveArticle(db, body) {
  const article = validateArticle(body);
  db.prepare(
    `INSERT INTO articles (
       id, slug, category, title, excerpt, body_json, published_at, read_time,
       art, color
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       category = excluded.category,
       title = excluded.title,
       excerpt = excluded.excerpt,
       body_json = excluded.body_json,
       published_at = excluded.published_at,
       read_time = excluded.read_time,
       art = excluded.art,
       color = excluded.color`,
  ).run(
    article.id,
    article.slug,
    article.category,
    article.title,
    article.excerpt,
    JSON.stringify(article.body),
    article.publishedAt,
    article.readTime,
    article.art,
    article.color,
  );
  return article;
}

function createOrder(db, session, body) {
  const customer = {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    address: String(body.address ?? "").trim(),
    note: body.note ? String(body.note).trim() : null,
  };
  if (
    !customer.name ||
    !assertEmail(customer.email) ||
    !/^1\d{10}$/.test(customer.phone) ||
    !customer.address
  ) {
    throw new HttpError(400, "收货信息不完整或格式不正确");
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const cart = db
      .prepare(
        `SELECT p.*, c.quantity
         FROM cart_items c
         JOIN products p ON p.id = c.product_id
         WHERE c.owner_key = ?
         ORDER BY c.updated_at`,
      )
      .all(ownerKey(session));
    if (cart.length === 0) throw new HttpError(400, "购物袋为空");
    const invalid = cart.find((item) => item.quantity > item.inventory);
    if (invalid) {
      throw new HttpError(409, `「${invalid.name}」库存不足`);
    }

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shipping = subtotal >= 299 ? 0 : 18;
    const discount = subtotal >= 599 ? 40 : 0;
    const total = subtotal + shipping - discount;
    const id = `QY${Date.now().toString().slice(-9)}${randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO orders (
         id, user_id, session_id, subtotal, shipping, discount, total, status,
         customer_name, customer_email, customer_phone, customer_address,
         customer_note, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      session.user?.id ?? null,
      session.token,
      subtotal,
      shipping,
      discount,
      total,
      "已确认",
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.note,
      createdAt,
    );
    const addLine = db.prepare(
      `INSERT INTO order_items (order_id, product_id, name, price, quantity, art)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const reduceInventory = db.prepare(
      "UPDATE products SET inventory = inventory - ? WHERE id = ?",
    );
    for (const item of cart) {
      addLine.run(
        id,
        item.id,
        item.name,
        item.price,
        item.quantity,
        item.art,
      );
      reduceInventory.run(item.quantity, item.id);
    }
    db.prepare("DELETE FROM cart_items WHERE owner_key = ?").run(
      ownerKey(session),
    );
    db.exec("COMMIT");
    return orderFromRow(
      db,
      db.prepare("SELECT * FROM orders WHERE id = ?").get(id),
    );
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function handleApi(req, res, url, db, session) {
  const { pathname } = url;
  const owner = ownerKey(session);

  if (req.method === "GET" && pathname === "/api/health") {
    const counts = {
      products: db.prepare("SELECT COUNT(*) AS count FROM products").get().count,
      articles: db.prepare("SELECT COUNT(*) AS count FROM articles").get().count,
      users: db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
      orders: db.prepare("SELECT COUNT(*) AS count FROM orders").get().count,
    };
    sendJson(res, 200, {
      status: "ok",
      engine: "SQLite",
      connected: true,
      counts,
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/bootstrap") {
    sendJson(res, 200, {
      ...getCatalog(db),
      cart: getCart(db, owner),
      favorites: getFavorites(db, owner),
      user: session.user,
      orders: getOrders(db, session),
    });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/register") {
    readJson(req).then((body) =>
      registerUser(db, req, res, session, body),
    ).catch((error) => sendError(res, error));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    readJson(req)
      .then((body) => loginUser(db, res, session, body))
      .catch((error) => sendError(res, error));
    return true;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    db.prepare("UPDATE sessions SET user_id = NULL WHERE token = ?").run(
      session.token,
    );
    sendJson(res, 200, { user: null });
    return true;
  }

  const cartMatch = pathname.match(/^\/api\/cart\/([^/]+)$/);
  if (cartMatch && (req.method === "PUT" || req.method === "DELETE")) {
    const productId = decodeURIComponent(cartMatch[1]);
    const product = db
      .prepare("SELECT id, inventory FROM products WHERE id = ?")
      .get(productId);
    if (!product) throw new HttpError(404, "商品不存在");

    readJson(req)
      .then((body) => {
        const quantity =
          req.method === "DELETE" ? 0 : Number(body.quantity ?? 1);
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10) {
          throw new HttpError(400, "商品数量必须为 1 至 10 的整数");
        }
        if (quantity > product.inventory) {
          throw new HttpError(409, "商品库存不足");
        }
        if (quantity === 0) {
          db.prepare(
            "DELETE FROM cart_items WHERE owner_key = ? AND product_id = ?",
          ).run(owner, productId);
        } else {
          db.prepare(
            `INSERT INTO cart_items (owner_key, product_id, quantity, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(owner_key, product_id) DO UPDATE SET
               quantity = excluded.quantity,
               updated_at = excluded.updated_at`,
          ).run(owner, productId, quantity, new Date().toISOString());
        }
        sendJson(res, 200, { cart: getCart(db, owner) });
      })
      .catch((error) => sendError(res, error));
    return true;
  }

  if (req.method === "DELETE" && pathname === "/api/cart") {
    db.prepare("DELETE FROM cart_items WHERE owner_key = ?").run(owner);
    sendJson(res, 200, { cart: [] });
    return true;
  }

  const favoriteMatch = pathname.match(/^\/api\/favorites\/([^/]+)$/);
  if (
    favoriteMatch &&
    (req.method === "PUT" || req.method === "DELETE")
  ) {
    const productId = decodeURIComponent(favoriteMatch[1]);
    if (req.method === "PUT") {
      const product = db
        .prepare("SELECT id FROM products WHERE id = ?")
        .get(productId);
      if (!product) throw new HttpError(404, "商品不存在");
      db.prepare(
        `INSERT OR IGNORE INTO favorites (owner_key, product_id, added_at)
         VALUES (?, ?, ?)`,
      ).run(owner, productId, new Date().toISOString());
    } else {
      db.prepare(
        "DELETE FROM favorites WHERE owner_key = ? AND product_id = ?",
      ).run(owner, productId);
    }
    sendJson(res, 200, { favorites: getFavorites(db, owner) });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/orders") {
    readJson(req)
      .then((body) => sendJson(res, 201, createOrder(db, session, body)))
      .catch((error) => sendError(res, error));
    return true;
  }

  if (req.method === "GET" && pathname === "/api/orders") {
    sendJson(res, 200, { orders: getOrders(db, session) });
    return true;
  }

  if (req.method === "PUT" && pathname === "/api/admin/products") {
    readJson(req)
      .then((body) => sendJson(res, 200, { product: saveProduct(db, body) }))
      .catch((error) => sendError(res, error));
    return true;
  }

  const deleteProductMatch = pathname.match(
    /^\/api\/admin\/products\/([^/]+)$/,
  );
  if (req.method === "DELETE" && deleteProductMatch) {
    const id = decodeURIComponent(deleteProductMatch[1]);
    const result = db.prepare("DELETE FROM products WHERE id = ?").run(id);
    if (result.changes === 0) throw new HttpError(404, "商品不存在");
    sendJson(res, 200, { deleted: id });
    return true;
  }

  if (req.method === "PUT" && pathname === "/api/admin/articles") {
    readJson(req)
      .then((body) => sendJson(res, 200, { article: saveArticle(db, body) }))
      .catch((error) => sendError(res, error));
    return true;
  }

  const deleteArticleMatch = pathname.match(
    /^\/api\/admin\/articles\/([^/]+)$/,
  );
  if (req.method === "DELETE" && deleteArticleMatch) {
    const id = decodeURIComponent(deleteArticleMatch[1]);
    const result = db.prepare("DELETE FROM articles WHERE id = ?").run(id);
    if (result.changes === 0) throw new HttpError(404, "文章不存在");
    sendJson(res, 200, { deleted: id });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/reset") {
    resetCatalog(db);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (pathname.startsWith("/api/")) {
    throw new HttpError(404, "接口不存在");
  }
  return false;
}

function sendError(res, error) {
  if (res.headersSent) return;
  const status = error instanceof HttpError ? error.status : 500;
  if (status === 500) console.error(error);
  sendJson(res, status, {
    error: status === 500 ? "服务器内部错误" : error.message,
  });
}

function serveStatic(req, res, url, distDir) {
  if (!["GET", "HEAD"].includes(req.method ?? "")) {
    res.writeHead(405);
    res.end();
    return;
  }
  const requestedPath =
    url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  let filePath = path.resolve(distDir, `.${requestedPath}`);
  if (!filePath.startsWith(`${distDir}${path.sep}`) && filePath !== distDir) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = path.join(distDir, "index.html");
  }
  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Build the frontend first with npm run build.");
    return;
  }
  const extension = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
    "Cache-Control":
      path.basename(filePath) === "index.html"
        ? "no-cache"
        : "public, max-age=31536000, immutable",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(filePath).pipe(res);
}

export function createApp({
  databasePath = process.env.DATABASE_PATH || DEFAULT_DATABASE,
  distDir = path.join(root, "dist"),
} = {}) {
  const db = openDatabase(databasePath);
  const server = createServer((req, res) => {
    Promise.resolve()
      .then(async () => {
        const host = req.headers.host ?? "localhost";
        const url = new URL(req.url ?? "/", `http://${host}`);
        if (url.pathname.startsWith("/api/")) {
          const session = ensureSession(db, req, res);
          if (!handleApi(req, res, url, db, session)) {
            sendError(res, new HttpError(404, "接口不存在"));
          }
          return;
        }
        serveStatic(req, res, url, distDir);
      })
      .catch((error) => sendError(res, error));
  });

  return {
    db,
    server,
    async listen(port = Number(process.env.PORT) || 3001, host = "127.0.0.1") {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, resolve);
      });
      return server.address();
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
      db.close();
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp();
  const address = await app.listen();
  const port = typeof address === "object" && address ? address.port : 3001;
  console.log(`Qingyu API and SQLite database are ready at http://127.0.0.1:${port}`);
  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
