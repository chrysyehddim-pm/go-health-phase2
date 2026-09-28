(function () {
  'use strict';
  let loading;
  function loadScript() {
    if (loading) return loading;
    const key = window.GOHEALTH_MAPS_API_KEY;
    if (!key) return Promise.reject(new Error('尚未設定地圖金鑰，以下顯示示意地點'));
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = '__gohealthMapsReady';
      window[callbackName] = () => { delete window[callbackName]; resolve(); };
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&loading=async&v=weekly&callback=' + callbackName;
      script.async = true;
      script.onerror = () => { delete window[callbackName]; reject(new Error('地圖服務載入失敗')); };
      document.head.appendChild(script);
    }).catch(error => { loading = null; throw error; });
    return loading;
  }
  async function load(lat, lng, container) {
    await loadScript();
    const [{ Map }, { Place, SearchNearbyRankPreference }, { AdvancedMarkerElement }] = await Promise.all([
      google.maps.importLibrary('maps'), google.maps.importLibrary('places'), google.maps.importLibrary('marker')
    ]);
    const center = { lat, lng };
    container.classList.remove('fallback');
    container.innerHTML = '';
    const map = new Map(container, { center, zoom: 14, mapId: 'DEMO_MAP_ID', disableDefaultUI: true, zoomControl: true });
    const groups = [['公園', 'park', 'fa-tree'], ['餐飲', 'restaurant', 'fa-utensils'], ['運動', 'gym', 'fa-dumbbell']];
    const responses = await Promise.all(groups.map(async ([type, googleType, icon]) => {
      const result = await Place.searchNearby({
        fields: ['id', 'displayName', 'location', 'formattedAddress', 'googleMapsURI'],
        locationRestriction: { center, radius: 3500 },
        includedTypes: [googleType], maxResultCount: 5,
        rankPreference: SearchNearbyRankPreference.DISTANCE
      });
      return (result.places || []).map(p => ({ id: p.id, name: p.displayName, type, address: p.formattedAddress, url: p.googleMapsURI, icon, location: p.location }));
    }));
    const places = responses.flat();
    places.forEach(p => {
      if (!p.location) return;
      const marker = new AdvancedMarkerElement({ map, position: p.location, title: p.name });
      marker.addListener('click', () => map.panTo(p.location));
    });
    return places;
  }
  window.GH_MAPS = { load };
})();
