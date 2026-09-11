// External providers are configured in one place for easier replacement and testing.
(function attachServiceConfig(global) {
  global.CartivaServices = Object.freeze({
    geocoder: {
      searchEndpoint: 'https://nominatim.openstreetmap.org/search',
      reverseEndpoint: 'https://nominatim.openstreetmap.org/reverse'
    },
    mapStyleUrl: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    terrainTilesUrl: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
  });
})(window);
