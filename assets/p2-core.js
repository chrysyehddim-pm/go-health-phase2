(function () {
  'use strict';
  const KEY = 'gohealth_p2_prototype_v1';
  const dateAgo = days => { const d = new Date(); d.setDate(d.getDate() - days); return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }); };
  const sampleGames = ['眼力極限考驗', '生活好時光', '24H 一日店長', '家事達人', '健康小學堂', '幸福柑仔店'];
  const sampleHistory = () => Array.from({ length: 100 }, (_, i) => ({ id: 'game-' + i, title: sampleGames[i % sampleGames.length], date: dateAgo(Math.floor(i * 89 / 99)), points: i % sampleGames.length === 5 ? 200 : i % sampleGames.length === 4 ? 50 : 100, kind: '個人任務' }));
  const fresh = () => ({
    records: [
      { id: 'r1', type: 'steps', value: 6240, date: dateAgo(0), source: '手機健康資料' },
      { id: 'r2', type: 'sleep', value: 7.2, date: dateAgo(0), source: '手機健康資料' },
      { id: 'r3', type: 'weight', value: 62.4, date: dateAgo(2), source: '手動紀錄' }
    ],
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
  state.gameHistory ||= sampleHistory();
  state.notifications ||= fresh().notifications;
  state.pointAwards ||= [];
  state.taskClaims ||= [];
  if (!Object.hasOwn(state, 'group')) state.group = null;
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const set = updater => { updater(state); save(); document.dispatchEvent(new CustomEvent('gh:state')); };
  const format = value => Number(value || 0).toLocaleString('zh-TW');
  const navItems = [
    ['index.html', '首頁', 'fa-house'],
    ['group.html', '健康圈', 'fa-users'],
    ['activities.html', '任務', 'fa-list-check'],
    ['health.html', '紀錄', 'fa-chart-line'],
    ['explore.html', '探索', 'fa-compass']
  ];
  function shell(active, title) {
    const header = document.getElementById('p2-header');
    const nav = document.getElementById('p2-nav');
    if (header) {
      header.innerHTML = '<header class="p2-header"><a href="index.html" aria-label="返回首頁"><img alt="GO HEALTH" src="images/logo.png"></a></header>';
      document.body.classList.add('p2-large');
    }
    if (nav) nav.innerHTML = '<nav class="bottom-nav p2-bottom-nav" aria-label="主要導覽">' + navItems.map(item =>
      '<a class="nav-btn ' + (active === item[1] ? 'active' : '') + '" ' + (active === item[1] ? 'aria-current="page"' : '') + ' href="' + item[0] + '"><i class="fa-solid ' + item[2] + '" aria-hidden="true"></i><span>' + item[1] + '</span></a>'
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
    document.body.classList.add('modal-open');
    overlay.querySelector('[data-close-sheet]').focus();
    return overlay;
  }
  function closeSheet() {
    const overlay = document.getElementById('p2-sheet');
    if (overlay) overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
  }
  function latest(type) {
    return state.records.filter(r => r.type === type).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
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
  window.GH = { state, fresh, set, save, escape, format, shell, toast, sheet, closeSheet, latest, metric, articleCategory, pointBalance, KEY };
})();
