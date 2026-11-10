const { parentPort, workerData } = require("worker_threads");
const { blockFor } = require("./block");

blockFor(workerData.ms);
parentPort.postMessage("done");
