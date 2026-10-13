(function () {
  'use strict';
  const GH = window.GH;
  const guide = window.GH_GUIDE;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const latest = type => { const r = GH.latest(type); return r ? GH.format(r.value) + ' ' + GH.metric(type).unit : '尚無紀錄'; };
  const row = (href, icon, title, detail) => '<a class="p2-home-link p2-illustrated-entry" href="' + href + '"><span><strong>' + title + '</strong><small>' + detail + '</small></span>' + GH.art(icon) + '<i class="fa-solid fa-chevron-right"></i></a>';
  function render() {
    GH.shell('首頁', '首頁');
    const greeting = '早安';
    const unread = GH.state.notifications.some(item => !item.read);
    const group = GH.state.group;
    const nudge = GH.latest('steps') ? '今天也用適合自己的節奏活動，記下每一個小進步。' : '連接健康資料後，查看適合自己的活動提醒；今天先找個舒服的時段散步。';
    main().innerHTML =
      '<section class="p2-home-top"><div><p class="p2-eyebrow">GO HEALTH</p><h1 class="p2-page-title">' + greeting + '！<span class="p2-greeting-detail">今天也要元氣滿滿</span></h1><p class="p2-lead">一起照顧健康，也和重要的人保持聯繫。</p></div><button class="p2-bell" id="p2-notifications" aria-label="開啟通知中心"><i class="fa-regular fa-bell"></i>' + (unread ? '<span></span>' : '') + '</button></section>' +
      '<section class="points-card p2-home-points"><div class="p2-points-top"><span>我的健康點 <button id="p2-point-info" aria-label="查看健康點說明">?</button></span><a href="points-history.html"><i class="fa-solid fa-list-ul"></i> 累兌點紀錄</a></div><div class="p2-points-value">' + GH.format(GH.pointBalance()) + ' <small>點</small></div><a class="exchange-entry" href="exchange.html"><span><i class="fa-solid fa-arrow-right-arrow-left"></i> 兌換 HAPPY GO 點數<small>500 健康點可兌換 1 點</small></span><i class="fa-solid fa-chevron-right"></i></a></section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>今天的健康提醒</h2><a href="ai.html">查看摘要 <i class="fa-solid fa-chevron-right"></i></a></div><div class="p2-card tint p2-feature"><img class="p2-reminder-art" src="images/scene/walking.webp" alt="輕鬆散步"><div><h3>讓散步成為日常</h3><p>' + nudge + '</p></div><a class="p2-primary" href="ai.html">看看我的建議</a></div></section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>我的紀錄</h2><a href="health.html">查看全部 <i class="fa-solid fa-chevron-right"></i></a></div><div class="p2-metric-grid"><a class="p2-metric" href="health.html?metric=steps"><span class="label">' + GH.art('steps') + ' 步數</span><span class="value">' + latest('steps') + '</span></a><a class="p2-metric" href="health.html?metric=sleep"><span class="label">' + GH.art('sleep') + ' 睡眠</span><span class="value">' + latest('sleep') + '</span></a></div></section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>任務中心</h2><a href="activities.html">查看任務 <i class="fa-solid fa-chevron-right"></i></a></div>' + row('activities.html', 'missions', '動動腦，累積健康點', '腦健康遊戲<br>健康圈共同任務') + '</section>' +
      '<section class="p2-home-block p2-home-circle"><div class="p2-section-head"><h2>健康圈近況</h2><a href="group.html">前往健康圈 <i class="fa-solid fa-chevron-right"></i></a></div><a class="p2-circle-preview" href="group.html"><img src="images/scene/circle.webp" alt="家人共享客廳"><div><h3>' + (group ? esc(group.name) : '讓健康成為共同的日常') + '</h3><p>' + (group ? '分享近況、互相鼓勵，一起完成任務。' : '邀請家人與好友，一起分享生活、完成任務。') + '</p></div></a>' + (group ? GH.state.posts.slice(0, 2).map(p => '<a class="p2-home-post" href="group.html"><span class="p2-avatar">' + esc(p.author.slice(0,1)) + '</span><span><strong>' + esc(p.author) + '</strong><small>' + esc(p.text) + '</small></span><i class="fa-solid fa-chevron-right"></i></a>').join('') || '<p class="p2-small">分享今天的一件小事，讓家人陪你一起進步。</p>' : '<a class="p2-secondary full" href="group.html">建立或加入健康圈</a>') + '</section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>探索健康服務</h2></div><div class="p2-home-stack">' + row('explore.html', 'explore', '健康文章與附近去處', '附近好去處<br>健康好知識') + row('records.html', 'brain', '腦健康紀錄', '回顧遊戲表現與成就') + '</div></section>';
    const circleBlock=main().querySelector('.p2-home-circle'),points=main().querySelector('.p2-home-points');
    main().insertBefore(circleBlock,main().children[1]);main().append(points);
    [...main().querySelectorAll('.p2-home-block')].filter(n=>['任務中心','探索健康服務'].includes(n.querySelector('h2')?.textContent)).forEach(n=>n.remove());
    const available=['steps','sleep','exercise','heart','weight'].filter(t=>GH.latest(t)).slice(0,2);
    const recordsBlock=[...main().querySelectorAll('.p2-home-block')].find(n=>n.querySelector('h2')?.textContent==='我的紀錄');
    recordsBlock.querySelector('.p2-metric-grid').outerHTML=available.length?'<div class="p2-metric-grid '+(available.length===1?'p2-single-metric':'')+'">'+available.map(t=>{const r=GH.latest(t);return '<a class="p2-metric" href="health.html?metric='+t+'"><span class="label">'+GH.art(t)+' '+GH.metric(t).name+'</span><span class="value">'+GH.format(r.value)+' <small>'+GH.metric(t).unit+'</small></span><small class="p2-metric-meta">'+esc(r.date)+'</small></a>';}).join('')+'</div>':'<a class="p2-home-link" href="health.html">'+GH.art('connect')+'<span><strong>'+(GH.state.device==='connected'?'尚無可用資料':'連接健康資料')+'</strong><small>'+(GH.state.device==='connected'?'更新資料或查看連接設定':'連接後查看自己的健康變化')+'</small></span><i class="fa-solid fa-chevron-right"></i></a>';
    circleBlock.innerHTML='<div class="p2-section-head"><h2>健康圈近況</h2><a href="group.html">前往健康圈 <i class="fa-solid fa-chevron-right"></i></a></div>'+(group?'<a class="p2-home-link" href="group.html"><span class="p2-avatar">'+group.members.length+'</span><span><strong>'+esc(group.name)+'</strong><small>'+group.members.length+'/5 位成員，一起照顧健康</small></span></a>'+ (GH.state.posts[0]?'<a class="p2-home-post" href="group.html"><span class="p2-avatar">'+esc(GH.state.posts[0].author.slice(0,1))+'</span><span><strong>'+esc(GH.state.posts[0].author==='我'?(group.nickname||'我'):GH.state.posts[0].author)+'</strong><small>'+esc(GH.state.posts[0].text)+'</small></span></a>':'<p>分享心情或傳句關心，開啟今天的對話。</p>')+(()=>{const t=GH.family.activeTasks()[0];if(!t)return '';const x=GH.family.taskStatus(t);return '<a class="p2-home-link p2-home-task-summary" href="activities.html"><span><strong>'+esc(t.title)+'</strong><small>'+esc(x.label)+' · '+x.count+' 人完成</small></span><i class="fa-solid fa-chevron-right"></i></a>';})():'<div class="p2-card warm"><h3>和家人一起照顧健康</h3><p>分享心情、互相關心，一起完成健康任務。</p><a class="p2-secondary" href="group.html">建立或加入健康圈</a></div>');
    const care=GH.family.visibleCare();if(care.length)circleBlock.insertAdjacentHTML('beforeend','<a class="p2-home-care-link" href="group.html">有 '+care.length+' 位家人值得關心 <i class="fa-solid fa-chevron-right"></i></a>');
    if (guide.welcome()) {
      circleBlock.insertAdjacentHTML('beforebegin','<section class="p2-guide-welcome" aria-label="首次使用導引"><span class="p2-guide-kicker">歡迎來到 GO HEALTH</span><h2>一起陪伴，把健康過成日常</h2><p>邀請家人與好友加入健康圈，分享近況、互相關心，也能一起完成健康任務。</p><div class="p2-guide-welcome-actions"><a id="p2-guide-join" class="p2-primary" href="group.html">建立或加入健康圈</a><button id="p2-guide-skip" class="p2-secondary" type="button">先看看</button></div></section>');
    }
    main().insertAdjacentHTML('beforeend','<section class="p2-guide-help-entry"><button id="p2-guide-help" type="button"><i class="fa-regular fa-circle-question" aria-hidden="true"></i><span>使用說明</span><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button></section>');
    GH.scene('home');
    document.getElementById('p2-guide-join')?.addEventListener('click',()=>guide.mark('welcome'));
    document.getElementById('p2-guide-skip')?.addEventListener('click',()=>{guide.mark('welcome');main().querySelector('.p2-guide-welcome')?.remove();});
    document.getElementById('p2-guide-help').onclick=guide.help;
    document.getElementById('p2-point-info').onclick = () => GH.sheet('健康點說明', '<div class="p2-info-list"><p>完成符合條件的健康任務，可累積健康點。</p><p>每 500 健康點可兌換 1 點 HAPPY GO 點數。</p><p>點選「累兌點紀錄」可查看點數使用情形。</p></div><button class="p2-primary full" data-close-sheet>我知道了</button>');
    document.getElementById('p2-notifications').onclick = notifications;
  }
  function notifications() {
    const list = GH.state.notifications;
    GH.sheet('通知中心', '<div class="p2-notification-list">' + list.map(item => '<article class="p2-notification ' + (item.read ? '' : 'unread') + '"><strong>' + esc(item.title) + '</strong><p>' + esc(item.detail) + '</p>'+(item.url?'<a class="p2-text-link" href="'+esc(item.url)+'">'+esc(item.actionLabel||'前往關心')+'</a>':'')+'</article>').join('') + '</div><button class="p2-secondary full" id="p2-read-all">全部標為已讀</button>');
    document.getElementById('p2-read-all').onclick = () => { GH.set(s => s.notifications.forEach(item => { item.read = true; })); GH.closeSheet(); render(); };
  }
  document.addEventListener('DOMContentLoaded', render);
})();

