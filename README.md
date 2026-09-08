# cartiva

## About
cartiva is a small, self-contained creative cartography web-app.

- Select a location
- configure a few parameters
- generate and export a high-resolution graphics for printing

Inspired by [Urbanmapdesign.com](https://www.urbanmapdesign.com).

## Demo
You can find a live demo of the latest released version on [Github Pages](https://yafp.github.io/MapArtGen/index.html)

## Usage
- Download [latest release](https://github.com/yafp/cartiva/releases)
- Extract
- Double-click the .html file within the `src` folder

## Developers
### Structure

- `src/index.html` contains the application markup.
- `src/MapArtGen.css` contains all presentation styles.
- `src/js/presets.js` contains the palette catalog and normalized preset data.
- `src/js/app.js` contains state, map, geocoding, preview, UI, and export behavior.
- `src/js/export-worker.js` contains the exporting routines.






