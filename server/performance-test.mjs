import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { createApp } from "./index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const resultPath = path.join(root, "tmp", "performance-results.json");
const databasePath = path.join(root, "tmp", `performance-${process.pid}.db`);
const app = createApp({ databasePath });
const address = await app.listen(0);
const baseUrl = `http://127.0.0.1:${address.port}`;

function percentile(sorted, ratio) {
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index];
}

async function runScenario(name, endpoint, count, concurrency, execute) {
  for (let index = 0; index < Math.min(20, count); index += 1) {
    await execute(index);
  }

  const samples = [];
  const statuses = new Map();
  let cursor = 0;
  const startedAt = performance.now();

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= count) return;
      const requestStartedAt = performance.now();
      const response = await execute(index);
      samples.push(performance.now() - requestStartedAt);
      statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const durationMs = performance.now() - startedAt;
  const sorted = samples.sort((a, b) => a - b);
  const errors = [...statuses.entries()]
    .filter(([status]) => status < 200 || status >= 300)
    .reduce((sum, [, amount]) => sum + amount, 0);

  return {
    name,
    endpoint,
    requests: count,
    concurrency,
    durationMs: Number(durationMs.toFixed(2)),
    throughput: Number((count / (durationMs / 1000)).toFixed(1)),
    averageMs: Number(
      (samples.reduce((sum, sample) => sum + sample, 0) / samples.length).toFixed(
        2,
      ),
    ),
    p50Ms: Number(percentile(sorted, 0.5).toFixed(2)),
    p95Ms: Number(percentile(sorted, 0.95).toFixed(2)),
    p99Ms: Number(percentile(sorted, 0.99).toFixed(2)),
    maxMs: Number(sorted.at(-1).toFixed(2)),
    errors,
  };
}

try {
  const initialResponse = await fetch(`${baseUrl}/api/bootstrap`);
  const cookie = initialResponse.headers.getSetCookie()[0].split(";")[0];
  await initialResponse.arrayBuffer();

  const scenarios = [];
  scenarios.push(
    await runScenario("健康检查", "/api/health", 300, 20, async () => {
      const response = await fetch(`${baseUrl}/api/health`, {
        headers: { cookie },
      });
      await response.arrayBuffer();
      return response;
    }),
  );
  scenarios.push(
    await runScenario("页面目录初始化", "/api/bootstrap", 300, 20, async () => {
      const response = await fetch(`${baseUrl}/api/bootstrap`, {
        headers: { cookie },
      });
      await response.arrayBuffer();
      return response;
    }),
  );
  scenarios.push(
    await runScenario(
      "购物车写入",
      "PUT /api/cart/:productId",
      200,
      10,
      async (index) => {
        const response = await fetch(`${baseUrl}/api/cart/p-001`, {
          method: "PUT",
          headers: {
            cookie,
            "content-type": "application/json",
          },
          body: JSON.stringify({ quantity: (index % 5) + 1 }),
        });
        await response.arrayBuffer();
        return response;
      },
    ),
  );

  const result = {
    testedAt: new Date().toISOString(),
    environment: {
      platform: `${os.type()} ${os.release()}`,
      node: process.version,
      cpu: os.cpus()[0]?.model ?? "unknown",
      sqlite: "file-backed WAL",
    },
    scenarios,
  };
  await mkdir(path.dirname(resultPath), { recursive: true });
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  for (const scenario of scenarios) {
    console.log(
      `${scenario.name}: ${scenario.requests} requests, ${scenario.concurrency} concurrent, ` +
        `avg ${scenario.averageMs} ms, P95 ${scenario.p95Ms} ms, ` +
        `${scenario.throughput} req/s, errors ${scenario.errors}`,
    );
  }
  console.log(`Wrote ${resultPath}`);
} finally {
  await app.close();
}
