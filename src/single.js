const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;

createApp({ mode: "single" }).listen(PORT, () => {
  console.log(`[pid ${process.pid}] Single process listening on http://localhost:${PORT}`);
});
