// Optional diagnostics channel for service failures and render comparisons.
(function attachDiagnostics(global) {
  const events = [];
  function record(area, message, details = {}) {
    const event = { time: new Date().toISOString(), area, message, details };
    events.push(event);
    if (events.length > 100) events.shift();
    return event;
  }
  function report(area, error, details = {}) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[cartiva:${area}] ${message}`, details);
    return record(area, message, details);
  }
  function list() { return events.slice(); }
  function clear() { events.length = 0; }
  global.CartivaDiagnostics = Object.freeze({ record, report, list, clear });
})(window);
