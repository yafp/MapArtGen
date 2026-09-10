// =============================================================================
// cartiva - app.js
// =============================================================================


// All basic app constants - as 1 object
const APP = {
  NAME: "cartiva",
  DESCRIPTION: "a small, self-contained creative cartography web-app",
  VERSION: "2026.09.10.211600", // yyyy.mm.dd.HHMMSS
  GITHUBLINK: "https://github.com/yafp/cartiva"
};


// Init some values in the UI with constants
// 
// Tab title
document.title = `${APP.NAME} - ${APP.DESCRIPTION} - v${APP.VERSION}`;

// AppName
const heading = document.getElementById('appName');
if (appName) {
  appName.textContent = `${APP.NAME}`;
}

// AppDescription
const appDescription = document.getElementById('appDescription');
if (appDescription) {
  appDescription.textContent = `${APP.DESCRIPTION}`;
}

// AppVersion
const appVersion = document.getElementById('appVersion');
if (appVersion) {
  appVersion.textContent = `${APP.VERSION}`;
}

// AppGithubLink
const appGithubLink = document.getElementById('appGithubLink');
if (appGithubLink) {
  appGithubLink.href = `${APP.GITHUBLINK}`;
}




// -----------------------------------------------------------------------------
// START LOCATION & PERSISTENCE
// First-time visitors receive a random, curated larger city with prominent
// river, lake, harbor, or coastal geography. Returning visitors resume the
// last successfully used map location stored in this browser.
// -----------------------------------------------------------------------------
const LAST_LOCATION_STORAGE_KEY = 'cartiva.lastLocation';
const STARTER_CITIES = Object.freeze([
  { city: 'AMSTERDAM', country: 'NETHERLANDS', center: [4.9041, 52.3676], zoom: 12 },
  { city: 'HAMBURG', country: 'GERMANY', center: [9.9937, 53.5511], zoom: 12 },
  { city: 'LONDON', country: 'UNITED KINGDOM', center: [-0.1276, 51.5074], zoom: 11.5 },
  { city: 'PARIS', country: 'FRANCE', center: [2.3522, 48.8566], zoom: 12 },
  { city: 'VIENNA', country: 'AUSTRIA', center: [16.3738, 48.2082], zoom: 12 },
  { city: 'BUDAPEST', country: 'HUNGARY', center: [19.0402, 47.4979], zoom: 12 },
  { city: 'PRAGUE', country: 'CZECHIA', center: [14.4378, 50.0755], zoom: 12 },
  { city: 'STOCKHOLM', country: 'SWEDEN', center: [18.0686, 59.3293], zoom: 12 },
  { city: 'COPENHAGEN', country: 'DENMARK', center: [12.5683, 55.6761], zoom: 12 },
  { city: 'LISBON', country: 'PORTUGAL', center: [-9.1393, 38.7223], zoom: 12 },
  { city: 'PORTO', country: 'PORTUGAL', center: [-8.6291, 41.1579], zoom: 12 },
  { city: 'VANCOUVER', country: 'CANADA', center: [-123.1207, 49.2827], zoom: 12 },
  { city: 'CHICAGO', country: 'UNITED STATES', center: [-87.6298, 41.8781], zoom: 11.5 },
  { city: 'NEW YORK', country: 'UNITED STATES', center: [-74.0060, 40.7128], zoom: 11 },
  { city: 'SINGAPORE', country: 'SINGAPORE', center: [103.8198, 1.3521], zoom: 11 },
  { city: 'SYDNEY', country: 'AUSTRALIA', center: [151.2093, -33.8688], zoom: 11.5 }
]);

function getStoredLocation() {
  try {
    const value = JSON.parse(localStorage.getItem(LAST_LOCATION_STORAGE_KEY));
    const validCenter = Array.isArray(value?.center)
      && value.center.length === 2
      && value.center.every(Number.isFinite);
    if (!validCenter || !Number.isFinite(value?.zoom)) return null;
    return {
      city: String(value.city || 'MAP LOCATION').toUpperCase(),
      country: String(value.country || '').toUpperCase(),
      center: value.center,
      zoom: value.zoom,
      bearing: Number.isFinite(value.bearing) ? value.bearing : 0,
      pitch: Number.isFinite(value.pitch) ? value.pitch : 0
    };
  } catch (error) {
    console.warn('The saved cartiva location could not be read.', error);
    return null;
  }
}

function getRandomStarterCity() {
  return STARTER_CITIES[Math.floor(Math.random() * STARTER_CITIES.length)];
}

const START_LOCATION = getStoredLocation() || getRandomStarterCity();

function saveLastLocation() {
  try {
    const center = map.getCenter();
    localStorage.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify({
      city: cityNameEl.textContent,
      country: cityCountryEl.textContent,
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch()
    }));
  } catch (error) {
    console.warn('The current cartiva location could not be saved.', error);
  }
}

// -----------------------------------------------------------------------------
// NATIVE SHARING
// Show the minimal share control only when the browser exposes Web Share.
// navigator.share opens the native share sheet on supported mobile and desktop
// browsers. Sharing the canonical page URL avoids including temporary hashes.
// -----------------------------------------------------------------------------
const shareBtn = document.getElementById('shareBtn');
const shareData = {
  title: APP.NAME,
  text: `Create your own map art with ${APP.NAME}.`,
  url: window.location.href
};

// Feature detection keeps the control invisible on unsupported browsers.
// canShare is used when available to verify this exact payload.
const sharingSupported = typeof navigator.share === 'function'
  && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData));

if (shareBtn && sharingSupported) {
  shareBtn.hidden = false;
  shareBtn.addEventListener('click', async () => {
    try {
      // Must run directly within the click handler to preserve user activation.
      await navigator.share(shareData);
    } catch (error) {
      // AbortError means the user intentionally closed the native share dialog.
      if (error.name !== 'AbortError') {
        console.warn('Sharing cartiva failed.', error);
      }
    }
  });
}

// -----------------------------------------------------------------------------
// DEFAULT CONFIGURATION
// Frozen object with default values for presets, labels, export, filters,
// terrain, STL options, and layer ordering.
// -----------------------------------------------------------------------------
const DEFAULTS = Object.freeze({
      preset: 'alpine',
      labelStyle: 'corner-bottom-right',
      labelOpacity: '100',
      textFilter: 'none',
      format: 'a4-portrait',
      exportType: 'image/png',
      exportDpi: 300,
      filterPreset: 'none',
      contrast: 100,
      brightness: 100,
      saturation: 100,
      shape: 'none',
      shapeColor: '#ffffff',
      terrainEnabled: false,
      mountainColor: '#64748b',
      terrainExaggeration: 100,
      stlBuildingsEnabled: true,
      stlRoadsEnabled: true,
      scaleEnabled: false,
      northEnabled: false,
      layerOrder: ['land', 'water', 'forest', 'landCover', 'terrain', 'road', 'boundary', 'building']
    });

// -----------------------------------------------------------------------------
// APPLICATION STATE
// Mutable state initialized from DEFAULTS and extended with map/location data.
// Updated as the user interacts with controls and the map.
// -----------------------------------------------------------------------------
    const state = {
      ...DEFAULTS,
      center: [...START_LOCATION.center],
      zoom: START_LOCATION.zoom,
      bearing: START_LOCATION.bearing || 0,
      pitch: START_LOCATION.pitch || 0,
      city: START_LOCATION.city,
      coordinates: '',
      country: START_LOCATION.country,
      layers: {}
    };

// -----------------------------------------------------------------------------
// DOM CONTROL CACHE
// Build a frozen map from element id → element for fast lookup.
// -----------------------------------------------------------------------------
    const controls = Object.freeze(Object.fromEntries(
      Array.from(document.querySelectorAll('[id]'), element => [element.id, element])
    ));

// -----------------------------------------------------------------------------
// HELPER: SHORT $() FOR GETTING CONTROLS BY ID
// Returns the cached element or null if not found.
// -----------------------------------------------------------------------------
    const $ = id => controls[id] || null;

