function blockFor(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy-wait: nothing else can run on this thread until the loop ends.
  }
}

module.exports = { blockFor };
