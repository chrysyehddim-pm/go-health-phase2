(function () {
  'use strict';
  window.navigateTo = page => { window.location.href = page; };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('p2-large');
    const nav = document.querySelector('.bottom-nav');
    if (nav) {
      nav.classList.add('p2-bottom-nav');
      nav.setAttribute('aria-label', '主要導覽');
      nav.innerHTML = [
        ['index.html','首頁','fa-house'],['health.html','紀錄','fa-chart-line'],
        ['group.html','健康圈','fa-users'],['activities.html','任務','fa-list-check'],
        ['explore.html','探索','fa-compass']
      ].map(([href,label,icon]) => {
        const active = label === (document.body.dataset.page === 'records' ? '紀錄' : '首頁');
        return '<a class="nav-btn ' + (active ? 'active ' : '') + (label === '健康圈' ? 'p2-nav-circle' : '') + '" ' + (active ? 'aria-current="page"' : '') + ' href="' + href + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i><span>' + label + '</span></a>';
      }).join('');
    }
  });
})();
