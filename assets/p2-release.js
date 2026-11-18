(() => {
  'use strict';
  const config = window.GH_RELEASE_CONFIG;
  const query = new URLSearchParams(location.search);
  const page = location.pathname.split('/').pop();
  const demo = config.environment === 'demo';
  let mode = 'full';
  if (demo) {
    try {
      const requested = query.get('release');
      if (requested === 'launch' || requested === 'full') sessionStorage.setItem('gohealth-release-mode', requested);
      mode = sessionStorage.getItem('gohealth-release-mode') === 'launch' ? 'launch' : 'full';
    } catch (_) { mode = query.get('release') === 'launch' ? 'launch' : 'full'; }
  } else {
    mode = config.productionMode === 'full' ? 'full' : 'launch';
  }
  const launch = mode === 'launch';
  if (demo && !query.has('release') && !['demo.html', 'journey.html', 'journey-qr.html'].includes(page)) {
    query.set('release', mode);
    history.replaceState(history.state, '', location.pathname + '?' + query + location.hash);
  }
  const enabled = key => !launch || config.launch[key] === true;
  const url = (path, targetMode = mode) => {
    if (!demo) return path;
    const target = new URL(path, location.href);
    if (target.origin === location.origin && target.pathname.endsWith('.html')) target.searchParams.set('release', targetMode);
    return target.href;
  };
  const blocked = {
    metrics: ['健康指標', '你可以先記下今天的心情，或回顧動腦紀錄。'],
    location: ['位置分享', '你可以在健康圈分享近況，或傳句話關心家人。'],
    places: ['附近去處', '你可以先看看探索裡的健康文章。']
  };
  const badge = '<span class="p2-release-badge">尚未開放</span>';
  function explain(key) {
    const [title, detail] = blocked[key];
    window.GH.sheet(title + '尚未開放', '<p>' + detail + '</p><button type="button" class="p2-primary full" data-close-sheet>我知道了</button>');
  }
  const storageKey = key => key + (launch ? '_launch' : '');
  window.GH_RELEASE = { launch, demo, config, enabled, url, badge, explain, storageKey };
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-release-block]');
    if (launch && button) explain(button.dataset.releaseBlock);
  });

  // Keep links mode-specific, including links rendered after a dialog opens.
  function markLinks(root) {
    const links = root.matches?.('a[href]') ? [root] : root.querySelectorAll?.('a[href]') || [];
    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || /^(?:javascript|mailto|tel):/i.test(href)) continue;
      const target = new URL(href, location.href);
      if (target.origin !== location.origin || !target.pathname.endsWith('.html') || target.searchParams.has('release')) continue;
      link.href = url(href, ['demo.html', 'journey.html', 'journey-qr.html'].includes(page) ? 'full' : mode);
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!demo) return;
    markLinks(document);
    new MutationObserver(changes => {
      for (const change of changes) for (const node of change.addedNodes) markLinks(node);
    }).observe(document.body, { childList: true, subtree: true });
  });

  if (config.maintenance.enabled && page !== 'service.html') {
    location.replace(url('service.html?state=maintenance'));
  } else if (launch && page === 'ai.html') {
    location.replace(url('index.html#health-reminder'));
  } else if (launch && !enabled('pointsExchange') && ['exchange.html', 'exchange-history.html'].includes(page)) {
    location.replace(url('index.html'));
  }
})();
