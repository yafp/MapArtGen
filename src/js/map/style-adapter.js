// Provider style adapter. The rest of the app works with normalized roles.
(function attachStyleAdapter(global) {
  function classify(layer, roleRegistry = global.CartivaLayerRegistry) {
    return roleRegistry.getRole(layer);
  }
  function groupLayers(style, roleRegistry = global.CartivaLayerRegistry) {
    const groups = {};
    (style?.layers || []).forEach(layer => {
      const role = classify(layer, roleRegistry);
      if (!role) return;
      (groups[role] ||= []).push(layer);
    });
    return groups;
  }
  global.CartivaStyleAdapter = Object.freeze({ classify, groupLayers });
})(window);
