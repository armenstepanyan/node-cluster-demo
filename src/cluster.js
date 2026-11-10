const cluster = require("cluster");
const os = require("os");

const PORT = Number(process.env.PORT) || 3000;
const arg = process.argv.find((a) => a.startsWith("--workers="));
const WORKERS = Number(arg && arg.split("=")[1]) || os.availableParallelism();

// Round-robin is the default everywhere except Windows; force it so the demo
// behaves the same on every OS.
cluster.schedulingPolicy = cluster.SCHED_RR;

if (cluster.isPrimary) {
  console.log(`[primary ${process.pid}] Forking ${WORKERS} workers...`);

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork({ WORKERS });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`[primary ${process.pid}] Worker ${worker.process.pid} died (${signal || code}). Forking a replacement...`);
    cluster.fork({ WORKERS });
  });
} else {
  const { createApp } = require("./app");

  createApp({ mode: "cluster" }).listen(PORT, () => {
    console.log(`[pid ${process.pid}] Worker listening on http://localhost:${PORT}`);
  });
}
