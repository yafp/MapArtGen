// Export requests are plain data, making exporters independently testable.
(function attachExportContract(global) {
  function createRequest({ state, dimensions, camera, bounds, overlay, layers }) {
    return Object.freeze({
      state: JSON.parse(JSON.stringify(state)),
      dimensions: { ...dimensions },
      camera: { ...camera },
      bounds: bounds ? JSON.parse(JSON.stringify(bounds)) : null,
      overlay: overlay ? JSON.parse(JSON.stringify(overlay)) : null,
      layers: layers ? { ...layers } : {}
    });
  }

  global.CartivaExport = Object.freeze({ createRequest });
})(window);
