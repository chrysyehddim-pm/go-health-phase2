(function () {
  'use strict';
  const GH = window.GH;
  const DATA = window.GH_DEMO;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  let view = 'list';
  let category = 'group';
  let shown = 20;
  const recent = date => date && date >= new Date(Date.now() - 6 * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  function selfHas(type, min) {
    return GH.state.records.some(r => r.type === type && r.value >= min && recent(r.date) && /裝置|手機/.test(r.source));
  }
  function selfEligible(task) { return task.type === 'both' ? selfHas('steps', 6000) && selfHas('exercise', 15) : selfHas(task.type, task.min); }
  function progress(task) {
    if (!GH.state.group) return 0;
    const self = selfEligible(task);
    const others = (GH.state.group.members || []).filter(m => m.name !== '我').filter(m => task.type === 'both' ? m.steps >= 6000 && m.exercise >= 15 : (m[task.type] || 0) >= task.min).length;
    return Math.min(task.members, (self ? 1 : 0) + others);
  }
  function groupCard(task) {
    const count = progress(task);
    const done = GH.state.taskClaims.includes(task.id);
    return '<article class="p2-task-card"><div class="p2-task-top"><span class="p2-icon"><i class="fa-solid ' + task.icon + '"></i></span><span class="p2-reward">+ ' + task.points + ' 點</span></div><h3>' + esc(task.title) + '</h3><p>' + esc(task.detail) + '</p><div class="p2-task-bottom"><span>' + (GH.state.group ? '已達成 ' + count + '／' + task.members + ' 人' : '加入健康圈後開始') + '</span><button class="p2-text-button" data-task="' + task.id + '">' + (done ? '查看成果' : '查看任務') + ' <i class="fa-solid fa-chevron-right"></i></button></div></article>';
  }
  function gameCard(game) {
    return '<a class="p2-game-card" href="' + esc(game.url) + '" target="_blank" rel="noopener noreferrer"><span class="p2-icon blue"><i class="fa-solid ' + game.icon + '"></i></span><span class="body"><strong>' + esc(game.title) + '</strong><small>' + esc(game.detail) + '</small></span><span class="p2-reward">' + esc(game.points) + '</span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>';
  }
  function render() {
    GH.shell('任務', '任務中心');
    main().innerHTML = '<section><p class="p2-eyebrow">一起累積健康生活</p><h1 class="p2-page-title">任務中心</h1><p class="p2-lead">選一件今天想做的事，慢慢累積自己的成果。</p></section><section><div class="p2-segment" role="tablist"><button data-view="list" class="' + (view === 'list' ? 'active' : '') + '">任務列表</button><button data-view="history" class="' + (view === 'history' ? 'active' : '') + '">參與紀錄</button></div></section><section id="p2-task-content"></section>';
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view; shown = 20; render(); });
    if (view === 'list') renderList(); else renderHistory();
  }
  function renderList() {
    const node = document.getElementById('p2-task-content');
    node.innerHTML = '<div class="p2-pill-row"><button data-category="group" class="' + (category === 'group' ? 'active' : '') + '">健康圈任務</button><button data-category="personal" class="' + (category === 'personal' ? 'active' : '') + '">個人任務</button></div><div id="p2-task-cards"></div>';
    document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { category = b.dataset.category; renderList(); });
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
    GH.sheet(task.title, '<div class="p2-task-detail"><span class="p2-reward">完成獎勵 + ' + task.points + ' 健康點</span><p>' + esc(task.detail) + '</p><div class="p2-progress-copy">目前已達成 ' + count + '／' + task.members + ' 人</div><p class="p2-small p2-muted">以最近 7 天的授權健康裝置紀錄判定；本人完成紀錄且達成團隊條件後，可領取一次。</p></div>' + (claimed ? '<div class="p2-success">已完成並領取健康點</div>' : count >= task.members && selfEligible(task) ? '<button id="p2-claim-task" class="p2-primary full">領取 ' + task.points + ' 健康點</button>' : '<div class="p2-actions"><a class="p2-secondary" href="health.html">查看健康紀錄</a><a class="p2-secondary" href="group.html">查看健康圈</a></div>'));
    const claim = document.getElementById('p2-claim-task');
    if (claim) claim.onclick = () => {
      if (GH.state.taskClaims.includes(task.id) || progress(task) < task.members || !selfEligible(task)) return;
      GH.set(s => { s.taskClaims.push(task.id); s.pointAwards.unshift({ id: task.id, title: task.title, points: task.points, date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }) }); s.activityHistory.unshift({ title: task.title, date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' }), points: task.points, kind: '健康圈任務' }); });
      GH.closeSheet(); render(); GH.toast('已獲得 ' + task.points + ' 健康點');
    };
  }
  function renderHistory() {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    const iso = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const records = [...GH.state.activityHistory, ...GH.state.gameHistory].filter(x => x.date >= iso).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
    const played = GH.state.gameHistory.filter(x => x.date >= iso).length;
    const milestones = [[10, '開始探索'], [50, '持續參與'], [100, '百次挑戰']];
    const node = document.getElementById('p2-task-content');
    node.innerHTML = '<div class="p2-section-head"><h2>我的參與</h2></div><div class="p2-history-summary"><strong>' + played + '</strong><span>最近三個月的遊戲紀錄</span></div><div class="p2-section-head"><h2>參與里程碑</h2></div><div class="p2-milestones">' + milestones.map(([n, label]) => '<div class="' + (played >= n ? 'earned' : '') + '"><i class="fa-solid fa-medal"></i><strong>' + label + '</strong><small>' + n + ' 次遊戲</small></div>').join('') + '</div><div class="p2-section-head"><h2>最近紀錄</h2><span class="p2-subtle">最近三個月，最多 100 筆</span></div><div class="p2-list">' + records.slice(0, shown).map(x => '<article class="p2-list-card"><span class="p2-icon blue"><i class="fa-solid ' + (x.kind === '健康圈任務' ? 'fa-users' : 'fa-brain') + '"></i></span><span class="body"><strong>' + esc(x.title) + '</strong><small>' + esc(x.date) + ' · ' + esc(x.kind) + '</small></span>' + (x.kind === '健康圈任務' ? '<span class="p2-reward">+' + x.points + ' 點</span>' : '') + '</article>').join('') + '</div>' + (shown < records.length ? '<button id="p2-more-history" class="p2-secondary full" style="margin-top:14px">載入更多</button>' : '') + '<div class="p2-actions"><a class="p2-secondary" href="records.html">查看腦健康表現</a></div>';
    const more = document.getElementById('p2-more-history');
    if (more) more.onclick = () => { shown += 20; renderHistory(); };
  }
  document.addEventListener('DOMContentLoaded', render);
})();
