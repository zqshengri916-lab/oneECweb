import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "./index.mjs";

let app;
let baseUrl;
let cookie;

before(async () => {
  app = createApp({ databasePath: ":memory:" });
  const address = await app.listen(0);
  baseUrl = `http://127.0.0.1:${address.port}`;
  const response = await fetch(`${baseUrl}/api/bootstrap`);
  cookie = response.headers.getSetCookie()[0].split(";")[0];
});

after(async () => {
  await app.close();
});

async function api(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      cookie,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = await response.json();
  return { response, body };
}

test("health endpoint reports a connected SQLite database", async () => {
  const { response, body } = await api("/api/health");
  assert.equal(response.status, 200);
  assert.equal(body.connected, true);
  assert.equal(body.engine, "SQLite");
  assert.ok(body.counts.products >= 8);
});

test("cart, account and checkout persist through the API", async () => {
  let result = await api("/api/cart/p-001", {
    method: "PUT",
    body: JSON.stringify({ quantity: 2 }),
  });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.body.cart, [{ productId: "p-001", quantity: 2 }]);

  result = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "数据库测试同学",
      email: "database-test@example.com",
      password: "qingyu123",
    }),
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.user.email, "database-test@example.com");

  result = await api("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      name: "数据库测试同学",
      email: "database-test@example.com",
      phone: "13800138000",
      address: "青屿大学 1 号宿舍楼",
    }),
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.body.total, 758);
  assert.equal(result.body.lines.length, 1);

  result = await api("/api/bootstrap");
  assert.equal(result.response.status, 200);
  assert.equal(result.body.user.email, "database-test@example.com");
  assert.equal(result.body.cart.length, 0);
  assert.equal(result.body.orders.length, 1);
  assert.equal(
    result.body.products.find((product) => product.id === "p-001").inventory,
    40,
  );
});

test("admin product and article changes are stored in the database", async () => {
  const product = {
    id: "p-test",
    slug: "database-test-product",
    name: "数据库测试商品",
    category: "study",
    price: 88,
    summary: "用于验证数据库写入。",
    description: "这条记录由 API 自动测试创建。",
    features: ["测试"],
    specs: [{ label: "规格", value: "测试" }],
    rating: 4.5,
    reviewCount: 0,
    inventory: 5,
    art: "notebook",
    color: "#617660",
    featured: false,
    createdAt: "2026-11-04",
  };
  let result = await api("/api/admin/products", {
    method: "PUT",
    body: JSON.stringify(product),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.product.name, product.name);

  const article = {
    id: "n-test",
    slug: "database-test-article",
    category: "品牌动态",
    title: "数据库测试文章",
    excerpt: "用于验证文章写入。",
    body: ["第一段", "第二段"],
    publishedAt: "2026-11-04",
    readTime: 2,
    art: "notebook",
    color: "#617660",
  };
  result = await api("/api/admin/articles", {
    method: "PUT",
    body: JSON.stringify(article),
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.article.body.length, 2);

  result = await api("/api/bootstrap");
  assert.ok(result.body.products.some((item) => item.id === "p-test"));
  assert.ok(result.body.articles.some((item) => item.id === "n-test"));

  result = await api("/api/admin/products/p-test", { method: "DELETE" });
  assert.equal(result.response.status, 200);
  result = await api("/api/admin/articles/n-test", { method: "DELETE" });
  assert.equal(result.response.status, 200);
});

test("reset restores the seed catalog", async () => {
  const { response, body } = await api("/api/admin/reset", {
    method: "POST",
  });
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  const bootstrap = await api("/api/bootstrap");
  assert.equal(bootstrap.body.products.length, 8);
  assert.equal(bootstrap.body.articles.length, 4);
});
