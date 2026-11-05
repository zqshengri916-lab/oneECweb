import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "src", "data.ts");
const tempDir = path.join(root, "tmp");
const tempModule = path.join(tempDir, "catalog-seed.mjs");
const outputPath = path.join(root, "server", "seed.json");

const source = await readFile(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: sourcePath,
}).outputText;

await mkdir(tempDir, { recursive: true });
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(tempModule, output, "utf8");

const moduleUrl = `${pathToFileURL(tempModule).href}?v=${Date.now()}`;
const catalog = await import(moduleUrl);
const seed = {
  products: catalog.PRODUCTS,
  articles: catalog.NEWS,
};

await writeFile(outputPath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
console.log(
  `Exported ${seed.products.length} products and ${seed.articles.length} articles to ${outputPath}`,
);
