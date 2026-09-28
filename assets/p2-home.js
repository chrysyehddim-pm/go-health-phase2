(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const latest = type => { const r = GH.latest(type); return r ? GH.format(r.value) + ' ' + GH.metric(type).unit : '尚無紀錄'; };
  const row = (href, icon, title, detail) => '<a class="p2-home-link" href="' + href + '"><span class="p2-icon"><i class="fa-solid ' + icon + '"></i></span><span><strong>' + title + '</strong><small>' + detail + '</small></span><i class="fa-solid fa-chevron-right"></i></a>';
  function render() {
    GH.shell('首頁', '首頁');
    const hour = new Date().getHours();
    const greeting = hour < 11 ? '早安' : hour < 18 ? '午安' : '晚安';
    const unread = GH.state.notifications.some(item => !item.read);
    const group = GH.state.group;
    const nudge = GH.latest('steps') ? '今天也用適合自己的節奏活動，記下每一個小進步。' : '從一筆健康紀錄開始，讓每天的照顧更有方向。';
    main().innerHTML =
      '<section class="p2-home-top"><div><p class="p2-eyebrow">GO HEALTH</p><h1 class="p2-page-title">' + greeting + '！今天也要元氣滿滿</h1><p class="p2-lead">一起照顧健康，也和重要的人保持聯繫。</p></div><button class="p2-bell" id="p2-notifications" aria-label="開啟通知中心"><i class="fa-regular fa-bell"></i>' + (unread ? '<span></span>' : '') + '</button></section>' +
      '<section class="points-card p2-home-points"><div class="p2-points-top"><span>我的健康點 <button id="p2-point-info" aria-label="查看健康點說明">?</button></span><a href="points-history.html"><i class="fa-solid fa-list-ul"></i> 累兌點紀錄</a></div><div class="p2-points-value">' + GH.format(GH.pointBalance()) + ' <small>點</small></div><a class="exchange-entry" href="exchange.html"><span><i class="fa-solid fa-arrow-right-arrow-left"></i> 兌換 HAPPY GO 點數<small>500 健康點可兌換 1 點</small></span><i class="fa-solid fa-chevron-right"></i></a></section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>今天的健康提醒</h2><a href="ai.html">查看摘要 <i class="fa-solid fa-chevron-right"></i></a></div><div class="p2-card tint p2-feature"><span class="p2-feature-icon"><i class="fa-solid fa-lightbulb"></i></span><div><h3>從一件小事開始</h3><p>' + nudge + '</p></div><a class="p2-primary" href="ai.html">看看我的建議</a></div></section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>我的紀錄</h2><a href="health.html">查看全部 <i class="fa-solid fa-chevron-right"></i></a></div><div class="p2-metric-grid"><a class="p2-metric" href="health.html?metric=steps"><span class="label"><i class="fa-solid fa-shoe-prints"></i> 步數</span><span class="value">' + latest('steps') + '</span></a><a class="p2-metric" href="health.html?metric=sleep"><span class="label"><i class="fa-solid fa-moon"></i> 睡眠</span><span class="value">' + latest('sleep') + '</span></a></div></section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>任務中心</h2><a href="activities.html">查看任務 <i class="fa-solid fa-chevron-right"></i></a></div>' + row('activities.html', 'fa-brain', '動動腦，累積健康點', '腦健康遊戲與健康圈任務') + '</section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>健康圈</h2><a href="group.html">前往健康圈 <i class="fa-solid fa-chevron-right"></i></a></div>' + row('group.html', 'fa-users', group ? esc(group.name) : '建立或加入健康圈', group ? '看看成員分享的近況' : '邀請家人，一起分享日常') + '</section>' +
      '<section class="p2-home-block"><div class="p2-section-head"><h2>探索健康服務</h2></div><div class="p2-home-stack">' + row('explore.html', 'fa-book-medical', '健康文章與附近去處', '找到適合自己的健康靈感') + row('records.html', 'fa-chart-line', '腦健康紀錄', '回顧遊戲表現與成就') + '</div></section>';
    document.getElementById('p2-point-info').onclick = () => GH.sheet('健康點說明', '<div class="p2-info-list"><p>完成符合條件的健康任務，可累積健康點。</p><p>每 500 健康點可兌換 1 點 HAPPY GO 點數。</p><p>點選「累兌點紀錄」可查看點數使用情形。</p></div><button class="p2-primary full" data-close-sheet>我知道了</button>');
    document.getElementById('p2-notifications').onclick = notifications;
  }
  function notifications() {
    const list = GH.state.notifications;
    GH.sheet('通知中心', '<div class="p2-notification-list">' + list.map(item => '<article class="p2-notification ' + (item.read ? '' : 'unread') + '"><strong>' + esc(item.title) + '</strong><p>' + esc(item.detail) + '</p></article>').join('') + '</div><button class="p2-secondary full" id="p2-read-all">全部標為已讀</button>');
    document.getElementById('p2-read-all').onclick = () => { GH.set(s => s.notifications.forEach(item => { item.read = true; })); GH.closeSheet(); render(); };
  }
  document.addEventListener('DOMContentLoaded', render);
})();
