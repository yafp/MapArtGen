# MapArtGen
## About
MapArtGen is a small, self-contained web application for turning map-data into stylized map art suitable for printing.

Select a location, configure a few parameters and generate or export a high-resolution graphic for printing.

Inspired by [Urbanmapdesign.com](https://www.urbanmapdesign.com).


## UI
![Preview](https://raw.githubusercontent.com/yafp/MapArtGen/refs/heads/main/.github/MapArtGen_Preview.png)
  
## Demo
You can find a live demo of the latest released version ![here](https://github.com/yafp/MapArtGen).

## Usage
- Download latest release from https://github.com/yafp?tab=packages&repo_name=MapArtGen
- Extract
- Double-click the .html file

## Developers
### Structure

- `MapArtGen.html` contains the application markup.
- `MapArtGen.css` contains all presentation styles.
- `js/presets.js` contains the palette catalog and normalized preset data.
- `js/app.js` contains state, map, geocoding, preview, UI, and export behavior.
- `js/export-worker.js` contains the exporting routines.






