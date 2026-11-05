import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright";
import { createApp } from "./index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const app = createApp({
  databasePath: ":memory:",
  distDir: path.join(root, "dist"),
});
const address = await app.listen(0);
const baseUrl = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
const routes = [
  "/",
  "/shop",
  "/product/island-anc-headphones",
  "/about",
  "/news",
  "/article/qingyu-first-campus-store",
  "/stories",
  "/cart",
  "/account",
  "/studio",
  "/not-found",
];
const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1440, height: 1000 },
];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    for (const route of routes) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dimensions.scroll <= dimensions.viewport + 1,
        `${route} overflows at ${viewport.width}px: ${dimensions.scroll}`,
      );
    }
    assert.deepEqual(errors, [], `Browser errors at ${viewport.width}px`);
    await context.close();
    console.log(`Browser routes passed at ${viewport.width}px`);
  }
} finally {
  await browser.close();
  await app.close();
}
