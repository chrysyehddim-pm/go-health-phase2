(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const types = [['steps', 'fa-shoe-prints'], ['sleep', 'fa-moon'], ['heart', 'fa-heart-pulse'], ['exercise', 'fa-person-running'], ['weight', 'fa-weight-scale']];
  const moods = [['開心','happy'],['平靜','calm'],['疲倦','tired'],['焦慮','anxious'],['低落','low']];
  const moodArt = mood => GH.art('mood-' + (moods.find(x=>x[0]===mood)?.[1] || 'calm'));
  const query = () => new URLSearchParams(location.search);
  const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  function render() {
    GH.shell('紀錄', '健康紀錄');
    if (query().get('metric')) return renderMetric(query().get('metric'));
    if (query().get('view') === 'mood') return renderMood();
    renderOverview();
    if (GH.state.device === 'connected') updateData();
  }
  function metricCard(type, fa) {
    const r = GH.latest(type);
    return '<a class="p2-metric p2-metric-link ' + (type === 'weight' ? 'p2-weight-metric' : '') + '" href="health.html?metric=' + type + '"><span class="label">' + GH.art(type) + ' ' + GH.metric(type).name + '</span><span class="value">' + (r ? GH.format(r.value) : '—') + '<small>' + (r ? GH.metric(type).unit : '') + '</small></span><span class="p2-metric-meta">' + (r ? (type === 'weight' ? '最近量測 · ' : '') + esc(r.date) : '尚無可用資料') + ' <i class="fa-solid fa-chevron-right"></i></span></a>';
  }
  let moodShown=10;
  function recordHeader(mood=false) {
    return '<section><p class="p2-eyebrow">留給自己的時間</p><h1 class="p2-page-title">紀錄</h1><p class="p2-lead">照顧身體，也留意自己的心情。</p></section><nav class="p2-segment p2-primary-tabs p2-record-tabs" aria-label="紀錄分類"><a href="health.html" class="'+(!mood?'active':'')+'" '+(!mood?'aria-current="page"':'')+'>健康指標</a><a href="health.html?view=mood" class="'+(mood?'active':'')+'" '+(mood?'aria-current="page"':'')+'>心情紀錄</a></nav>';
  }
  function renderOverview() {
    const connected = GH.state.device === 'connected';
    const guideTip = !connected && GH_GUIDE.tip('records') ? GH_GUIDE.tipCard('records', '先連接，再查看自己的健康變化', '選擇同意讀取的健康資料；手機有對應紀錄時，這裡才會顯示數值。') : '';
    const deviceCard='<section class="p2-card p2-device-card"><div class="p2-row start">' + GH.art('connect') + '<div><h2>' + (connected ? '已連接 HAPPY GO App' : '連接 HAPPY GO 健康資料') + '</h2><p>' + (connected ? '從 HAPPY GO App 更新你同意讀取的健康資料。' : '選擇同意讀取的項目，查看自己的健康變化。') + '</p></div></div><p id="p2-sync-status" class="p2-sync-status" role="status">' + syncLabel() + '</p><button id="p2-device" class="p2-primary full">' + (connected ? '管理資料連接' : '連接健康資料') + '</button>' + '</section>';
    main().innerHTML=recordHeader() + guideTip + (connected ? '<section class="p2-sync-toolbar"><p id="p2-sync-status" role="status">'+syncLabel()+'</p><button id="p2-update" class="p2-secondary">更新資料</button></section>' : deviceCard) + '<section><div class="p2-section-head"><h2>健康指標</h2><span class="p2-subtle">授權資料</span></div><div class="p2-metric-grid">' + types.map(([type, fa]) => metricCard(type, fa)).join('') + '</div></section>' + '<section><div class="p2-section-head"><h2>腦健康成果</h2></div><a class="p2-home-link" href="records.html">' + GH.art('brain') + '<span><strong>遊戲與表現紀錄</strong><small>回顧近期挑戰與成就</small></span><i class="fa-solid fa-chevron-right"></i></a></section>' + (connected?deviceCard.replace('id="p2-sync-status"','class="p2-sync-status"'):'') + '<section class="p2-privacy"><span>健康資料與心情由你管理，不會自動分享到健康圈。</span></section>';
    document.getElementById('p2-device').onclick = deviceSheet;
    const update = document.getElementById('p2-update');
    if (update) update.onclick = updateData;
    GH_GUIDE.bind(main());
    GH.scene('records');
  }
  function syncLabel() {
    if (GH.state.healthSync === 'syncing') return '正在更新健康資料…';
    if (GH.state.healthSync === 'error') return '更新未完成，請重試。前次資料仍保留。';
    if (GH.state.healthUpdatedAt) return '上次更新：' + new Date(GH.state.healthUpdatedAt).toLocaleString('zh-TW', {timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    return '資料依你同意的項目與手機健康紀錄顯示。';
  }
  async function updateData() {
    const update = document.getElementById('p2-update');
    if (update) { update.disabled = true; update.textContent = '正在更新…'; }
    const status = document.getElementById('p2-sync-status');
    if (status) status.textContent = '正在更新健康資料…';
    const success = await GH.syncHealthData();
    renderOverview();
    if (success === null) return;
    GH.toast(success ? '健康資料已更新' : '更新未完成，請稍後重試');
  }
  const metricHelp = type => ({steps:'來自手機或活動裝置的步數紀錄。',sleep:'來自穿戴裝置或健康 App 的睡眠紀錄。',heart:'來自支援量測心率的裝置或 App。',exercise:'來自運動 App 或裝置的運動紀錄。',weight:'來自相容體重計，或在手機健康 App 手動記錄的量測。'})[type];
  function deviceSheet() {
    const connected = GH.state.device === 'connected';
    GH.sheet(connected ? '管理健康資料' : '連接 HAPPY GO 健康資料', '<div class="p2-connection-intro">' + GH.art('connect') + '<p>透過 HAPPY GO App，讀取你選擇的健康資料。</p></div><div class="p2-info-list"><p><strong>1. 選擇同意讀取的項目</strong><br>步數、睡眠、心率、運動與體重，可逐項選擇。</p><p><strong>2. 在 HAPPY GO App 確認權限</strong><br>若需要，App 會引導你完成手機健康資料授權。</p><p><strong>3. 查看資料與更新時間</strong><br>有授權且來源有紀錄時，才會顯示數值。也可以手動更新。</p></div><div class="p2-actions"><button id="p2-device-action" class="p2-primary">' + (connected ? '調整讀取項目' : '繼續') + '</button>' + (connected ? '<button id="p2-disconnect" class="p2-secondary">中斷連接</button>' : '') + '</div>');
    document.getElementById('p2-device-action').onclick = permissionForm;
    const disconnect = document.getElementById('p2-disconnect');
    if (disconnect) disconnect.onclick = () => { GH.cancelHealthSync(); GH.set(s => {s.device='disconnected';s.records=[];s.healthConsent=false;s.healthPreferences=[];s.healthUpdatedAt=null;s.healthSync=null;});GH.closeSheet();renderOverview();GH.toast('已中斷資料連接');};
  }
  function permissionForm() {
    const connected = GH.state.device === 'connected';
    const allSelected = types.every(([type])=>GH.state.healthPreferences.includes(type));
    GH.sheet('選擇健康資料項目', '<form id="p2-permissions-form" class="p2-form"><p>選擇允許 GO HEALTH 從 HAPPY GO App 讀取的項目。</p><fieldset class="p2-health-choices"><legend>同意讀取的資料</legend><label class="p2-health-choice p2-health-choice-all"><input type="checkbox" id="p2-health-select-all"' + (allSelected?' checked':'') + '><span class="p2-select-all-icon"><i class="fa-solid fa-check-double"></i></span><span><strong>全部選取</strong><small>一次同意讀取下列全部健康資料。</small></span></label>' + types.map(([type])=>'<label class="p2-health-choice"><input type="checkbox" name="healthType" value="' + type + '"' + (GH.state.healthPreferences.includes(type)?' checked':'') + '>' + GH.art(type) + '<span><strong>' + GH.metric(type).name + '</strong><small>' + metricHelp(type) + '</small></span></label>').join('') + '</fieldset><div class="p2-privacy"><i class="fa-solid fa-lock"></i><span>只讀取所選項目，不修改手機健康紀錄。資料也用於共同任務完成判定；圈內只顯示任務進度，不公開原始數值。</span></div><p class="p2-small p2-muted">同意讀取不代表手機已有資料。日後新增讀取項目時，會再請你確認。</p><div class="p2-actions"><button id="p2-confirm-health" class="p2-primary" disabled>' + (connected?'儲存並更新':'同意並連接') + '</button><button type="button" class="p2-secondary" data-close-sheet>暫時不要</button></div></form>');
    const form = document.getElementById('p2-permissions-form');
    const selectAll = document.getElementById('p2-health-select-all');
    const choices = [...form.querySelectorAll('[name=healthType]')];
    const refresh = () => {
      const selected = choices.filter(input=>input.checked).length;
      selectAll.checked = selected === choices.length;
      selectAll.indeterminate = selected > 0 && selected < choices.length;
      document.getElementById('p2-confirm-health').disabled = selected === 0;
    };
    selectAll.onchange = () => { choices.forEach(input=>{input.checked=selectAll.checked;}); refresh(); };
    choices.forEach(input=>input.addEventListener('change',refresh));refresh();
    form.onsubmit = async e => {
      e.preventDefault();
      const selected = new FormData(form).getAll('healthType').filter(t=>types.some(x=>x[0]===t));
      if (!selected.length) return;
      const button = document.getElementById('p2-confirm-health');button.disabled=true;button.textContent='正在更新…';
      GH.cancelHealthSync();
      GH.set(s=>{s.healthPreferences=selected;s.healthConsent=true;s.records=s.records.filter(r=>selected.includes(r.type));});
      const success = await GH.syncHealthData();
      if (success === null) return;
      GH.closeSheet();renderOverview();GH.toast(success?'健康資料已更新':'更新未完成，請重試');
    };
  }
  function chart(records, type) {
    const values = records.map(r => Number(r.value));
    if (!values.length) return '<div class="p2-empty"><i class="fa-solid fa-chart-line"></i><h3>尚無這段期間的紀錄</h3><p>更新資料後，就能查看變化。</p></div>';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    const points = values.map((v, i) => [22 + i * 276 / Math.max(values.length - 1, 1), 126 - (v - min) / span * 92]);
    return '<div class="p2-chart"><svg viewBox="0 0 320 150" role="img" aria-label="' + GH.metric(type).name + '趨勢折線圖"><line x1="20" y1="127" x2="300" y2="127" stroke="#dce9e7"/><polyline fill="none" stroke="#159365" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="' + points.map(p => p.join(',')).join(' ') + '"/>' + points.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#159365"/>').join('') + '</svg><div class="p2-chart-labels"><span>' + esc(records[0].date) + '</span><span>' + esc(records[records.length - 1].date) + '</span></div></div>';
  }
  function renderMetric(type) {
    if (!types.some(x => x[0] === type)) { location.href = 'health.html'; return; }
    let days = Number(query().get('days') || 7);
    if (![7, 30, 90].includes(days)) days = 7;
    const cutoff = new Date(Date.now() - (days - 1) * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const records = GH.state.records.filter(r => GH.state.device === 'connected' && GH.state.healthPreferences.includes(type) && r.type === type && r.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
    const latest = records[records.length - 1] || GH.latest(type);
    main().innerHTML = '<section><a class="p2-text-link" href="health.html"><i class="fa-solid fa-arrow-left"></i> 返回紀錄</a><p class="p2-eyebrow" style="margin-top:18px">健康指標</p><h1 class="p2-page-title">' + GH.metric(type).name + '</h1><p class="p2-lead">查看數值與最近的變化。</p></section><section class="p2-card"><span class="p2-subtle">' + (type === 'weight' ? '最近一次量測' : '最新紀錄') + '</span><div class="p2-detail-value">' + (latest ? GH.format(latest.value) : '—') + ' <small>' + GH.metric(type).unit + '</small></div><p class="p2-small p2-muted">' + (latest ? esc(latest.date) + ' · ' + esc(latest.source) : '尚無紀錄') + '</p>' + (!latest ? '<div class="p2-metric-guidance"><p>' + metricHelp(type) + '</p><p>同意讀取且手機健康平台有紀錄後，才會顯示資料。</p><button id="p2-metric-access" class="p2-secondary">管理資料讀取</button></div>' : '') + (type === 'weight' ? '<p class="p2-small p2-muted">體重依量測日期顯示，並非每天都有新資料。</p>' : '') + '</section><section><div class="p2-segment">' + [7, 30, 90].map(d => '<a class="' + (d === days ? 'active' : '') + '" href="health.html?metric=' + type + '&days=' + d + '">近 ' + d + ' 天</a>').join('') + '</div><div class="p2-card" style="margin-top:12px">' + chart(records, type) + '</div></section><section><div class="p2-section-head"><h2>紀錄明細</h2></div><div class="p2-list">' + [...records].reverse().slice(0, 100).map(r => '<div class="p2-list-card"><span class="body"><strong>' + GH.format(r.value) + ' ' + GH.metric(type).unit + '</strong><small>' + esc(r.date) + ' · ' + esc(r.source) + '</small></span></div>').join('') + '</div></section>';

    const access = document.getElementById('p2-metric-access');if(access) access.onclick=deviceSheet;
  }
  function renderMood() {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    const iso = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const allEntries = [...GH.state.moods.map(x => ({ ...x, mood: x.value, note: x.note || '' })), ...GH.state.diaries.map(x => ({ ...x, mood: '', note: x.value }))].filter(x => x.date >= iso).sort((a, b) => (b.date+' '+(b.time||'00:00')).localeCompare(a.date+' '+(a.time||'00:00')));
    const entries = allEntries.slice(0, 100);
    const thirtyDaysAgo = new Date(Date.now()-29*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
    const recentMood = allEntries.filter(x=>x.mood&&x.date>=thirtyDaysAgo);
    const moodDays=[...recentMood.reduce((map,item)=>{if(!map.has(item.date))map.set(item.date,[]);map.get(item.date).push(item);return map;},new Map())].map(([date,items])=>({date,items,latest:items[0]}));
    const moodCount = moods.map(([label,key])=>({label,key,count:moodDays.filter(x=>x.latest.mood===label).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count);
    const balls = moodDays.slice().reverse().map((day,i)=>'<button class="p2-mood-ball mood-'+esc(moods.find(m=>m[0]===day.latest.mood)?.[1]||'calm')+'" data-mood-date="'+esc(day.date)+'" style="--ball-index:'+i+'" aria-label="'+esc(day.date+' '+day.latest.mood+(day.items.length>1?'，共 '+day.items.length+' 筆':''))+'">'+moodArt(day.latest.mood)+(day.items.length>1?'<span class="p2-mood-count">'+day.items.length+'</span>':'')+'</button>').join('');
    const density=moodDays.length>20?'high':moodDays.length>12?'medium':'low';
    const jar = '<section class="p2-card p2-mood-jar"><div class="p2-section-head"><div><p class="p2-eyebrow">近 30 天</p><h2>我的心情罐</h2></div><span class="p2-subtle">'+moodDays.length+' 天 · '+recentMood.length+' 筆</span></div><p>'+(moodCount[0]?'近 30 天有 '+moodDays.length+' 天留下心情，共 '+recentMood.length+' 筆紀錄。最常出現的是「'+esc(moodCount[0].label)+'」。':'每天會留下最近一筆心情球；同一天的其他紀錄也會完整保留。')+'</p><div class="p2-jar-stage density-'+density+'"><img class="p2-jar-art" src="images/illustrations/mood-jar.webp" alt="" aria-hidden="true"><div class="p2-jar-balls">'+(balls||'<div class="p2-jar-empty">今天的第一顆心情球，等你放進來</div>')+'</div></div><div class="p2-mood-legend">'+moodCount.map(x=>'<span>'+moodArt(x.label)+esc(x.label)+' '+x.count+' 天</span>').join('')+'</div></section>';
    main().innerHTML = recordHeader(true) + jar + '<section><button id="p2-add-mood" class="p2-primary full"><i class="fa-solid fa-pen"></i> 記下今天</button></section><section><div class="p2-section-head"><h2>最近三個月</h2><span class="p2-subtle">' + entries.length + '／100 筆</span></div>' + (entries.length ? '<div class="p2-journal-list">' + entries.slice(0,moodShown).map(x => '<article class="p2-card"><div class="p2-row"><strong>' + esc(x.date) + (x.time?' '+esc(x.time):'') + '</strong>' + (x.mood ? '<span class="p2-journal-mood">' + moodArt(x.mood) + '<span>' + esc(x.mood) + '</span></span>' : '') + '</div>' + (x.note ? '<p>' + esc(x.note) + '</p>' : '') + (x.mood?'<div class="p2-journal-actions"><button class="p2-text-button" data-edit-mood="'+esc(x.id)+'"><i class="fa-solid fa-pen"></i> 編輯</button><button class="p2-text-button" data-share-diary="'+esc(x.id)+'">'+(GH.state.posts.some(p=>p.diaryId===x.id)?'已分享 · 再次分享':'分享到健康圈')+'</button></div>':'')+'</article>').join('') + '</div>' : '<div class="p2-empty">' + GH.art('journal') + '<h3>還沒有心情日記</h3><p>從今天的一句話開始。</p></div>') + '</section>';
    if(entries.length>moodShown)main().insertAdjacentHTML('beforeend','<button id="p2-more-moods" class="p2-secondary full">載入更多心情紀錄</button>');
    document.getElementById('p2-more-moods')?.addEventListener('click',()=>{moodShown+=10;renderMood();});
    main().querySelectorAll('[data-share-diary]').forEach(b=>b.onclick=()=>GH.family.shareDiary(b.dataset.shareDiary,renderMood));
    main().querySelectorAll('[data-edit-mood]').forEach(b=>b.onclick=()=>moodForm(GH.state.moods.find(x=>x.id===b.dataset.editMood)));
    main().querySelectorAll('[data-mood-date]').forEach(b=>b.onclick=()=>openMoodDay(b.dataset.moodDate));
    document.getElementById('p2-add-mood').onclick = ()=>moodForm();
    GH.scene('records');
  }
  function openMood(id){
    const entry=GH.state.moods.find(x=>x.id===id);if(!entry)return;
    GH.sheet(entry.date+' 的心情','<div class="p2-mood-detail">'+moodArt(entry.value)+'<h3>'+esc(entry.value)+'</h3><p class="p2-subtle">'+esc(entry.date)+(entry.time?' '+esc(entry.time):'')+'</p>'+(entry.note?'<p>'+esc(entry.note)+'</p>':'<p class="p2-muted">這天沒有留下文字。</p>')+'<div class="p2-actions"><button id="p2-edit-open-mood" class="p2-secondary">編輯日記</button><button id="p2-share-open-mood" class="p2-primary">分享到健康圈</button></div></div>');
    document.getElementById('p2-edit-open-mood').onclick=()=>moodForm(entry);document.getElementById('p2-share-open-mood').onclick=()=>GH.family.shareDiary(id,renderMood);
  }
  function openMoodDay(date){
    const items=GH.state.moods.filter(x=>x.date===date).sort((a,b)=>(b.time||'00:00').localeCompare(a.time||'00:00'));
    if(!items.length)return;
    if(items.length===1)return openMood(items[0].id);
    GH.sheet(date+' 的心情','<p class="p2-subtle">這天共留下 '+items.length+' 筆心情紀錄，心情罐以最後一筆代表當天。</p><div class="p2-mood-day-list">'+items.map(entry=>'<article class="p2-card"><div class="p2-row"><span class="p2-journal-mood">'+moodArt(entry.value)+'<strong>'+esc(entry.value)+'</strong></span><time>'+esc(entry.time||'')+'</time></div>'+(entry.note?'<p>'+esc(entry.note)+'</p>':'<p class="p2-muted">沒有留下文字。</p>')+'<div class="p2-journal-actions"><button class="p2-text-button" data-day-edit="'+esc(entry.id)+'"><i class="fa-solid fa-pen"></i> 編輯</button><button class="p2-text-button" data-day-share="'+esc(entry.id)+'">分享到健康圈</button></div></article>').join('')+'</div>');
    document.querySelectorAll('[data-day-edit]').forEach(button=>button.onclick=()=>moodForm(GH.state.moods.find(x=>x.id===button.dataset.dayEdit)));
    document.querySelectorAll('[data-day-share]').forEach(button=>button.onclick=()=>GH.family.shareDiary(button.dataset.dayShare,renderMood));
  }
  function moodForm(existing=null) {
    const now = new Date().toLocaleTimeString('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false});
    GH.sheet(existing?'編輯心情日記':'記下今天', '<form id="p2-mood-form" class="p2-form"><fieldset class="p2-mood-choices"><legend>今天的心情</legend>' + moods.map(([label,key])=>'<label class="p2-mood-choice"><input type="radio" name="mood" value="' + label + '" required'+(existing?.value===label?' checked':'')+'>' + GH.art('mood-'+key) + '<span>' + label + '</span><i class="fa-solid fa-check" aria-hidden="true"></i></label>').join('') + '</fieldset><label>記錄時間<input type="time" name="time" value="'+esc(existing?.time||now)+'" required></label><label>想記下什麼？<textarea name="note" maxlength="500" placeholder="寫下今天的一件小事">'+esc(existing?.note||'')+'</textarea></label><button id="p2-save-mood" class="p2-primary full"'+(existing?'':' disabled')+'>'+(existing?'儲存修改':'儲存心情日記')+'</button></form>');
    const form=document.getElementById('p2-mood-form');
    form.onchange=()=>{document.getElementById('p2-save-mood').disabled=!form.querySelector('[name=mood]:checked');};
    form.onsubmit = e => {
      e.preventDefault();const f=new FormData(form),mood=String(f.get('mood'));
      if(!moods.some(x=>x[0]===mood))return;
      document.getElementById('p2-save-mood').disabled=true;
      const id=existing?.id||crypto.randomUUID();GH.set(s=>{const row=s.moods.find(x=>x.id===id),next={id,value:mood,note:String(f.get('note')||'').trim(),date:existing?.date||today(),time:String(f.get('time')||'')};if(row)Object.assign(row,next);else s.moods.push(next);});
      GH.closeSheet();renderMood();if(existing)return GH.toast('心情日記已更新');GH.sheet('心情日記已儲存','<p>這篇日記只會保留在你的私人紀錄。若想讓家人看見，可以先預覽再分享到健康圈。</p><div class="p2-actions"><button id="p2-share-saved-diary" class="p2-primary">預覽並分享</button><button class="p2-secondary" data-close-sheet>完成</button></div>');document.getElementById('p2-share-saved-diary').onclick=()=>GH.family.shareDiary(id,renderMood);
    };
  }
  document.addEventListener('DOMContentLoaded', render);
})();



