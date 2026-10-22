(function () {
  'use strict';
  const GH = window.GH, esc = GH.escape, maps = window.GH_MAPS;
  const categories = ['健康飲食','公園步道','運動場所','醫院診所','藥局'];
  const icons = ['fa-bowl-food','fa-tree','fa-person-running','fa-hospital','fa-prescription-bottle-medical'];
  const params = new URLSearchParams(location.search);
  const demoStates = ['region-data','region-empty','category-empty','location','location-denied','map-error','data-few','data-many'];
  const demo = params.get('demoPlaces') === '1' && !params.get('family');
  const scenario = demoStates.includes(params.get('placeState'));
  const familyName = params.get('family');
  let panel, center, centerKey = '', category, map, mapPromise, markers = [], groupId, invalid = false, locateRun = 0;
  let initialEmpty = true;
  const entries = new Map(), detailEntries = new Map();
  const $ = id => document.getElementById(id);
  function family() { return familyName ? GH.locationContext.get(familyName) : null; }
  function allowed() {
    if (!familyName) return true;
    const context = family();
    if (!context.available || (groupId && groupId !== context.groupId)) { invalidate(context); return false; }
    if(center?.mode==='family' && center.capturedAt!==context.member.lastLocation.updatedAt){invalidate({label:'家人的位置已更新',reason:'請返回最後位置頁，確認最新的位置後再查看附近去處。'});return false;}
    return true;
  }
  function invalidate(context) {
    if (!panel) return;
    invalid = true; locateRun++;
    clearEntries(); detailEntries.clear();
    if ($('p2-sheet')?.classList.contains('open')) GH.closeSheet();
    $('p2-map').innerHTML = '';
    $('p2-place-list').innerHTML = empty(context.label || '位置分享已失效', context.reason || '請回到健康圈確認成員與位置分享狀態。');
    $('p2-place-cats').querySelectorAll('button').forEach(b => b.disabled = true);
  }
  function clearMarkers() { markers.forEach(m => m.map = null); markers = []; }
  function clearEntries() { entries.forEach(e => {clearTimeout(e.timer);e.node.remove();}); entries.clear(); clearMarkers(); }
  function empty(title, text) { return '<div class="p2-empty p2-place-empty"><i class="fa-solid fa-map-location-dot"></i><h3>'+esc(title)+'</h3><p>'+esc(text)+'</p></div>'; }
  function externalUrl() { return 'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:(category||'健康資源')+' '+(center?.label||'臺灣')}); }
  function updateTools() { $('p2-map-tools').innerHTML='<a href="'+esc(externalUrl())+'" target="_blank" rel="noopener noreferrer">在 Google 地圖繼續搜尋 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>'; }
  function drawCategories() {
    $('p2-place-cats').innerHTML=categories.map((name,i)=>'<button type="button" data-place-cat="'+name+'" aria-pressed="'+(name===category)+'" class="'+(name===category?'active':'')+'" '+(!center||invalid?'disabled':'')+'><i aria-hidden="true" class="fa-solid '+icons[i]+'"></i><span>'+name+'</span></button>').join('');
    $('p2-place-cats').querySelectorAll('button').forEach(b=>b.onclick=()=>searchCategory(b.dataset.placeCat));
  }
  function showNote() {
    $('p2-place-scope').textContent = !category ? '選擇一個分類，看看附近有什麼。' : category==='健康飲食' ? '附近約 1 公里 · 最多 10 筆。健康餐搜尋結果由 Google 提供，非 GO HEALTH 營養認證。' : '半徑 1 公里 · 最多 10 筆 · 依距離排序';
  }
  function showError(entry) {
    clearTimeout(entry.timer); entry.status='error'; entry.node.innerHTML=empty('附近去處暫時無法載入','請稍後再試，或直接前往 Google 地圖查看。')+'<button class="p2-secondary full" data-retry-places>重新載入這個分類</button>';
    entry.node.querySelector('button').onclick=()=>{entries.delete(entry.key);entry.node.remove();searchCategory(entry.category);};
    if (category===entry.category) clearMarkers();
  }
  async function ensureMap() {
    if (demo) {
      if (params.get('placeState')==='map-error') { $('p2-map').innerHTML=empty('地圖暫時無法顯示','仍可查看下方地點清單，或使用 Google 地圖。'); return; }
      $('p2-map').innerHTML='<iframe title="搜尋中心地圖" src="https://www.google.com/maps?q='+encodeURIComponent(center.lat+','+center.lng)+'&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
      return;
    }
    if (map) {map.setCenter({lat:center.lat,lng:center.lng});map.setZoom(15);return;}
    try { mapPromise ||= maps.createMap($('p2-map'),{lat:center.lat,lng:center.lng});map=await mapPromise;map.setCenter({lat:center.lat,lng:center.lng}); }
    catch (_) { $('p2-map').innerHTML=empty('地圖暫時無法顯示','可先查看搜尋結果，或使用 Google 地圖。'); }
  }
  function paintMarkers(entry) {
    clearMarkers();
    if (!map || entry.status!=='ready' || invalid) return;
    entry.places.forEach(place=>{const m=maps.marker(map,place,()=>openPlace(place,entry.category));if(m)markers.push(m);});
    if (entry.places.length) {
      const bounds=new google.maps.LatLngBounds();bounds.extend({lat:center.lat,lng:center.lng});
      entry.places.forEach(p=>{if(p.location)bounds.extend(p.location);});map.fitBounds(bounds,24);
    }
  }
  async function searchCategory(name, interactive=true) {
    if(interactive&&initialEmpty&&['region-empty','category-empty'].includes(params.get('placeState'))){initialEmpty=false;clearEntries();}
    if (!center || invalid || !allowed() || !categories.includes(name)) return;
    category=name;drawCategories();showNote();updateTools();
    $('p2-place-list-intro').hidden=true;
    entries.forEach(e=>e.node.hidden=e.category!==category);
    const key=centerKey+'|'+category;
    if(entries.has(key)){const e=entries.get(key);e.node.hidden=false;paintMarkers(e);return;}
    clearMarkers();
    const node=document.createElement('div');node.className='p2-google-results';$('p2-place-list').appendChild(node);
    const entry={key,category:name,node,status:'loading',places:[]};entries.set(key,entry);
    const status=document.createElement('div');status.className='p2-place-result-head';status.setAttribute('role','status');status.textContent='正在尋找附近的'+name+'…';node.appendChild(status);
    entry.timer=setTimeout(()=>{if(entries.get(key)===entry&&entry.status==='loading')showError(entry);},22000);
    if(initialEmpty&&['region-empty','category-empty'].includes(params.get('placeState'))){clearTimeout(entry.timer);entry.status='ready';status.innerHTML=empty('附近沒有符合的去處','試試其他分類，或選擇其他地區。');return;}
    if(demo){await fixtureSearch(entry,status);return;}
    try {
      await maps.search(node,{lat:center.lat,lng:center.lng},name,{
        select:place=>{if(allowed())openPlace(place,name);},
        loaded:places=>{
          if(entries.get(key)!==entry||entry.status!=='loading'||!allowed())return;
          clearTimeout(entry.timer);entry.status='ready';entry.places=places.slice(0,10);status.textContent='找到 '+entry.places.length+' 個去處';
          if(!places.length)status.innerHTML=empty('附近沒有符合的去處','試試其他分類，或選擇其他地區。');
          if(category===name)paintMarkers(entry);
        },
        error:()=>{if(entries.get(key)===entry&&allowed())showError(entry);}
      });
    } catch (_) {if(entries.get(key)===entry&&allowed())showError(entry);}
  }
  function fixtureData() {
    if(window.GH_PLACE_FIXTURES)return Promise.resolve(window.GH_PLACE_FIXTURES);
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='assets/p2-place-fixtures.js';s.onload=()=>resolve(window.GH_PLACE_FIXTURES);s.onerror=reject;document.head.appendChild(s);});
  }
  async function fixtureSearch(entry,status) {
    try {
      const data=await fixtureData();if(entries.get(entry.key)!==entry)return;
      const bounds=maps.foodBounds(center);
      let places=data.places.filter(p=>p.type===entry.category).filter(p=>entry.category==='健康飲食'?p.lat>=bounds.south&&p.lat<=bounds.north&&p.lng>=bounds.west&&p.lng<=bounds.east:maps.distance(center,p)<=1).sort((a,b)=>maps.distance(center,a)-maps.distance(center,b)).slice(0,10).map(p=>({...p,fixture:true,location:{lat:p.lat,lng:p.lng}}));
      if(initialEmpty&&['region-empty','category-empty'].includes(params.get('placeState')))places=[];
      clearTimeout(entry.timer);entry.status='ready';entry.places=places;
      status.textContent='找到 '+places.length+' 個去處';
      const list=document.createElement('div');list.className='p2-place-list';
      list.innerHTML=places.length?'<p class="p2-small p2-muted">以下為固定示意資料；實際評分與營業資訊以 Google 地圖為準。</p>'+places.map((p,i)=>'<button class="p2-place-card p2-place-compact" data-fixture-place="'+i+'"><span class="body"><strong>'+esc(p.name)+'</strong><small>'+esc(p.address)+'</small><small>'+esc(p.type)+'</small>'+(p.rating?'<small>'+esc(p.rating)+' ★'+(p.ratingCount?'（'+esc(p.ratingCount)+'）':'')+'</small>':'')+(p.hours?'<small>'+esc(p.hours)+'</small>':'')+'<small>查看地點與分享</small></span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></button>').join(''):empty('附近沒有符合的去處','試試其他分類，或選擇其他地區。');
      list.querySelectorAll('button').forEach(b=>b.onclick=()=>openPlace(places[Number(b.dataset.fixturePlace)],entry.category));entry.node.appendChild(list);
    } catch (_) {showError(entry);}
  }
  async function setCenter(next, nextCategory) {
    if(!allowed())return;
    locateRun++;center=next;
    const key=next.lat+','+next.lng;
    if(key!==centerKey){clearEntries();centerKey=key;}
    category=nextCategory||category||'公園步道';
    $('p2-place-location-label').textContent=next.label;
    $('p2-place-location-detail').textContent=next.mode==='region'?'以行政區代表位置搜尋，並非你的實際位置。':next.mode==='family'?'以家人最後分享位置搜尋。':next.mode==='journey'?'以板橋車站周邊作為展示起點，未使用你的實際位置；也能改選地區。':'距離為約略直線距離，實際路線請查看 Google 地圖。';
    drawCategories();showNote();updateTools();
    const requestedKey=centerKey;
    await ensureMap();
    if(category&&centerKey===requestedKey)searchCategory(category,false);
  }
  function openAreaPicker() {
    if(familyName)return;
    const areas=window.GH_TW_AREAS;
    GH.sheet('選擇地區','<div class="p2-area-picker"><p>選擇想探索的縣市與行政區。</p><label>縣市<select id="p2-county"><option value="">請選擇縣市</option>'+areas.map(c=>'<option>'+esc(c.name)+'</option>').join('')+'</select></label><label>行政區<select id="p2-district" disabled><option value="">請先選擇縣市</option></select></label><p class="p2-small">將以行政區代表位置搜尋附近去處。</p><button id="p2-confirm-area" class="p2-primary full" disabled>查看這個地區</button></div>');
    const county=$('p2-county'),district=$('p2-district'),confirm=$('p2-confirm-area');
    county.onchange=()=>{const c=areas.find(c=>c.name===county.value);district.disabled=!c;district.innerHTML='<option value="">請選擇行政區</option>'+(c?c.districts.map(d=>'<option>'+esc(d.name)+'</option>').join(''):'');confirm.disabled=true;};
    district.onchange=()=>confirm.disabled=!district.value;
    confirm.onclick=()=>{
      const point=window.GH_AREA_CENTERS?.[(county.value+district.value).replaceAll('台','臺')];
      if(!point)return GH.toast('這個地區的位置資料暫時無法使用，請稍後再試');
      GH.closeSheet();initialEmpty=false;clearEntries();$('p2-location-notice').hidden=true;setCenter({lat:point.center[0],lng:point.center[1],label:county.value+district.value,mode:'region'});
    };
  }
  function locate() {
    const run=++locateRun,button=$('p2-my-location');button.disabled=true;button.textContent='正在取得位置…';
    const reset=()=>{button.disabled=false;button.textContent='使用我的位置';};
    const failure=()=>{if(run!==locateRun)return;reset();$('p2-location-notice').hidden=false;$('p2-location-notice').textContent='尚未取得位置權限，也可以選擇地區開始探索。';};
    if(!navigator.geolocation){failure();return;}
    navigator.geolocation.getCurrentPosition(pos=>{if(run!==locateRun)return;reset();initialEmpty=false;$('p2-location-notice').hidden=true;setCenter({lat:pos.coords.latitude,lng:pos.coords.longitude,label:'我的目前位置',mode:'location'});},failure,{timeout:10000,maximumAge:300000});
  }
  function parkDetails() {
    let park=$('p2-place-detail-park');if(!park){park=document.createElement('div');park.id='p2-place-detail-park';park.hidden=true;document.body.appendChild(park);}
    detailEntries.forEach(node=>park.appendChild(node));
  }
  async function openPlace(place, type) {
    if(!allowed())return;
    parkDetails();
    if(map&&place.location){map.panTo(place.location);map.setZoom(16);}
    const url=place.mapsUrl||maps.mapsUrl(place);
    GH.sheet(place.fixture?place.name:'地點資訊','<div id="p2-place-detail-host" class="p2-place-detail-host"></div><p class="p2-small">'+esc(type)+'</p><div class="p2-actions"><a class="p2-primary" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">在 Google 地圖查看</a><button id="p2-share-place" class="p2-secondary">'+(familyName?'推薦給'+esc(familyName):'分享到健康圈')+'</button></div>');
    const host=$('p2-place-detail-host');
    if(place.fixture){host.innerHTML='<div class="p2-place-detail"><strong>'+esc(place.name)+'</strong><p>'+esc(place.address)+'</p><p>'+esc(place.summary)+'</p><p class="p2-small">營業時間與評分請至 Google 地圖確認。</p></div>';}
    else {
      try {
        if(!detailEntries.has(place.id))detailEntries.set(place.id,await maps.details(place));
        const node=detailEntries.get(place.id);
        if(host.isConnected&&allowed())host.appendChild(node);
        node.addEventListener('gmp-error',()=>{if(host.isConnected)host.innerHTML=empty('地點資訊暫時無法載入','仍可在 Google 地圖查看，或分享此地點連結。');},{once:true});
      } catch (_) {if(host.isConnected)host.innerHTML=empty('地點資訊暫時無法載入','可在 Google 地圖查看此地點。');}
    }
    $('p2-share-place')?.addEventListener('click',()=>share(place,type,url));
  }
  function share(place,type,url,draft={}) {
    if(!allowed())return;
    if(!GH.state.group)return GH.sheet('加入健康圈','<p>加入健康圈後，就能把喜歡的去處分享給家人。</p><a class="p2-primary full" href="group.html">前往健康圈</a>');
    const targetGroup=GH.state.group.id;
    parkDetails();
    GH.sheet(familyName?'推薦給'+familyName:'分享地點','<form id="p2-place-share-form" class="p2-form"><div class="p2-share-preview"><strong>'+esc(familyName?'推薦給'+familyName:GH.state.group.name)+'</strong><span>'+esc(type)+'</span><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">查看選取的地點</a></div><p class="p2-small">這則推薦將發布在健康圈，圈內成員都能看到。</p><label>地點稱呼（選填）<input name="name" maxlength="60" placeholder="例如：附近的健康餐店" value="'+esc(draft.name||place.name||'')+'"></label><label>想說的話<textarea name="note" maxlength="200" required>'+esc(draft.note||(familyName?familyName+'，這裡在你最後分享的位置附近，有空可以看看。':'想和大家分享這個附近去處。'))+'</textarea></label><button class="p2-primary full">預覽分享內容</button></form>');
    $('p2-place-share-form').onsubmit=event=>{
      event.preventDefault();if(!allowed()||GH.state.group?.id!==targetGroup)return GH.toast('健康圈已變更，請重新選擇分享對象');
      const form=new FormData(event.target),name=String(form.get('name')).trim(),note=String(form.get('note')).trim();if(!note)return;
      GH.sheet('確認分享內容','<div class="p2-share-preview"><p>將發布到 '+esc(GH.state.group.name)+'</p>'+(familyName?'<strong>推薦給 '+esc(familyName)+'</strong>':'')+'<strong>'+esc(name||'附近健康去處')+'</strong><p>'+esc(note)+'</p><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">查看地點</a></div><div class="p2-actions"><button id="p2-confirm-place-share" class="p2-primary">確認發布</button><button id="p2-back-place-share" class="p2-secondary">返回修改</button></div>');
      $('p2-back-place-share').onclick=()=>share(place,type,url,{name,note});
      $('p2-confirm-place-share').onclick=event=>{
        if(!allowed()||GH.state.group?.id!==targetGroup)return GH.toast('健康圈已變更，請重新選擇分享對象');
        event.currentTarget.disabled=true;
        GH.set(s=>s.posts.unshift({id:crypto.randomUUID(),author:'我',createdAt:new Date().toISOString(),time:'剛剛',kind:familyName?'地點推薦':'地點分享',text:(familyName?'推薦給'+familyName+'：':'')+note,place:name||'附近健康去處',url,recipient:familyName||null,groupId:targetGroup,comments:[],likes:0}));
        GH.closeSheet();location.href='group.html?shared=place';
      };
    };
  }
  function render() {
    if(panel?.isConnected){if(allowed())return;return;}
    panel=$('p2-places-panel')||$('p2-discovery-panel');
    const context=family();if(context?.available)groupId=context.groupId;
    panel.innerHTML=(familyName?'<a class="p2-back-button" href="group.html?view=location&member='+encodeURIComponent(familyName)+'">返回'+esc(familyName)+'的最後位置</a>':'')+'<div class="p2-section-head"><h2>'+(familyName?esc(familyName)+'附近的去處':'附近健康去處')+'</h2></div>'+(familyName?'<div class="p2-family-search-context"><strong>'+esc(context.available?context.label:context.label)+'</strong><p>'+(context.available?(context.age>=86400000?'這是較早的位置，建議先確認家人目前所在。':'以家人最後分享的位置搜尋，並非即時定位。'):esc(context.reason))+'</p></div>':'<div class="p2-actions p2-place-actions"><button id="p2-my-location" class="p2-primary">使用我的位置</button><button id="p2-city-location" class="p2-secondary">選擇地區</button></div>')+'<div id="p2-location-notice" class="p2-location-notice" hidden></div><div class="p2-location-label"><strong id="p2-place-location-label">尚未選擇位置</strong><p id="p2-place-location-detail">選擇位置後，會自動顯示附近的公園步道；也能切換其他分類。</p></div><div id="p2-map" class="p2-map">'+empty('選擇位置開始探索','使用目前位置，或選擇想查看的地區。')+'</div><div id="p2-map-tools" class="p2-map-tools"></div><div class="p2-pill-row p2-place-filter" id="p2-place-cats"></div><p id="p2-place-scope" class="p2-small"></p><div id="p2-place-list-intro"></div><div id="p2-place-list" aria-live="polite"></div><p class="p2-subtle">營業資訊可能變動，出發前可到 Google 地圖確認。</p>';
    if(!familyName){$('p2-city-location').onclick=openAreaPicker;$('p2-my-location').onclick=locate;}
    drawCategories();showNote();
    if(familyName){if(!context.available){invalidate(context);return;}setCenter({...context.center,label:familyName+'的最後位置 · '+context.area,mode:'family',capturedAt:context.member.lastLocation.updatedAt},'健康飲食');}
    else if(GH.state.journey?.id==='xiaohua'&&!scenario&&!demo){
      setCenter({lat:25.0142,lng:121.4638,label:'板橋車站附近（展示起點）',mode:'journey'},'公園步道');
    }
    else if(demo||scenario){
      const state=params.get('placeState');
      if(state==='location-denied'){$('p2-location-notice').hidden=false;$('p2-location-notice').textContent='尚未取得位置權限，可改用選擇地區。';}
      else setCenter({lat:25.0264,lng:121.5435,label:'臺北市大安區',mode:'region'},state==='category-empty'?'健康飲食':'公園步道');
    }
    document.addEventListener('gh:state',()=>{if(familyName)allowed();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)allowed();});
    if(familyName)setInterval(()=>{if(!invalid)allowed();},60000);
    window.addEventListener('gh:maps-auth-error',()=>{if(map){$('p2-map').innerHTML=empty('地圖暫時無法顯示','請使用 Google 地圖查看。');map=null;}});
  }
  window.GH_PLACES={render, demo};
})();
