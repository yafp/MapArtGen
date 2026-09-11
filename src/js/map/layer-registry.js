// Map style knowledge is isolated here so renderer code does not own naming rules.
(function attachLayerRegistry(global) {
  const roleMap = Object.freeze({
    water: ['water', 'waterway'],
    forest: ['park', 'landcover', 'landuse'],
    land: ['background'],
    landCover: ['residential', 'commercial', 'industrial'],
    road: ['road', 'bridge', 'tunnel', 'railway', 'rail', 'transportation', 'aeroway'],
    boundary: ['boundary'],
    building: ['building']
  });

  function getRole(layer) {
    const id = layer.id.toLowerCase();
    const sourceLayer = String(layer['source-layer'] || '').toLowerCase();
    for (const [role, names] of Object.entries(roleMap)) {
      if (names.some(name => id === name || id.startsWith(`${name}_`) || id.startsWith(`${name}-`) || sourceLayer === name)) {
        return role;
      }
    }
    return null;
  }

  function getUnsupportedLayers(layers) {
    return layers
      .filter(layer => ['background', 'fill', 'line'].includes(layer.type) && !getRole(layer))
      .map(layer => layer.id);
  }

  global.CartivaLayerRegistry = Object.freeze({
    roles: roleMap,
    getRole,
    getUnsupportedLayers
  });
})(window);
