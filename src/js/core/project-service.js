// Versioned project persistence. Only plain data crosses this boundary.
(function attachProjectService(global) {
  const VERSION = 1;
  const STORAGE_KEY = 'cartiva.project.v1';
  const PRESETS_KEY = 'cartiva.user-presets.v1';

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeProject(input) {
    if (!input || typeof input !== 'object') throw new Error('Project data must be an object.');
    const source = input.state && typeof input.state === 'object' ? input.state : input;
    if (!source.layers || typeof source.layers !== 'object') throw new Error('Project data is missing layer settings.');
    const project = {
      schemaVersion: VERSION,
      savedAt: input.savedAt || new Date().toISOString(),
      appVersion: input.appVersion || global.CartivaApp?.version || 'unknown',
      state: clone(source)
    };
    if (!Array.isArray(project.state.layerOrder)) project.state.layerOrder = ['land', 'water', 'forest', 'landCover', 'terrain', 'road', 'boundary', 'building'];
    return project;
  }

  function createProject(state) {
    return normalizeProject({ schemaVersion: VERSION, appVersion: global.CartivaApp?.version, state });
  }

  function save(project) {
    const normalized = normalizeProject(project);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProject(JSON.parse(raw)) : null;
  }

  function download(project, filename = 'cartiva-project.json') {
    const blob = new Blob([JSON.stringify(normalizeProject(project), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function readFile(file) {
    return file.text().then(text => normalizeProject(JSON.parse(text)));
  }

  function listPresets() {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]');
  }

  function savePreset(name, state) {
    const presets = listPresets().filter(item => item.name !== name);
    presets.push({ name, savedAt: new Date().toISOString(), state: clone(state) });
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return presets;
  }

  function deletePreset(name) {
    const presets = listPresets().filter(item => item.name !== name);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return presets;
  }

  global.CartivaProject = Object.freeze({
    VERSION, STORAGE_KEY, create: createProject, normalize: normalizeProject,
    save, load, download, readFile, listPresets, savePreset, deletePreset
  });
})(window);
