(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const icon = name => '<span class="p2-icon blue"><i class="fa-solid ' + name + '"></i></span>';
  function adviceCard(item,result){
    const titles={steps_low:'今天，多走一小段',steps_keep:'把走動，留在每天的生活裡',sleep_low:'今晚，留點時間好好休息',sleep_keep:'睡得規律，也留意醒來的感受',exercise_low:'把活動分成幾次，慢慢累積',exercise_goal:'讓活動成為喜歡的日常',exercise_partial:'先肯定已經累積的活動',exercise_recorded:'照自己的體力，持續活動',heart_high:'先休息，再確認自己的狀況',heart_low:'留意和平常不同的心率紀錄',heart_keep:'認識自己的心率與身體感受',heart_context:'在安靜休息時，留下可比較的紀錄',weight_same:'固定量測，慢慢觀察變化',weight_change:'用相近的條件，觀察體重變化'};
    let lead='',message=item.message;
    const week=item.days===7?'最近一週':'最近一週有 '+item.days+' 天紀錄，';
    if(item.type==='steps')lead=week+'平均每天約 '+Math.round(item.average).toLocaleString('zh-TW')+' 步。';
    if(item.type==='sleep')lead=week+'平均睡眠約 '+item.average+' 小時。';
    if(item.type==='exercise')lead=item.equivalentMinutes===item.totalMinutes?'最近一週累積了 '+item.totalMinutes+' 分鐘中等強度活動。':'最近一週已記錄 '+item.totalMinutes+' 分鐘運動'+(item.equivalentMinutes!==null?'，中等強度活動等量約 '+Math.round(item.equivalentMinutes)+' 分鐘。':'，目前尚無運動強度資訊。');
    if(item.type==='heart'){
      if(item.rule==='heart_high'){lead='最近一週有 '+item.highDays+' 天靜息心率高於每分鐘 100 次。';message='先在安靜狀態下休息後再確認；若持續與平常不同，建議詢問醫療專業人員。';}
      else if(item.rule==='heart_low'){lead='最近一週有 '+item.lowDays+' 天靜息心率低於每分鐘 60 次。';message='運動習慣或藥物都可能影響數字。留意是否和平常不同，有疑問時請教醫療專業人員。';}
      else lead=item.restingDays>=3?'最近一週有 '+item.restingDays+' 天靜息心率紀錄。':'目前的心率紀錄還沒有足夠的靜息量測資訊。';
    }
    if(item.type==='weight'){lead='最近一次體重為 '+item.lastWeight+' 公斤，'+(item.weightDelta===0?'與這段期間最早的紀錄相同。':'較這段期間最早的紀錄'+(item.weightDelta>0?'增加 ':'減少 ')+Math.abs(item.weightDelta)+' 公斤。');message=item.weightDelta===0?'維持均衡飲食與規律活動，不必為了讓數字下降而刻意少吃。':item.message;}
    const end=new Date(new Date(result.end+'T12:00:00+08:00').getTime()-86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'}),short=d=>d.slice(5).replace('-','/');
    return '<article class="p2-advice-slide" aria-label="'+esc(GH.metric(item.type).name)+'建議"><div class="p2-advice-slide-heading">'+GH.art(item.type)+'<span>'+esc(GH.metric(item.type).name)+'小提醒</span></div><h2>'+esc(titles[item.rule])+'</h2><p class="p2-advice-observation">'+esc(lead)+'</p><p>'+esc(message)+'</p><footer>參考期間：'+short(result.start)+'–'+short(end)+' · '+(item.type==='heart'&&item.restingDays>=3?item.restingDays:item.days)+' 天有效紀錄</footer></article>';
  }
  async function renderAI() {
    GH.shell('首頁', '我的健康建議');
    const q=new URLSearchParams(location.search),review=q.get('adviceCase');
    if(review&&['none','partial','empty','short','triggered','maintain','error'].includes(review))GH.set(s=>GH_ADVICE.preview(s,review));
    const paint=()=>{
      const result=GH_ADVICE.compute(GH.state),sync=GH.state.healthSync;
      const ready=result.items.filter(i=>i.rule),ordered=result.selected?[result.selected,...ready.filter(i=>i!==result.selected)]:[];
      const slides=ordered.map(item=>adviceCard(item,result)).join('');
      main().innerHTML='<section><a class="p2-back-button" href="index.html">返回首頁</a><p class="p2-eyebrow" style="margin-top:18px">我的健康建議</p><h1 class="p2-page-title">給自己，一點生活上的照顧</h1><p class="p2-lead">'+(result.consent?'從最近的健康紀錄，找一件今天可以做的小事。':'照自己的步調，慢慢累積健康的日常。')+'</p></section>'+
       (review?'<details class="p2-card p2-advice-review"><summary>導覽專用：切換示範狀態</summary><label for="p2-advice-case">健康建議情境</label><select id="p2-advice-case">'+[['none','未授權'],['partial','部分授權'],['empty','授權但無資料'],['short','未滿三天'],['triggered','五項健康建議'],['maintain','維持習慣'],['error','更新失敗']].map(([key,name])=>'<option value="'+key+'" '+(key===review?'selected':'')+'>'+name+'</option>').join('')+'</select><small>此切換僅供團隊導覽示範。</small></details>':'')+
       (result.consent?'<section class="p2-sync-toolbar"><p role="status">'+(sync==='syncing'?'正在更新你同意讀取的資料…':sync==='error'?'更新未完成，以下依前次可用資料提供參考。':GH.state.healthUpdatedAt?'上次更新：'+esc(new Date(GH.state.healthUpdatedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})):'尚未更新健康資料')+'</p><button id="p2-advice-refresh" class="p2-secondary" '+(sync==='syncing'?'disabled':'')+'>'+(sync==='error'?'重新更新':'更新資料')+'</button></section>':'')+
       (slides?'<section class="p2-advice-carousel" aria-label="健康建議卡片"><p class="p2-advice-swipe-hint">左右滑動，看看其他建議</p><div class="p2-advice-stack"><div class="p2-advice-track" id="p2-advice-track" tabindex="0" aria-label="可左右滑動或使用方向鍵循環翻動建議卡片">'+slides+'</div></div><div class="p2-advice-controls"><button id="p2-advice-prev" class="p2-round-button" aria-label="上一張建議"><i class="fa-solid fa-chevron-left"></i></button><span id="p2-advice-position" role="status" aria-live="polite">1／'+ordered.length+' · '+esc(GH.metric(ordered[0].type).name)+'</span><button id="p2-advice-next" class="p2-round-button" aria-label="下一張建議"><i class="fa-solid fa-chevron-right"></i></button></div></section>':'<section class="p2-card tint p2-advice-generic"><img src="images/illustrations/health-advice.png" alt="" aria-hidden="true"><h2>今天，從一件小事開始</h2><p>'+esc(result.generic)+'</p><small>'+(result.consent?'目前紀錄還在累積中；各項指標至少有三天有效資料後，再提供對應的生活建議。':'尚未連接健康資料，目前提供日常生活小提醒。')+'</small></section>')+
       (!result.consent||result.partial?'<section class="p2-card p2-advice-connect"><h2>'+(result.partial?'依你願意分享的項目，照顧自己':'讓建議更貼近你的生活')+'</h2><p>'+(result.partial?'只使用你同意讀取的健康資料；其他項目不會被讀取，也不影響目前建議。':'連接你願意分享的健康資料，累積足夠紀錄後，就能查看對應的生活建議。')+'</p><a class="p2-primary" href="health.html">'+(result.partial?'管理資料連接':'連接健康資料')+'</a></section>':'')+
       '<a class="p2-secondary full" href="health.html">查看完整紀錄</a><section class="p2-privacy"><span>以上內容提供生活參考，不是醫療診斷。有健康疑慮時，請向醫療專業人員諮詢。</span></section>';
      const track=document.getElementById('p2-advice-track');
      if(track){
        const cards=[...track.children];let queue=[...cards],busy=false,gesture=null;
        const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
        const pose=depth=>'translateY('+Math.min(depth,2)*18+'px) scale('+(1-Math.min(depth,2)*.035)+') rotate('+(depth===0?0:depth===1?-1.6:1.6)+'deg)';
        const draw=()=>{
          if(!track.isConnected)return;
          queue.forEach((card,depth)=>{card.style.transform=pose(depth);card.style.zIndex=String(cards.length-depth);card.style.visibility=depth<3?'visible':'hidden';card.style.opacity='1';card.classList.remove('is-entering','is-returning');card.style.pointerEvents=depth===0?'auto':'none';card.dataset.depth=String(depth);card.setAttribute('aria-hidden',String(depth!==0));card.inert=depth!==0;track.appendChild(card);});
          const original=cards.indexOf(queue[0]);document.getElementById('p2-advice-position').textContent=(original+1)+'／'+cards.length+' · '+GH.metric(ordered[original].type).name;
          document.getElementById('p2-advice-prev').disabled=cards.length<2;document.getElementById('p2-advice-next').disabled=cards.length<2;track.setAttribute('aria-busy','false');
        };
        const move=async delta=>{
          if(busy||!track.isConnected||cards.length<2)return;
          busy=true;track.setAttribute('aria-busy','true');
          const animations=[];
          try{
            if(!reduced()){
              if(delta>0){
                // Move an opaque card out, lower it behind the deck, then return it.
                // Fading the entire card makes two sets of text overlap visibly.
                const top=queue[0],out='translateX(-48%) translateY(-8px) rotate(-10deg) scale(.96)';
                queue[1].classList.add('is-entering');
                const outgoing=top.animate([{transform:top.style.transform},{transform:out}],{duration:180,easing:'cubic-bezier(.35,0,.6,1)',fill:'forwards'});animations.push(outgoing);
                queue.slice(1,3).forEach((card,i)=>animations.push(card.animate([{transform:pose(i+1)},{transform:pose(i)}],{duration:360,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'})));
                await outgoing.finished.catch(()=>{});
                if(!track.isConnected)return;
                top.style.zIndex='0';top.classList.add('is-returning');top.style.transform=out;
                animations.push(top.animate([{transform:out},{transform:pose(Math.min(queue.length-1,2))}],{duration:180,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'}));
              }else{
                const incoming=queue[queue.length-1];incoming.style.visibility='visible';incoming.style.zIndex=String(cards.length+1);incoming.classList.add('is-entering');
                animations.push(incoming.animate([{transform:'translateX(44%) translateY(14px) rotate(9deg) scale(.92)'},{transform:pose(0)}],{duration:380,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'}));
                queue.slice(0,2).forEach((card,i)=>animations.push(card.animate([{transform:pose(i)},{transform:pose(i+1)}],{duration:380,easing:'cubic-bezier(.22,.7,.25,1)',fill:'forwards'})));
              }
              await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
            }
            if(!track.isConnected)return;
            if(delta>0)queue.push(queue.shift());else queue.unshift(queue.pop());
            draw();
          }finally{animations.forEach(a=>a.cancel());busy=false;if(track.isConnected)track.setAttribute('aria-busy','false');}
        };
        track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
        track.addEventListener('pointerdown',e=>{if(busy||cards.length<2||(e.pointerType==='mouse'&&e.button!==0))return;gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};});
        track.addEventListener('pointermove',e=>{
          if(!gesture||gesture.id!==e.pointerId||busy)return;
          const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
          if(!gesture.dragging&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
          if(!gesture.dragging&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.2){gesture.dragging=true;track.setPointerCapture(e.pointerId);}
          if(gesture.dragging&&!reduced())queue[0].style.transform='translateX('+Math.max(-70,Math.min(70,dx*.4))+'px) rotate('+Math.max(-7,Math.min(7,dx*.025))+'deg)';
        });
        const finish=e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dragging=gesture.dragging;gesture=null;if(dragging&&Math.abs(dx)>Math.max(44,track.clientWidth*.16))move(dx<0?1:-1);else draw();};
        track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',()=>{gesture=null;if(!busy)draw();});
        document.getElementById('p2-advice-prev').onclick=()=>move(-1);document.getElementById('p2-advice-next').onclick=()=>move(1);draw();
      }
      document.getElementById('p2-advice-refresh')?.addEventListener('click',async()=>{if(review){GH.set(s=>{GH_ADVICE.preview(s,review==='error'?'triggered':review);s.healthSync='ready';});paint();return;}const task=GH.syncHealthData();paint();await task;paint();});
      document.getElementById('p2-advice-case')?.addEventListener('change',e=>{location.href='ai.html?adviceCase='+encodeURIComponent(e.target.value);});
    };
    paint();
    if(!review&&GH.state.device==='connected'){const task=GH.syncHealthData();paint();await task;paint();}
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
      document.querySelector('.p2-hospital-services').hidden=name!=='articles'||!!family;
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
    // Fixed review ordering only; production uses the prior 30 complete Taipei days, daily deduplicated outgoing reads.
    const recommended = articles.filter(a => recommendedTopics.has(Number(a.id))).sort((a,b)=>Number(a.id)-Number(b.id));
    const recommendedIds = new Set(recommended.map(a => a.id));
    const cats = ['全部', '熱門', '動腦與記憶', '心情與睡眠', '活動與身體', '心血管與健康知識'];
    let cat = '全部'; let query = ''; let shown = 10;
    const panel = document.getElementById('p2-articles-panel');
    panel.innerHTML = '<div class="p2-section-head"><h2>健康文章</h2></div><label class="sr-only" for="p2-article-search">搜尋健康文章</label><input class="p2-input" id="p2-article-search" type="search" placeholder="搜尋標題、主題或科別"><div class="p2-pill-row p2-article-filters" id="p2-article-filters"></div><div id="p2-article-list"></div>';
    const draw = () => {
      document.getElementById('p2-article-filters').innerHTML = cats.map(c => '<button data-cat="' + c + '" class="' + (c === cat ? 'active' : '') + '">' + c + '</button>').join('');
      const base = cat === '熱門' ? recommended.slice(0,3) : articles.filter(a => cat === '全部' || GH.articleCategory(a) === cat);
      const found = base.filter(a => !query || [a.title, a.department, ...(a.tags || [])].join(' ').toLowerCase().includes(query));
      document.getElementById('p2-article-list').innerHTML = found.length ? '<p class="p2-subtle">'+(cat==='熱門'?'熱門排序為示意，正式依近 30 天閱讀次數每日更新。<br>':'')+'共 ' + found.length + ' 篇</p><div class="p2-list">' + found.slice(0, shown).map((a,index) => '<a data-article="' + esc(a.id) + '" class="p2-article-card" href="article.html?id=' + encodeURIComponent(a.id) + '">' + '<span><strong>' + esc(a.title) + '</strong><small>亞東醫院 · ' + esc(a.department) + ' · ' + esc(a.date) + '</small>' + (cat==='熱門'?'<em class="hot">熱門</em>':'') + '</span></a>').join('') + '</div>' + (shown < found.length ? '<button id="p2-more-articles" class="p2-secondary full" style="margin-top:14px">載入更多文章</button>' : '') : '<div class="p2-empty"><i class="fa-solid fa-magnifying-glass"></i><h3>找不到符合的文章</h3><p>試試其他關鍵字或分類。</p></div>';
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
    GH.sheet(a.title,'<p class="p2-article-meta">亞東醫院 · '+esc(a.department)+'</p><p>'+esc(a.summary || '前往亞東醫院閱讀這篇健康文章，了解相關健康知識。')+'</p><div class="p2-actions"><a id="p2-read-article" class="p2-primary" href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer">前往閱讀</a><button id="p2-share-article" class="p2-secondary">分享到健康圈</button></div>');
    document.getElementById('p2-read-article').onclick=()=>GH.set(s=>{const date=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});s.articleReads||=[];if(!s.articleReads.some(r=>r.id===String(a.id)&&r.date===date))s.articleReads.push({id:String(a.id),date});});
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
