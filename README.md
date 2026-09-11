# cartiva

## About
cartiva is a small, self-contained creative cartography web-app.

- Select a location
- configure a few parameters
- generate and export a high-resolution graphics for printing

Inspired by [Urbanmapdesign.com](https://www.urbanmapdesign.com).

## Demo
You can find a live demo of the latest released version on [Github Pages](https://yafp.github.io/cartiva/index.html)

## Usage
### Locally
- Download [latest release](https://github.com/yafp/cartiva/releases)
- Extract
- Double-click the .html file within the `src` folder

### As a service
Just use the demo linked above.

## Developers
### Structure

- `src/index.html` contains the application markup.
- `src/cartiva.css` contains all presentation styles.
- `src/js/preset-data.js` contains the palette catalog and normalized preset data.
- `src/data/preset-catalog.json` contains the editable preset display catalog; the JS data module remains as a direct-file-compatible runtime fallback for palette values.
- `src/js/app.js` is the small composition root loaded after the feature runtimes.
- `src/js/ui.js` owns state initialization, controls, preview rendering, labels, and layout controls.
- `src/js/map.js` owns MapLibre initialization, map layers, terrain, annotations, and map interactions.
- `src/js/location.js` owns search, reverse geocoding, and location persistence.
- `src/js/export.js` owns export state, raster/vector/3D output orchestration, and download actions.
- `src/js/pdf-exporter.js` owns the PDF worker adapter.
- `src/js/core/` contains state, project persistence, caching, diagnostics, and external service configuration.
- `src/js/map/layer-registry.js` owns MapLibre style-layer role detection.
- `src/js/map/style-adapter.js` normalizes provider layers into application roles.
- `src/js/services/geocoder.js` owns the Nominatim network boundary.
- `src/js/presets/preset-service.js` validates and exposes preset data.
- `src/js/export/export-contract.js` defines the serializable export request shape.
- `src/js/export-worker.js` contains the PDF encoding worker.

### Architecture boundaries

The application uses a serializable state object as its shared domain model. UI controls update that state, while MapLibre, geocoding, preset data, and export encoding are accessed through dedicated boundaries. The feature files remain classic scripts loaded in dependency order so the app stays dependency-free and can still be opened directly from the `src/index.html` file.

External provider URLs are centralized in `src/js/core/service-config.js`. This makes provider replacement, local testing, and future configuration injection possible without changing UI or rendering code.

### Maintenance features

- `src/js/core/project-service.js` owns versioned project JSON, local browser persistence, and user presets. Use **Save project**, **Download project**, **Load project**, **Save preset**, and **Load preset** in the sidebar.
- `src/js/core/resource-cache.js` provides bounded in-memory caching for geocoder and elevation requests. Repeated exports and location lookups avoid unnecessary network calls.
- `src/js/core/diagnostics.js` records service failures and preview/export bounds comparisons. Export logs a warning if its geographic bounds differ from the preview beyond the configured tolerance.
- `src/js/map/style-adapter.js` normalizes provider-specific MapLibre style layers into application roles. Provider layer naming changes should be handled there or in `layer-registry.js`.
- Poster and 3D exports produce a JSON metadata sidecar containing the camera, bounds, format, DPI, layer settings, effects, provider URLs, and application version.
- 3D polygon surfaces use ear-clipping triangulation for concave footprints, with clipped feature collection and bounded mesh sizes preserved by the existing export limits.

### Reliability and accessibility

The map reports non-fatal MapLibre errors through the status area and diagnostics channel. Geocoder and terrain failures are reported without preventing other features from working. Accordion headers expose keyboard focus, `Enter`/`Space` activation, and `aria-controls`; color inputs receive explicit accessible names.

### Local development

Opening the HTML file directly remains supported for the main application, but a local HTTP server is recommended for worker and browser security behavior:

```powershell
python -m http.server 8080 --directory src
```

Then open `http://localhost:8080`. No package installation or build step is required.






