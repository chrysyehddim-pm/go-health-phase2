(function () {
  'use strict';
  const GH = window.GH;
  const DATA = window.GH_DEMO;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  let view = 'list';
  let category = 'group';
  let shown = 20;
  let historyCategory = 'all';
  const recent = date => date && date >= new Date(Date.now() - 6 * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  function keyboardTabs(selector, attribute) {
    const buttons = [...document.querySelectorAll(selector)];
    buttons.forEach((button, index) => {
      button.tabIndex = button.getAttribute('aria-selected') === 'true' ? 0 : -1;
      button.onkeydown = e => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return;
        e.preventDefault();
        const next = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        const value = buttons[next].getAttribute(attribute);
        buttons[next].click();
        document.querySelector('[' + attribute + '="' + value + '"]')?.focus();
      };
    });
  }
  function selfHas(type, min) {
    return GH.state.device === 'connected' && GH.state.records.some(r => r.type === type && r.value >= min && recent(r.date) && /裝置|手機/.test(r.source));
  }
  function selfEligible(task) { return task.type === 'both' ? selfHas('steps', 6000) && selfHas('exercise', 15) : selfHas(task.type, task.min); }
  function progress(task) {
    if (!GH.state.group) return 0;
    const self = selfEligible(task);
    const others = (GH.state.group.members || []).filter(m => m.name !== '我').filter(m => task.type === 'both' ? m.steps >= 6000 && m.exercise >= 15 : (m[task.type] || 0) >= task.min).length;
    return Math.min(task.members, (self ? 1 : 0) + others);
  }
  function groupCard(task) {
    return GH.taskCard(task, { count: progress(task), joined: !!GH.state.group, claimed: GH.state.taskClaims.includes(task.id) });
  }
  function gameCard(game) {
    return '<a class="p2-game-card p2-art-card" href="' + esc(game.url) + '" target="_blank" rel="noopener noreferrer"><div class="p2-card-art" aria-hidden="true"><img src="images/scene/' + game.image + '.webp" alt="" loading="lazy"></div><div class="p2-card-copy"><span class="p2-reward">' + esc(game.points) + '</span><h3>' + esc(game.title) + '</h3><p>' + esc(game.detail) + '</p></div><span class="p2-game-cta">開始遊戲 <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span></a>';
  }
  function render() {
    GH.shell('任務', '任務中心');
    main().innerHTML = '<section><p class="p2-eyebrow">一起累積健康生活</p><h1 class="p2-page-title">任務中心</h1><p class="p2-lead">選一件今天想做的事，慢慢累積自己的成果。</p></section><section><div class="p2-segment" role="tablist"><button role="tab" aria-selected="' + (view === 'list') + '" data-view="list" class="' + (view === 'list' ? 'active' : '') + '">任務列表</button><button role="tab" aria-selected="' + (view === 'history') + '" data-view="history" class="' + (view === 'history' ? 'active' : '') + '">參與紀錄</button></div></section><section id="p2-task-content"></section>';
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view; shown = 20; render(); });
    keyboardTabs('[data-view]', 'data-view');
    if (view === 'list') renderList(); else renderHistory();
    GH.scene('tasks');
  }
  function renderList() {
    const node = document.getElementById('p2-task-content');
    node.innerHTML = '<div class="p2-task-categories" role="tablist" aria-label="任務類型"><button role="tab" aria-selected="' + (category === 'group') + '" data-category="group" class="' + (category === 'group' ? 'active' : '') + '"><i class="fa-solid fa-users" aria-hidden="true"></i>健康圈任務</button><button role="tab" aria-selected="' + (category === 'personal') + '" data-category="personal" class="' + (category === 'personal' ? 'active' : '') + '"><i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i>個人任務</button></div><div id="p2-task-cards"></div>';
    document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { category = b.dataset.category; renderList(); });
    keyboardTabs('[data-category]', 'data-category');
    rememberCompletions();
    const cards = document.getElementById('p2-task-cards');
    if (category === 'group') {
      cards.innerHTML = '<div class="p2-section-head"><h2>一起完成</h2><a href="group.html">前往健康圈 <i class="fa-solid fa-chevron-right"></i></a></div><p class="p2-section-intro">成員授權的健康裝置紀錄達成條件後，每位符合資格的成員可領取一次獎勵。</p><div class="p2-task-grid">' + DATA.tasks.map(groupCard).join('') + '</div>';
      cards.querySelectorAll('[data-task]').forEach(b => b.onclick = () => openTask(DATA.tasks.find(t => t.id === b.dataset.task)));
    } else {
      cards.innerHTML = '<div class="p2-section-head"><h2>腦健康遊戲</h2></div><p class="p2-section-intro">動動腦，完成遊戲後依各項任務規則累積健康點。</p><div class="p2-game-list">' + DATA.games.map(gameCard).join('') + '</div>';
    }
  }
  function openTask(task) {
    const count = progress(task);
    const claimed = GH.state.taskClaims.includes(task.id);
    GH.sheet(task.title, '<div class="p2-task-detail"><span class="p2-reward">完成獎勵 + ' + task.points + ' 健康點</span><p>' + esc(task.detail) + '</p><div class="p2-progress-copy">目前已達成 ' + count + '／' + task.members + ' 人</div><p class="p2-small p2-muted">以最近 7 天的授權健康裝置紀錄判定；本人完成紀錄且達成團隊條件後，可領取一次。</p></div>' + (claimed ? '<div class="p2-success">已完成並領取健康點</div>' : count >= task.members && selfEligible(task) ? '<button id="p2-claim-task" class="p2-primary full">領取 ' + task.points + ' 健康點</button>' : '<div class="p2-actions"><a class="p2-secondary" href="health.html">查看健康紀錄</a><a class="p2-secondary" href="group.html">' + (GH.state.group ? '查看健康圈' : '加入健康圈') + '</a></div>'));
    const claim = document.getElementById('p2-claim-task');
    if (claim) claim.onclick = () => {
      if (GH.state.taskClaims.includes(task.id) || progress(task) < task.members || !selfEligible(task)) return;
      GH.set(s => { s.taskClaims.push(task.id); s.pointAwards.unshift({ id: task.id, title: task.title, points: task.points, date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }) }); const entry = s.activityHistory.find(x => x.taskId === task.id && x.groupName === s.group.name); if (entry) entry.status = 'claimed'; else s.activityHistory.unshift({ taskId: task.id, groupName: s.group.name, title: task.title, date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }), points: task.points, kind: '健康圈任務', status: 'claimed' }); });
      GH.closeSheet(); render(); GH.toast('已獲得 ' + task.points + ' 健康點');
    };
  }
  function rememberCompletions() { GH.rememberTaskCompletions(); GH.save(); }
  function renderHistory() {
    rememberCompletions();
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    const iso = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const all = [...GH.state.activityHistory, ...GH.state.gameHistory].filter(x => x.date >= iso).sort((a,b) => b.date.localeCompare(a.date));
    const games = all.filter(x => x.kind !== '健康圈任務');
    const circles = all.filter(x => x.kind === '健康圈任務');
    const records = (historyCategory === 'group' ? circles : historyCategory === 'personal' ? games : all).slice(0,100);
    const played = games.length;
    const milestones = [[10,'開始探索'],[50,'持續參與'],[100,'百次挑戰']];
    const node = document.getElementById('p2-task-content');
    node.innerHTML = '<div class="p2-participation-summary">' + GH.art('journal') + '<div><h2>每次參與，都有收穫</h2><p>回顧近三個月的參與。</p></div><div class="p2-participation-counts"><span><strong>' + played + '</strong>個人遊戲次數</span><span><strong>' + circles.length + '</strong>共同任務完成</span></div></div>' +
      '<details class="p2-milestone-panel"><summary>參與里程碑<span>看看我的足跡 <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span></summary><p class="p2-small p2-muted">每次動腦，為自己留下新足跡。</p><div class="p2-milestones">' + milestones.map(([n,label]) => '<div class="' + (played >= n ? 'earned' : '') + '"><span class="p2-illustrated-medal">' + GH.art('missions') + '</span><strong>' + label + '</strong><small>' + n + ' 次遊戲</small></div>').join('') + '</div></details>' +
      '<div class="p2-history-filters p2-pill-row" aria-label="紀錄分類">' + [['all','全部'],['group','健康圈任務'],['personal','個人任務']].map(([key,label]) => '<button data-history-category="' + key + '" aria-pressed="' + (key === historyCategory) + '" class="' + (key === historyCategory ? 'active' : '') + '">' + label + '</button>').join('') + '</div><div class="p2-section-head"><h2>最近紀錄</h2><span class="p2-subtle">三個月內 · 最多 100 筆</span></div><div class="p2-list">' + (records.length ? records.slice(0,shown).map(historyRow).join('') : '<div class="p2-empty">' + GH.art('missions') + '<h3>還沒有完成紀錄</h3><p>一起完成任務，留下共同的健康足跡。</p><button id="p2-history-to-list" class="p2-secondary">查看任務</button></div>') + '</div>' + (shown < records.length ? '<button id="p2-more-history" class="p2-secondary full" style="margin-top:14px">載入更多</button>' : '') + '<div class="p2-actions"><a class="p2-secondary" href="records.html">查看腦健康表現</a></div>';
    node.querySelectorAll('[data-history-category]').forEach(b => b.onclick = () => { historyCategory = b.dataset.historyCategory; shown = 20; renderHistory(); });
    node.querySelectorAll('[data-history-task]').forEach(b => b.onclick = () => openTask(DATA.tasks.find(t => t.id === b.dataset.historyTask)));
    const toList = document.getElementById('p2-history-to-list'); if (toList) toList.onclick = () => {view='list';category='group';render();};
    const more = document.getElementById('p2-more-history'); if (more) more.onclick = () => {shown += 20;renderHistory();};
  }
  function historyRow(x) {
    const group = x.kind === '健康圈任務';
    const task = group && DATA.tasks.find(t => t.id === x.taskId || t.title === x.title);
    const game = !group && DATA.games.find(g => g.title === x.title);
    const image = task?.image || game?.image || 'symbol-memory';
    const claimed = x.status === 'claimed' || (!x.status && group);
    return '<article class="p2-list-card p2-history-record"><img class="p2-history-thumb" src="images/scene/' + esc(image) + '.webp" alt="" loading="lazy"><span class="body"><strong>' + esc(x.title) + '</strong><small>' + esc(x.date) + ' · ' + esc(group ? (x.groupName || '健康圈任務') : '個人任務') + '</small>' + (group ? '<span class="p2-history-status ' + (claimed?'claimed':'pending') + '">' + (claimed?'已領取':'待領取') + ' · ' + (claimed?'+':'') + x.points + ' 健康點</span>' : '') + '</span>' + (group && task && !claimed ? '<button class="p2-text-button" data-history-task="' + task.id + '">領取 <i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' : '') + '</article>';
  }
  document.addEventListener('DOMContentLoaded', render);
})();

