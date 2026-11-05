import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
const children = [
  spawn(process.execPath, ["--watch", path.join(root, "server", "index.mjs")], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  }),
  spawn(process.execPath, [viteBin], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  }),
];

let closing = false;
function shutdown(signal = "SIGTERM") {
  if (closing) return;
  closing = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!closing && code && code !== 0) {
      shutdown();
      process.exitCode = code;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
