(function () {
  'use strict';
  const types = {
    '公園步道': ['park', 'hiking_area'],
    '運動場所': ['gym', 'fitness_center', 'sports_complex'],
    '醫院診所': ['hospital', 'medical_clinic'],
    '藥局': ['pharmacy']
  };
  let ready;
  const config = window.GH_MAPS_CONFIG || {};
  function load() {
    if (ready) return ready;
    ready = new Promise((resolve, reject) => {
      const key = config.apiKey || window.GOHEALTH_MAPS_API_KEY;
      if (!key) return reject(new Error('MAPS_KEY_MISSING'));
      const callback = '__ghMapsReady';
      const timeout = setTimeout(() => reject(new Error('MAPS_TIMEOUT')), 20000);
      window[callback] = async () => {
        try {
          await Promise.all(['maps', 'places', 'marker'].map(lib => google.maps.importLibrary(lib)));
          clearTimeout(timeout); resolve(google.maps);
        } catch (error) { clearTimeout(timeout); reject(error); }
      };
      window.gm_authFailure = () => { clearTimeout(timeout); reject(new Error('MAPS_AUTH')); window.dispatchEvent(new Event('gh:maps-auth-error')); };
      if (window.google?.maps?.importLibrary) { window[callback](); return; }
      const script = document.createElement('script');
      const query = new URLSearchParams({key, callback, v: 'weekly', loading: 'async', language: 'zh-TW', region: 'TW'});
      script.src = 'https://maps.googleapis.com/maps/api/js?' + query;
      script.onerror = () => { clearTimeout(timeout); reject(new Error('MAPS_NETWORK')); };
      document.head.appendChild(script);
    });
    return ready;
  }
  function distance(a, b) {
    const rad = n => n * Math.PI / 180;
    const dlat = rad(b.lat - a.lat), dlng = rad(b.lng - a.lng);
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }
  function foodBounds(center) {
    const dy = 1 / 111.32, dx = dy / Math.cos(center.lat * Math.PI / 180);
    return {north: center.lat + dy, south: center.lat - dy, east: center.lng + dx, west: center.lng - dx};
  }
  function content(detail) {
    const node = document.createElement('gmp-place-content-config');
    ['address', 'type', 'rating', detail ? 'opening-hours' : 'open-now-status', 'attribution'].forEach(name => node.appendChild(document.createElement('gmp-place-' + name)));
    return node;
  }
  async function createMap(container, center) {
    const maps = await load();
    return new maps.Map(container, {center, zoom: 15, mapId: config.mapId || 'DEMO_MAP_ID', mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false, gestureHandling: 'cooperative'});
  }
  // Existing elements stay mounted (hidden) for this page only. No REST Places
  // or fetchFields fallback, persistent result store, or cross-member result cache.
  async function search(host, center, category, callbacks) {
    await load();
    const element = document.createElement('gmp-place-search');
    element.setAttribute('selectable', '');
    element.setAttribute('aria-label', category + '搜尋結果');
    element.appendChild(content(false));
    const food = category === '健康飲食';
    const request = document.createElement(food ? 'gmp-place-text-search-request' : 'gmp-place-nearby-search-request');
    request.maxResultCount = 10;
    if (food) {
      request.locationRestriction = foodBounds(center);
      request.rankPreference = 'DISTANCE';
    } else {
      request.includedTypes = types[category];
      request.rankPreference = 'DISTANCE';
    }
    element.appendChild(request);
    element.addEventListener('gmp-select', event => callbacks.select(event.place));
    element.addEventListener('gmp-load', () => callbacks.loaded(element.places || []));
    element.addEventListener('gmp-error', () => callbacks.error(new Error('PLACES_DENIED')));
    host.appendChild(element);
    // Required property last: preceding property assignments do not start queries.
    if (food) request.textQuery = '健康餐';
    else request.locationRestriction = {center, radius: 1000};
    return element;
  }
  function marker(map, place, select) {
    if (!place.location) return null;
    const m = new google.maps.marker.AdvancedMarkerElement({map, position: place.location, gmpClickable: true});
    m.addListener('click', () => select(place));
    return m;
  }
  async function details(place) {
    await load();
    const element = document.createElement('gmp-place-details');
    element.appendChild(content(true));
    const request = document.createElement('gmp-place-details-place-request');
    request.place = place.id;
    element.appendChild(request);
    return element;
  }
  function mapsUrl(place) {
    const pos = typeof place.location?.toJSON === 'function' ? place.location.toJSON() : place.location;
    const query = new URLSearchParams({api: '1', query: pos ? pos.lat + ',' + pos.lng : (place.name || '地點')});
    if (place.id && !place.fixture) query.set('query_place_id', place.id);
    return 'https://www.google.com/maps/search/?' + query;
  }
  window.GH_MAPS = {load, createMap, search, marker, details, distance, mapsUrl, foodBounds};
})();
