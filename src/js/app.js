// cartiva application composition root
// Feature runtimes are loaded in dependency order from index.html.
// shared services -> preset data/service -> UI -> map -> location -> export.
//
// Keeping this file intentionally small makes startup wiring easy to inspect.
window.CartivaApp = Object.freeze({
  version: '2026.09.11.151600',
  modules: ['ui', 'map', 'location', 'export']
});