// -----------------------------------------------------------------------------
// MAPLIBRE & TERRAIN CONSTANTS
// Base style URL, terrain source/layer IDs, and elevation tile URL template.
// -----------------------------------------------------------------------------
    const MAP_STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    const TERRAIN_SOURCE_ID = 'mapartgen-terrain';
    const TERRAIN_LAYER_ID = 'mapartgen-hillshade';
    const TERRAIN_COLOR_SOURCE_ID = 'mapartgen-elevation-colors';
    const TERRAIN_COLOR_LAYER_ID = 'mapartgen-elevation-colors-layer';
    const TERRAIN_TILES_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// -----------------------------------------------------------------------------
// OUTPUT DIMENSIONS MAP
// Pixel dimensions for each paper format at 300 DPI.
// Scaled later according to the chosen export DPI.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// CONTROL HELPERS: READ/WRITE
// readControl: get value (boolean for checkbox, string otherwise).
// writeControl: set value (boolean for checkbox, string otherwise).
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// STATE SYNC FROM UI
// Reads all relevant controls and updates the global `state` object.
// Also captures map camera state if `map` exists.
// -----------------------------------------------------------------------------
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
      state.shape = readControl('shapeSelect');
      state.shapeColor = readControl('shapeColor');
      state.terrainEnabled = readControl('terrainToggle');
      state.mountainColor = readControl('mountainColor');
      state.terrainExaggeration = Number(readControl('terrainExaggeration'));
      state.stlBuildingsEnabled = readControl('stlBuildingsToggle');
      state.stlRoadsEnabled = readControl('stlRoadsToggle');
      state.scaleEnabled = readControl('scaleToggle');
      state.northEnabled = readControl('northToggle');
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


// -----------------------------------------------------------------------------
// EXPORT STATE BUILDER
// Constructs a comprehensive snapshot for high‑res export:
// - All settings from controls/state
// - Map bounds and camera
// - Overlay geometry and label metrics for precise placement
// -----------------------------------------------------------------------------
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
        shape: readControl('shapeSelect'),
        shapeColor: readControl('shapeColor'),
        terrainEnabled: readControl('terrainToggle'),
        mountainColor: readControl('mountainColor'),
        terrainExaggeration: Number(readControl('terrainExaggeration')),
        stlBuildingsEnabled: readControl('stlBuildingsToggle'),
        stlRoadsEnabled: readControl('stlRoadsToggle'),
        scaleEnabled: readControl('scaleToggle'),
        northEnabled: readControl('northToggle'),
        layerOrder: [...state.layerOrder],
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


// -----------------------------------------------------------------------------
// STATE PATCH HELPER
// Applies a partial update to `state` and optionally re-renders preview.
// -----------------------------------------------------------------------------
    function setState(patch, { render = true } = {}) {
      Object.assign(state, patch);
      if (render) renderPreview();
    }


// -----------------------------------------------------------------------------
// DIMENSION CALCULATIONS
// Compute target export size (px) for a given format and DPI.
// Update on-screen dimension readout.
// -----------------------------------------------------------------------------
    function getTargetDimensions(format = readControl('formatSelect'), dpi = Number(readControl('exportDpi'))) {
      const baseDims = dimsMap[format];
      if (!baseDims) throw new Error('Unsupported output format.');
      const scale = dpi / 300;
      return {
        width: Math.round(baseDims.width * scale),
        height: Math.round(baseDims.height * scale)
      };
    }

    function updateOutputDimensions() {
      const dimensions = getTargetDimensions();
      $('outputDimensions').textContent = `${dimensions.width} × ${dimensions.height} px`;
    }


