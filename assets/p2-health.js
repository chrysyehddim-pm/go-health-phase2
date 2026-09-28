(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  const types = [['steps', 'fa-shoe-prints'], ['sleep', 'fa-moon'], ['heart', 'fa-heart-pulse'], ['exercise', 'fa-person-running'], ['weight', 'fa-weight-scale']];
  const query = () => new URLSearchParams(location.search);
  const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  function render() {
    GH.shell('紀錄', '健康紀錄');
    if (query().get('metric')) return renderMetric(query().get('metric'));
    if (query().get('view') === 'mood') return renderMood();
    renderOverview();
  }
  function metricCard(type, fa) {
    const r = GH.latest(type);
    return '<a class="p2-metric p2-metric-link" href="health.html?metric=' + type + '"><span class="label"><i class="fa-solid ' + fa + '"></i> ' + GH.metric(type).name + '</span><span class="value">' + (r ? GH.format(r.value) : '—') + '<small>' + (r ? GH.metric(type).unit : '') + '</small></span><span class="p2-metric-meta">' + (r ? esc(r.date) : '尚無紀錄') + ' <i class="fa-solid fa-chevron-right"></i></span></a>';
  }
  function renderOverview() {
    const connected = GH.state.device === 'connected';
    main().innerHTML = '<section><p class="p2-eyebrow">我的健康資料</p><h1 class="p2-page-title">紀錄</h1><p class="p2-lead">掌握每日變化，找到適合自己的節奏。</p></section>' +
      '<section class="p2-card blue p2-device-card"><div class="p2-row start"><span class="p2-icon blue"><i class="fa-solid fa-mobile-screen-button"></i></span><div><h2>' + (connected ? '健康資料已連接' : '連接手機健康資料') + '</h2><p>' + (connected ? '步數、睡眠、運動與心率會整理在下方。' : '完成授權後，查看步數、睡眠、運動與心率。') + '</p></div></div><button id="p2-device" class="p2-primary full">' + (connected ? '管理連線' : '查看連接方式') + '</button></section>' +
      '<section><div class="p2-section-head"><h2>健康指標</h2><button id="p2-add-record" class="p2-text-button">新增紀錄 <i class="fa-solid fa-plus"></i></button></div><div class="p2-metric-grid">' + types.slice(0, 4).map(([type, fa]) => metricCard(type, fa)).join('') + '</div><a class="p2-home-link p2-more-metric" href="health.html?metric=weight"><span class="p2-icon"><i class="fa-solid fa-weight-scale"></i></span><span><strong>體重</strong><small>查看體重變化</small></span><i class="fa-solid fa-chevron-right"></i></a></section>' +
      '<section><div class="p2-section-head"><h2>心情日記</h2><a href="health.html?view=mood">查看紀錄 <i class="fa-solid fa-chevron-right"></i></a></div><div class="p2-card"><p class="p2-small p2-muted">記下今天的心情與想法，留給自己慢慢回顧。</p><a class="p2-secondary" href="health.html?view=mood" style="margin-top:12px">寫下今天</a></div></section>' +
      '<section><div class="p2-section-head"><h2>腦健康</h2></div><a class="p2-home-link" href="records.html"><span class="p2-icon blue"><i class="fa-solid fa-brain"></i></span><span><strong>遊戲與表現紀錄</strong><small>回顧近期挑戰與成就</small></span><i class="fa-solid fa-chevron-right"></i></a></section>' +
      '<section class="p2-privacy"><i class="fa-solid fa-lock"></i><span>健康紀錄與心情日記由你管理；分享給健康圈時會先讓你確認內容。</span></section>';
    document.getElementById('p2-device').onclick = deviceSheet;
    document.getElementById('p2-add-record').onclick = () => recordForm();
  }
  function deviceSheet() {
    const connected = GH.state.device === 'connected';
    GH.sheet(connected ? '管理健康資料連線' : '連接手機健康資料', '<div class="p2-info-list"><p><strong>1. 選擇資料來源</strong><br>使用手機或穿戴裝置的健康資料。</p><p><strong>2. 選擇授權項目</strong><br>步數、運動、睡眠與心率可分別管理。</p><p><strong>3. 查看同步結果</strong><br>返回紀錄頁，查看更新時間與數值。</p></div><div class="p2-actions"><button id="p2-device-action" class="p2-primary">' + (connected ? '同步最新紀錄' : '同意並連接') + '</button>' + (connected ? '<button id="p2-disconnect" class="p2-secondary">中斷連線</button>' : '') + '</div>');
    document.getElementById('p2-device-action').onclick = () => {
      const now = new Date();
      GH.set(s => {
        s.device = 'connected';
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const date = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
          [['steps', 6200 + (6 - i) * 240], ['sleep', 6.8 + (i % 3) * 0.2], ['heart', 72 + (i % 4)], ['exercise', 18 + (i % 5)]].forEach(([type, value]) => {
            if (!s.records.some(r => r.type === type && r.date === date && r.source === '手機健康資料')) s.records.push({ id: type + '-' + date, type, value, date, source: '手機健康資料' });
          });
        }
      });
      GH.closeSheet(); renderOverview(); GH.toast('健康資料已更新');
    };
    const disconnect = document.getElementById('p2-disconnect');
    if (disconnect) disconnect.onclick = () => { GH.set(s => { s.device = 'disconnected'; }); GH.closeSheet(); renderOverview(); GH.toast('已中斷連線'); };
  }
  function recordForm(existingId) {
    const existing = GH.state.records.find(r => r.id === existingId);
    GH.sheet(existing ? '編輯紀錄' : '新增健康紀錄', '<form id="p2-record-form" class="p2-form"><label>紀錄類型<select name="type">' + types.map(([type]) => '<option value="' + type + '">' + GH.metric(type).name + '</option>').join('') + '</select></label><label>數值<input type="number" name="value" min="0.1" step="0.1" required value="' + (existing ? existing.value : '') + '"></label><label>日期<input type="date" name="date" required value="' + (existing ? esc(existing.date) : today()) + '"></label><button class="p2-primary full">儲存紀錄</button></form>');
    if (existing) document.querySelector('#p2-record-form [name=type]').value = existing.type;
    document.getElementById('p2-record-form').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const value = Number(f.get('value'));
      if (!Number.isFinite(value) || value <= 0) return GH.toast('請輸入大於 0 的數值');
      const type = String(f.get('type'));
      GH.set(s => {
        if (existing) Object.assign(s.records.find(r => r.id === existingId), { type, value, date: String(f.get('date')), source: '手動紀錄' });
        else s.records.push({ id: String(Date.now()), type, value, date: String(f.get('date')), source: '手動紀錄' });
      });
      GH.closeSheet();
      if (query().get('metric')) renderMetric(type); else renderOverview();
      GH.toast('健康紀錄已儲存');
    };
  }
  function chart(records, type) {
    const values = records.map(r => Number(r.value));
    if (!values.length) return '<div class="p2-empty"><i class="fa-solid fa-chart-line"></i><h3>尚無這段期間的紀錄</h3><p>更新資料後，就能查看變化。</p></div>';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(max - min, 1);
    const points = values.map((v, i) => [22 + i * 276 / Math.max(values.length - 1, 1), 126 - (v - min) / span * 92]);
    return '<div class="p2-chart"><svg viewBox="0 0 320 150" role="img" aria-label="' + GH.metric(type).name + '趨勢折線圖"><line x1="20" y1="127" x2="300" y2="127" stroke="#dce9e7"/><polyline fill="none" stroke="#159365" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="' + points.map(p => p.join(',')).join(' ') + '"/>' + points.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#159365"/>').join('') + '</svg><div class="p2-chart-labels"><span>' + esc(records[0].date) + '</span><span>' + esc(records[records.length - 1].date) + '</span></div></div>';
  }
  function renderMetric(type) {
    if (!types.some(x => x[0] === type)) { location.href = 'health.html'; return; }
    let days = Number(query().get('days') || 7);
    if (![7, 30, 90].includes(days)) days = 7;
    const cutoff = new Date(Date.now() - (days - 1) * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const records = GH.state.records.filter(r => r.type === type && r.date >= cutoff).sort((a, b) => a.date.localeCompare(b.date));
    const latest = records[records.length - 1] || GH.latest(type);
    main().innerHTML = '<section><a class="p2-text-link" href="health.html"><i class="fa-solid fa-arrow-left"></i> 返回紀錄</a><p class="p2-eyebrow" style="margin-top:18px">健康指標</p><h1 class="p2-page-title">' + GH.metric(type).name + '</h1><p class="p2-lead">查看數值與最近的變化。</p></section><section class="p2-card"><span class="p2-subtle">最新紀錄</span><div class="p2-detail-value">' + (latest ? GH.format(latest.value) : '—') + ' <small>' + GH.metric(type).unit + '</small></div><p class="p2-small p2-muted">' + (latest ? esc(latest.date) + ' · ' + esc(latest.source) : '尚無紀錄') + '</p></section><section><div class="p2-segment">' + [7, 30, 90].map(d => '<a class="' + (d === days ? 'active' : '') + '" href="health.html?metric=' + type + '&days=' + d + '">近 ' + d + ' 天</a>').join('') + '</div><div class="p2-card" style="margin-top:12px">' + chart(records.slice(-14), type) + '</div></section><section><div class="p2-section-head"><h2>紀錄明細</h2><button id="p2-add-record" class="p2-text-button">新增 <i class="fa-solid fa-plus"></i></button></div><div class="p2-list">' + [...records].reverse().slice(0, 100).map(r => '<div class="p2-list-card"><span class="body"><strong>' + GH.format(r.value) + ' ' + GH.metric(type).unit + '</strong><small>' + esc(r.date) + ' · ' + esc(r.source) + '</small></span><button class="p2-text-button" data-edit="' + esc(r.id) + '">編輯</button></div>').join('') + '</div></section>';
    document.getElementById('p2-add-record').onclick = () => recordForm();
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => recordForm(b.dataset.edit));
  }
  function renderMood() {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    const iso = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const entries = [...GH.state.moods.map(x => ({ ...x, mood: x.value, note: x.note || '' })), ...GH.state.diaries.map(x => ({ ...x, mood: '', note: x.value }))].filter(x => x.date >= iso).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 100);
    main().innerHTML = '<section><a class="p2-text-link" href="health.html"><i class="fa-solid fa-arrow-left"></i> 返回紀錄</a><p class="p2-eyebrow" style="margin-top:18px">留給自己的時間</p><h1 class="p2-page-title">心情日記</h1><p class="p2-lead">心情與生活筆記放在一起，回顧最近的自己。</p></section><section><button id="p2-add-mood" class="p2-primary full"><i class="fa-solid fa-pen"></i> 記下今天</button></section><section><div class="p2-section-head"><h2>最近三個月</h2><span class="p2-subtle">' + entries.length + '／100 筆</span></div>' + (entries.length ? '<div class="p2-journal-list">' + entries.map(x => '<article class="p2-card"><div class="p2-row"><strong>' + esc(x.date) + '</strong>' + (x.mood ? '<span class="p2-badge">' + esc(x.mood) + '</span>' : '') + '</div>' + (x.note ? '<p>' + esc(x.note) + '</p>' : '') + '</article>').join('') + '</div>' : '<div class="p2-empty"><i class="fa-solid fa-book-open"></i><h3>還沒有心情日記</h3><p>從今天的一句話開始。</p></div>') + '</section>';
    document.getElementById('p2-add-mood').onclick = moodForm;
  }
  function moodForm() {
    GH.sheet('記下今天', '<form id="p2-mood-form" class="p2-form"><label>今天的心情<select name="mood"><option>開心</option><option>平靜</option><option>疲倦</option><option>焦慮</option><option>低落</option></select></label><label>想記下什麼？<textarea name="note" maxlength="500" placeholder="寫下今天的一件小事"></textarea></label><button class="p2-primary full">儲存心情日記</button></form>');
    document.getElementById('p2-mood-form').onsubmit = e => { e.preventDefault(); const f = new FormData(e.target); GH.set(s => s.moods.push({ id: String(Date.now()), value: String(f.get('mood')), note: String(f.get('note')).trim(), date: today() })); GH.closeSheet(); renderMood(); GH.toast('心情日記已儲存'); };
  }
  document.addEventListener('DOMContentLoaded', render);
})();
