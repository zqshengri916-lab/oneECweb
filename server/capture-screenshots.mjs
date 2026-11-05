import path from "node:path";
import { chromium } from "playwright";
import { createApp } from "./index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const screenshots = path.join(root, "screenshots");
const app = createApp({
  databasePath: ":memory:",
  distDir: path.join(root, "dist"),
});
const address = await app.listen(0);
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });

async function capture(name, route, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(screenshots, `${name}.png`),
    fullPage: false,
  });
  await context.close();
}

try {
  await capture("home-desktop", "/");
  await capture("shop-desktop", "/shop");
  await capture("product-desktop", "/product/island-anc-headphones");
  await capture("about-desktop", "/about");
  await capture("news-desktop", "/news");
  await capture("article-desktop", "/article/qingyu-first-campus-store");
  await capture("stories-desktop", "/stories");
  await capture("account-desktop", "/account");
  await capture("studio-desktop", "/studio");
  await capture("home-mobile", "/", { width: 390, height: 844 });
  await capture("product-mobile", "/product/island-anc-headphones", {
    width: 390,
    height: 844,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/product/island-anc-headphones`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: /加入购物袋/ }).click();
  await page.waitForTimeout(250);
  await page.goto(`${baseUrl}/cart`, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(screenshots, "cart-desktop.png"),
    fullPage: false,
  });
  await context.close();

  const homeContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const homePage = await homeContext.newPage();
  await homePage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await homePage.screenshot({
    path: path.join(screenshots, "home-preview.png"),
    clip: { x: 0, y: 0, width: 1440, height: 1000 },
  });
  await homeContext.close();
  console.log("Screenshots refreshed from the database-backed build.");
} finally {
  await browser.close();
  await app.close();
}
