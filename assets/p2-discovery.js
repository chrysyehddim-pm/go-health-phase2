(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const icon = name => '<span class="p2-icon blue"><i class="fa-solid ' + name + '"></i></span>';
  function renderAI() {
    GH.shell('首頁', '我的健康提醒');
    const steps = GH.latest('steps'); const sleep = GH.latest('sleep');
    const mood = GH.state.moods.at(-1);
    const suggestion = steps && steps.value < 7000 ? '最近的步數是 ' + GH.format(steps.value) + ' 步。找個舒服的時段走一小段路，讓活動融入日常。' : '持續用自己喜歡的方式活動，也別忘了留時間休息。';
    main().innerHTML = '<section><a class="p2-text-link" href="index.html"><i class="fa-solid fa-arrow-left"></i> 返回首頁</a><p class="p2-eyebrow" style="margin-top:18px">今天的健康提醒</p><h1 class="p2-page-title">照顧自己，從一件小事開始</h1><p class="p2-lead">' + (steps ? '根據你授權的活動紀錄，整理今天可以試試的方向。' : '連接健康資料後，可查看個人活動提醒。現在先從輕鬆散步開始。') + '</p></section><section class="p2-card tint p2-feature"><span class="p2-feature-icon"><i class="fa-solid fa-lightbulb"></i></span><div><h2>今天可以這樣做</h2><p>' + suggestion + '</p></div><a class="p2-primary" href="explore.html?tab=places">找個地方走走</a></section><section class="p2-card"><div class="p2-section-head"><h2>最近的健康摘要</h2></div><div class="p2-summary-list"><div><span>步數</span><strong>' + (steps ? GH.format(steps.value) + ' 步' : '尚無紀錄') + '</strong></div><div><span>睡眠</span><strong>' + (sleep ? sleep.value + ' 小時' : '尚無紀錄') + '</strong></div><div><span>心情</span><strong>' + (mood ? esc(mood.value) : '尚無紀錄') + '</strong></div></div><a class="p2-secondary" href="health.html">查看完整紀錄</a></section><section class="p2-privacy"><i class="fa-solid fa-circle-info"></i><span>以上內容提供日常健康參考；有健康疑慮時，請向醫療專業人員諮詢。</span></section>';
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
    const family = new URLSearchParams(location.search).get('family');
    GH.shell(family ? '健康圈' : '探索', '探索');
    const tab = new URLSearchParams(location.search).get('tab') === 'articles' && !family ? 'articles' : 'places';
    main().innerHTML = '<section><p class="p2-eyebrow">從生活出發</p><h1 class="p2-page-title">'+(family?'家人附近去處':'探索')+'</h1><p class="p2-lead">'+(family?'找個合適的地方，分享一句貼心的推薦。':'讀一篇健康文章，或找個地方出門走走。')+'</p></section>'+
      (family?'':'<section><div class="p2-segment p2-primary-tabs" role="tablist" aria-label="探索分類"><button role="tab" id="p2-tab-places" aria-controls="p2-places-panel" data-tab="places">附近去處</button><button role="tab" id="p2-tab-articles" aria-controls="p2-articles-panel" data-tab="articles">健康文章</button></div></section>')+
      '<section id="p2-places-panel" role="tabpanel" aria-labelledby="p2-tab-places" hidden></section><section id="p2-articles-panel" role="tabpanel" aria-labelledby="p2-tab-articles" hidden></section>'+
      '<section class="p2-hospital-services"><div class="p2-section-head"><h2>更多健康協助</h2></div><p>需要更多資訊與專業協助時，讓亞東醫院陪你一起照顧健康。</p><a class="p2-hospital-service" href="https://page.line.me/769uaenm" target="_blank" rel="noopener noreferrer"><span class="p2-service-icon line"><i class="fa-brands fa-line"></i></span><span><strong>亞東醫院 LINE 好友</strong><small>接收健康資訊與院方最新消息</small><em>加入 LINE 好友</em></span><i class="fa-solid fa-arrow-up-right-from-square"></i></a><a class="p2-hospital-service" href="https://www.fetnet.net/content/cbu/tw/digital-services/health/5g-telemedicine/partners/femh.html" target="_blank" rel="noopener noreferrer"><span class="p2-service-icon"><i class="fa-solid fa-video"></i></span><span><strong>亞東醫院 Health Online</strong><small>了解遠距健康諮詢服務</small><em>查看服務介紹</em></span><i class="fa-solid fa-arrow-up-right-from-square"></i></a></section>';
    let articleRendered=false;
    const select=name=>{
      const p=new URLSearchParams(location.search);p.set('tab',name);history.replaceState(null,'',location.pathname+'?'+p);
      document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
      document.getElementById('p2-places-panel').hidden=name!=='places';
      document.getElementById('p2-articles-panel').hidden=name!=='articles';
      if(name==='places')renderPlaces();else if(!articleRendered){renderArticles();articleRendered=true;}
    };
    document.querySelectorAll('[data-tab]').forEach(b=>{
      b.onclick=()=>select(b.dataset.tab);
      b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...document.querySelectorAll('[data-tab]')];const target=buttons[e.key==='Home'?0:e.key==='End'?1:1-buttons.indexOf(b)];select(target.dataset.tab);target.focus();}};
    });
    select(tab);GH.scene('explore');
  }
  function renderArticles() {
    const articles = [...(window.GH_ARTICLES || [])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''),'zh-TW'));
    const recommendedTopics = new Set([44, 33, 16, 27, 39, 43, 8, 49]);
    const recommended = articles.filter(a => recommendedTopics.has(Number(a.id))).sort((a, b) => recommendScore(b) - recommendScore(a));
    const recommendedIds = new Set(recommended.map(a => a.id));
    const cats = ['推薦', '全部', '動腦與記憶', '心情與睡眠', '活動與身體', '心血管與健康知識'];
    let cat = '推薦'; let query = ''; let shown = 10;
    const panel = document.getElementById('p2-articles-panel');
    panel.innerHTML = '<div class="p2-section-head"><h2>健康文章</h2></div><label class="sr-only" for="p2-article-search">搜尋健康文章</label><input class="p2-input" id="p2-article-search" type="search" placeholder="搜尋標題、主題或科別"><div class="p2-pill-row p2-article-filters" id="p2-article-filters"></div><div id="p2-article-list"></div>';
    const draw = () => {
      document.getElementById('p2-article-filters').innerHTML = cats.map(c => '<button data-cat="' + c + '" class="' + (c === cat ? 'active' : '') + '">' + c + '</button>').join('');
      const base = cat === '推薦' ? recommended : articles.filter(a => cat === '全部' || GH.articleCategory(a) === cat);
      const found = base.filter(a => !query || [a.title, a.department, ...(a.tags || [])].join(' ').toLowerCase().includes(query));
      document.getElementById('p2-article-list').innerHTML = found.length ? '<p class="p2-subtle">共 ' + found.length + ' 篇</p><div class="p2-list">' + found.slice(0, shown).map((a,index) => '<a data-article="' + esc(a.id) + '" class="p2-article-card" href="article.html?id=' + encodeURIComponent(a.id) + '">' + '<span><strong>' + esc(a.title) + '</strong><small>亞東醫院 · ' + esc(a.department) + ' · ' + esc(a.date) + '</small>' + (cat==='推薦'&&index<3?'<em class="hot">熱門</em>':recommendedIds.has(a.id) ? '<em>推薦</em>' : '') + '</span></a>').join('') + '</div>' + (shown < found.length ? '<button id="p2-more-articles" class="p2-secondary full" style="margin-top:14px">載入更多文章</button>' : '') : '<div class="p2-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>找不到符合的文章</h3><p>試試其他關鍵字或分類。</p></div>';
      document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { cat = b.dataset.cat; shown = 10; draw(); });
      panel.querySelectorAll('[data-article]').forEach(b=>b.onclick=e=>{e.preventDefault();articlePopup(articles.find(a=>String(a.id)===b.dataset.article));});
      const more = document.getElementById('p2-more-articles'); if (more) more.onclick = () => { shown += 10; draw(); };
    };
    document.getElementById('p2-article-search').oninput = e => { query = e.target.value.trim().toLowerCase(); shown = 10; draw(); };
    draw();
  }
  function renderPlaces() { window.GH_PLACES?.render(); }
  function articlePopup(a) {
    if(!a)return;
    GH.sheet(a.title,'<p class="p2-article-meta">亞東醫院 · '+esc(a.department)+'</p><p>'+esc(a.summary || '前往亞東醫院閱讀這篇健康文章，了解相關健康知識。')+'</p><div class="p2-actions"><a class="p2-primary" href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer">前往閱讀</a><button id="p2-share-article" class="p2-secondary">分享到健康圈</button></div>');
    document.getElementById('p2-share-article').onclick=()=>{
      if(!GH.state.group)return GH.sheet('加入健康圈','<p>加入健康圈後，就能分享文章。</p><a class="p2-primary full" href="group.html">前往健康圈</a>');
      GH.sheet('確認分享文章','<form id="p2-article-share-form" class="p2-form"><p><strong>'+esc(a.title)+'</strong><br>來源：亞東醫院</p><label>想說的話（選填）<textarea name="note" maxlength="200"></textarea></label><button class="p2-primary full">確認分享到健康圈</button></form>');
      document.getElementById('p2-article-share-form').onsubmit=e=>{e.preventDefault();e.target.querySelector('button').disabled=true;const note=String(new FormData(e.target).get('note')).trim();GH.set(s=>s.posts.unshift({id:String(Date.now()),author:'我',time:'剛剛',createdAt:new Date().toISOString(),kind:'文章分享',text:(note?note+'\n':'')+a.title+'\n來源：亞東醫院',url:a.url,comments:[],likes:0}));GH.closeSheet();GH.toast('已分享至健康圈');};
    };
  }
  function renderArticle() {
    const params=new URLSearchParams(location.search);params.set('tab','articles');history.replaceState(null,'','article.html?'+params);
    renderExplore();
    const a=(window.GH_ARTICLES||[]).find(x=>String(x.id)===new URLSearchParams(location.search).get('id'));
    articlePopup(a);
  }
  document.addEventListener('DOMContentLoaded', () => { const page = document.body.dataset.page; if (page === 'explore') renderExplore(); else if (page === 'article') renderArticle(); else if (page === 'ai') renderAI(); });
})();
