(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const icon = name => '<span class="p2-icon blue"><i class="fa-solid ' + name + '"></i></span>';
  function renderAI() {
    GH.shell('', '我的健康提醒');
    const steps = GH.latest('steps'); const sleep = GH.latest('sleep');
    const mood = GH.state.moods.at(-1);
    const suggestion = steps && steps.value < 7000 ? '最近的步數是 ' + GH.format(steps.value) + ' 步。找個舒服的時段走一小段路，讓活動融入日常。' : '持續用自己喜歡的方式活動，也別忘了留時間休息。';
    main().innerHTML = '<section><a class="p2-text-link" href="index.html"><i class="fa-solid fa-arrow-left"></i> 返回首頁</a><p class="p2-eyebrow" style="margin-top:18px">今天的健康提醒</p><h1 class="p2-page-title">照顧自己，從一件小事開始</h1><p class="p2-lead">根據你最近的紀錄，整理今天可以試試的方向。</p></section><section class="p2-card tint p2-feature"><span class="p2-feature-icon"><i class="fa-solid fa-lightbulb"></i></span><div><h2>今天可以這樣做</h2><p>' + suggestion + '</p></div><a class="p2-primary" href="explore.html?tab=places">找個地方走走</a></section><section class="p2-card"><div class="p2-section-head"><h2>最近的健康摘要</h2></div><div class="p2-summary-list"><div><span>步數</span><strong>' + (steps ? GH.format(steps.value) + ' 步' : '尚無紀錄') + '</strong></div><div><span>睡眠</span><strong>' + (sleep ? sleep.value + ' 小時' : '尚無紀錄') + '</strong></div><div><span>心情</span><strong>' + (mood ? esc(mood.value) : '尚無紀錄') + '</strong></div></div><a class="p2-secondary" href="health.html">查看完整紀錄</a></section><section class="p2-privacy"><i class="fa-solid fa-circle-info"></i><span>以上內容提供日常健康參考；有健康疑慮時，請向醫療專業人員諮詢。</span></section>';
  }
  function recommendScore(a) {
    const tags = (a.tags || []).join(' ');
    const title = a.title || '';
    let score = 0;
    if (GH.latest('sleep') && /睡眠|失眠/.test(tags + title)) score += 6;
    if (GH.latest('steps') && /運動|活動|心血管|復健|肌少/.test(tags)) score += 4;
    if (GH.state.moods.length && /心情|情緒|心理|壓力/.test(tags)) score += 5;
    if (/失智|記憶|腦健康/.test(tags + title)) score += 2;
    if (/長者|高齡|老年/.test(title)) score += 2;
    const year = Number(String(a.date || '').match(/\d{4}/)?.[0] || 2022);
    score += Math.max(0, year - 2022) * 0.25;
    return score;
  }
  function renderExplore() {
    GH.shell('探索', '探索');
    const tab = new URLSearchParams(location.search).get('tab') === 'places' ? 'places' : 'articles';
    main().innerHTML = '<section><p class="p2-eyebrow">從生活出發</p><h1 class="p2-page-title">探索</h1><p class="p2-lead">讀一篇健康文章，或找個地方出門走走。</p></section><section><div class="p2-segment" role="tablist"><button data-tab="articles" class="' + (tab === 'articles' ? 'active' : '') + '">健康文章</button><button data-tab="places" class="' + (tab === 'places' ? 'active' : '') + '">附近去處</button></div></section><section id="p2-discovery-panel"></section>';
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { history.replaceState(null, '', 'explore.html?tab=' + b.dataset.tab); document.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b)); if (b.dataset.tab === 'places') renderPlaces(); else renderArticles(); });
    if (tab === 'places') renderPlaces(); else renderArticles();
  }
  function renderArticles() {
    const articles = window.GH_ARTICLES || [];
    const recommendedTopics = new Set([44, 33, 16, 27, 39, 43, 8, 49]);
    const recommended = articles.filter(a => recommendedTopics.has(Number(a.id))).sort((a, b) => recommendScore(b) - recommendScore(a));
    const recommendedIds = new Set(recommended.map(a => a.id));
    const cats = ['推薦', '全部', '動腦與記憶', '心情與睡眠', '活動與身體', '心血管與健康知識'];
    let cat = '推薦'; let query = ''; let shown = 10;
    const panel = document.getElementById('p2-discovery-panel');
    panel.innerHTML = '<div class="p2-section-head"><h2>亞東醫院健康文章</h2></div><label class="sr-only" for="p2-article-search">搜尋健康文章</label><input class="p2-input" id="p2-article-search" type="search" placeholder="搜尋標題、主題或科別"><div class="p2-pill-row" id="p2-article-filters"></div><div id="p2-article-list"></div>';
    const draw = () => {
      document.getElementById('p2-article-filters').innerHTML = cats.map(c => '<button data-cat="' + c + '" class="' + (c === cat ? 'active' : '') + '">' + c + '</button>').join('');
      const base = cat === '推薦' ? recommended : articles.filter(a => cat === '全部' || GH.articleCategory(a) === cat);
      const found = base.filter(a => !query || [a.title, a.department, ...(a.tags || [])].join(' ').toLowerCase().includes(query));
      document.getElementById('p2-article-list').innerHTML = found.length ? '<p class="p2-subtle">共 ' + found.length + ' 篇</p><div class="p2-list">' + found.slice(0, shown).map(a => '<a class="p2-article-card" href="article.html?id=' + encodeURIComponent(a.id) + '">' + icon('fa-book-medical') + '<span><strong>' + esc(a.title) + '</strong><small>' + esc(a.department) + ' · ' + esc(a.date) + '</small></span>' + (recommendedIds.has(a.id) ? '<em>推薦</em>' : '') + '</a>').join('') + '</div>' + (shown < found.length ? '<button id="p2-more-articles" class="p2-secondary full" style="margin-top:14px">載入更多文章</button>' : '') : '<div class="p2-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>找不到符合的文章</h3><p>試試其他關鍵字或分類。</p></div>';
      document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; shown = 10; draw(); });
      const more = document.getElementById('p2-more-articles'); if (more) more.onclick = () => { shown += 10; draw(); };
    };
    document.getElementById('p2-article-search').oninput = e => { query = e.target.value.trim().toLowerCase(); shown = 10; draw(); };
    draw();
  }
  function renderPlaces() {
    const panel = document.getElementById('p2-discovery-panel');
    panel.innerHTML = '<div class="p2-section-head"><h2>探索去處</h2></div><p class="p2-section-intro">選擇地點後，可查看周邊公園、餐飲與運動場所。</p><div class="p2-actions"><button id="p2-my-location" class="p2-primary"><i class="fa-solid fa-location-crosshairs"></i> 使用我的位置</button><button id="p2-city-location" class="p2-secondary">探索台北市</button></div><div id="p2-map" class="p2-map fallback" style="margin-top:14px"><div class="message">選擇位置，查看地圖與周邊去處</div></div><div class="p2-pill-row" id="p2-place-cats" style="margin-top:16px"></div><div id="p2-place-list"></div><p class="p2-subtle">地點資訊由 Google Maps 提供；營業資訊請以地點頁面為準。</p>';
    let places = []; let cat = '全部';
    const cats = ['全部', '公園', '餐飲', '運動'];
    const draw = () => {
      document.getElementById('p2-place-cats').innerHTML = cats.map(c => '<button data-place-cat="' + c + '" class="' + (cat === c ? 'active' : '') + '">' + c + '</button>').join('');
      const found = places.filter(p => cat === '全部' || p.type === cat);
      document.getElementById('p2-place-list').innerHTML = found.length ? '<div class="p2-list">' + found.map((p, i) => '<button class="p2-list-card" data-place="' + i + '">' + icon(p.icon || 'fa-location-dot') + '<span class="body"><strong>' + esc(p.name) + '</strong><small>' + esc(p.type) + ' · ' + esc(p.address || '') + '</small></span><i class="fa-solid fa-chevron-right chevron"></i></button>').join('') + '</div>' : '<div class="p2-empty"><i class="fa-solid fa-map-location-dot"></i><h3>' + (places.length ? '此分類沒有地點' : '選擇位置開始探索') + '</h3></div>';
      document.querySelectorAll('[data-place-cat]').forEach(b => b.onclick = () => { cat = b.dataset.placeCat; draw(); });
      document.querySelectorAll('[data-place]').forEach(b => b.onclick = () => openPlace(found[Number(b.dataset.place)]));
    };
    const load = async (lat, lng) => {
      const map = document.getElementById('p2-map');
      map.innerHTML = '<div class="message">正在尋找周邊去處…</div>';
      try { places = await window.GH_MAPS.load(lat, lng, map); draw(); if (!places.length) GH.toast('附近暫無搜尋結果'); }
      catch (_) { map.classList.add('fallback'); map.innerHTML = '<div class="message">地圖暫時無法載入，請稍後再試</div>'; GH.toast('地圖服務暫時無法使用'); }
    };
    document.getElementById('p2-city-location').onclick = () => load(25.033, 121.565);
    document.getElementById('p2-my-location').onclick = () => {
      if (!navigator.geolocation) return GH.toast('目前無法取得位置');
      navigator.geolocation.getCurrentPosition(pos => load(pos.coords.latitude, pos.coords.longitude), () => GH.toast('尚未取得位置授權，仍可探索台北市'), { timeout: 10000 });
    };
    draw();
  }
  function openPlace(place) {
    if (!place) return;
    GH.sheet(place.name, '<div class="p2-info-list"><p><strong>' + esc(place.type) + '</strong><br>' + esc(place.address || '') + '</p></div><div class="p2-actions"><a class="p2-primary" href="' + esc(place.url || '#') + '" target="_blank" rel="noopener noreferrer">在 Google Maps 查看</a><button id="p2-share-place" class="p2-secondary">分享給健康圈</button></div>');
    document.getElementById('p2-share-place').onclick = () => {
      if (!GH.state.group) return GH.sheet('加入健康圈', '<p>加入健康圈後，就能把喜歡的去處分享給大家。</p><a class="p2-primary full" href="group.html">前往健康圈</a>');
      GH.sheet('分享地點', '<form id="p2-place-share-form" class="p2-form"><label>想說的話<textarea name="note" maxlength="200" required>想和大家一起去「' + esc(place.name) + '」走走。</textarea></label><button class="p2-primary full">分享給健康圈</button></form>');
      document.getElementById('p2-place-share-form').onsubmit = e => { e.preventDefault(); const text = String(new FormData(e.target).get('note')).trim(); if (!text) return; GH.set(s => s.posts.unshift({ id: String(Date.now()), author: '我', time: '剛剛', createdAt: new Date().toISOString(), kind: '地點分享', text, place: place.name, url: place.url, comments: [], likes: 0 })); GH.closeSheet(); GH.toast('已分享至健康圈'); };
    };
  }
  function renderArticle() {
    GH.shell('', '健康文章');
    const a = (window.GH_ARTICLES || []).find(x => String(x.id) === new URLSearchParams(location.search).get('id'));
    if (!a) { main().innerHTML = '<div class="p2-empty"><h1>找不到文章</h1><a class="p2-primary" href="explore.html">返回探索</a></div>'; return; }
    const saved = GH.state.articleSaved.includes(a.id);
    main().innerHTML = '<section><a class="p2-text-link" href="explore.html"><i class="fa-solid fa-arrow-left"></i> 返回探索</a><p class="p2-eyebrow" style="margin-top:18px">' + esc(GH.articleCategory(a)) + '</p><h1 class="p2-page-title">' + esc(a.title) + '</h1><p class="p2-article-meta">' + esc(a.department) + ' · ' + esc(a.author) + ' · ' + esc(a.issue || a.date) + '</p></section><section class="p2-card blue"><span class="p2-badge blue">GO HEALTH 閱讀重點</span><p class="p2-article-summary">' + esc(a.summary) + '</p></section><section class="p2-card"><h2>閱讀完整文章</h2><p class="p2-small p2-muted">前往亞東醫院網站，閱讀完整內容。</p><div class="p2-actions"><a class="p2-primary" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">閱讀院方文章 <i class="fa-solid fa-arrow-up-right-from-square"></i></a><button id="p2-save-article" class="p2-secondary">' + (saved ? '取消收藏' : '收藏文章') + '</button></div></section><section class="p2-privacy"><i class="fa-solid fa-circle-info"></i><span>健康知識不能取代醫師診療；如有不適，請諮詢醫療專業人員。</span></section>';
    document.getElementById('p2-save-article').onclick = () => { GH.set(s => { s.articleSaved = saved ? s.articleSaved.filter(id => id !== a.id) : [...s.articleSaved, a.id]; }); renderArticle(); GH.toast(saved ? '已取消收藏' : '已收藏文章'); };
  }
  document.addEventListener('DOMContentLoaded', () => { const page = document.body.dataset.page; if (page === 'explore') renderExplore(); else if (page === 'article') renderArticle(); else if (page === 'ai') renderAI(); });
})();
