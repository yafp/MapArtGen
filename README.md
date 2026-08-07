# MapArtGen

## About
MapArtGen is a free art generator using maps.

You simply select a location and configure a few parameter and can then generate & export a high-res graphic for prints.

Inspired by [Urbanmapdesign.com](https://www.urbanmapdesign.com).


## UI
![Preview](https://raw.githubusercontent.com/yafp/MapArtGen/refs/heads/main/.github/MapArtGen_Preview.png)


## Developers
### Structure

- `src/MapArtGen.html` contains the application markup.
- `src/MapArtGen.css` contains all presentation styles.
- `src/js/presets.js` contains the palette catalog and normalized preset data.
- `src/js/app.js` contains state, map, geocoding, preview, UI, and export behavior.
- `src/tests/` contains focused Playwright suites for layouts, formats, effects, and interactions.



### Browser tests

The Playwright suite covers every layout, aspect ratio, DPI, output type,
border state, and names filter.

```sh
npm install
npx playwright install chromium
npm test
```
