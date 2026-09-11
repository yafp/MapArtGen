// Presets are treated as data with a validated service boundary.
(function attachPresetService(global) {
  const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
  const numericKeys = new Set([
    'waterOpacity', 'forestOpacity', 'landOpacity', 'landCoverOpacity',
    'roadOpacity', 'boundaryOpacity', 'buildingOpacity'
  ]);

  function validatePreset(id, values) {
    if (!values || typeof values !== 'object') throw new Error(`Preset ${id} is not an object.`);
    for (const [key, value] of Object.entries(values)) {
      if (key.toLowerCase().includes('color') && !COLOR_PATTERN.test(value)) {
        throw new Error(`Preset ${id} has invalid color ${key}.`);
      }
      if (numericKeys.has(key) && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
        throw new Error(`Preset ${id} has invalid opacity ${key}.`);
      }
    }
    return true;
  }

  function createService(catalog, presets) {
    const entries = new Map();
    catalog.forEach(entry => {
      if (!entry?.id || entries.has(entry.id)) throw new Error(`Invalid or duplicate preset id: ${entry?.id}`);
      validatePreset(entry.id, presets[entry.id]);
      entries.set(entry.id, Object.freeze({ ...entry, values: Object.freeze({ ...presets[entry.id] }) }));
    });

    return Object.freeze({
      list: () => [...entries.values()],
      get: id => entries.get(id) || null,
      values: id => entries.get(id)?.values || null,
      validate: validatePreset,
      randomId: () => {
        const ids = [...entries.keys()];
        return ids[Math.floor(Math.random() * ids.length)];
      }
    });
  }

  global.CartivaPresets = Object.freeze({ create: createService, validate: validatePreset });
})(window);