// -----------------------------------------------------------------------------
// CONTRAST & ACCESSIBILITY
// relativeLuminance: WCAG-style luminance calculation for a hex color.
// updateContrastWarning: compute text/background contrast and show warning.
// -----------------------------------------------------------------------------
    function relativeLuminance(hex) {
      const channels = [1, 3, 5].map(index => {
        const value = parseInt(hex.slice(index, index + 2), 16) / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }

    function updateContrastWarning() {
      const background = relativeLuminance(state.labelBgColor);
      const ratios = [state.labelTextColor, state.labelCoordColor, state.labelCountryColor].map(color => {
        const foreground = relativeLuminance(color);
        return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
      });
      const minimum = Math.min(...ratios);
      const warning = $('contrastWarning');
      const passes = minimum >= 4.5 || state.labelStyle === 'none' || state.labelOpacity < 50;
      warning.textContent = passes
        ? `Text contrast: ${minimum.toFixed(1)}:1`
        : `Low text contrast: ${minimum.toFixed(1)}:1 (aim for 4.5:1)`;
      warning.classList.toggle('good', passes);
    }


// -----------------------------------------------------------------------------
// PREVIEW RENDERING
// Applies current state to the live preview:
// - CSS filters on map
// - Label overlay visibility, colors, font, background
// - Border/frame styles and shape mask
// - Map annotations (scale/north), text filters, dimensions, contrast warning
// -----------------------------------------------------------------------------
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
        mapLabelOverlay.style.backgroundColor = state.labelStyle === 'special-minimal'
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
      mapFrame.style.backgroundColor = state.borderEnabled ? state.borderColor : '#ffffff';
      mapFrame.style.borderRadius = `${state.outerBorderRadius}px`;
      mapEl.style.borderRadius = `${state.innerBorderRadius}px`;
      mapFrame.className = `map-frame ratio-${state.format}`;
      renderShapeMask();
      renderMapAnnotations();
      applyTextFilters(map, state.textFilter);
      updateOutputDimensions();
      updateContrastWarning();
    }


// -----------------------------------------------------------------------------
// UI UPDATE WRAPPER
// Sync state from controls, then re-render preview.
// -----------------------------------------------------------------------------
    function updateStateFromControls() {
      syncStateFromControls();
      renderPreview();
    }


// -----------------------------------------------------------------------------
// SHAPE MASKS
// getShapePath: create scaled Path2D for a shape.
// getShapeSvgPath: SVG path strings for various shapes (100×¹00 viewBox).
// renderShapeMask: show/hide and configure the SVG shape mask overlay.
// -----------------------------------------------------------------------------
    function getShapePath(shape, width, height) {
      const svgPath = getShapeSvgPath(shape);
      const path = new Path2D(svgPath);
      const transform = new DOMMatrix().scale(width / 100, height / 100);
      return new Path2D(path, transform);
    }

    function getShapeSvgPath(shape) {
      if (shape === 'circle') return 'M 50 10 A 40 40 0 1 1 49.99 10 Z';
      if (shape === 'heart') return 'M 50 88 C 5 58 5 25 27 15 C 40 9 49 20 50 31 C 51 20 60 9 73 15 C 95 25 95 58 50 88 Z';
      if (shape === 'star') return 'M 50 8 L 61 36 L 91 38 L 68 57 L 76 88 L 50 70 L 24 88 L 32 57 L 9 38 L 39 36 Z';
      if (shape === 'house') return 'M 10 45 L 50 10 L 90 45 L 82 45 L 82 90 L 60 90 L 60 63 L 40 63 L 40 90 L 18 90 L 18 45 Z';
      if (shape === 'spiral') return 'M 50 7 C 85 7 94 34 91 55 C 88 81 67 94 43 91 C 18 88 6 68 10 46 C 14 24 33 14 52 17 C 72 20 81 36 78 53 C 75 70 61 78 47 75 C 33 72 27 61 30 49 C 33 37 43 32 53 35 C 63 38 67 46 64 54 C 62 61 56 64 50 62 L 50 49 C 52 51 53 50 53 49 C 53 47 51 46 49 47 C 46 48 45 52 47 55 C 50 59 56 58 59 54 C 63 48 60 41 54 39 C 45 36 37 42 35 51 C 32 63 41 71 51 72 C 66 73 76 61 75 48 C 74 29 58 18 42 20 C 19 23 8 43 13 62 C 19 84 42 94 62 86 C 86 77 96 50 86 28 C 79 13 65 7 50 7 Z';
      if (shape === 'peace') return 'M 50 8 A 42 42 0 1 1 49.99 8 Z M 44 20 L 56 20 L 56 56 L 79 79 L 70 87 L 50 67 L 30 87 L 21 79 L 44 56 Z';
      if (shape === 'smiley') return 'M 50 8 A 42 42 0 1 1 49.99 8 Z M 31 32 A 6 6 0 1 1 30.99 32 Z M 69 32 A 6 6 0 1 1 68.99 32 Z M 25 57 C 31 81 69 81 75 57 L 64 57 C 59 68 41 68 36 57 Z';
      if (shape === 'diamond') return 'M 50 7 L 92 50 L 50 93 L 8 50 Z';
      if (shape === 'hexagon') return 'M 27 10 L 73 10 L 94 50 L 73 90 L 27 90 L 6 50 Z';
      if (shape === 'cross') return 'M 35 8 L 65 8 L 65 35 L 92 35 L 92 65 L 65 65 L 65 92 L 35 92 L 35 65 L 8 65 L 8 35 L 35 35 Z';
      if (shape === 'cloud') return 'M 22 79 C 7 79 4 57 17 50 C 13 31 34 19 48 31 C 57 12 85 21 84 43 C 101 48 96 79 77 79 Z';
      return '';
    }

    function renderShapeMask() {
      const mask = $('shapeMask');
      if (state.shape === 'none') {
        mask.style.display = 'none';
        return;
      }
      mask.style.display = 'block';
      $('shapeCutoutPath').setAttribute('d', getShapeSvgPath(state.shape));
      $('shapeMaskColor').setAttribute('fill', state.shapeColor);
    }

    document.getElementById('settingsForm').addEventListener('input', updateStateFromControls);
    document.getElementById('settingsForm').addEventListener('change', updateStateFromControls);
    let mapReady = false;


// -----------------------------------------------------------------------------
// INITIALIZATION
// Reset form, apply default values to controls, and sync state.
// Runs on DOMContentLoaded and on pageshow if persisted.
// -----------------------------------------------------------------------------
    function initializeDefaults() {
		
		
		
	
		
      const form = document.getElementById('settingsForm');
      if (form) form.reset();
      document.getElementById('roadColor').value = "#374151";
      document.getElementById('boundaryColor').value = "#9ca3af";
      document.getElementById('borderWidth').value = "16";
      document.getElementById('borderWidthVal').textContent = "16";
      document.getElementById('searchInput').value = START_LOCATION.city;
      document.getElementById('cityName').textContent = START_LOCATION.city;
      document.getElementById('cityCountry').textContent = START_LOCATION.country;
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
      writeControl('terrainToggle', DEFAULTS.terrainEnabled);
      writeControl('mountainColor', DEFAULTS.mountainColor);
      writeControl('terrainExaggeration', DEFAULTS.terrainExaggeration);
      writeControl('stlBuildingsToggle', DEFAULTS.stlBuildingsEnabled);
      writeControl('stlRoadsToggle', DEFAULTS.stlRoadsEnabled);
      writeControl('scaleToggle', DEFAULTS.scaleEnabled);
      writeControl('northToggle', DEFAULTS.northEnabled);
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


// -----------------------------------------------------------------------------
// ACCORDION SECTIONS
// Collapsible section blocks with ARIA attributes and keyboard support.
// Only one section expanded at a time.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// MAPLIBRE MAP INITIALIZATION
// Create map at the restored or randomly selected starter location.
// Attach move/zoom/moveend handlers for UI updates and terrain refresh.
// -----------------------------------------------------------------------------
    // MapLibre initialization using the restored or random starter location
    const map = new maplibregl.Map({
      container: 'map',
      preserveDrawingBuffer: true,
      attributionControl: false,
      style: MAP_STYLE_URL,
      center: START_LOCATION.center,
      zoom: START_LOCATION.zoom,
      bearing: START_LOCATION.bearing || 0,
      pitch: START_LOCATION.pitch || 0
    });
    const zoomLevelDisplay = $('zoomLevelDisplay');
    function updateZoomLevelDisplay() {
      state.zoom = map.getZoom();
      zoomLevelDisplay.textContent = state.zoom.toFixed(2);
    }
    map.on('move', updateZoomLevelDisplay);
    map.on('move', renderMapAnnotations);
    map.on('zoomend', () => {
      configureBuildingZoom(map);
      triggerAllLayerUpdates();
      applyTextFilters(map, readControl('textFilter'));
    });
    map.on('moveend', () => {
      syncStateFromControls();
      saveLastLocation();
    });
    let terrainRefreshTimer;
    map.on('moveend', () => {
      clearTimeout(terrainRefreshTimer);
      terrainRefreshTimer = setTimeout(() => {
        if (state.terrainEnabled) updateTerrainColorization().catch(error => console.warn('Elevation colors could not be updated:', error));
      }, 250);
    });


// -----------------------------------------------------------------------------
// ZOOM & ROTATE CONTROLS
// Four zoom buttons (big/fine in/out) and three rotate buttons.
// -----------------------------------------------------------------------------
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
    $('rotateLeftBtn').addEventListener('click', () => map.rotateTo(map.getBearing() - 15, { duration: 200 }));
    $('rotateRightBtn').addEventListener('click', () => map.rotateTo(map.getBearing() + 15, { duration: 200 }));
    $('resetBearingBtn').addEventListener('click', () => map.rotateTo(0, { duration: 250 }));


// -----------------------------------------------------------------------------
// LIVE MAGNIFIER
// Toggleable lens that shows a zoomed crop of the map canvas under the cursor.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// LIVE FILTERS (PRESETS + CONTRAST/BRIGHTNESS/SATURATION)
// Apply CSS filter chain to map element based on preset and sliders.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// LABEL VISIBILITY FILTERS
// Group label layers by role (water, cities, streets, transit, poi, natural).
// Show/hide labels based on selected filter mode (e.g. cities_only).
// -----------------------------------------------------------------------------
    // Map Labels Filter
    const textFilter = document.getElementById('textFilter');
    const LABEL_LAYER_GROUPS = Object.freeze({
      water: ['waterway_label', 'water_name', 'marine_label', 'ocean', 'sea', 'lake', 'river', 'canal', 'stream'],
      cities: ['place_', 'city', 'town', 'village', 'hamlet', 'suburb', 'neighbourhood', 'country_label', 'state_label', 'province'],
      streets: ['roadname', 'road_label', 'street', 'highway', 'motorway', 'path_label'],
      transit: ['transportation_name', 'transit', 'station', 'rail', 'airport', 'aerodrome', 'ferry'],
      poi: ['poi', 'housenumber', 'building_label', 'amenity', 'shop', 'tourism'],
      natural: ['natural', 'mountain', 'peak', 'volcano', 'glacier', 'forest_label', 'park_label']
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
      if (mode === 'transit_only') return role === 'transit';
      if (mode === 'poi_only') return role === 'poi';
      if (mode === 'natural_only') return role === 'natural';
      return false;
    }

    function applyTextFilters(targetMap = map, mode = state.textFilter) {
      const style = targetMap.getStyle();
      if (!style || !style.layers) return;

      style.layers.forEach(layer => {
        if (layer.type === 'symbol') {
          const liveTextField = targetMap.getLayoutProperty(layer.id, 'text-field');
          if (liveTextField == null && layer.layout?.['text-field'] == null) return;
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


// -----------------------------------------------------------------------------
// LAYER ROLE MAPPING & TERRAIN
// Map Carto layer IDs to roles (water, forest, land, etc.).
// Configure terrain source/layer and hillshade styling.
// Update terrain colorization overlay when terrain is enabled.
// -----------------------------------------------------------------------------
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

    function shadeHex(hex, amount) {
      const channel = index => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(index, index + 2), 16) + amount)));
      return `rgb(${channel(1)}, ${channel(3)}, ${channel(5)})`;
    }

    function configureTerrain(targetMap, terrainState = state) {
      if (!targetMap.getSource(TERRAIN_SOURCE_ID)) {
        targetMap.addSource(TERRAIN_SOURCE_ID, {
          type: 'raster-dem',
          tiles: [TERRAIN_TILES_URL],
          tileSize: 256,
          encoding: 'terrarium',
          maxzoom: 15
        });
      }
      if (!targetMap.getLayer(TERRAIN_LAYER_ID)) {
        const firstLabel = targetMap.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
        targetMap.addLayer({
          id: TERRAIN_LAYER_ID,
          type: 'hillshade',
          source: TERRAIN_SOURCE_ID,
          paint: {
            'hillshade-exaggeration': 0,
            'hillshade-highlight-color': shadeHex(terrainState.mountainColor, 80),
            'hillshade-shadow-color': shadeHex(terrainState.mountainColor, -80),
            'hillshade-accent-color': terrainState.mountainColor
          }
        }, firstLabel);
      }
      targetMap.setPaintProperty(TERRAIN_LAYER_ID, 'hillshade-highlight-color', shadeHex(terrainState.mountainColor, 80));
      targetMap.setPaintProperty(TERRAIN_LAYER_ID, 'hillshade-shadow-color', shadeHex(terrainState.mountainColor, -80));
      targetMap.setPaintProperty(TERRAIN_LAYER_ID, 'hillshade-accent-color', terrainState.mountainColor);
      targetMap.setPaintProperty(TERRAIN_LAYER_ID, 'hillshade-exaggeration', terrainState.terrainEnabled ? terrainState.terrainExaggeration / 180 : 0);
    }

    async function updateTerrainColorization(targetMap = map, terrainState = state) {
      if (!terrainState.terrainEnabled) {
        if (targetMap.getLayer(TERRAIN_COLOR_LAYER_ID)) targetMap.setPaintProperty(TERRAIN_COLOR_LAYER_ID, 'raster-opacity', 0);
        return;
      }
      const grid = await getElevationGrid(targetMap.getBounds(), 81, Math.min(13, Math.max(10, Math.floor(targetMap.getZoom()))));
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = grid.size;
      const context = canvas.getContext('2d');
      const image = context.createImageData(grid.size, grid.size);
      const minimum = Math.min(...grid.heights);
      const maximum = Math.max(...grid.heights);
      grid.heights.forEach((height, index) => {
        const ratio = (height - minimum) / Math.max(1, maximum - minimum);
        const color = shadeHex(terrainState.mountainColor, -100 + ratio * 190).match(/\d+/g).map(Number);
        image.data[index * 4] = color[0]; image.data[index * 4 + 1] = color[1]; image.data[index * 4 + 2] = color[2]; image.data[index * 4 + 3] = 185;
      });
      context.putImageData(image, 0, 0);
      const bounds = targetMap.getBounds();
      const coordinates = [[bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()], [bounds.getWest(), bounds.getSouth()]];
      if (targetMap.getLayer(TERRAIN_COLOR_LAYER_ID)) targetMap.removeLayer(TERRAIN_COLOR_LAYER_ID);
      if (targetMap.getSource(TERRAIN_COLOR_SOURCE_ID)) targetMap.removeSource(TERRAIN_COLOR_SOURCE_ID);
      targetMap.addSource(TERRAIN_COLOR_SOURCE_ID, { type: 'canvas', canvas, coordinates, animate: false });
      targetMap.addLayer({ id: TERRAIN_COLOR_LAYER_ID, type: 'raster', source: TERRAIN_COLOR_SOURCE_ID, paint: { 'raster-opacity': 0.72 } }, TERRAIN_LAYER_ID);
      applyLayerOrder(targetMap, terrainState.layerOrder);
    }


// -----------------------------------------------------------------------------
// LAYER ORDERING
// Human-readable labels and controls to reorder layer roles.
// Moves matching MapLibre layers in the render stack.
// -----------------------------------------------------------------------------
    const LAYER_ORDER_LABELS = Object.freeze({ land: 'Land', terrain: 'Terrain', water: 'Water', forest: 'Nature', landCover: 'Urban', road: 'Roads', boundary: 'Borders', building: 'Buildings' });
    function applyLayerOrder(targetMap = map, order = state.layerOrder) {
      const layers = targetMap.getStyle()?.layers || [];
      const beforeId = layers.find(layer => layer.type === 'symbol')?.id;
      order.forEach(role => {
        const matchingIds = role === 'terrain'
          ? [TERRAIN_COLOR_LAYER_ID, TERRAIN_LAYER_ID]
          : layers.filter(layer => getLayerRole(layer) === role).map(layer => layer.id);
        matchingIds.forEach(id => {
          if (targetMap.getLayer(id)) targetMap.moveLayer(id, beforeId);
        });
      });
    }

    function renderLayerOrderControls() {
      const list = $('layerOrderList');
      list.replaceChildren();
      state.layerOrder.forEach((role, index) => {
        const item = document.createElement('div');
        item.className = 'layer-order-item';
        const label = document.createElement('span');
        label.textContent = LAYER_ORDER_LABELS[role];
        const up = document.createElement('button');
        up.type = 'button'; up.textContent = 'Up'; up.title = `Move ${label.textContent} earlier`; up.disabled = index === 0;
        const down = document.createElement('button');
        down.type = 'button'; down.textContent = 'Down'; down.title = `Move ${label.textContent} later`; down.disabled = index === state.layerOrder.length - 1;
        up.addEventListener('click', () => moveLayerOrder(index, -1));
        down.addEventListener('click', () => moveLayerOrder(index, 1));
        item.append(label, up, down);
        list.appendChild(item);
      });
    }

    function moveLayerOrder(index, direction) {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= state.layerOrder.length) return;
      [state.layerOrder[index], state.layerOrder[nextIndex]] = [state.layerOrder[nextIndex], state.layerOrder[index]];
      applyLayerOrder();
      renderLayerOrderControls();
    }


// -----------------------------------------------------------------------------
// SCALE BAR & NORTH ARROW
// Compute real-world scale (meters) for current center/zoom.
// Render scale overlay and north arrow based on state and bearing.
// -----------------------------------------------------------------------------
    function getScaleInfo(targetMap = map) {
      const metersPerPixel = (40075016.686 * Math.cos(targetMap.getCenter().lat * Math.PI / 180)) / (512 * 2 ** targetMap.getZoom());
      const targetMeters = metersPerPixel * targetMap.getContainer().clientWidth * 0.2;
      const exponent = 10 ** Math.floor(Math.log10(targetMeters));
      const base = [1, 2, 5, 10].find(value => value * exponent >= targetMeters) || 10;
      const meters = base * exponent;
      return { meters, pixels: meters / metersPerPixel, label: meters >= 1000 ? `${meters / 1000} km` : `${Math.round(meters)} m` };
    }

    function renderMapAnnotations() {
      if (!mapReady) return;
      const scale = $('mapScaleOverlay');
      const north = $('northOverlay');
      scale.style.display = state.scaleEnabled ? 'block' : 'none';
      north.style.display = state.northEnabled ? 'block' : 'none';
      if (state.scaleEnabled) {
        const info = getScaleInfo();
        scale.style.width = `${info.pixels}px`;
        scale.firstElementChild.textContent = info.label;
      }
      if (state.northEnabled) north.style.transform = `rotate(${-map.getBearing()}deg)`;
    }

    function warnAboutUnsupportedLayers(targetMap) {
      const unsupported = targetMap.getStyle().layers
        .filter(layer => ['background', 'fill', 'line'].includes(layer.type) && !getLayerRole(layer))
        .map(layer => layer.id);
      if (unsupported.length) console.warn('Unsupported CARTO layers were left unchanged:', unsupported);
    }


// -----------------------------------------------------------------------------
// COLOR & LAYER CONTROLLERS
// setupLayerControls: bind color/opacity/toggle inputs to MapLibre paint properties.
// Handles main vs accent colors for forest/landCover.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// COLOR PRESETS
// Populate preset dropdown from MapArtGenPresetCatalog.
// applyColorPreset: write preset values to controls and update map layers.
// Step/randomize buttons for quick design changes.
// -----------------------------------------------------------------------------
    // Predefined color set definitions
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

      triggerAllLayerUpdates();
      syncStateFromControls();
      applyTextFilters(map, state.textFilter);
    }

    colorPresetSelect.addEventListener('change', (e) => {
      applyColorPreset(e.target.value);
    });

    function stepPreset(offset) {
      const count = colorPresetSelect.options.length;
      const current = Math.max(0, colorPresetSelect.selectedIndex);
      colorPresetSelect.selectedIndex = (current + offset + count) % count;
      applyColorPreset(colorPresetSelect.value);
    }
    $('previousPresetBtn').addEventListener('click', () => stepPreset(-1));
    $('nextPresetBtn').addEventListener('click', () => stepPreset(1));

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

    



// -----------------------------------------------------------------------------
// BUILDING LAYER CONTROLS
// Handle building fill color, opacity, visibility, and outline options.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// MAP LOAD INITIALIZATION
// When map is ready:
// - Configure terrain and colorization
// - Set up layer controls for water/forest/land/landCover/road/boundary
// - Initialize building controls and apply default preset
// - Apply layer order and render controls
// -----------------------------------------------------------------------------
    map.on('load', () => {
      mapReady = true;
      configureTerrain(map);
      updateTerrainColorization(map).catch(error => console.warn('Elevation colors could not be loaded:', error));
      configureBuildingZoom(map);
      enhancePreviewDetail(map);
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
      applyTextFilters(map, readControl('textFilter'));
      updateLabelStyle();
      warnAboutUnsupportedLayers(map);
      applyLayerOrder();
      renderLayerOrderControls();
    });

    ['terrainToggle', 'mountainColor', 'terrainExaggeration'].forEach(id => $(id).addEventListener('input', () => {
      syncStateFromControls();
      $('terrainExaggerationVal').textContent = state.terrainExaggeration;
      configureTerrain(map);
      updateTerrainColorization().catch(error => console.warn('Elevation colors could not be updated:', error));
    }));
    ['scaleToggle', 'northToggle'].forEach(id => $(id).addEventListener('change', () => {
      syncStateFromControls();
      renderMapAnnotations();
    }));


// -----------------------------------------------------------------------------
// SEARCH & REVERSE GEOCODING (NOMINATIM)
// Search input with debounced requests to Nominatim.
// Reverse geocode on map move to update city/country labels.
// Keyboard navigation in search results.
// -----------------------------------------------------------------------------
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
      saveLastLocation();
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
        saveLastLocation();
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


// -----------------------------------------------------------------------------
// LABEL OVERLAY & FONT STYLING
// Controls for label position/style, font, and separate colors
// for city name, coordinates, and country.
// -----------------------------------------------------------------------------
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


// -----------------------------------------------------------------------------
// BORDER & ASPECT RATIO
// Toggle border, choose color/width, and adjust inner/outer radii.
// Format select changes aspect ratio and resizes map.
// -----------------------------------------------------------------------------
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
    $('exportDpi').addEventListener('change', updateOutputDimensions);
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


// -----------------------------------------------------------------------------
// HIGH-RES EXPORT ENGINE
// - Optional Web Worker for PDF generation
// - Helper to download blobs (images, SVG, PDF, STL, 3MF)
// - Elevation grid fetch from Terrarium tiles
// - Terrain mesh generation with buildings/roads/water
// - STL and colored 3MF export
// - Canvas/SVG/PDF/image export with labels and annotations
// -----------------------------------------------------------------------------
    // High-Res Export Engine & Download Handlers
    const exportBtn = document.getElementById('exportBtn');
    let exportWorker = null;
    try {
      exportWorker = new Worker('js/export-worker.js');
    } catch (error) {
      console.warn('Export worker unavailable; PDF export will use the main thread.', error);
    }
    let exportWorkerRequest = 0;
    const exportWorkerPending = new Map();
    if (exportWorker) {
      exportWorker.onmessage = event => {
        const pending = exportWorkerPending.get(event.data.id);
        if (!pending) return;
        exportWorkerPending.delete(event.data.id);
        if (event.data.error) pending.reject(new Error(event.data.error));
        else pending.resolve(event.data);
      };
    }

    function processExportInWorker(action, payload) {
      if (!exportWorker) return Promise.reject(new Error('Export worker is unavailable.'));
      const id = ++exportWorkerRequest;
      return new Promise((resolve, reject) => {
        exportWorkerPending.set(id, { resolve, reject });
        exportWorker.postMessage({ id, action, ...payload });
      });
    }
    function downloadBlob(blob, filename) {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }

    function lngLatToTile(lng, lat, zoom) {
      const latitude = Math.max(-85.05112878, Math.min(85.05112878, lat));
      const scale = 2 ** zoom;
      return {
        x: ((lng + 180) / 360) * scale,
        y: (1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * scale
      };
    }

    async function getElevationGrid(bounds, size = 65, zoom = 12) {
      const tileCache = new Map();
      async function loadTile(tileX, tileY) {
        const scale = 2 ** zoom;
        const wrappedX = ((tileX % scale) + scale) % scale;
        const key = `${wrappedX}/${tileY}`;
        if (!tileCache.has(key)) tileCache.set(key, (async () => {
          const response = await fetch(TERRAIN_TILES_URL.replace('{z}', zoom).replace('{x}', wrappedX).replace('{y}', tileY));
          if (!response.ok) throw new Error('Elevation data is unavailable for this location.');
          const bitmap = await createImageBitmap(await response.blob());
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 256;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(bitmap, 0, 0);
          bitmap.close();
          return context.getImageData(0, 0, 256, 256).data;
        })());
        return tileCache.get(key);
      }
      const heights = await Promise.all(Array.from({ length: size * size }, async (_, index) => {
        const row = Math.floor(index / size);
        const column = index % size;
        const lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * (column / (size - 1));
        const lat = bounds.getNorth() + (bounds.getSouth() - bounds.getNorth()) * (row / (size - 1));
        const position = lngLatToTile(lng, lat, zoom);
        const tileX = Math.floor(position.x);
        const tileY = Math.floor(position.y);
        const pixels = await loadTile(tileX, tileY);
        const pixelX = Math.max(0, Math.min(255, Math.floor((position.x - tileX) * 256)));
        const pixelY = Math.max(0, Math.min(255, Math.floor((position.y - tileY) * 256)));
        const offset = (pixelY * 256 + pixelX) * 4;
        return pixels[offset] * 256 + pixels[offset + 1] + pixels[offset + 2] / 256 - 32768;
      }));
      return { heights, size };
    }

    function createTerrainMesh(heights, size, bounds, exaggeration, cityFeatures = {}) {
      const latitude = (bounds.getNorth() + bounds.getSouth()) / 2;
      const widthMeters = (bounds.getEast() - bounds.getWest()) * 111320 * Math.cos(latitude * Math.PI / 180);
      const depthMeters = (bounds.getNorth() - bounds.getSouth()) * 110540;
      const widthMm = 160;
      const depthMm = Math.max(20, widthMm * depthMeters / Math.max(widthMeters, 1));
      const minimum = Math.min(...heights);
      const maximum = Math.max(...heights);
      const reliefMm = Math.min(50, 16 * exaggeration / 100);
      const heightAt = index => 2 + ((heights[index] - minimum) / Math.max(maximum - minimum, 1)) * reliefMm;
      const vertexAt = (row, column, base = false) => [column * widthMm / (size - 1), row * depthMm / (size - 1), base ? 0 : heightAt(row * size + column)];
      const triangles = [];
      const triangleMaterials = [];
      const add = (a, b, c, material = 'terrain') => { triangles.push(a, b, c); triangleMaterials.push(material); };
      const terrainHeightAt = (x, y) => {
        const column = Math.max(0, Math.min(size - 1, Math.round(x / widthMm * (size - 1))));
        const row = Math.max(0, Math.min(size - 1, Math.round(y / depthMm * (size - 1))));
        return heightAt(row * size + column);
      };
      const pointFromCoordinate = coordinate => {
        const [lng, lat] = coordinate;
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < bounds.getWest() || lng > bounds.getEast() || lat < bounds.getSouth() || lat > bounds.getNorth()) return null;
        return [
          (lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest()) * widthMm,
          (bounds.getNorth() - lat) / (bounds.getNorth() - bounds.getSouth()) * depthMm
        ];
      };
      const addBuilding = ring => {
        const points = ring.map(pointFromCoordinate);
        if (points.some(point => !point)) return;
        if (points.length < 4) return;
        const top = points.slice(0, -1).map(([x, y]) => [x, y, terrainHeightAt(x, y) + 4]);
        if (top.length < 3) return;
        for (let index = 1; index < top.length - 1; index += 1) add(top[0], top[index], top[index + 1], 'building');
        top.forEach((point, index) => {
          const next = top[(index + 1) % top.length];
          const base = [point[0], point[1], terrainHeightAt(point[0], point[1])];
          const nextBase = [next[0], next[1], terrainHeightAt(next[0], next[1])];
          add(point, next, base, 'building'); add(next, nextBase, base, 'building');
        });
      };
      const addSurface = (ring, material, height) => {
        const points = ring.map(pointFromCoordinate);
        if (points.some(point => !point) || points.length < 4) return;
        const top = points.slice(0, -1).map(([x, y]) => [x, y, terrainHeightAt(x, y) + height]);
        if (top.length < 3) return;
        for (let index = 1; index < top.length - 1; index += 1) add(top[0], top[index], top[index + 1], material);
        top.forEach((point, index) => {
          const next = top[(index + 1) % top.length];
          const base = [point[0], point[1], terrainHeightAt(point[0], point[1])];
          const nextBase = [next[0], next[1], terrainHeightAt(next[0], next[1])];
          add(point, next, base, material); add(next, nextBase, base, material);
        });
      };
      const addPathSegment = (start, end, material, height, halfWidth) => {
        const a = pointFromCoordinate(start), b = pointFromCoordinate(end);
        if (!a || !b) return;
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (length < 0.1) return;
        const offsetX = -(b[1] - a[1]) / length * halfWidth, offsetY = (b[0] - a[0]) / length * halfWidth;
        const lower = [[a[0] + offsetX, a[1] + offsetY], [a[0] - offsetX, a[1] - offsetY], [b[0] - offsetX, b[1] - offsetY], [b[0] + offsetX, b[1] + offsetY]];
        const bottom = lower.map(([x, y]) => [x, y, terrainHeightAt(x, y)]);
        const top = lower.map(([x, y]) => [x, y, terrainHeightAt(x, y) + height]);
        add(top[0], top[1], top[2], material); add(top[0], top[2], top[3], material);
        for (let index = 0; index < 4; index += 1) { const next = (index + 1) % 4; add(top[index], top[next], bottom[index], material); add(top[next], bottom[next], bottom[index], material); }
      };
      for (let row = 0; row < size - 1; row += 1) for (let column = 0; column < size - 1; column += 1) {
        const topLeft = vertexAt(row, column), topRight = vertexAt(row, column + 1), bottomLeft = vertexAt(row + 1, column), bottomRight = vertexAt(row + 1, column + 1);
        add(topLeft, bottomLeft, topRight); add(topRight, bottomLeft, bottomRight);
        const baseTopLeft = vertexAt(row, column, true), baseTopRight = vertexAt(row, column + 1, true), baseBottomLeft = vertexAt(row + 1, column, true), baseBottomRight = vertexAt(row + 1, column + 1, true);
        add(baseTopRight, baseBottomLeft, baseTopLeft); add(baseBottomRight, baseBottomLeft, baseTopRight);
      }
      for (let index = 0; index < size - 1; index += 1) {
        [[vertexAt(0, index), vertexAt(0, index + 1), vertexAt(0, index + 1, true), vertexAt(0, index, true)], [vertexAt(size - 1, index + 1), vertexAt(size - 1, index), vertexAt(size - 1, index, true), vertexAt(size - 1, index + 1, true)], [vertexAt(index + 1, 0), vertexAt(index, 0), vertexAt(index, 0, true), vertexAt(index + 1, 0, true)], [vertexAt(index, size - 1), vertexAt(index + 1, size - 1), vertexAt(index + 1, size - 1, true), vertexAt(index, size - 1, true)]].forEach(([a, b, c, d]) => { add(a, b, c); add(a, c, d); });
      }
      cityFeatures.buildings?.forEach(feature => {
        const coordinates = feature.geometry?.coordinates;
        if (feature.geometry?.type === 'Polygon') addBuilding(coordinates[0]);
        if (feature.geometry?.type === 'MultiPolygon') coordinates.forEach(polygon => addBuilding(polygon[0]));
      });
      cityFeatures.roads?.forEach(feature => {
        const lines = feature.geometry?.type === 'LineString' ? [feature.geometry.coordinates] : feature.geometry?.type === 'MultiLineString' ? feature.geometry.coordinates : [];
        lines.forEach(line => line.slice(1).forEach((point, index) => addPathSegment(line[index], point, 'road', 0.9, 0.3)));
        if (feature.geometry?.type === 'Polygon') addSurface(feature.geometry.coordinates[0], 'road', 0.9);
        if (feature.geometry?.type === 'MultiPolygon') feature.geometry.coordinates.forEach(polygon => addSurface(polygon[0], 'road', 0.9));
      });
      cityFeatures.water?.forEach(feature => {
        const coordinates = feature.geometry?.coordinates;
        if (feature.geometry?.type === 'Polygon') addSurface(coordinates[0], 'water', 0.35);
        if (feature.geometry?.type === 'MultiPolygon') coordinates.forEach(polygon => addSurface(polygon[0], 'water', 0.35));
        const lines = feature.geometry?.type === 'LineString' ? [coordinates] : feature.geometry?.type === 'MultiLineString' ? coordinates : [];
        lines.forEach(line => line.slice(1).forEach((point, index) => addPathSegment(line[index], point, 'water', 0.45, 0.45)));
      });
      return { triangles, triangleMaterials };
    }

    function createTerrainStl(mesh) {
      const triangleCount = mesh.triangles.length / 3;
      const buffer = new ArrayBuffer(84 + triangleCount * 50);
      const view = new DataView(buffer);
      view.setUint32(80, triangleCount, true);
      let offset = 84;
      for (let index = 0; index < mesh.triangles.length; index += 3) {
        offset += 12;
        mesh.triangles.slice(index, index + 3).forEach(vertex => {
          view.setFloat32(offset, vertex[0], true); view.setFloat32(offset + 4, vertex[1], true); view.setFloat32(offset + 8, vertex[2], true); offset += 12;
        });
        view.setUint16(offset, 0, true); offset += 2;
      }
      return new Blob([buffer], { type: 'model/stl' });
    }

    function rotateMeshToMapBearing(mesh, bearing) {
      if (!bearing) return mesh;
      const bounds = mesh.triangles.reduce((result, vertex) => ({
        minX: Math.min(result.minX, vertex[0]), maxX: Math.max(result.maxX, vertex[0]),
        minY: Math.min(result.minY, vertex[1]), maxY: Math.max(result.maxY, vertex[1])
      }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      const angle = bearing * Math.PI / 180;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      return {
        ...mesh,
        triangles: mesh.triangles.map(([x, y, z]) => [
          centerX + (x - centerX) * cosine - (y - centerY) * sine,
          centerY + (x - centerX) * sine + (y - centerY) * cosine,
          z
        ])
      };
    }

    function crc32(bytes) {
      let value = 0xffffffff;
      for (const byte of bytes) {
        value ^= byte;
        for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
      }
      return (value ^ 0xffffffff) >>> 0;
    }

    function createStoredZip(files) {
      const encoder = new TextEncoder();
      const entries = files.map(({ name, content }) => ({ name: encoder.encode(name), content: typeof content === 'string' ? encoder.encode(content) : content }));
      let offset = 0;
      const parts = [];
      const directory = [];
      const pushUint16 = (view, offsetValue, value) => view.setUint16(offsetValue, value, true);
      const pushUint32 = (view, offsetValue, value) => view.setUint32(offsetValue, value, true);
      entries.forEach(entry => {
        const crc = crc32(entry.content), header = new Uint8Array(30 + entry.name.length), view = new DataView(header.buffer);
        pushUint32(view, 0, 0x04034b50); pushUint16(view, 4, 20); pushUint16(view, 6, 0x0800); pushUint16(view, 8, 0); pushUint32(view, 14, crc); pushUint32(view, 18, entry.content.length); pushUint32(view, 22, entry.content.length); pushUint16(view, 26, entry.name.length); entry.setName = offset;
        header.set(entry.name, 30); parts.push(header, entry.content); offset += header.length + entry.content.length;
        directory.push({ ...entry, crc, offset: entry.setName });
      });
      const directoryOffset = offset;
      directory.forEach(entry => {
        const header = new Uint8Array(46 + entry.name.length), view = new DataView(header.buffer);
        pushUint32(view, 0, 0x02014b50); pushUint16(view, 4, 20); pushUint16(view, 6, 20); pushUint16(view, 8, 0x0800); pushUint16(view, 10, 0); pushUint32(view, 16, entry.crc); pushUint32(view, 20, entry.content.length); pushUint32(view, 24, entry.content.length); pushUint16(view, 28, entry.name.length); pushUint32(view, 42, entry.offset); header.set(entry.name, 46); parts.push(header); offset += header.length;
      });
      const footer = new Uint8Array(22), footerView = new DataView(footer.buffer);
      pushUint32(footerView, 0, 0x06054b50); pushUint16(footerView, 8, entries.length); pushUint16(footerView, 10, entries.length); pushUint32(footerView, 12, offset - directoryOffset); pushUint32(footerView, 16, directoryOffset); parts.push(footer);
      return new Blob(parts, { type: 'model/3mf' });
    }

    function createColoredThreeMf(mesh, colors) {
      const materialIndex = { terrain: 0, building: 1, road: 2, water: 3 };
      const color = hex => `${hex.toUpperCase()}FF`;
      const vertices = mesh.triangles.map(vertex => `<vertex x="${vertex[0]}" y="${vertex[1]}" z="${vertex[2]}"/>`).join('');
      const triangles = mesh.triangleMaterials.map((material, index) => `<triangle v1="${index * 3}" v2="${index * 3 + 1}" v3="${index * 3 + 2}" pid="1" p1="${materialIndex[material]}"/>`).join('');
      const model = `<?xml version="1.0" encoding="UTF-8"?><model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" unit="millimeter" xml:lang="en-US"><resources><basematerials id="1"><base name="Terrain" displaycolor="${color(colors.terrain)}"/><base name="Buildings" displaycolor="${color(colors.building)}"/><base name="Streets" displaycolor="${color(colors.road)}"/><base name="Water" displaycolor="${color(colors.water)}"/></basematerials><object id="2" type="model" pid="1" pindex="0"><mesh><vertices>${vertices}</vertices><triangles>${triangles}</triangles></mesh></object></resources><build><item objectid="2"/></build></model>`;
      return createStoredZip([
        { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' },
        { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
        { name: '3D/3dmodel.model', content: model }
      ]);
    }

    function drawExportAnnotations(context, exportState, width, height, mapWidth, borderWidth) {
      context.save();
      context.fillStyle = '#111827';
      context.strokeStyle = '#111827';
      context.lineWidth = Math.max(2, width / 900);
      context.font = `800 ${Math.max(14, width / 115)}px sans-serif`;
      if (exportState.scaleEnabled) {
        const previewInfo = getScaleInfo(map);
        const scaleWidth = previewInfo.pixels * (mapWidth / map.getContainer().clientWidth);
        const x = borderWidth + width * 0.025, y = height - borderWidth - width * 0.035;
        context.textAlign = 'center'; context.fillText(previewInfo.label, x + scaleWidth / 2, y - 8);
        context.beginPath(); context.moveTo(x, y); context.lineTo(x + scaleWidth, y); context.moveTo(x, y - 6); context.lineTo(x, y + 6); context.moveTo(x + scaleWidth, y - 6); context.lineTo(x + scaleWidth, y + 6); context.stroke();
      }
      if (exportState.northEnabled) {
        const x = borderWidth + width * 0.045, y = borderWidth + width * 0.055;
        context.translate(x, y); context.rotate(-exportState.bearing * Math.PI / 180); context.textAlign = 'center'; context.fillText('N', 0, -12); context.beginPath(); context.moveTo(0, -8); context.lineTo(-7, 13); context.lineTo(0, 8); context.lineTo(7, 13); context.closePath(); context.fill();
      }
      context.restore();
    }

    function canvasToSvg(canvas, exportState) {
      const dataUrl = canvas.toDataURL('image/png');
      const escape = value => String(value).replace(/[&<>"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
      })[character]);
      const textX = canvas.width / 2;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <title>${exportState.city} map poster</title>
  <image width="100%" height="100%" href="${dataUrl}"/>
  <g text-anchor="middle" font-family="sans-serif">
    <text x="${textX}" y="${canvas.height - 105}" font-size="34" font-weight="800" fill="${exportState.labelTextColor}">${escape(exportState.city)}</text>
    <text x="${textX}" y="${canvas.height - 65}" font-size="16" font-weight="600" fill="${exportState.labelCoordColor}">${escape(exportState.coordinates)}</text>
    <text x="${textX}" y="${canvas.height - 30}" font-size="18" font-weight="700" fill="${exportState.labelCountryColor}">${escape(exportState.country)}</text>
  </g>
</svg>`;
    }

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
          targetMap.setLayoutProperty(layer.id, 'visibility', state.layers.buildingToggle === false ? 'none' : 'visible');
          if (layer.type === 'fill') {
            targetMap.setPaintProperty(layer.id, 'fill-opacity', 1);
          }
        }
      });
    }

    function enhancePreviewDetail(targetMap) {
      configureBuildingZoom(targetMap);
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
        style: MAP_STYLE_URL,
        bearing: exportState.bearing,
        pitch: exportState.pitch
      });
      await new Promise((resolve, reject) => {
        exportMap.once('load', resolve);
        exportMap.once('error', event => reject(event.error || new Error('Export map failed to load.')));
      });
      configureTerrain(exportMap, exportState);
      configureBuildingZoom(exportMap);
      applyStateToMap(exportMap, exportState);
      applyLayerOrder(exportMap, exportState.layerOrder);
      exportMap.resize();
      const bounds = new maplibregl.LngLatBounds(exportState.bounds[0], exportState.bounds[1]);
      exportMap.fitBounds(bounds, {
        padding: 0,
        bearing: exportState.bearing,
        pitch: exportState.pitch,
        duration: 0
      });
      await updateTerrainColorization(exportMap, exportState);
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
      setStatus('1/5 Preparing export...');

      try {
        if (document.fonts) {
          await document.fonts.ready;
        }

        const exportState = getExportState();
        const targetDims = getTargetDimensions(exportState.format, exportState.exportDpi);
        setStatus('2/5 Loading detailed map tiles...');

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
        const mapWidth = Math.max(1, Math.round(targetDims.width - (bWidth * 2)));
        const mapHeight = Math.max(1, Math.round(targetDims.height - (bWidth * 2)));

        ctx.fillStyle = exportState.borderColor;
        ctx.fillRect(0, 0, targetDims.width, targetDims.height);
        if (exportState.shape !== 'none') {
          ctx.fillStyle = exportState.shapeColor;
          ctx.fillRect(bWidth, bWidth, mapWidth, mapHeight);
        }

        const presetKey = exportState.filterPreset;
        const baseFilter = filterPresets[presetKey] || '';
        const contrastSetting = exportState.contrast;
        ctx.filter = `${baseFilter} contrast(${contrastSetting}%) brightness(${exportState.brightness}%) saturate(${exportState.saturation}%)`.trim();

      const { exportMap, container } = await createExportMap(mapWidth, mapHeight, exportState);
      setStatus('3/5 Rendering map and layout...');
      const mapCanvas = exportMap.getCanvas();
      if (exportState.innerBorderRadius > 0 || exportState.shape !== 'none') {
        const innerRadius = exportState.innerBorderRadius * scaleFactor;
        ctx.save();
        ctx.beginPath();
        if (exportState.shape === 'none') {
          ctx.roundRect(bWidth, bWidth, mapWidth, mapHeight, innerRadius);
          ctx.clip();
        } else {
          const shapePath = getShapePath(exportState.shape, mapWidth, mapHeight);
          ctx.translate(bWidth, bWidth);
          ctx.clip(shapePath);
          ctx.translate(-bWidth, -bWidth);
        }
      }
      ctx.drawImage(
        mapCanvas, 
        bWidth, 
        bWidth, 
        targetDims.width - (bWidth * 2), 
        targetDims.height - (bWidth * 2)
      );
      if (exportState.innerBorderRadius > 0 || exportState.shape !== 'none') ctx.restore();
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

        const isBanner = style.startsWith('banner-');
        if (![isBanner, style === 'special-deck', style === 'special-minimal'].some(Boolean)) {
          const boxWidth = measuredOverlay.width * proportionalScale;
          const boxHeight = measuredOverlay.height * proportionalScale;
          const isBottomCorner = style.startsWith('corner-bottom-');
          const isCorner = style.startsWith('corner-');
          const isRightCorner = isCorner && style.endsWith('-right');
          const isLeftCorner = isCorner && style.endsWith('-left');
          const boxX = isLeftCorner
            ? bWidth
            : isRightCorner
              ? targetDims.width - bWidth - boxWidth
              : bWidth + measuredOverlay.x * proportionalScale;
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
        } else if (isBanner) {
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

        } else if (style === 'special-deck') {
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

        } else if (style === 'special-minimal') {
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

      drawExportAnnotations(ctx, exportState, targetDims.width, targetDims.height, mapWidth, bWidth);

        const mimeType = exportState.exportType;
        const baseFilename = `cartiva_${exportState.city.trim().replace(/\s+/g, '_')}_${exportState.exportDpi}dpi_${getFileTimestamp()}`;
        setStatus('4/5 Encoding output...');
        if (mimeType === 'image/svg+xml') {
          downloadBlob(new Blob([canvasToSvg(exportCanvas, exportState)], { type: mimeType }), `${baseFilename}.svg`);
          setStatus('5/5 Poster exported.');
          return;
        }
        if (mimeType === 'application/pdf') {
          const jpegBlob = await new Promise((resolve, reject) => {
            exportCanvas.toBlob(result => result ? resolve(result) : reject(new Error('JPEG encoding failed.')), 'image/jpeg', 0.92);
          });
          const result = await processExportInWorker('pdf', {
            blob: jpegBlob,
            filename: `${baseFilename}.pdf`,
            width: exportCanvas.width,
            height: exportCanvas.height
          });
          downloadBlob(result.blob, result.filename);
          setStatus('5/5 Poster exported.');
          return;
        }
        const extension = mimeType.split('/')[1].replace('jpeg', 'jpg');
        const blob = await new Promise((resolve, reject) => {
          exportCanvas.toBlob(result => {
            if (result) resolve(result);
            else reject(new Error(`${extension.toUpperCase()} encoding failed.`));
          }, mimeType, 0.92);
        });
        downloadBlob(blob, `${baseFilename}.${extension}`);
        setStatus('5/5 Poster exported.');
      } catch (error) {
        console.error('Export failed', error);
        const location = error.stack?.match(/MapArtGen\.html:(\d+):(\d+)/)?.[0];
        setStatus(`Export failed${location ? ` at ${location}` : ''}: ${error.message}`, true);
      } finally {
        exportBtnLabel.textContent = 'Export';
        exportBtn.disabled = false;
      }
    });

    function getVisibleCityFeatures(includeBuildings, includeRoads) {
      const layers = map.getStyle().layers || [];
      const collect = role => {
        const layerIds = layers.filter(layer => getLayerRole(layer) === role && ['fill', 'line'].includes(layer.type)).map(layer => layer.id);
        if (!layerIds.length) return [];
        const seen = new Set();
        return map.queryRenderedFeatures({ layers: layerIds }).filter(feature => {
          const key = `${feature.source || ''}:${feature.sourceLayer || ''}:${feature.id ?? JSON.stringify(feature.geometry)}`;
          if (seen.has(key) || !feature.geometry?.coordinates) return false;
          seen.add(key);
          return true;
        });
      };
      return {
        buildings: includeBuildings ? collect('building').slice(0, 3000) : [],
        roads: includeRoads ? collect('road').slice(0, 8000) : [],
        water: collect('water').slice(0, 4000)
      };
    }

    $('stlExportBtn').addEventListener('click', async () => {
      const button = $('stlExportBtn');
      button.disabled = true;
      setStatus('Loading elevation data for 3D model...');
      try {
        syncStateFromControls();
        const bounds = map.getBounds();
        const cityFeatures = getVisibleCityFeatures(state.stlBuildingsEnabled, state.stlRoadsEnabled);
        const grid = await getElevationGrid(bounds);
        const mesh = rotateMeshToMapBearing(
          createTerrainMesh(grid.heights, grid.size, bounds, state.terrainExaggeration, cityFeatures),
          map.getBearing()
        );
        const model = createTerrainStl(mesh);
        const name = `cartiva_${state.city.trim().replace(/\s+/g, '_')}_${getFileTimestamp()}.stl`;
        downloadBlob(model, name);
        setStatus('3D model exported.');
      } catch (error) {
        console.error('STL export failed', error);
        setStatus(`3D model export failed: ${error.message}`, true);
      } finally {
        button.disabled = false;
      }
    });

    $('threeMfExportBtn').addEventListener('click', async () => {
      const button = $('threeMfExportBtn');
      button.disabled = true;
      setStatus('Loading elevation data for colored 3D model...');
      try {
        syncStateFromControls();
        const bounds = map.getBounds();
        const cityFeatures = getVisibleCityFeatures(state.stlBuildingsEnabled, state.stlRoadsEnabled);
        const grid = await getElevationGrid(bounds);
        const mesh = rotateMeshToMapBearing(
          createTerrainMesh(grid.heights, grid.size, bounds, state.terrainExaggeration, cityFeatures),
          map.getBearing()
        );
        const model = createColoredThreeMf(mesh, {
          terrain: state.mountainColor,
          building: state.layers.buildingColor,
          road: state.layers.roadColor,
          water: state.layers.waterColor
        });
        const name = `cartiva_${state.city.trim().replace(/\s+/g, '_')}_${getFileTimestamp()}.3mf`;
        downloadBlob(model, name);
        setStatus('Colored 3D model exported.');
      } catch (error) {
        console.error('3MF export failed', error);
        setStatus(`Colored 3D model export failed: ${error.message}`, true);
      } finally {
        button.disabled = false;
      }
    });


// -----------------------------------------------------------------------------
// KEYBOARD SHORTCUTS
// +/-: fine zoom
// Ctrl/Cmd+E: trigger export
// /: focus search
// 1–9: toggle accordion sections
// -----------------------------------------------------------------------------
    document.addEventListener('keydown', event => {
      if (event.target.matches('input, select, textarea')) return;
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        map.zoomTo(map.getZoom() + 0.25, { duration: 150 });
      } else if (event.key === '-') {
        event.preventDefault();
        map.zoomTo(map.getZoom() - 0.25, { duration: 150 });
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        exportBtn.click();
      } else if (event.key === '/') {
        event.preventDefault();
        searchInput.focus();
      } else if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const block = sectionBlocks[Number(event.key) - 1];
        block?.querySelector('.section-header').click();
      }
    });