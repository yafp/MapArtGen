// Network boundary for Nominatim. UI code should only deal with domain results.
(function attachGeocoder(global) {
  async function requestJson(url, signal) {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  function createGeocoder({ searchEndpoint, reverseEndpoint }) {
    const cache = global.CartivaCache?.create(80);
    return Object.freeze({
      search(query, signal) {
        const url = `${searchEndpoint}?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5`;
        const key = `search:${query.toLowerCase()}`;
        if (cache?.has(key)) return Promise.resolve(cache.get(key));
        return requestJson(url, signal).then(data => cache?.set(key, data) || data)
          .catch(error => { global.CartivaDiagnostics?.report('geocoder.search', error); throw error; });
      },
      reverse({ lat, lon }, signal) {
        const url = `${reverseEndpoint}?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const key = `reverse:${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
        if (cache?.has(key)) return Promise.resolve(cache.get(key));
        return requestJson(url, signal).then(data => cache?.set(key, data) || data)
          .catch(error => { global.CartivaDiagnostics?.report('geocoder.reverse', error); throw error; });
      }
    });
  }

  global.CartivaGeocoding = Object.freeze({
    create: createGeocoder,
    requestJson
  });
})(window);
