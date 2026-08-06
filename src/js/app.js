const DEFAULTS = Object.freeze({
      preset: 'alpine',
      labelStyle: 'style-bottom-right-absolute',
      labelOpacity: '100',
      textFilter: 'none',
      format: 'a4-portrait',
      exportType: 'image/png',
      exportDpi: 300,
      filterPreset: 'none',
      contrast: 100,
      brightness: 100,
      saturation: 100
    });
    const state = {
      ...DEFAULTS,
      center: [8.69079, 49.40768],
      zoom: 13,
      bearing: 0,
      pitch: 0,
      city: 'HEIDELBERG',
      coordinates: '49.4077° N / 8.6908° E',
      country: 'GERMANY',
      layers: {}
    };
    const controls = Object.freeze(Object.fromEntries(
      Array.from(document.querySelectorAll('[id]'), element => [element.id, element])
    ));
    const $ = id => controls[id] || null;

    function readControl(id) {
      const control = $(id);
      if (!control) {
        throw new Error(`Missing required control: #${id}`);
      }
      return control.type === 'checkbox' ? control.checked : control.value;
    }

    function writeControl(id, value) {
      const control = $(id);
      if (!control) {
        throw new Error(`Missing required control: #${id}`);
      }
      if (control.type === 'checkbox') control.checked = Boolean(value);
      else control.value = value;
    }

    function syncStateFromControls() {
      state.format = readControl('formatSelect');
      state.exportType = readControl('exportType');
      state.exportDpi = Number(readControl('exportDpi'));
      state.preset = readControl('colorPresetSelect');
      state.labelStyle = readControl('labelStyle');
      state.labelOpacity = Number(readControl('labelOpacity'));
      state.labelFont = readControl('labelFontSelect');
      state.labelTextColor = readControl('labelTextColor');
      state.labelCoordColor = readControl('labelCoordColor');
      state.labelCountryColor = readControl('labelCountryColor');
      state.labelBgColor = readControl('labelBgColor');
      state.textFilter = readControl('textFilter');
      state.filterPreset = readControl('filterPreset');
      state.contrast = Number(readControl('contrastVal'));
      state.brightness = Number(readControl('brightnessVal'));
      state.saturation = Number(readControl('saturationVal'));
      state.borderEnabled = readControl('borderCheckbox');
      state.borderColor = readControl('borderColor');
      state.borderWidth = Number(readControl('borderWidth'));
      state.outerBorderRadius = Number(readControl('outerBorderRadius'));
      state.innerBorderRadius = Number(readControl('innerBorderRadius'));
      [
        'waterColor', 'waterOpacity', 'waterToggle',
        'forestColor', 'forestColorAccent', 'forestOpacity', 'forestToggle',
        'landColor', 'landOpacity', 'landToggle',
        'landCoverColor', 'landCoverColorAccent', 'landCoverOpacity', 'landCoverToggle',
        'roadColor', 'roadOpacity', 'roadToggle',
        'boundaryColor', 'boundaryOpacity', 'boundaryToggle',
        'buildingColor', 'buildingOpacity', 'buildingToggle',
        'buildingOutlineToggle', 'buildingOutlineColor'
      ].forEach(id => {
        state.layers[id] = readControl(id);
      });
      state.city = $('cityName').textContent;
      state.coordinates = $('cityCoords').textContent;
      state.country = $('cityCountry').textContent;
      if (typeof map !== 'undefined') {
        state.center = map.getCenter().toArray();
        state.zoom = map.getZoom();
        state.bearing = map.getBearing();
        state.pitch = map.getPitch();
      }
      return state;
    }

    function getExportState() {
      const mapRect = map.getContainer().getBoundingClientRect();
      const overlayRect = mapLabelOverlay.getBoundingClientRect();
      const previewScale = map.getContainer().clientWidth / mapRect.width;
      const childMetrics = [cityNameEl, cityCoordsEl, cityCountryEl].map(element => {
        const rect = element.getBoundingClientRect();
        const computed = getComputedStyle(element);
        return {
          x: (rect.left - overlayRect.left) * previewScale,
          baselineY: (rect.top - overlayRect.top + parseFloat(computed.fontSize)) * previewScale,
          fontSize: parseFloat(computed.fontSize) * previewScale,
          fontWeight: computed.fontWeight,
          textAlign: computed.textAlign,
          color: computed.color
        };
      });
      return {
        ...state,
        format: readControl('formatSelect'),
        exportType: readControl('exportType'),
        exportDpi: Number(readControl('exportDpi')),
        filterPreset: readControl('filterPreset'),
        contrast: Number(readControl('contrastVal')),
        brightness: Number(readControl('brightnessVal')),
        saturation: Number(readControl('saturationVal')),
        borderEnabled: readControl('borderCheckbox'),
        borderColor: readControl('borderColor'),
        borderWidth: Number(readControl('borderWidth')),
        outerBorderRadius: Number(readControl('outerBorderRadius')),
        innerBorderRadius: Number(readControl('innerBorderRadius')),
        labelStyle: readControl('labelStyle'),
        labelOpacity: Number(readControl('labelOpacity')),
        labelFont: readControl('labelFontSelect'),
        labelTextColor: readControl('labelTextColor'),
        labelCoordColor: readControl('labelCoordColor'),
        labelCountryColor: readControl('labelCountryColor'),
        labelBgColor: readControl('labelBgColor'),
        textFilter: readControl('textFilter'),
        city: $('cityName').textContent,
        coordinates: $('cityCoords').textContent,
        country: $('cityCountry').textContent,
        center: map.getCenter().toArray(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
        bounds: map.getBounds().toArray(),
        previewMapSize: {
          width: map.getContainer().clientWidth,
          height: map.getContainer().clientHeight
        },
        overlay: {
          x: (overlayRect.left - mapRect.left) * previewScale,
          y: (overlayRect.top - mapRect.top) * previewScale,
          width: overlayRect.width * previewScale,
          height: overlayRect.height * previewScale,
          borderRadius: parseFloat(getComputedStyle(mapLabelOverlay).borderRadius) * previewScale,
          children: childMetrics
        },
        layers: { ...state.layers }
      };
    }

    function setState(patch, { render = true } = {}) {
      Object.assign(state, patch);
      if (render) renderPreview();
    }

    function renderPreview() {
      if (!mapReady) return;
      contrastNum.textContent = state.contrast;
      brightnessNum.textContent = state.brightness;
      saturationNum.textContent = state.saturation;
      mapEl.style.filter = `${filterPresets[state.filterPreset] || ''} contrast(${state.contrast}%) brightness(${state.brightness}%) saturate(${state.saturation}%)`.trim();
      opacityNum.textContent = state.labelOpacity;
      mapLabelOverlay.style.display = state.labelStyle === 'none' ? 'none' : 'block';
      if (state.labelStyle !== 'none') {
        mapLabelOverlay.className = `map-label-overlay ${state.labelStyle}`;
        mapLabelOverlay.style.fontFamily = state.labelFont;
        const hex = state.labelBgColor;
        const alpha = state.labelOpacity / 100;
        const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
        mapLabelOverlay.style.backgroundColor = state.labelStyle === 'style-minimal'
          ? 'transparent'
          : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        cityNameEl.style.color = state.labelTextColor;
        cityCoordsEl.style.color = state.labelCoordColor;
        cityCountryEl.style.color = state.labelCountryColor;
        [cityNameEl, cityCoordsEl, cityCountryEl].forEach(element => {
          element.style.fontFamily = state.labelFont;
        });
      }
      borderWidthVal.textContent = state.borderWidth;
      $('outerBorderRadiusVal').textContent = state.outerBorderRadius;
      $('innerBorderRadiusVal').textContent = state.innerBorderRadius;
      borderUiItems.forEach(item => {
        item.style.display = state.borderEnabled ? 'flex' : 'none';
      });
      mapFrame.style.border = state.borderEnabled
        ? `${state.borderWidth}px solid ${state.borderColor}`
        : 'none';
      mapFrame.style.borderRadius = `${state.outerBorderRadius}px`;
      mapEl.style.borderRadius = `${state.innerBorderRadius}px`;
      mapFrame.className = `map-frame ratio-${state.format}`;
      applyTextFilters(map, state.textFilter);
    }

    function updateStateFromControls() {
      syncStateFromControls();
      renderPreview();
    }

    document.getElementById('settingsForm').addEventListener('input', updateStateFromControls);
    document.getElementById('settingsForm').addEventListener('change', updateStateFromControls);
    let mapReady = false;

    function initializeDefaults() {
      const form = document.getElementById('settingsForm');
      if (form) form.reset();
      document.getElementById('roadColor').value = "#374151";
      document.getElementById('boundaryColor').value = "#9ca3af";
      document.getElementById('borderWidth').value = "16";
      document.getElementById('borderWidthVal').textContent = "16";
      document.getElementById('searchInput').value = "Heidelberg";
      document.getElementById('colorPresetSelect').value = DEFAULTS.preset;
      document.getElementById('labelStyle').value = DEFAULTS.labelStyle;
      document.getElementById('labelOpacity').value = DEFAULTS.labelOpacity;
      document.getElementById('textFilter').value = DEFAULTS.textFilter;
      writeControl('formatSelect', DEFAULTS.format);
      writeControl('exportType', DEFAULTS.exportType);
      writeControl('exportDpi', DEFAULTS.exportDpi);
      writeControl('filterPreset', DEFAULTS.filterPreset);
      writeControl('contrastVal', DEFAULTS.contrast);
      writeControl('brightnessVal', DEFAULTS.brightness);
      writeControl('saturationVal', DEFAULTS.saturation);
      updateBuildingOutlineVisibility();
      updateBorderElementsVisibility();
      updateLabelStyle();
      updateBorderStyle();
      if (mapReady) {
        applyTextFilters();
        applyColorPreset(DEFAULTS.preset);
      }
      syncStateFromControls();
    }

    document.addEventListener('DOMContentLoaded', initializeDefaults);
    window.addEventListener('pageshow', event => {
      if (event.persisted) initializeDefaults();
    });

    // Accordion Control
    const sectionBlocks = document.querySelectorAll('.section-block');
    sectionBlocks.forEach(block => {
      const header = block.querySelector('.section-header');
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', String(!block.classList.contains('collapsed')));
      const toggleSection = () => {
        const isCollapsed = block.classList.contains('collapsed');
        sectionBlocks.forEach(b => {
          b.classList.add('collapsed');
          b.querySelector('.section-header').setAttribute('aria-expanded', 'false');
        });
        if (isCollapsed) {
          block.classList.remove('collapsed');
          header.setAttribute('aria-expanded', 'true');
        }
      };
      header.addEventListener('click', () => {
        toggleSection();
      });
      header.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleSection();
        }
      });
    });

    const fineTuningToggle = document.getElementById('fineTuningToggle');
    const fineTuningControls = document.getElementById('fineTuningControls');
    fineTuningToggle.addEventListener('click', () => {
      const showControls = fineTuningControls.hidden;
      fineTuningControls.hidden = !showControls;
      fineTuningToggle.setAttribute('aria-expanded', String(showControls));
      fineTuningToggle.textContent = showControls
        ? 'Hide layer fine-tuning'
        : 'Show layer fine-tuning';
    });

    // MapLibre Map Initialization preset centered to Heidelberg
    const map = new maplibregl.Map({
      container: 'map',
      preserveDrawingBuffer: true,
      attributionControl: false,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [8.69079, 49.40768],
      zoom: 13
    });
    const zoomLevelDisplay = $('zoomLevelDisplay');
    function updateZoomLevelDisplay() {
      state.zoom = map.getZoom();
      zoomLevelDisplay.textContent = state.zoom.toFixed(2);
    }
    map.on('move', updateZoomLevelDisplay);
    map.on('zoomend', () => {
      configureBuildingZoom(map);
      triggerAllLayerUpdates();
    });
    map.on('moveend', syncStateFromControls);

    // 4-Button Zoom Controls Event Listeners (Big steps & Fine adjustments)
    document.getElementById('zoomInBigBtn').addEventListener('click', () => {
      map.zoomTo(map.getZoom() + 2, { duration: 300 });
    });
    document.getElementById('zoomInFineBtn').addEventListener('click', () => {
      map.zoomTo(map.getZoom() + 0.25, { duration: 200 });
    });
    document.getElementById('zoomOutFineBtn').addEventListener('click', () => {
      map.zoomTo(map.getZoom() - 0.25, { duration: 200 });
    });
    document.getElementById('zoomOutBigBtn').addEventListener('click', () => {
      map.zoomTo(map.getZoom() - 2, { duration: 300 });
    });

    // Live Magnifier Functionality
    const magnifierBtn = document.getElementById('magnifierBtn');
    const mapMagnifierLens = document.getElementById('mapMagnifierLens');
    const magnifierContext = mapMagnifierLens.getContext('2d');
    const mapFrame = document.getElementById('mapFrame');
    let magnifierActive = false;
    let magnifierFrame = null;
    let magnifierPosition = null;

    magnifierBtn.addEventListener('click', () => {
      magnifierActive = !magnifierActive;
      if (magnifierActive) {
        magnifierBtn.classList.add('active-magnifier');
        mapMagnifierLens.style.display = 'block';
      } else {
        magnifierBtn.classList.remove('active-magnifier');
        mapMagnifierLens.style.display = 'none';
      }
    });

    function renderMagnifier() {
      magnifierFrame = null;
      if (!magnifierActive || !magnifierPosition) return;
      const { x, y, rect } = magnifierPosition;
      const mapCanvas = map.getCanvas();
      const sourceX = (x / rect.width) * mapCanvas.width;
      const sourceY = (y / rect.height) * mapCanvas.height;
      const sourceSize = 140;
      magnifierContext.clearRect(0, 0, mapMagnifierLens.width, mapMagnifierLens.height);
      magnifierContext.drawImage(
        mapCanvas,
        sourceX - sourceSize / 2,
        sourceY - sourceSize / 2,
        sourceSize,
        sourceSize,
        0,
        0,
        mapMagnifierLens.width,
        mapMagnifierLens.height
      );
    }

    mapFrame.addEventListener('mousemove', (e) => {
      if (!magnifierActive) return;
      const rect = mapFrame.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        mapMagnifierLens.style.display = 'none';
        return;
      }

      mapMagnifierLens.style.display = 'block';
      const lensSize = 140;
      mapMagnifierLens.style.width = `${lensSize}px`;
      mapMagnifierLens.style.height = `${lensSize}px`;
      mapMagnifierLens.style.left = `${x - lensSize / 2}px`;
      mapMagnifierLens.style.top = `${y - lensSize / 2}px`;
      magnifierPosition = { x, y, rect };
      if (!magnifierFrame) magnifierFrame = requestAnimationFrame(renderMagnifier);
    });

    mapFrame.addEventListener('mouseleave', () => {
      if (magnifierActive) {
        mapMagnifierLens.style.display = 'none';
      }
    });

    // Live Effects Engine
    const mapEl = document.getElementById('map');
    const filterPreset = document.getElementById('filterPreset');
    const contrastVal = document.getElementById('contrastVal');
    const contrastNum = document.getElementById('contrastNum');
    const brightnessNum = document.getElementById('brightnessNum');
    const saturationNum = document.getElementById('saturationNum');

    const filterPresets = {
      'none': '',
      'grayscale': 'grayscale(100%)',
      'vintage': 'sepia(50%) contrast(90%) saturate(85%)',
      'high-contrast': 'grayscale(100%) contrast(190%)',
      'invert': 'invert(100%) hue-rotate(180deg)'
    };

    function applyLiveFilters() {
      setState({
        filterPreset: readControl('filterPreset'),
        contrast: Number(readControl('contrastVal')),
        brightness: Number(readControl('brightnessVal')),
        saturation: Number(readControl('saturationVal'))
      });
    }

    filterPreset.addEventListener('change', applyLiveFilters);
    contrastVal.addEventListener('input', applyLiveFilters);
    $('brightnessVal').addEventListener('input', applyLiveFilters);
    $('saturationVal').addEventListener('input', applyLiveFilters);

    // Map Labels Filter
    const textFilter = document.getElementById('textFilter');
    const LABEL_LAYER_GROUPS = Object.freeze({
      water: ['waterway_label', 'water_name', 'marine_label'],
      cities: ['place_', 'city', 'town', 'village', 'country_label', 'state_label'],
      streets: ['roadname', 'road_label', 'street', 'transportation_name', 'transport']
    });

    function getLabelRole(layer) {
      const id = layer.id.toLowerCase();
      const sourceLayer = String(layer['source-layer'] || '').toLowerCase();
      for (const [role, names] of Object.entries(LABEL_LAYER_GROUPS)) {
        if (names.some(name => id.includes(name) || sourceLayer.includes(name.replace(/_label$|_name$/, '')))) {
          return role;
        }
      }
      return 'other';
    }

    function isLabelVisible(mode, role) {
      if (mode === 'none') return false;
      if (mode === 'all') return true;
      if (mode === 'cities_only') return role === 'cities';
      if (mode === 'streets_only') return role === 'streets';
      if (mode === 'water_only') return role === 'water';
      return false;
    }

    function applyTextFilters(targetMap = map, mode = state.textFilter) {
      const style = targetMap.getStyle();
      if (!style || !style.layers) return;

      style.layers.forEach(layer => {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
          targetMap.setLayoutProperty(
            layer.id,
            'visibility',
            isLabelVisible(mode, getLabelRole(layer)) ? 'visible' : 'none'
          );
        }
      });
    }

    textFilter.addEventListener('change', () => {
      setState({ textFilter: readControl('textFilter') });
    });

    // Global update triggers for initial map sync
    let updateCallbacks = [];
    const CARTO_LAYER_MAP = Object.freeze({
      water: ['water', 'waterway'],
      forest: ['park', 'landcover', 'landuse'],
      land: ['background'],
      landCover: ['residential', 'commercial', 'industrial'],
      road: ['road', 'bridge', 'tunnel', 'railway', 'rail', 'transportation', 'aeroway'],
      boundary: ['boundary'],
      building: ['building']
    });

    function getLayerRole(layer) {
      const id = layer.id.toLowerCase();
      const sourceLayer = String(layer['source-layer'] || '').toLowerCase();
      for (const [role, names] of Object.entries(CARTO_LAYER_MAP)) {
        if (names.some(name => id === name || id.startsWith(`${name}_`) || id.startsWith(`${name}-`) || sourceLayer === name)) {
          return role;
        }
      }
      return null;
    }

    function warnAboutUnsupportedLayers(targetMap) {
      const unsupported = targetMap.getStyle().layers
        .filter(layer => ['background', 'fill', 'line'].includes(layer.type) && !getLayerRole(layer))
        .map(layer => layer.id);
      if (unsupported.length) console.warn('Unsupported CARTO layers were left unchanged:', unsupported);
    }

    // Color & Layer Controllers
    function setupLayerControls(colorId, accentColorId, opacityId, opacityValId, toggleId, role) {
      const colorInput = document.getElementById(colorId);
      const accentColorInput = accentColorId ? document.getElementById(accentColorId) : null;
      const opacityInput = document.getElementById(opacityId);
      const opacityValSpan = document.getElementById(opacityValId);
      const toggleInput = document.getElementById(toggleId);

      function update() {
        syncStateFromControls();
        const layerState = state.layers;
        layerState[colorId] = state[colorId] = readControl(colorId);
        layerState[opacityId] = state[opacityId] = readControl(opacityId);
        layerState[toggleId] = state[toggleId] = readControl(toggleId);
        if (accentColorId) layerState[accentColorId] = state[accentColorId] = readControl(accentColorId);
        if (opacityValSpan) opacityValSpan.textContent = layerState[opacityId];
        const style = map.getStyle();
        if (!style || !style.layers) return;

        const enabled = layerState[toggleId];
        const opacity = (layerState[opacityId] / 100) * (enabled ? 1 : 0);
        const mainColor = layerState[colorId];
        const accentColor = accentColorId ? layerState[accentColorId] : mainColor;

        style.layers.forEach(layer => {
          const layerRole = getLayerRole(layer);
          const matchResult = layerRole === role
            ? ((role === 'forest' && /park|recreation|pitch/.test(layer.id.toLowerCase())) || (role === 'landCover' && /residential/.test(layer.id.toLowerCase())) ? 'accent' : 'main')
            : false;
          if (matchResult) {
            map.setLayoutProperty(layer.id, 'visibility', enabled ? 'visible' : 'none');
            
            const activeColor = (matchResult === 'accent') ? accentColor : mainColor;

            if (layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', activeColor);
              map.setPaintProperty(layer.id, 'fill-opacity', opacity);
            } else if (layer.type === 'line') {
              map.setPaintProperty(layer.id, 'line-color', activeColor);
              map.setPaintProperty(layer.id, 'line-opacity', opacity);
            } else if (layer.type === 'background') {
              map.setPaintProperty(layer.id, 'background-color', activeColor);
              map.setPaintProperty(layer.id, 'background-opacity', opacity);
            }
          }
        });
      }

      if (colorInput) colorInput.addEventListener('input', update);
      if (accentColorInput) accentColorInput.addEventListener('input', update);
      if (opacityInput) opacityInput.addEventListener('input', update);
      if (toggleInput) toggleInput.addEventListener('change', update);

      updateCallbacks.push(update);
    }

    // Pre-defined color set definitions
    const colorPresetSelect = controls.colorPresetSelect;
    const predefinedColorSets = window.MapArtGenPresets;
    window.MapArtGenPresetCatalog.forEach((preset, index) => {
      const option = document.createElement('option');
      option.value = preset.id;
      option.textContent = `${String(index + 1).padStart(4, '0')} - ${preset.name}`;
      colorPresetSelect.appendChild(option);
    });

    function applyColorPreset(presetName) {
      if (!predefinedColorSets[presetName]) return;
      const set = predefinedColorSets[presetName];

      Object.entries(set).forEach(([id, value]) => {
        if ($(id)) writeControl(id, value);
      });
      state.preset = presetName;
      state.layers = { ...set };

      updateBuildingOutlineVisibility();
      triggerAllLayerUpdates();
      syncStateFromControls();
    }

    colorPresetSelect.addEventListener('change', (e) => {
      applyColorPreset(e.target.value);
    });

    $('randomPresetBtn').addEventListener('click', () => {
      const randomHex = () => `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`;
      const blueWater = ['#0ea5e9', '#38bdf8', '#0284c7', '#2563eb', '#60a5fa', '#7dd3fc', '#1d4ed8'];
      const fields = [
        'waterColor', 'forestColor', 'forestColorAccent', 'landColor',
        'landCoverColor', 'landCoverColorAccent', 'roadColor',
        'boundaryColor', 'buildingColor', 'buildingOutlineColor'
      ];
      fields.forEach(id => writeControl(id, randomHex()));
      writeControl('waterColor', Math.random() < 0.75
        ? blueWater[Math.floor(Math.random() * blueWater.length)]
        : randomHex());
      $('colorPresetSelect').selectedIndex = -1;
      syncStateFromControls();
      triggerAllLayerUpdates();
      renderPreview();
    });

    $('randomizeDesignBtn').addEventListener('click', () => {
      const presetNames = Object.keys(predefinedColorSets);
      const layoutNames = Array.from($('labelStyle').options, option => option.value);
      const effectNames = Array.from($('filterPreset').options, option => option.value);
      const randomItem = items => items[Math.floor(Math.random() * items.length)];

      writeControl('colorPresetSelect', randomItem(presetNames));
      writeControl('labelStyle', randomItem(layoutNames));
      writeControl('filterPreset', randomItem(effectNames));
      writeControl('contrastVal', 85 + Math.floor(Math.random() * 31));
      writeControl('brightnessVal', 90 + Math.floor(Math.random() * 21));
      writeControl('saturationVal', 80 + Math.floor(Math.random() * 61));
      applyColorPreset(readControl('colorPresetSelect'));
      updateStateFromControls();
    });

    function setPresetToCustomIfManual() {
      state.preset = null;
    }

    const buildingOutlineToggle = document.getElementById('buildingOutlineToggle');

    function updateBuildingOutlineVisibility() {}

    buildingOutlineToggle.addEventListener('change', updateBuildingOutlineVisibility);

    function setupBuildingControls() {
      const fillInput = document.getElementById('buildingColor');
      const opacityInput = document.getElementById('buildingOpacity');
      const opacityValSpan = document.getElementById('buildingOpacityVal');
      const toggleInput = document.getElementById('buildingToggle');
      const outlineColorInput = document.getElementById('buildingOutlineColor');

      function update() {
        syncStateFromControls();
        Object.assign(state.layers, {
          buildingColor: readControl('buildingColor'),
          buildingOpacity: readControl('buildingOpacity'),
          buildingToggle: readControl('buildingToggle'),
          buildingOutlineToggle: readControl('buildingOutlineToggle'),
          buildingOutlineColor: readControl('buildingOutlineColor')
        });
        opacityValSpan.textContent = state.layers.buildingOpacity;
        const style = map.getStyle();
        if (!style || !style.layers) return;

        const enabled = state.layers.buildingToggle;
        const opacity = (state.layers.buildingOpacity / 100) * (enabled ? 1 : 0);
        const fillColor = state.layers.buildingColor;
        const outlineEnabled = state.layers.buildingOutlineToggle && enabled;
        const outlineColor = state.layers.buildingOutlineColor;

        style.layers.forEach(layer => {
          if (layer.id.toLowerCase().includes('building')) {
            map.setLayoutProperty(layer.id, 'visibility', enabled ? 'visible' : 'none');
            if (layer.type === 'fill') {
              map.setPaintProperty(layer.id, 'fill-color', fillColor);
              map.setPaintProperty(layer.id, 'fill-opacity', opacity);
              if (outlineEnabled) {
                map.setPaintProperty(layer.id, 'fill-outline-color', outlineColor);
              } else {
                map.setPaintProperty(layer.id, 'fill-outline-color', fillColor);
              }
            } else if (layer.type === 'line') {
              map.setLayoutProperty(layer.id, 'visibility', outlineEnabled ? 'visible' : 'none');
              map.setPaintProperty(layer.id, 'line-color', outlineColor);
              map.setPaintProperty(layer.id, 'line-opacity', opacity);
            }
          }
        });
      }

      fillInput.addEventListener('input', () => { setPresetToCustomIfManual(); update(); });
      opacityInput.addEventListener('input', () => { setPresetToCustomIfManual(); update(); });
      toggleInput.addEventListener('change', () => { setPresetToCustomIfManual(); update(); });
      buildingOutlineToggle.addEventListener('change', () => { setPresetToCustomIfManual(); update(); });
      outlineColorInput.addEventListener('input', () => { setPresetToCustomIfManual(); update(); });

      updateCallbacks.push(update);
    }

    document.querySelectorAll('.layer-control-card input').forEach(input => {
      input.addEventListener('input', setPresetToCustomIfManual);
      input.addEventListener('change', setPresetToCustomIfManual);
    });

    function triggerAllLayerUpdates() {
      updateCallbacks.forEach(cb => cb());
    }

    map.on('load', () => {
      mapReady = true;
      configureBuildingZoom(map);
      applyTextFilters();

      setupLayerControls('waterColor', null, 'waterOpacity', 'waterOpacityVal', 'waterToggle', 'water');
      setupLayerControls('forestColor', 'forestColorAccent', 'forestOpacity', 'forestOpacityVal', 'forestToggle', 'forest');
      setupLayerControls('landColor', null, 'landOpacity', 'landOpacityVal', 'landToggle', 'land');
      setupLayerControls('landCoverColor', 'landCoverColorAccent', 'landCoverOpacity', 'landCoverOpacityVal', 'landCoverToggle', 'landCover');
      setupLayerControls('roadColor', null, 'roadOpacity', 'roadOpacityVal', 'roadToggle', 'road');
      setupLayerControls('boundaryColor', null, 'boundaryOpacity', 'boundaryOpacityVal', 'boundaryToggle', 'boundary');

      setupBuildingControls();
      applyColorPreset(DEFAULTS.preset);
      configureBuildingZoom(map);
      triggerAllLayerUpdates();
      updateLabelStyle();
      warnAboutUnsupportedLayers(map);
    });

    // Search and reverse geocoding via Nominatim
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const cityNameEl = document.getElementById('cityName');
    const cityCoordsEl = document.getElementById('cityCoords');
    const cityCountryEl = document.getElementById('cityCountry');
    let debounceTimer;
    let searchController;
    let activeSearchIndex = -1;
    let lastSearchAt = 0;
    let reverseController;
    let lastReverseAt = 0;
    let locationSelectionInProgress = false;
    const searchCache = new Map();
    const reverseCache = new Map();
    const SEARCH_INTERVAL_MS = 1000;
    const REVERSE_INTERVAL_MS = 1200;
    const statusMessage = document.getElementById('statusMessage');

    function setStatus(message, isError = false) {
      statusMessage.textContent = message;
      statusMessage.classList.toggle('error', isError);
    }

    function setSearchResultsVisible(visible) {
      searchResults.style.display = visible ? 'block' : 'none';
      searchInput.setAttribute('aria-expanded', String(visible));
    }

    function showSearchMessage(message) {
      searchResults.innerHTML = `<div class="search-message">${message}</div>`;
      setSearchResultsVisible(true);
      activeSearchIndex = -1;
    }

    function selectSearchResult(item) {
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      map.flyTo({ center: [lon, lat], zoom: 12 });
      locationSelectionInProgress = true;
      cityNameEl.textContent = item.display_name.split(',')[0].toUpperCase();
      searchInput.value = item.display_name.split(',')[0];
      if (item.address?.country) cityCountryEl.textContent = item.address.country.toUpperCase();
      else updateLocationFromCenter();
      setSearchResultsVisible(false);
      setStatus('');
      syncStateFromControls();
    }

    function renderSearchResults(data) {
      searchResults.innerHTML = '';
      activeSearchIndex = -1;
      data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.setAttribute('role', 'option');
        div.setAttribute('aria-selected', 'false');
        div.textContent = item.display_name;
        div.addEventListener('click', () => selectSearchResult(item));
        searchResults.appendChild(div);
      });
      setSearchResultsVisible(true);
    }

    async function fetchJson(url, signal) {
      const response = await fetch(url, {
        signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      return response.json();
    }

    function updateCoordsDisplay() {
      const center = map.getCenter();
      const lat = center.lat.toFixed(4);
      const lng = center.lng.toFixed(4);
      cityCoordsEl.textContent = `${Math.abs(lat)}° ${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lng)}° ${lng >= 0 ? 'E' : 'W'}`;
    }

    map.on('move', updateCoordsDisplay);

    function getNearestCity(address) {
      return address.city
        || address.town
        || address.municipality
        || address.village
        || address.county
        || address.state;
    }

    async function updateLocationFromCenter() {
      const center = map.getCenter();
      const cacheKey = `${center.lat.toFixed(3)},${center.lng.toFixed(3)}`;
      reverseController?.abort();
      try {
        const cached = reverseCache.get(cacheKey);
        const waitMs = Math.max(0, REVERSE_INTERVAL_MS - (Date.now() - lastReverseAt));
        if (!cached && waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
        reverseController = new AbortController();
        lastReverseAt = Date.now();
        const data = cached || await fetchJson(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=10&addressdetails=1`,
          reverseController.signal
        );
        if (!cached) reverseCache.set(cacheKey, data);
        const city = getNearestCity(data.address || {});
        if (city) {
          cityNameEl.textContent = city.toUpperCase();
          searchInput.value = city;
        }
        if (data.address?.country) cityCountryEl.textContent = data.address.country.toUpperCase();
        syncStateFromControls();
      } catch (error) {
        if (error.name !== 'AbortError') {
          setStatus(`Location update failed: ${error.message}`, true);
        }
      }
    }

    map.on('moveend', () => {
      if (locationSelectionInProgress) {
        locationSelectionInProgress = false;
        syncStateFromControls();
        return;
      }
      updateLocationFromCenter();
    });

    function requestLocationSearch() {
      clearTimeout(debounceTimer);
      const query = searchInput.value.trim();
      searchController?.abort();
      if (query.length < 3) {
        setSearchResultsVisible(false);
        return;
      }

      const runSearch = async () => {
        searchController = new AbortController();
        try {
          showSearchMessage('Loading locations...');
          setStatus('Searching...');
          const cached = searchCache.get(query.toLowerCase());
          if (cached) {
            renderSearchResults(cached);
            setStatus('');
            return;
          }
          const waitMs = Math.max(0, SEARCH_INTERVAL_MS - (Date.now() - lastSearchAt));
          if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
          lastSearchAt = Date.now();
          const data = await fetchJson(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`, searchController.signal);
          searchCache.set(query.toLowerCase(), data);
          if (!data.length) {
            showSearchMessage('No locations found.');
            setStatus('No locations found.');
            return;
          }
          renderSearchResults(data);
          setStatus('');
        } catch (error) {
          if (error.name !== 'AbortError') {
            setSearchResultsVisible(false);
            setStatus(`Location search failed: ${error.message}`, true);
          }
        }
      };
      debounceTimer = setTimeout(runSearch, 300);
    }

    searchInput.addEventListener('input', requestLocationSearch);
    $('searchBtn').addEventListener('click', requestLocationSearch);

    searchInput.addEventListener('keydown', event => {
      const items = [...searchResults.querySelectorAll('.search-item')];
      if (!items.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        activeSearchIndex = event.key === 'ArrowDown'
          ? (activeSearchIndex + 1) % items.length
          : (activeSearchIndex - 1 + items.length) % items.length;
        items.forEach((item, index) => {
          item.classList.toggle('active', index === activeSearchIndex);
          item.setAttribute('aria-selected', String(index === activeSearchIndex));
        });
        items[activeSearchIndex].scrollIntoView({ block: 'nearest' });
      } else if (event.key === 'Enter' && activeSearchIndex >= 0) {
        event.preventDefault();
        items[activeSearchIndex].click();
      } else if (event.key === 'Escape') {
        setSearchResultsVisible(false);
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        setSearchResultsVisible(false);
      }
    });

    // Text Label Overlay & Font Styling (with 3 separate color fields)
    const mapLabelOverlay = document.getElementById('mapLabelOverlay');
    const labelStyle = document.getElementById('labelStyle');
    const labelTextColor = document.getElementById('labelTextColor');
    const labelCoordColor = document.getElementById('labelCoordColor');
    const labelCountryColor = document.getElementById('labelCountryColor');
    const labelBgColor = document.getElementById('labelBgColor');
    const labelOpacity = document.getElementById('labelOpacity');
    const opacityNum = document.getElementById('opacityNum');
    const labelFontSelect = document.getElementById('labelFontSelect');

    function updateLabelStyle() {
      syncStateFromControls();
      renderPreview();
    }

    labelStyle.addEventListener('change', updateLabelStyle);
    labelTextColor.addEventListener('input', updateLabelStyle);
    labelCoordColor.addEventListener('input', updateLabelStyle);
    labelCountryColor.addEventListener('input', updateLabelStyle);
    labelBgColor.addEventListener('input', updateLabelStyle);
    labelOpacity.addEventListener('input', updateLabelStyle);
    labelFontSelect.addEventListener('change', updateLabelStyle);

    // Border & Aspect Ratio Controls
    const borderCheckbox = document.getElementById('borderCheckbox');
    const borderColor = document.getElementById('borderColor');
    const borderWidth = document.getElementById('borderWidth');
    const borderWidthVal = document.getElementById('borderWidthVal');
    const borderUiItems = document.querySelectorAll('.border-ui-item');

    function updateBorderElementsVisibility() {
      renderPreview();
    }

    function updateBorderStyle() {
      syncStateFromControls();
      renderPreview();
    }

    borderCheckbox.addEventListener('change', updateBorderStyle);
    borderColor.addEventListener('input', updateBorderStyle);
    borderWidth.addEventListener('input', updateBorderStyle);
    $('outerBorderRadius').addEventListener('input', updateBorderStyle);
    $('innerBorderRadius').addEventListener('input', updateBorderStyle);

    const formatSelect = document.getElementById('formatSelect');
    formatSelect.addEventListener('change', () => {
      setState({ format: readControl('formatSelect') });
      setTimeout(() => map.resize(), 300);
    });
    function getFileTimestamp() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
    }

    // High-Res Export Engine & Download Handlers
    const exportBtn = document.getElementById('exportBtn');
    const dimsMap = {
      'a2-portrait': { width: 4961, height: 7016 },
      'a2-landscape': { width: 7016, height: 4961 },
      'a3-portrait': { width: 3508, height: 4961 },
      'a3-landscape': { width: 4961, height: 3508 },
      'a4-portrait': { width: 2480, height: 3508 },
      'a4-landscape': { width: 3508, height: 2480 },
      'a5-portrait': { width: 1748, height: 2480 },
      'a5-landscape': { width: 2480, height: 1748 },
      'square-large': { width: 4961, height: 4961 },
      'square-medium': { width: 3508, height: 3508 },
      'square-small': { width: 2480, height: 2480 }
    };

    function waitForMapIdle(targetMap, timeoutMs = 30000) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Map tiles did not finish loading in time.')), timeoutMs);
        const finish = () => {
          if (!targetMap.loaded() || !targetMap.areTilesLoaded()) return;
          clearTimeout(timeout);
          targetMap.off('idle', finish);
          resolve();
        };
        targetMap.on('idle', finish);
        finish();
      });
    }

    function applyStateToMap(targetMap, exportState) {
      const set = exportState.layers;
      targetMap.getStyle().layers.forEach(layer => {
        const role = getLayerRole(layer);
        if (!role) return;
        const prefix = role === 'landCover' ? 'landCover' : role;
        const enabled = set[`${prefix}Toggle`] !== false;
        const opacity = Number(set[`${prefix}Opacity`] ?? 100) / 100;
        const isAccent = (role === 'forest' && /park|recreation|pitch/.test(layer.id.toLowerCase()))
          || (role === 'landCover' && /residential/.test(layer.id.toLowerCase()));
        const color = isAccent ? set[`${prefix}ColorAccent`] : set[`${prefix}Color`];
        targetMap.setLayoutProperty(layer.id, 'visibility', enabled ? 'visible' : 'none');
        if (!color) return;
        if (layer.type === 'fill') {
          targetMap.setPaintProperty(layer.id, 'fill-color', color);
          targetMap.setPaintProperty(layer.id, 'fill-opacity', enabled ? opacity : 0);
        } else if (layer.type === 'line') {
          targetMap.setPaintProperty(layer.id, 'line-color', color);
          targetMap.setPaintProperty(layer.id, 'line-opacity', enabled ? opacity : 0);
        } else if (layer.type === 'background') {
          targetMap.setPaintProperty(layer.id, 'background-color', color);
          targetMap.setPaintProperty(layer.id, 'background-opacity', enabled ? opacity : 0);
        }
      });
      applyTextFilters(targetMap, exportState.textFilter);
    }

    function configureBuildingZoom(targetMap) {
      const style = targetMap.getStyle();
      if (!style?.layers) return;
      style.layers.forEach(layer => {
        if (getLayerRole(layer) === 'building') {
          targetMap.setLayerZoomRange(layer.id, 0, 24);
          if (layer.type === 'fill') {
            targetMap.setPaintProperty(layer.id, 'fill-opacity', 1);
          }
        }
      });
    }


    async function createExportMap(width, height, exportState) {
      const container = document.createElement('div');
      container.className = 'export-map-container';
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      document.body.appendChild(container);
      const exportMap = new maplibregl.Map({
        container,
        preserveDrawingBuffer: true,
        attributionControl: false,
        interactive: false,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        bearing: exportState.bearing,
        pitch: exportState.pitch
      });
      await new Promise((resolve, reject) => {
        exportMap.once('load', resolve);
        exportMap.once('error', event => reject(event.error || new Error('Export map failed to load.')));
      });
      configureBuildingZoom(exportMap);
      applyStateToMap(exportMap, exportState);
      exportMap.resize();
      const bounds = new maplibregl.LngLatBounds(exportState.bounds[0], exportState.bounds[1]);
      exportMap.fitBounds(bounds, {
        padding: 0,
        bearing: exportState.bearing,
        pitch: exportState.pitch,
        duration: 0
      });
      const previewAspect = exportState.previewMapSize.width / exportState.previewMapSize.height;
      const exportAspect = width / height;
      if (Math.abs(previewAspect - exportAspect) > 0.001) {
        console.warn('Preview and export map aspect ratios differ; matching bounds takes priority.');
      }
      await waitForMapIdle(exportMap);
      return { exportMap, container };
    }

    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportBtnLabel.textContent = 'Exporting...';
      setStatus('Rendering high-resolution poster...');

      try {
        if (document.fonts) {
          await document.fonts.ready;
        }

        const exportState = getExportState();
        const baseDims = dimsMap[exportState.format];
        if (!baseDims) throw new Error('Unsupported output format.');
        const dpiScale = exportState.exportDpi / 300;
        const targetDims = {
          width: Math.round(baseDims.width * dpiScale),
          height: Math.round(baseDims.height * dpiScale)
        };

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = targetDims.width;
        exportCanvas.height = targetDims.height;
          const ctx = exportCanvas.getContext('2d');
          if (!ctx) throw new Error('Canvas rendering is unavailable.');
          if (exportState.outerBorderRadius > 0) {
            const exportRadius = exportState.outerBorderRadius * (targetDims.width / mapFrame.clientWidth);
            ctx.beginPath();
            ctx.roundRect(0, 0, targetDims.width, targetDims.height, exportRadius);
            ctx.clip();
          }

        const scaleFactor = targetDims.width / mapFrame.clientWidth;
        const bWidth = exportState.borderEnabled ? exportState.borderWidth * scaleFactor : 0;

      ctx.fillStyle = exportState.borderColor;
      ctx.fillRect(0, 0, targetDims.width, targetDims.height);

      const presetKey = exportState.filterPreset;
      const baseFilter = filterPresets[presetKey] || '';
      const contrastSetting = exportState.contrast;
      ctx.filter = `${baseFilter} contrast(${contrastSetting}%) brightness(${exportState.brightness}%) saturate(${exportState.saturation}%)`.trim();

      const mapWidth = Math.max(1, Math.round(targetDims.width - (bWidth * 2)));
      const mapHeight = Math.max(1, Math.round(targetDims.height - (bWidth * 2)));
      const { exportMap, container } = await createExportMap(mapWidth, mapHeight, exportState);
      const mapCanvas = exportMap.getCanvas();
      if (exportState.innerBorderRadius > 0) {
        const innerRadius = exportState.innerBorderRadius * scaleFactor;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(bWidth, bWidth, mapWidth, mapHeight, innerRadius);
        ctx.clip();
      }
      ctx.drawImage(
        mapCanvas, 
        bWidth, 
        bWidth, 
        targetDims.width - (bWidth * 2), 
        targetDims.height - (bWidth * 2)
      );
      if (exportState.innerBorderRadius > 0) ctx.restore();
      exportMap.remove();
      container.remove();

      ctx.filter = 'none';

      if (exportState.labelStyle !== 'none') {
        const hex = exportState.labelBgColor;
        const alpha = exportState.labelOpacity / 100;
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        
        const style = exportState.labelStyle;
        const fontChoice = exportState.labelFont;
        const previewRefWidth = exportState.previewMapSize.width;
        const proportionalScale = mapWidth / previewRefWidth;
        const measuredOverlay = exportState.overlay;

        const fullWidthStyles = [
          'style-fullwidth-left', 'style-fullwidth', 'style-fullwidth-right',
          'style-fullwidth-top-left', 'style-fullwidth-top', 'style-fullwidth-top-right'
        ];
        if (![...fullWidthStyles, 'style-deck', 'style-minimal'].includes(style)) {
          const boxX = bWidth + measuredOverlay.x * proportionalScale;
          const boxWidth = measuredOverlay.width * proportionalScale;
          const boxHeight = measuredOverlay.height * proportionalScale;
          const isBottomCorner = style === 'style-bottom-right-absolute';
          const boxY = isBottomCorner
            ? targetDims.height - bWidth - boxHeight
            : bWidth + measuredOverlay.y * proportionalScale;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          if (measuredOverlay.borderRadius > 0 && typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, measuredOverlay.borderRadius * proportionalScale);
            ctx.fill();
          } else {
            ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
          }

          measuredOverlay.children.forEach((child, index) => {
            const texts = [exportState.city, exportState.coordinates, exportState.country];
            const colors = [exportState.labelTextColor, exportState.labelCoordColor, exportState.labelCountryColor];
            ctx.fillStyle = colors[index];
            ctx.font = `${child.fontWeight} ${child.fontSize * proportionalScale}px ${fontChoice}`;
            if (child.textAlign === 'right') {
              ctx.textAlign = 'right';
              ctx.fillText(texts[index], boxX + boxWidth - child.x * proportionalScale, boxY + child.baselineY * proportionalScale);
            } else if (child.textAlign === 'left') {
              ctx.textAlign = 'left';
              ctx.fillText(texts[index], boxX + child.x * proportionalScale, boxY + child.baselineY * proportionalScale);
            } else {
              ctx.textAlign = 'center';
              ctx.fillText(texts[index], boxX + boxWidth / 2, boxY + child.baselineY * proportionalScale);
            }
          });
        } else if (fullWidthStyles.includes(style)) {
          const bannerHeight = 180 * proportionalScale;
          const isTop = style.includes('-top');
          const isLeft = style.endsWith('-left');
          const isRight = style.endsWith('-right');
          const bannerY = isTop ? bWidth : targetDims.height - bWidth - bannerHeight;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(bWidth, bannerY, targetDims.width - (bWidth * 2), bannerHeight);

          ctx.textAlign = isLeft ? 'left' : isRight ? 'right' : 'center';
          const textX = isLeft
            ? bWidth + (40 * proportionalScale)
            : isRight
              ? targetDims.width - bWidth - (40 * proportionalScale)
              : targetDims.width / 2;
          ctx.fillStyle = exportState.labelTextColor;
          ctx.font = `800 ${38 * proportionalScale}px ${fontChoice}`;
          ctx.fillText(cityNameEl.textContent, textX, bannerY + (50 * proportionalScale));

          ctx.fillStyle = exportState.labelCoordColor;
          ctx.font = `600 ${20 * proportionalScale}px ${fontChoice}`;
          ctx.fillText(cityCoordsEl.textContent, textX, bannerY + (95 * proportionalScale));

          ctx.fillStyle = exportState.labelCountryColor;
          ctx.font = `700 ${22 * proportionalScale}px ${fontChoice}`;
          ctx.fillText(cityCountryEl.textContent, textX, bannerY + (140 * proportionalScale));

        } else if (style === 'style-deck') {
          const bannerHeight = 130 * proportionalScale;
          const bannerY = targetDims.height - bWidth - bannerHeight - (30 * proportionalScale);
          const margin = 30 * proportionalScale;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(bWidth + margin, bannerY, targetDims.width - (bWidth * 2) - (margin * 2), bannerHeight);

          ctx.textAlign = 'left';
          ctx.fillStyle = exportState.labelTextColor;
          ctx.font = `800 ${34 * proportionalScale}px ${fontChoice}`;
          ctx.fillText(cityNameEl.textContent, bWidth + margin + (30 * proportionalScale), bannerY + (50 * proportionalScale));

          ctx.fillStyle = exportState.labelCoordColor;
          ctx.font = `600 ${16 * proportionalScale}px ${fontChoice}`;
          ctx.fillText(cityCoordsEl.textContent, bWidth + margin + (30 * proportionalScale), bannerY + (90 * proportionalScale));

          ctx.textAlign = 'right';
          ctx.fillStyle = exportState.labelCountryColor;
          ctx.font = `700 ${20 * proportionalScale}px ${fontChoice}`;
          ctx.fillText(cityCountryEl.textContent, targetDims.width - bWidth - margin - (30 * proportionalScale), bannerY + (70 * proportionalScale));

        } else if (style === 'style-minimal') {
           const boxX = targetDims.width / 2;
           const boxY = targetDims.height - bWidth - (80 * proportionalScale);
           
           ctx.textAlign = 'center';
           ctx.shadowColor = 'rgba(0,0,0,0.4)';
           ctx.shadowBlur = 10 * proportionalScale;

           ctx.fillStyle = exportState.labelTextColor;
           ctx.font = `800 ${34 * proportionalScale}px ${fontChoice}`;
           ctx.fillText(cityNameEl.textContent, boxX, boxY);

           ctx.fillStyle = exportState.labelCoordColor;
           ctx.font = `600 ${16 * proportionalScale}px ${fontChoice}`;
           ctx.fillText(cityCoordsEl.textContent, boxX, boxY + (35 * proportionalScale));

           ctx.fillStyle = exportState.labelCountryColor;
           ctx.font = `700 ${18 * proportionalScale}px ${fontChoice}`;
           ctx.fillText(cityCountryEl.textContent, boxX, boxY + (70 * proportionalScale));
           
           ctx.shadowColor = 'transparent';
           ctx.shadowBlur = 0;

        }
      }

        const mimeType = exportState.exportType;
        const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
        const blob = await new Promise((resolve, reject) => {
          exportCanvas.toBlob(result => {
            if (result) resolve(result);
            else reject(new Error(`${extension.toUpperCase()} encoding failed.`));
          }, mimeType, 0.92);
        });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `MapArtGen_${exportState.city.trim().replace(/\s+/g, '_')}_${exportState.exportDpi}dpi_${getFileTimestamp()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
        setStatus('Poster exported.');
      } catch (error) {
        console.error('Export failed', error);
        const location = error.stack?.match(/MapArtGen\.html:(\d+):(\d+)/)?.[0];
        setStatus(`Export failed${location ? ` at ${location}` : ''}: ${error.message}`, true);
      } finally {
        exportBtnLabel.textContent = 'Export';
        exportBtn.disabled = false;
      }
    });

