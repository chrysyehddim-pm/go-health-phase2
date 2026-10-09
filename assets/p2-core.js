(function () {
  'use strict';
  const KEY = 'gohealth_p2_prototype_v3';
  const dateAgo = days => { const d = new Date(); d.setDate(d.getDate() - days); return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }); };
  const sampleGames = ['眼力極限考驗', '生活好時光', '24H 一日店長', '家事達人', '健康小學堂', '幸福柑仔店'];
  const sampleHistory = () => Array.from({ length: 100 }, (_, i) => ({ id: 'game-' + i, title: sampleGames[i % sampleGames.length], date: dateAgo(Math.floor(i * 89 / 99)), points: i % sampleGames.length === 5 ? 200 : i % sampleGames.length === 4 ? 50 : 100, kind: '個人任務' }));
  const fresh = () => ({
    records: [],
    diaries: [],
    moods: [],
    device: 'disconnected',
    posts: [],
    group: null,
    notifications: [
      { id: 'welcome', title: '歡迎來到 GO HEALTH', detail: '從今天開始，記錄健康、探索生活。', read: false },
      { id: 'record', title: '看看最近的健康變化', detail: '你的健康紀錄已整理在「紀錄」頁。', read: false }
    ],
    circlePermissions: { posting: 'members' },
    shared: [],
    tasks: {},
    location: { permission: false, sharing: null },
    articleSaved: [],
    activityHistory: [],
    gameHistory: sampleHistory(),
    pointAwards: [],
    taskClaims: [],
    member: { isHappyGo: true, consent: false }
  });
  let state;
  try { state = Object.assign(fresh(), JSON.parse(sessionStorage.getItem(KEY) || '{}')); }
  catch (_) { state = fresh(); }
  const healthTypes = ['steps','sleep','heart','exercise','weight'];
  if (!Array.isArray(state.healthPreferences)) {
    state.healthPreferences = state.device === 'connected' ? [...new Set(['steps', ...state.records.map(r => r.type)])].filter(t => healthTypes.includes(t)) : [];
  }
  state.healthSchema = 'happygo-health-v2';
  state.gameHistory ||= sampleHistory();
  state.notifications ||= fresh().notifications;
  state.pointAwards ||= [];
  state.taskClaims ||= [];
  if (!Object.hasOwn(state, 'group')) state.group = null;
  if (state.group) {
    state.group.id ||= 'circle-' + crypto.randomUUID();
    state.activityHistory.filter(x=>!x.groupId&&x.groupName===state.group.name).forEach(x=>x.groupId=state.group.id);
  }
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const set = updater => { updater(state); rememberTaskCompletions(); save(); document.dispatchEvent(new CustomEvent('gh:state')); };
  const format = value => Number(value || 0).toLocaleString('zh-TW');
  const navItems = [
    ['index.html', '首頁', 'fa-house'],
    ['health.html', '紀錄', 'fa-chart-line'],
    ['group.html', '健康圈', 'fa-users'],
    ['activities.html', '任務', 'fa-list-check'],
    ['explore.html', '探索', 'fa-compass']
  ];
  function scene(name) {
    const app = document.getElementById('app-root');
    const main = document.getElementById('p2-main');
    if (!app || !main) return;
    app.classList.add('p2-scene-app');
    let hero = document.getElementById('p2-scene');
    if (!hero) {
      hero = document.createElement('div');
      hero.id = 'p2-scene';
      hero.className = 'p2-scene';
      app.insertBefore(hero, main);
      // The scroll viewport never changes size. The spacer scrolls away so the
      // sheet covers the hero without feeding scroll position back into layout.
      main.addEventListener('scroll', () => {
        const spacer = main.querySelector('.p2-scene-spacer');
        app.classList.toggle('p2-scene-collapsed', main.scrollTop >= (spacer?.offsetHeight || 1));
        positionSheetFrame();
      }, { passive: true });
    }
    hero.dataset.scene = name;
    if (!hero.querySelector('img') || hero.querySelector('img').dataset.name !== name) {
      hero.innerHTML = '<img data-name="' + name + '" src="images/scene/' + name + '.webp" alt="" fetchpriority="high">';
    }
    const greeting = main.querySelector('.p2-home-top');
    if (greeting) {
      hero.querySelector('.p2-home-top')?.remove();
      hero.appendChild(greeting);
    }
    if (!main.querySelector(':scope > .p2-sheet-content')) {
      const content = document.createElement('div');
      content.className = 'p2-sheet-content';
      while (main.firstChild) content.appendChild(main.firstChild);
      const spacer = document.createElement('div');
      spacer.className = 'p2-scene-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      main.append(spacer, content);
    }
    let frame = document.getElementById('p2-sheet-frame');
    if (!frame) {
      frame = document.createElement('div');
      frame.id = 'p2-sheet-frame';
      frame.className = 'p2-sheet-frame';
      frame.setAttribute('aria-hidden', 'true');
      app.appendChild(frame);
      window.addEventListener('resize', positionSheetFrame);
    }
    positionSheetFrame();
    function positionSheetFrame() {
      const frame = document.getElementById('p2-sheet-frame');
      if (!frame) return;
      const spacer = main.querySelector('.p2-scene-spacer');
      const offset = Math.max(0, (spacer?.offsetHeight || 0) - main.scrollTop);
      // Move only the decorative outline; the scroll viewport stays fixed.
      frame.style.transform = 'translateY(' + offset + 'px)';
    }
  }
  function taskCard(task, options = {}) {
    const count = options.count || 0;
    const href = options.href;
    const tag = href ? 'a' : 'article';
    const image = 'images/scene/' + (task.image || 'task-walk') + '.webp';
    return '<' + tag + ' class="p2-task-card p2-art-card ' + (href ? 'p2-illustrated-task' : '') + '"' + (href ? ' href="' + escape(href) + '"' : '') + '>' +
      '<div class="p2-card-art" aria-hidden="true"><img src="' + image + '" alt="" loading="lazy"></div>' +
      '<div class="p2-card-copy"><span class="p2-reward">+ ' + task.points + ' 健康點／人</span><h3>' + escape(task.title) + '</h3><p>' + escape(task.shortDetail || task.detail) + '</p></div>' +
      '<div class="p2-task-bottom"><span class="' + (options.joined ? '' : 'p2-task-join-hint') + '">' + (options.joined ? '已達成 ' + count + '／' + task.members + ' 人' : '加入健康圈完成任務') + '</span>' +
      (href ? '<span class="p2-task-link-label">查看任務 <i class="fa-solid fa-chevron-right"></i></span>' : '<button class="p2-text-button" data-task="' + task.id + '">' + (options.claimed ? '查看成果' : '查看任務') + ' <i class="fa-solid fa-chevron-right"></i></button>') + '</div></' + tag + '>';
  }
  function shell(active, title) {
    const header = document.getElementById('p2-header');
    const nav = document.getElementById('p2-nav');
    if (header) {
      header.innerHTML = '<header class="p2-header"><a href="index.html" aria-label="返回首頁"><img alt="GO HEALTH" src="images/logo.png"></a></header>';
      document.body.classList.add('p2-large');
    }
    if (nav) nav.innerHTML = '<nav class="bottom-nav p2-bottom-nav" aria-label="主要導覽">' + navItems.map(item =>
      '<a class="nav-btn ' + (active === item[1] ? 'active ' : '') + (item[1] === '健康圈' ? 'p2-nav-circle' : '') + '" ' + (active === item[1] ? 'aria-current="page"' : '') + ' href="' + item[0] + '"><i class="fa-solid ' + item[2] + '" aria-hidden="true"></i><span>' + item[1] + '</span></a>'
    ).join('') + '</nav>';
    document.title = title + '｜GO HEALTH';
  }
  function toast(message) {
    let node = document.getElementById('p2-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'p2-toast';
      node.className = 'p2-toast';
      node.setAttribute('role', 'status');
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove('visible'), 3200);
  }
  function sheet(title, html) {
    let overlay = document.getElementById('p2-sheet');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'p2-sheet';
      overlay.className = 'p2-overlay';
      overlay.innerHTML = '<div class="p2-sheet" role="dialog" aria-modal="true"><div class="p2-sheet-head"><h2 id="p2-sheet-title"></h2><button type="button" class="p2-icon-btn" data-close-sheet aria-label="關閉"><i class="fa-solid fa-xmark"></i></button></div><div id="p2-sheet-body"></div></div>';
      overlay.addEventListener('click', e => { if (e.target === overlay || e.target.closest('[data-close-sheet]')) closeSheet(); });
      document.body.appendChild(overlay);
    }
    document.getElementById('p2-sheet-title').textContent = title;
    document.getElementById('p2-sheet-body').innerHTML = html;
    overlay.classList.add('open');
    overlay.querySelector('.p2-sheet').scrollTop = 0;
    document.body.classList.add('modal-open');
    overlay.querySelector('[data-close-sheet]').focus();
    return overlay;
  }
  function closeSheet() {
    const overlay = document.getElementById('p2-sheet');
    if (overlay) overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }
  function rememberTaskCompletions() {
    if (!state.group || state.device !== 'connected' || !window.GH_DEMO) return;
    const cutoff = dateAgo(6);
    const has = (type,min) => state.records.some(r => r.type === type && r.value >= min && r.date >= cutoff && /裝置|手機/.test(r.source));
    window.GH_DEMO.tasks.forEach(t => {
      const self = t.type === 'both' ? has('steps',6000) && has('exercise',15) : has(t.type,t.min);
      const others = state.group.members.filter(m => m.name !== '我').filter(m => t.type === 'both' ? m.steps >= 6000 && m.exercise >= 15 : (m[t.type] || 0) >= t.min).length;
      if (!self || others + 1 < t.members) return;
      const found = state.activityHistory.find(x => (x.taskId === t.id || (!x.taskId && x.title === t.title)) && (x.groupId === state.group.id || (!x.groupId && (!x.groupName || x.groupName === state.group.name))));
      if (found) { found.taskId = t.id; found.groupId = state.group.id; found.groupName ||= state.group.name; found.status = state.taskClaims.includes(t.id) ? 'claimed' : (found.status || 'pending'); }
      else state.activityHistory.unshift({taskId:t.id,groupId:state.group.id,groupName:state.group.name,title:t.title,date:dateAgo(0),points:t.points,kind:'健康圈任務',status:state.taskClaims.includes(t.id)?'claimed':'pending'});
    });
  }
  let healthSyncRun = 0;
  function cancelHealthSync() { healthSyncRun++; }
  function art(name, cls = '') {
    return '<img class="p2-object-art ' + cls + '" src="images/scene/icon-' + escape(name) + '.webp" alt="" aria-hidden="true" loading="lazy">';
  }
  // Prototype adapter. Replace with the confirmed HAPPY GO native bridge contract.
  // Permission requests remain in the host App; this page never calls HealthKit directly.
  // Fixed local demonstration values; native bridge responses always take precedence.
  function demoHealthRecords(requested) {
    const series={steps:[6200,7100,6800,8200,7600,6500,7840],sleep:[7.2,6.8,7.5,7.1,6.9,7.6,7.3],heart:[72,70,74,71,69,73,72],exercise:[20,15,30,25,18,35,22]};
    const records=[];
    requested.forEach(type=>{
      if(type==='weight') [28,21,14,7,1].forEach((days,i)=>records.push({type,value:[65.4,65.2,65.3,65.1,65][i],date:dateAgo(days)}));
      else if(series[type])for(let days=29;days>=0;days--)records.push({type,value:series[type][(29-days)%7],date:dateAgo(days)});
    });
    return records;
  }
  async function syncHealthData() {
    const run = ++healthSyncRun;
    const requested = [...state.healthPreferences];
    set(s => { s.healthSync = 'syncing'; });
    try {
      let payload;
      if (window.HappyGoHealthBridge?.readHealthData) payload = await window.HappyGoHealthBridge.readHealthData({types:requested});
      else if (window.HappyGoHealthBridge?.readSteps && requested.includes('steps')) payload = await window.HappyGoHealthBridge.readSteps();
      else if (window.HappyGoHealthBridge) throw Error('Unsupported bridge');
      else payload = await new Promise(resolve => setTimeout(() => resolve({records:demoHealthRecords(requested)}),650));
      if (run !== healthSyncRun) return null;
      if (!payload || !Array.isArray(payload.records)) throw Error('Invalid bridge payload');
      const rows = payload.records.filter(r => requested.includes(r.type) && Number.isFinite(Number(r.value)) && Number(r.value) >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date));
      set(s => {
        s.records = rows.map(r=>({id:r.type+'-'+r.date,type:r.type,value:Number(r.value),date:r.date,source:'HAPPY GO App · 手機健康資料'}));
        s.device = 'connected'; s.healthSource = 'HAPPY GO App';
        s.healthUpdatedAt = new Date().toISOString(); s.healthSync = 'ready';
      });
      return true;
    } catch (_) {
      if (run !== healthSyncRun) return null;
      set(s => { s.healthSync = 'error'; });
      return false;
    }
  }
  function latest(type) {
    if (state.device !== 'connected' || !state.healthPreferences.includes(type)) return null;
    return state.records.filter(r=>r.type===type).sort((a,b)=>b.date.localeCompare(a.date))[0] || null;
  }
  function metric(type) {
    const names = { steps: '步數', exercise: '運動', sleep: '睡眠', heart: '心率', weight: '體重' };
    const units = { steps: '步', exercise: '分鐘', sleep: '小時', heart: '次／分', weight: '公斤' };
    return { name: names[type], unit: units[type] };
  }
  function articleCategory(a) {
    const t = a.tags.join(',');
    if (/失智|記憶|專注|巴金森|神經/.test(t)) return '動腦與記憶';
    if (/心理|焦慮|壓力|憂鬱|睡眠|情緒/.test(t)) return '心情與睡眠';
    if (/運動|復健|行動|骨科|疼痛/.test(t)) return '活動與身體';
    return '心血管與健康知識';
  }
  function pointBalance() {
    const earned = state.pointAwards.reduce((sum, item) => sum + Number(item.points || 0), 0);
    let used = 0;
    try {
      const exchanges = JSON.parse(sessionStorage.getItem('gohealth_p2_exchanges') || '[]');
      if (exchanges.length) used = exchanges.filter(x => x.status === 'success').reduce((sum, x) => sum + Number(x.healthPointsUsed || 0), 0);
      else { const last = JSON.parse(sessionStorage.getItem('gohealth_latest_exchange') || 'null'); if (last?.status === 'success') used = Number(last.healthPointsUsed || 0); }
    } catch (_) {}
    return 1200 + earned - used;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  window.GH = { state, fresh, set, save, escape, format, shell, scene, taskCard, toast, sheet, closeSheet, art, syncHealthData, syncSteps:syncHealthData, cancelHealthSync, rememberTaskCompletions, latest, metric, articleCategory, pointBalance, KEY };
})();
