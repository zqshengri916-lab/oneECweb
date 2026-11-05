import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const seedPath = path.join(import.meta.dirname, "seed.json");
const seedCatalog = JSON.parse(readFileSync(seedPath, "utf8"));

const SCHEMA = `
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    joined_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    original_price INTEGER,
    summary TEXT NOT NULL,
    description TEXT NOT NULL,
    features_json TEXT NOT NULL,
    specs_json TEXT NOT NULL,
    rating REAL NOT NULL,
    review_count INTEGER NOT NULL,
    inventory INTEGER NOT NULL CHECK (inventory >= 0),
    art TEXT NOT NULL,
    color TEXT NOT NULL,
    badge TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    body_json TEXT NOT NULL,
    published_at TEXT NOT NULL,
    read_time INTEGER NOT NULL,
    art TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    owner_key TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
    updated_at TEXT NOT NULL,
    PRIMARY KEY (owner_key, product_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    owner_key TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TEXT NOT NULL,
    PRIMARY KEY (owner_key, product_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    discount INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    art TEXT NOT NULL,
    PRIMARY KEY (order_id, product_id)
  );

  CREATE INDEX IF NOT EXISTS idx_cart_owner ON cart_items(owner_key);
  CREATE INDEX IF NOT EXISTS idx_favorites_owner ON favorites(owner_key);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
`;

function parseJson(value, fallback = []) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function productFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    summary: row.summary,
    description: row.description,
    features: parseJson(row.features_json),
    specs: parseJson(row.specs_json),
    rating: row.rating,
    reviewCount: row.review_count,
    inventory: row.inventory,
    art: row.art,
    color: row.color,
    badge: row.badge || undefined,
    featured: Boolean(row.featured),
    createdAt: row.created_at,
  };
}

export function articleFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    body: parseJson(row.body_json),
    publishedAt: row.published_at,
    readTime: row.read_time,
    art: row.art,
    color: row.color,
  };
}

function userFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    joinedAt: row.joined_at,
  };
}

export function orderFromRow(db, row) {
  if (!row) return null;
  const lines = db
    .prepare(
      `SELECT product_id, name, price, quantity, art
       FROM order_items
       WHERE order_id = ?
       ORDER BY rowid`,
    )
    .all(row.id)
    .map((line) => ({
      productId: line.product_id,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
      art: line.art,
    }));

  return {
    id: row.id,
    lines,
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount,
    total: row.total,
    status: row.status,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.customer_address,
      note: row.customer_note || undefined,
    },
    createdAt: row.created_at,
  };
}

export function getCatalog(db) {
  return {
    products: db
      .prepare("SELECT * FROM products ORDER BY created_at DESC, rowid DESC")
      .all()
      .map(productFromRow),
    articles: db
      .prepare("SELECT * FROM articles ORDER BY published_at DESC, rowid DESC")
      .all()
      .map(articleFromRow),
  };
}

export function getOrders(db, session) {
  const rows = session.user
    ? db
        .prepare(
          "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        )
        .all(session.user.id)
    : db
        .prepare(
          `SELECT * FROM orders
           WHERE session_id = ? AND user_id IS NULL
           ORDER BY created_at DESC`,
        )
        .all(session.token);
  return rows.map((row) => orderFromRow(db, row));
}

export function getCart(db, ownerKey) {
  return db
    .prepare(
      `SELECT product_id AS productId, quantity
       FROM cart_items
       WHERE owner_key = ?
       ORDER BY updated_at`,
    )
    .all(ownerKey);
}

export function getFavorites(db, ownerKey) {
  return db
    .prepare(
      `SELECT product_id
       FROM favorites
       WHERE owner_key = ?
       ORDER BY added_at`,
    )
    .all(ownerKey)
    .map((row) => row.product_id);
}

function insertSeedCatalog(db) {
  const productStatement = db.prepare(`
    INSERT INTO products (
      id, slug, name, category, price, original_price, summary, description,
      features_json, specs_json, rating, review_count, inventory, art, color,
      badge, featured, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const articleStatement = db.prepare(`
    INSERT INTO articles (
      id, slug, category, title, excerpt, body_json, published_at, read_time,
      art, color
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of seedCatalog.products) {
    productStatement.run(
      product.id,
      product.slug,
      product.name,
      product.category,
      product.price,
      product.originalPrice ?? null,
      product.summary,
      product.description,
      JSON.stringify(product.features),
      JSON.stringify(product.specs),
      product.rating,
      product.reviewCount,
      product.inventory,
      product.art,
      product.color,
      product.badge ?? null,
      product.featured ? 1 : 0,
      product.createdAt,
    );
  }

  for (const article of seedCatalog.articles) {
    articleStatement.run(
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
  }
}

export function resetCatalog(db) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM products; DELETE FROM articles;");
    insertSeedCatalog(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function openDatabase(databasePath) {
  if (databasePath !== ":memory:") {
    mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const db = new DatabaseSync(databasePath);
  db.exec(SCHEMA);
  const productCount = db
    .prepare("SELECT COUNT(*) AS count FROM products")
    .get().count;
  if (productCount === 0) {
    db.exec("BEGIN IMMEDIATE");
    try {
      insertSeedCatalog(db);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return db;
}

export function createSession(db, token, expiresAt) {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO sessions (token, user_id, created_at, expires_at)
     VALUES (?, NULL, ?, ?)`,
  ).run(token, now, expiresAt);
}

export function readSession(db, token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT sessions.token, sessions.expires_at, users.*
       FROM sessions
       LEFT JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ?`,
    )
    .get(token);
  if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
    if (row) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return {
    token: row.token,
    user: row.id ? userFromRow(row) : null,
  };
}

export function attachUserToSession(db, token, userId) {
  const guestOwner = `s:${token}`;
  const userOwner = `u:${userId}`;
  db.exec("BEGIN IMMEDIATE");
  try {
    const guestCart = db
      .prepare("SELECT product_id, quantity FROM cart_items WHERE owner_key = ?")
      .all(guestOwner);
    const findUserItem = db.prepare(
      "SELECT quantity FROM cart_items WHERE owner_key = ? AND product_id = ?",
    );
    const upsertUserItem = db.prepare(
      `INSERT INTO cart_items (owner_key, product_id, quantity, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(owner_key, product_id) DO UPDATE SET
         quantity = excluded.quantity,
         updated_at = excluded.updated_at`,
    );
    const now = new Date().toISOString();
    for (const item of guestCart) {
      const existing = findUserItem.get(userOwner, item.product_id);
      const quantity = Math.min(10, (existing?.quantity ?? 0) + item.quantity);
      upsertUserItem.run(userOwner, item.product_id, quantity, now);
    }
    db.prepare(
      `INSERT OR IGNORE INTO favorites (owner_key, product_id, added_at)
       SELECT ?, product_id, added_at FROM favorites WHERE owner_key = ?`,
    ).run(userOwner, guestOwner);
    db.prepare("DELETE FROM cart_items WHERE owner_key = ?").run(guestOwner);
    db.prepare("DELETE FROM favorites WHERE owner_key = ?").run(guestOwner);
    db.prepare(
      "UPDATE orders SET user_id = ? WHERE session_id = ? AND user_id IS NULL",
    ).run(userId, token);
    db.prepare("UPDATE sessions SET user_id = ? WHERE token = ?").run(
      userId,
      token,
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getUserByEmail(db, email) {
  return db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email);
}

export function publicUser(row) {
  return userFromRow(row);
}
