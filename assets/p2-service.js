(() => {
  'use strict';
  const release = window.GH_RELEASE;
  const { announcement, maintenance, happyGoReturnUrl } = release.config;
  const query = new URLSearchParams(location.search);
  const preview = release.demo && query.get('preview') === '1';
  if (query.get('state') === 'maintenance' && !maintenance.enabled && !preview) {
    location.replace(release.url('index.html'));
    return;
  }
  const kind = maintenance.enabled ? 'maintenance' : query.get('state');
  const pages = ['index.html', 'health.html', 'records.html', 'group.html', 'activities.html', 'explore.html', 'points-history.html'];
  const retryPage = pages.includes(query.get('return')) ? query.get('return') : 'index.html';
  const content = kind === 'maintenance' && (maintenance.enabled || preview) ? {
    title: maintenance.title || '服務維護中',
    body: maintenance.body || 'GO HEALTH 正在維護，請稍後再回來。',
    period: maintenance.period,
    action: ['重新進入', release.url('index.html'), maintenance.enabled]
  } : kind === 'announcement' && (announcement.enabled || preview) ? {
    title: announcement.title || '服務公告',
    body: announcement.body || '這是公告畫面示意。會員可查看訊息後繼續使用服務。',
    action: ['返回首頁', release.url('index.html')]
  } : {
    title: '暫時無法載入',
    body: '請重新載入。若問題持續，請稍後再回來。',
    action: ['重新載入', release.url(retryPage)]
  };
  document.getElementById('service-title').textContent = content.title;
  document.getElementById('service-body').textContent = content.body;
  const period = document.getElementById('service-period');
  if (content.period) {
    period.textContent = content.period;
    period.hidden = false;
  }
  const actions = document.getElementById('service-actions');
  const [label, href, refresh] = content.action;
  const primary = document.createElement('a');
  primary.textContent = label;
  primary.href = refresh ? location.href : href;
  actions.append(primary);
  if (kind === 'announcement') return;
  const back = document.createElement('a');
  back.className = 'secondary';
  back.textContent = happyGoReturnUrl ? '返回 HAPPY GO' : release.demo ? '返回情境導覽' : '返回服務首頁';
  back.href = happyGoReturnUrl || (release.demo ? 'demo.html?release=full' : release.url('index.html'));
  if (happyGoReturnUrl || release.demo || !maintenance.enabled) actions.append(back);
})();
