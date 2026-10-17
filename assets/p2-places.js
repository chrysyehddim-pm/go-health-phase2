(function () {
  'use strict';

  const GH = window.GH;
  const esc = GH.escape;
  const categories = ['全部', '健康飲食', '公園步道', '運動場所', '醫院診所', '藥局'];
  const categoryIcons = {
    '全部': 'fa-border-all',
    '健康飲食': 'fa-bowl-food',
    '公園步道': 'fa-tree',
    '運動場所': 'fa-person-running',
    '醫院診所': 'fa-hospital',
    '藥局': 'fa-prescription-bottle-medical'
  };

  let panel;
  let map;
  let places = [];
  let category = '全部';
  let shown = 6;
  let mode = '';
  let selectedArea = null;
  let forceMapError = false;

  function setUrl(values) {
    const params = new URLSearchParams(location.search);
    params.set('tab', 'places');
    Object.keys(values).forEach(function (key) {
      if (values[key]) params.set(key, values[key]);
      else params.delete(key);
    });
    history.replaceState(null, '', 'explore.html?' + params.toString());
  }

  function diverse(list) {
    if (category !== '全部' || mode === 'location') return list;
    const groups = categories.slice(1).map(function (name) {
      return list.filter(function (place) { return place.type === name; });
    });
    const result = [];
    let index = 0;
    while (groups.some(function (group) { return group[index]; })) {
      groups.forEach(function (group) { if (group[index]) result.push(group[index]); });
      index += 1;
    }
    return result;
  }

  function distanceLabel(place) {
    if (mode !== 'location' || !Number.isFinite(place.distance)) return '';
    const distance = place.distance < 1 ? Math.round(place.distance * 1000) + ' 公尺' : place.distance.toFixed(1) + ' 公里';
    return '<span><i class="fa-solid fa-location-arrow"></i> 約 ' + distance + '</span>';
  }

  function placeCard(place, index) {
    return '<button class="p2-place-card" data-place-index="' + index + '">' +
      '<span class="p2-place-icon ' + esc(place.tone) + '"><i class="fa-solid ' + esc(place.icon) + '"></i></span>' +
      '<span class="body"><span class="p2-place-meta"><em>' + esc(place.type) + '</em>' + distanceLabel(place) + '</span>' +
      '<strong>' + esc(place.name) + '</strong><small>' + esc(place.address) + '</small><small class="summary">' + esc(place.summary) + '</small></span>' +
      '<i class="fa-solid fa-chevron-right chevron"></i></button>';
  }

  function emptyHtml(found) {
    if (!mode) {
      return '<div class="p2-empty p2-place-empty"><i class="fa-solid fa-map-location-dot"></i><h3>選擇位置開始探索</h3><p>可以使用目前位置，或從全台行政區選擇想查看的地區。</p></div>';
    }
    if (places.length && !found.length) {
      return '<div class="p2-empty p2-place-empty"><i class="fa-solid fa-filter-circle-xmark"></i><h3>此分類目前沒有精選地點</h3><p>可以切換其他分類，查看這個地區已整理的健康去處。</p><button id="p2-reset-category" class="p2-secondary">查看全部分類</button></div>';
    }
    const title = mode === 'location' ? '目前位置附近尚無精選去處' : '此地區尚無精選去處';
    return '<div class="p2-empty p2-place-empty"><i class="fa-solid fa-map-pin"></i><h3>' + title + '</h3><p>GO HEALTH 會逐步補充合作與精選地點，你也可以先查看其他行政區。</p><button id="p2-reselect-area" class="p2-secondary">選擇其他地區</button></div>';
  }

  function draw() {
    const cats = document.getElementById('p2-place-cats');
    const list = document.getElementById('p2-place-list');
    if (!cats || !list) return;
    cats.innerHTML = categories.map(function (name) {
      return '<button data-place-cat="' + name + '" class="' + (category === name ? 'active' : '') + '"><i class="fa-solid ' + categoryIcons[name] + '"></i><span>' + name + '</span></button>';
    }).join('');

    const found = diverse(places.filter(function (place) {
      return category === '全部' || place.type === category;
    }));
    const limit = Math.min(found.length, 18);
    const visible = found.slice(0, Math.min(shown, limit));

    if (!found.length) {
      list.innerHTML = emptyHtml(found);
    } else {
      list.innerHTML = '<div class="p2-place-result-head"><strong>共 ' + found.length + ' 個精選去處</strong><span>每次顯示 6 筆，最多 18 筆</span></div>' +
        '<div class="p2-place-list">' + visible.map(placeCard).join('') + '</div>' +
        (visible.length < limit ? '<button id="p2-more-places" class="p2-secondary full p2-more-places">載入更多去處（再顯示 6 筆）</button>' : '');
    }

    cats.querySelectorAll('[data-place-cat]').forEach(function (button) {
      button.onclick = function () {
        category = button.dataset.placeCat;
        shown = 6;
        draw();
      };
    });
    list.querySelectorAll('[data-place-index]').forEach(function (button) {
      button.onclick = function () { openPlace(visible[Number(button.dataset.placeIndex)]); };
    });
    const more = document.getElementById('p2-more-places');
    if (more) more.onclick = function () { shown = Math.min(shown + 6, 18); draw(); };
    const reset = document.getElementById('p2-reset-category');
    if (reset) reset.onclick = function () { category = '全部'; shown = 6; draw(); };
    const reselect = document.getElementById('p2-reselect-area');
    if (reselect) reselect.onclick = openAreaPicker;
  }

  function locationNotice(title, detail, actionLabel, action) {
    const notice = document.getElementById('p2-location-notice');
    if (!notice) return;
    notice.innerHTML = '<div><i class="fa-solid fa-circle-info"></i><span><strong>' + title + '</strong>' + detail + '</span></div>' +
      (actionLabel ? '<button id="p2-notice-action" class="p2-text-link">' + actionLabel + '</button>' : '');
    notice.hidden = false;
    const button = document.getElementById('p2-notice-action');
    if (button) button.onclick = action;
  }

  function clearNotice() {
    const notice = document.getElementById('p2-location-notice');
    if (notice) {
      notice.hidden = true;
      notice.innerHTML = '';
    }
  }

  function updateMapTools(query) {
    const tools = document.getElementById('p2-map-tools');
    if (!tools) return;
    tools.innerHTML = '<a href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query) + '" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> 在 Google 地圖開啟</a>';
  }

  function updateLocationLabel(title, detail) {
    const label = document.getElementById('p2-place-location-label');
    label.innerHTML = '<i class="fa-solid fa-location-dot"></i><span><strong>' + esc(title) + '</strong><small>' + esc(detail) + '</small></span>';
  }

  async function loadRegion(county, district, options) {
    mode = 'region';
    selectedArea = { county: county, district: district };
    category = options && options.category ? options.category : '全部';
    shown = options && options.showAll ? 18 : 6;
    forceMapError = Boolean(options && options.forceMapError);
    clearNotice();
    updateLocationLabel(county + district, '依選擇的行政區顯示 GO HEALTH 精選內容');
    map.innerHTML = '<div class="message"><i class="fa-solid fa-spinner fa-spin"></i><strong>正在載入地圖</strong><span>同步整理這個地區的精選去處。</span></div>';
    places = await window.GH_MAPS.loadRegion(county, district, map, { forceError: forceMapError });
    updateMapTools(county + district);
    setUrl({ placeState: options && options.preserveState ? options.preserveState : 'region', county: county, district: district });
    draw();
  }

  async function loadLocation(lat, lng, options) {
    mode = 'location';
    selectedArea = null;
    category = '全部';
    shown = options && options.showAll ? 18 : 6;
    forceMapError = Boolean(options && options.forceMapError);
    clearNotice();
    updateLocationLabel('我的目前位置', '依距離排序 GO HEALTH 已整理的地點');
    map.innerHTML = '<div class="message"><i class="fa-solid fa-spinner fa-spin"></i><strong>正在取得附近內容</strong><span>位置只用於本次排序與地圖顯示。</span></div>';
    places = await window.GH_MAPS.loadNearby(lat, lng, map, { forceError: forceMapError });
    updateMapTools(lat + ',' + lng);
    setUrl({ placeState: options && options.preserveState ? options.preserveState : 'location', county: '', district: '' });
    draw();
  }

  function renderDenied() {
    mode = '';
    places = [];
    category = '全部';
    shown = 6;
    updateLocationLabel('尚未取得位置', '可改用手動選擇地區，不影響瀏覽');
    window.GH_MAPS.fallback(map, '未取得定位權限', '仍可使用全台行政區選擇精選去處。');
    updateMapTools('臺灣');
    locationNotice('尚未允許位置權限', '使用目前位置需要在手機或 App 中同意定位；也可以直接選擇地區。', '改用選擇地區', openAreaPicker);
    draw();
  }

  function openAreaPicker() {
    const areas = window.GH_TW_AREAS || [];
    GH.sheet('選擇地區', '<div class="p2-area-picker"><p>先選縣市，再選行政區。原型已備妥全台 22 縣市、368 個行政區；有資料的地區會顯示精選內容，其餘顯示空狀態。</p>' +
      '<label for="p2-county">縣市<select id="p2-county"><option value="">請選擇縣市</option>' + areas.map(function (area) { return '<option value="' + esc(area.name) + '">' + esc(area.name) + '</option>'; }).join('') + '</select></label>' +
      '<label for="p2-district">行政區<select id="p2-district" disabled><option value="">請先選擇縣市</option></select></label>' +
      '<div id="p2-area-coverage" class="p2-area-coverage"><i class="fa-solid fa-circle-info"></i><span>選擇行政區後，會顯示目前資料收錄情況。</span></div>' +
      '<button id="p2-confirm-area" class="p2-primary full" disabled>查看這個地區</button></div>');
    const countySelect = document.getElementById('p2-county');
    const districtSelect = document.getElementById('p2-district');
    const coverage = document.getElementById('p2-area-coverage');
    const confirm = document.getElementById('p2-confirm-area');

    countySelect.onchange = function () {
      const area = areas.find(function (item) { return item.name === countySelect.value; });
      districtSelect.disabled = !area;
      districtSelect.innerHTML = area ? '<option value="">請選擇行政區</option>' + area.districts.map(function (district) {
        return '<option value="' + esc(district.name) + '">' + esc(district.name) + '</option>';
      }).join('') : '<option value="">請先選擇縣市</option>';
      coverage.innerHTML = '<i class="fa-solid fa-circle-info"></i><span>選擇行政區後，會顯示目前資料收錄情況。</span>';
      confirm.disabled = true;
    };
    districtSelect.onchange = function () {
      const count = window.GH_MAPS.coverage(countySelect.value, districtSelect.value);
      coverage.innerHTML = count ?
        '<i class="fa-solid fa-circle-check"></i><span>目前收錄 <strong>' + count + '</strong> 個精選去處。</span>' :
        '<i class="fa-solid fa-circle-info"></i><span>此區目前尚無精選內容，仍可查看地圖與正式空狀態。</span>';
      confirm.disabled = !districtSelect.value;
    };
    confirm.onclick = function () {
      const county = countySelect.value;
      const district = districtSelect.value;
      if (!county || !district) return;
      GH.closeSheet();
      loadRegion(county, district);
    };
  }

  function openPlace(place) {
    if (!place) return;
    window.GH_MAPS.focus(place, map, { forceError: forceMapError });
    updateMapTools(place.name + ' ' + place.address);
    const tags = place.tags.map(function (tag) { return '<span>' + esc(tag) + '</span>'; }).join('');
    GH.sheet(place.name, '<div class="p2-place-detail"><div class="p2-place-detail-top"><span class="p2-place-icon ' + esc(place.tone) + '"><i class="fa-solid ' + esc(place.icon) + '"></i></span><div><em>' + esc(place.type) + '</em><p>' + esc(place.summary) + '</p></div></div>' +
      '<div class="p2-tag-row">' + tags + '</div><dl><div><dt>地址</dt><dd>' + esc(place.address) + '</dd></div><div><dt>資料來源</dt><dd>' + esc(place.source) + '</dd></div><div><dt>更新日期</dt><dd>' + esc(place.updatedAt) + '</dd></div></dl>' +
      '<p class="p2-subtle">營業時間、費用與服務內容請以 Google 地圖或地點官方資訊為準。</p></div>' +
      '<div class="p2-actions"><a class="p2-primary" href="' + esc(place.mapsUrl) + '" target="_blank" rel="noopener noreferrer">在 Google 地圖查看</a><button id="p2-share-place" class="p2-secondary">分享給健康圈</button></div>');
    document.getElementById('p2-share-place').onclick = function () {
      if (!GH.state.group) {
        GH.sheet('加入健康圈', '<p>加入健康圈後，就能把喜歡的去處分享給大家。</p><a class="p2-primary full" href="group.html">前往健康圈</a>');
        return;
      }
      GH.sheet('分享地點', '<form id="p2-place-share-form" class="p2-form"><div class="p2-share-preview"><strong>' + esc(place.name) + '</strong><span>' + esc(place.type) + ' · ' + esc(place.address) + '</span></div><label>想說的話<textarea name="note" maxlength="200" required>想和大家一起去「' + esc(place.name) + '」走走。</textarea></label><button class="p2-primary full">分享給健康圈</button></form>');
      document.getElementById('p2-place-share-form').onsubmit = function (event) {
        event.preventDefault();
        const text = String(new FormData(event.target).get('note')).trim();
        if (!text) return;
        GH.set(function (state) {
          state.posts.unshift({ id: String(Date.now()), author: '我', time: '剛剛', createdAt: new Date().toISOString(), kind: '地點分享', text: text, place: place.name, url: place.mapsUrl, comments: [], likes: 0 });
        });
        GH.closeSheet();
        GH.toast('已分享至健康圈');
      };
    };
  }

  function runScenario() {
    const params = new URLSearchParams(location.search);
    const state = params.get('placeState');
    if (state === 'location') return loadLocation(25.0330, 121.5430, { preserveState: state });
    if (state === 'region-data') return loadRegion('臺北市', '大安區', { preserveState: state });
    if (state === 'region-partial') return loadRegion('新北市', '板橋區', { preserveState: state });
    if (state === 'region-empty') return loadRegion('金門縣', '烏坵鄉', { preserveState: state });
    if (state === 'category-empty') return loadRegion('新北市', '板橋區', { category: '健康飲食', preserveState: state });
    if (state === 'location-denied') return renderDenied();
    if (state === 'map-error') return loadRegion('臺北市', '大安區', { forceMapError: true, preserveState: state });
    if (state === 'full-list') return loadRegion('臺北市', '大安區', { showAll: true, preserveState: state });
    if (state === 'picker') return openAreaPicker();
    const county = params.get('county');
    const district = params.get('district');
    if (county && district) return loadRegion(county, district);
  }

  function render() {
    panel = document.getElementById('p2-discovery-panel');
    panel.innerHTML = '<div class="p2-section-head"><h2>附近健康去處</h2></div><p class="p2-section-intro">看看附近適合散步、運動與健康生活的好去處。</p>' +
      '<div class="p2-location-panel"><div class="p2-actions"><button id="p2-my-location" class="p2-primary"><i class="fa-solid fa-location-crosshairs"></i> 使用我的位置</button><button id="p2-city-location" class="p2-secondary"><i class="fa-solid fa-list"></i> 選擇地區</button></div>' +
      '<div id="p2-place-location-label" class="p2-location-status"><i class="fa-solid fa-location-dot"></i><span><strong>尚未選擇位置</strong><small>位置只用於本次排序與地圖顯示</small></span></div><div id="p2-location-notice" class="p2-location-notice" hidden></div></div>' +
      '<div id="p2-map" class="p2-map"><div class="message"><i class="fa-solid fa-map-location-dot"></i><strong>選擇位置查看地圖</strong><span>可以使用目前位置，也可以手動選擇行政區。</span></div></div>' +
      '<div id="p2-map-tools" class="p2-map-tools"></div><div class="p2-pill-row p2-place-filter" id="p2-place-cats"></div><div id="p2-place-list"></div>' +
      '<p class="p2-subtle p2-place-disclaimer">地圖與路線由 Google Maps 提供；營業時間與服務內容請以地點官方資訊為準。</p>';
    map = document.getElementById('p2-map');
    document.getElementById('p2-city-location').onclick = openAreaPicker;
    document.getElementById('p2-my-location').onclick = function () {
      if (!navigator.geolocation) {
        renderDenied();
        return;
      }
      navigator.geolocation.getCurrentPosition(function (position) {
        loadLocation(position.coords.latitude, position.coords.longitude);
      }, renderDenied, { timeout: 10000, maximumAge: 300000 });
    };
    draw();
    runScenario();
  }

  window.GH_PLACES = { render: render };
})();
