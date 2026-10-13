(function () {
  'use strict';
  const GH = window.GH;
  const DATA = window.GH_DEMO;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  let view = new URLSearchParams(location.search).get('view')==='history'?'history':'list';
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
  const progress=t=>GH.family.taskStatus(t).count;
  function groupCard(task) {const x=GH.family.taskStatus(task);return GH.taskCard(task,{count:x.count,joined:!!GH.state.group,claimed:x.claimed});}
  function gameCard(game) {
    return '<a class="p2-game-card p2-art-card" href="' + esc(game.url) + '" target="_blank" rel="noopener noreferrer"><div class="p2-card-art" aria-hidden="true"><img src="images/scene/' + game.image + '.webp" alt="" loading="lazy"></div><div class="p2-card-copy"><span class="p2-reward">' + esc(game.points) + '</span><h3>' + esc(game.title) + '</h3><p>' + esc(game.detail) + '</p></div><span class="p2-game-cta">開始遊戲 <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span></a>';
  }
  function render() {
    GH.shell('任務', '任務中心');
    main().innerHTML = '<section><p class="p2-eyebrow">一起累積健康生活</p><h1 class="p2-page-title">任務中心</h1><p class="p2-lead">選一件今天想做的事，慢慢累積自己的成果。</p></section><section class="p2-task-history-entry"><button data-view="' + (view==='history'?'list':'history') + '" class="p2-text-button">' + (view==='history'?'返回任務':'參與紀錄') + ' <i class="fa-solid fa-chevron-right"></i></button></section><section id="p2-task-content"></section>';
    const historyEntry=main().querySelector('.p2-task-history-entry');
    const title=main().querySelector('h1');
    const titleRow=document.createElement('div');titleRow.className='p2-row p2-task-title-row';
    title.replaceWith(titleRow);titleRow.append(title,historyEntry.querySelector('button'));historyEntry.remove();
    document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { view = b.dataset.view; shown = 20; render(); });

    if (view === 'list') renderList(); else renderHistory();
    GH.scene('tasks');
  }
  function renderList() {
    const node = document.getElementById('p2-task-content');
    node.innerHTML = '<div class="p2-segment p2-primary-tabs p2-task-categories" role="tablist" aria-label="任務類型"><button role="tab" aria-selected="' + (category === 'group') + '" data-category="group" class="' + (category === 'group' ? 'active' : '') + '">健康圈任務</button><button role="tab" aria-selected="' + (category === 'personal') + '" data-category="personal" class="' + (category === 'personal' ? 'active' : '') + '">個人任務</button></div><div id="p2-task-cards"></div>';
    document.querySelectorAll('[data-category]').forEach(b => b.onclick = () => { category = b.dataset.category; renderList(); });
    keyboardTabs('[data-category]', 'data-category');
    rememberCompletions();
    const cards = document.getElementById('p2-task-cards');
    if (category === 'group') {
      cards.innerHTML = '<div class="p2-section-head"><h2>一起完成</h2><a href="group.html">前往健康圈 <i class="fa-solid fa-chevron-right"></i></a></div><p class="p2-section-intro">每週一起完成健康或動腦目標。達標後請在本週期限內主動領取，逾期不補領。</p><div class="p2-task-grid">' + GH.family.activeTasks().map(groupCard).join('') + '</div>';
      if(!GH.family.activeTasks().length)cards.insertAdjacentHTML('beforeend','<div class="p2-empty"><h3>目前沒有可參與的任務</h3><p>過往成果可在參與紀錄查看。</p></div>');
      cards.querySelectorAll('[data-task]').forEach(b => b.onclick = () => openTask(DATA.tasks.find(t => t.id === b.dataset.task)));
    } else {
      cards.innerHTML = '<div class="p2-section-head"><h2>腦健康遊戲</h2></div><p class="p2-section-intro">動動腦，完成遊戲後依各項任務規則累積健康點。</p><div class="p2-game-list">' + DATA.games.map(gameCard).join('') + '</div>';
    }
  }
  function openTask(task) {
    const x=GH.family.taskStatus(task),p=x.period;if(!x.joined)return GH.sheet(task.title,'<p>'+esc(task.shortDetail)+'</p><p>加入健康圈後可與家人一起參與。</p><a class="p2-primary full" href="group.html">建立或加入健康圈</a>');if(!x.active)return GH.toast('本期任務已結束');
    GH.sheet(task.title,'<span class="p2-reward">每人 +'+task.points+' 健康點</span><p>'+esc(task.shortDetail)+'</p>'+(p?'<p>任務期間：'+p.start+' ～ '+p.end+' 23:59</p><p class="p2-small">請於截止前完成資料同步並領取，逾期不補領。</p>':'')+'<p><strong>'+esc(x.label)+'</strong></p>'+GH.family.completedMarkup(task)+'<p>至少 '+task.members+' 人完成解鎖。期間內，每位完成個人條件的成員都能各自領取一次，沒有先後名額限制。</p>'+(x.canClaim?'<button id="p2-claim-task" class="p2-primary full">領取 '+task.points+' 健康點</button>':x.claimed?'<div class="p2-success">已領取獎勵</div>':'<div class="p2-actions"><a class="p2-secondary" href="health.html">查看健康紀錄</a><a class="p2-secondary" href="group.html">查看健康圈</a></div>'));
    document.getElementById('p2-claim-task')?.addEventListener('click',()=>{if(!GH.family.claim(task))return;GH.closeSheet();render();GH.toast('已獲得 '+task.points+' 健康點');});
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
    const month=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'}).slice(0,7);
    const gameDays=new Set(games.filter(x=>x.date.startsWith(month)).map(x=>x.date)).size;
    const circleCount=circles.filter(x=>x.date.startsWith(month)&&x.teamCompleted!==false&&x.status!=='waiting'&&x.status!=='team_expired').length;
    const activeDays=new Set(GH.state.records.filter(x=>GH.state.device==='connected'&&GH.state.healthPreferences.includes('steps')&&x.type==='steps'&&x.date.startsWith(month)&&x.value>0).map(x=>x.date)).size;
    const milestones=[['brain','個人參與',gameDays+' 天動動腦'],['missions','家人合作',circleCount+' 次共同完成'],['steps','生活行動',activeDays+' 天留下步行足跡']];
    const node = document.getElementById('p2-task-content');
    node.innerHTML = '<div class="p2-participation-summary">' + GH.art('journal') + '<div><h2>每次參與，都有收穫</h2><p>回顧近三個月的參與。</p></div><div class="p2-participation-counts"><span><strong>' + played + '</strong>個人遊戲次數</span><span><strong>' + circles.filter(x=>x.teamCompleted!==false&&!['waiting','team_expired'].includes(x.status)).length + '</strong>共同任務完成</span></div></div>' +
      '<section class="p2-monthly-footprints"><div class="p2-section-head"><h2>本月健康足跡</h2><span>'+esc(month)+'</span></div><p class="p2-small p2-muted">動動腦、與家人合作，累積生活中的小進步。</p><div class="p2-milestones">' + milestones.map(([art,label,detail])=>'<div><span class="p2-illustrated-medal">'+GH.art(art)+'</span><strong>'+label+'</strong><small>'+detail+'</small></div>').join('')+'</div></section>' +
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
    const claimed=x.status==='claimed'||(!x.status&&group),active=group&&task&&GH.state.group?.id===x.groupId&&GH.family.taskStatus(task).key===x.claimKey&&GH.family.taskStatus(task).canClaim;
    const label=claimed?'任務已完成・已領取 '+x.points+' 點':x.status==='waiting'?'個人已達標・團隊未達標':x.status==='team_expired'?'個人已達標・本期團隊未達標':x.status==='expired'||!active?'任務已完成・未於期限內領取':'任務已完成・尚未領取';
    return '<article class="p2-list-card p2-history-record"><img class="p2-history-thumb" src="images/scene/'+esc(image)+'.webp" alt="" loading="lazy"><span class="body"><strong>'+esc(x.title)+'</strong><small>'+esc(x.date)+' · '+esc(group?(x.groupName||'健康圈任務'):'個人任務')+'</small>'+(group?'<span class="p2-history-status '+(claimed?'claimed':'pending')+'">'+label+'</span>':'')+'</span>'+(active?'<button class="p2-text-button" data-history-task="'+task.id+'">領取</button>':'')+'</article>';
  }
  document.addEventListener('DOMContentLoaded', render);
})();

