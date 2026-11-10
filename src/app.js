const path = require("path");
const express = require("express");
const { Worker } = require("worker_threads");
const { blockFor } = require("./block");

function createApp({ mode }) {
  const app = express();
  const log = (msg) => console.log(`[pid ${process.pid}] ${msg}`);

  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    // Cluster balances *connections*, not requests. Closing each connection lets
    // the demo show every request being load-balanced individually.
    res.set("Connection", "close");
    next();
  });

  app.get("/info", (req, res) => {
    res.json({ mode, pid: process.pid, workers: Number(process.env.WORKERS) || 1 });
  });

  // Fast endpoint: should answer in a few milliseconds.
  app.get("/user", (req, res) => {
    res.json({ id: 1, name: "John Doe", pid: process.pid });
  });

  // Synchronous CPU work on the main thread: freezes this process's event loop.
  app.get("/block-loop", (req, res) => {
    const ms = Number(req.query.ms) || 5000;
    log(`/block-loop -> event loop BLOCKED for ${ms}ms`);
    blockFor(ms);
    log(`/block-loop -> event loop free again`);
    res.json({ message: "Available now", pid: process.pid, ms });
  });

  // Same CPU work, but offloaded to a worker thread: the event loop stays free.
  app.get("/block-thread", (req, res) => {
    const ms = Number(req.query.ms) || 5000;
    log(`/block-thread -> offloading ${ms}ms of CPU work to a worker thread`);
    const worker = new Worker(path.join(__dirname, "block-worker.js"), { workerData: { ms } });
    worker.once("message", () => {
      log(`/block-thread -> worker thread finished`);
      res.json({ message: "Done in a worker thread", pid: process.pid, ms });
    });
    worker.once("error", (err) => res.status(500).json({ error: err.message }));
  });

  // Simulates a crash so you can watch the cluster primary replace the worker.
  app.get("/crash", (req, res) => {
    log(`/crash -> exiting with code 1`);
    res.json({ message: "crashing", pid: process.pid });
    setTimeout(() => process.exit(1), 50);
  });

  return app;
}

module.exports = { createApp };
