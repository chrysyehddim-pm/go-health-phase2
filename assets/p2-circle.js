(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  let visiblePosts = 5;
  const dayKey = date => date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  function postDate(post) {
    const saved = post.createdAt && new Date(post.createdAt);
    if (saved && !Number.isNaN(saved.getTime())) return saved;
    if (/^\d{13}$/.test(String(post.id || ''))) return new Date(Number(post.id));
    if (post.time === '昨天') return new Date(Date.now() - 86400000);
    if (post.time === '今天') return new Date(Date.now() - 7200000);
    return new Date(Date.now() - 172800000);
  }
  function dateGroup(date) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (dayKey(date) === dayKey(new Date())) return '今天';
    if (dayKey(date) === dayKey(yesterday)) return '昨天';
    return date >= new Date(Date.now() - 7 * 86400000) ? '近七天' : '更早';
  }
  function recentPosts() {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
    return GH.state.posts.map((post, index) => ({ post, index, date: postDate(post) }))
      .filter(item => item.date >= cutoff)
      .sort((a, b) => b.date - a.date || a.index - b.index)
      .slice(0, 100);
  }
  const seedMembers = [
    { name: '我', role: '成員', status: '今天記錄了健康近況' },
    { name: '爸爸', role: '圈主', status: '昨天分享了散步近況', steps: 7200, exercise: 20 },
    { name: '媽媽', role: '成員', status: '今天完成了活動紀錄', steps: 8300, exercise: 25 },
    { name: '姊姊', role: '成員', status: '剛分享了一處散步好去處', steps: 6500, exercise: 18 }
  ];
  function render() {
    GH.shell('健康圈', '健康圈');
    if (!GH.state.group) return renderEntry();
    const group = GH.state.group;
    main().innerHTML = '<section class="p2-circle-head"><p class="p2-eyebrow">健康圈</p><div class="p2-row"><div><h1 class="p2-page-title">' + esc(group.name) + '</h1><p class="p2-lead">和重要的人分享近況，一起照顧健康。</p></div><button id="p2-group-menu" class="p2-round-button" aria-label="健康圈設定"><i class="fa-solid fa-ellipsis"></i></button></div></section>' +
      '<section class="p2-circle-hero"><div class="p2-avatar-stack">' + group.members.slice(0, 4).map(m => '<span title="' + esc(m.name) + '">' + esc(m.name.slice(0, 1)) + '</span>').join('') + '</div><div><strong>' + group.members.length + ' 位成員</strong><small>分享生活，互相鼓勵</small></div><button id="p2-invite" class="p2-secondary">邀請成員</button></section>' +
      '<section><div class="p2-section-head"><h2>成員近況</h2></div><div class="p2-member-strip">' + group.members.map(m => '<button class="p2-member" data-member="' + esc(m.name) + '"><span class="p2-avatar">' + esc(m.name.slice(0, 1)) + '</span><strong>' + esc(m.name) + '</strong><small>' + esc(m.status || '一起參與健康圈') + '</small></button>').join('') + '</div></section>' +
      '<section class="p2-card p2-compose-card"><div class="p2-row"><span class="p2-avatar self">我</span><button id="p2-compose" class="p2-compose-prompt">分享你的近況…</button></div><div class="p2-compose-actions"><button id="p2-share-health"><i class="fa-solid fa-heart-pulse"></i> 健康紀錄</button><a href="explore.html?tab=places"><i class="fa-solid fa-location-dot"></i> 地點</a></div></section>' +
      '<section><div class="p2-section-head"><h2>近況動態</h2><span class="p2-subtle">最近三個月</span></div><div id="p2-circle-feed"></div></section>' +
      '<section><div class="p2-section-head"><h2>一起做任務</h2><a href="activities.html">查看任務 <i class="fa-solid fa-chevron-right"></i></a></div><a class="p2-home-link" href="activities.html"><span class="p2-icon"><i class="fa-solid fa-list-check"></i></span><span><strong>健康圈任務</strong><small>透過健康紀錄一起完成挑戰</small></span><i class="fa-solid fa-chevron-right"></i></a></section>';
    const taskSection = main().lastElementChild;
    const task = window.GH_DEMO.tasks[0];
    const count = Math.min(task.members, group.members.filter(m => m.name === '我' ? GH.latest('steps')?.value >= 6000 : m.steps >= 6000).length);
    taskSection.innerHTML = '<div class="p2-section-head"><h2>共同任務</h2><a href="activities.html">查看全部 <i class="fa-solid fa-chevron-right"></i></a></div>' + GH.taskCard(task, { count, joined: true, href: 'activities.html' });
    main().insertBefore(taskSection, main().children[2]);
    const membersSection = main().children[3];
    main().appendChild(membersSection);
    GH.scene('circle');
    renderFeed();
    document.getElementById('p2-group-menu').onclick = groupSettings;
    document.getElementById('p2-invite').onclick = invite;
    document.getElementById('p2-compose').onclick = compose;
    document.getElementById('p2-share-health').onclick = shareHealth;
    document.querySelectorAll('[data-member]').forEach(b => b.onclick = () => memberSheet(b.dataset.member));
  }
  function renderEntry() {
    main().innerHTML = '<section><p class="p2-eyebrow">一起更健康</p><h1 class="p2-page-title">我的健康圈</h1><p class="p2-lead">邀請家人與好友，分享生活、互相鼓勵，一起完成健康任務。</p></section><section class="p2-entry-hero"><div class="p2-entry-graphic"><span><i class="fa-solid fa-heart"></i></span><span><i class="fa-solid fa-person-walking"></i></span><span><i class="fa-solid fa-comment-dots"></i></span></div><h2>讓健康成為共同的日常</h2><p>你可以自己建立健康圈，也可以用邀請碼加入。</p></section><section class="p2-entry-actions"><button id="p2-create-group" class="p2-choice"><span class="p2-icon"><i class="fa-solid fa-plus"></i></span><span><strong>建立健康圈</strong><small>邀請重要的人加入</small></span><i class="fa-solid fa-chevron-right"></i></button><button id="p2-join-group" class="p2-choice"><span class="p2-icon blue"><i class="fa-solid fa-user-plus"></i></span><span><strong>加入健康圈</strong><small>輸入收到的邀請碼</small></span><i class="fa-solid fa-chevron-right"></i></button></section>';
    GH.scene('circle');
    document.getElementById('p2-create-group').onclick = createGroup;
    document.getElementById('p2-join-group').onclick = joinGroup;
  }
  function createGroup() {
    GH.sheet('建立健康圈', '<form id="p2-create-form" class="p2-form"><label>健康圈名稱<input name="name" maxlength="20" required placeholder="例如：我們家的健康圈"></label><button class="p2-primary full">建立健康圈</button></form>');
    document.getElementById('p2-create-form').onsubmit = e => {
      e.preventDefault(); const name = String(new FormData(e.target).get('name')).trim(); if (!name) return;
      GH.set(s => { s.group = { name, code: '00000', members: [{ name: '我', role: '圈主', status: '健康圈建立者' }] }; s.posts = []; });
      GH.closeSheet(); render(); main().scrollTop = 0; invite();
    };
  }
  function joinGroup() {
    GH.sheet('加入健康圈', '<form id="p2-join-form" class="p2-form"><label>五位數邀請碼<input name="code" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" required placeholder="請輸入邀請碼"></label><button class="p2-primary full">加入健康圈</button></form>');
    document.getElementById('p2-join-form').onsubmit = e => {
      e.preventDefault(); const code = String(new FormData(e.target).get('code')).trim();
      if (code !== '00000') return GH.toast('邀請碼錯誤，請確認後再試一次');
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      GH.set(s => {
        s.group = { name: '我們家的健康圈', code, members: seedMembers };
        s.posts = [
          { id: 'sample-1', author: '爸爸', time: '昨天', createdAt: yesterday.toISOString(), text: '傍晚到公園走了走，今天的步數也達標了。', kind: '生活近況', comments: [{ author: '媽媽', text: '下次一起去！' }], likes: 2, place: '信義區' },
          { id: 'sample-2', author: '媽媽', time: '今天', createdAt: new Date().toISOString(), text: '完成今天的運動紀錄，感覺精神不錯。', kind: '健康紀錄', comments: [], likes: 1, metric: '運動 25 分鐘' },
          { id: 'sample-3', author: '姊姊', time: '今天', createdAt: new Date(Date.now()-3600000).toISOString(), text: '找到一條樹蔭很多的步道，週末一起去走走吧。', kind: '地點分享', place: '大安森林公園', comments: [], likes: 2 }
        ];
      });
      visiblePosts = 5; GH.closeSheet(); render(); main().scrollTop = 0; GH.toast('已加入健康圈');
    };
  }
  function invite() {
    GH.sheet('邀請成員', '<p>分享邀請碼，讓家人與好友加入「' + esc(GH.state.group.name) + '」。</p><div class="p2-invite-code">' + esc(GH.state.group.code) + '</div><button class="p2-primary full" id="p2-copy-code">複製邀請碼</button>');
    document.getElementById('p2-copy-code').onclick = async () => { try { await navigator.clipboard.writeText(GH.state.group.code); GH.toast('邀請碼已複製'); } catch (_) { GH.toast('請長按邀請碼複製'); } };
  }
  function groupSettings() {
    GH.sheet('健康圈設定', '<div class="p2-info-list"><p><strong>健康資料由本人決定是否分享</strong><br>加入健康圈不會自動公開健康數值與日記。</p><p><strong>邀請碼</strong><br>' + esc(GH.state.group.code) + '</p></div><button id="p2-leave" class="p2-secondary full">退出健康圈</button>');
    document.getElementById('p2-leave').onclick = () => GH.sheet('退出健康圈？', '<p>退出後，這個健康圈的近況將不再顯示。</p><div class="p2-actions"><button class="p2-secondary" data-close-sheet>保留健康圈</button><button class="p2-primary" id="p2-confirm-leave">確認退出</button></div>');
    document.addEventListener('click', function leave(e) {
      if (!e.target.closest('#p2-confirm-leave')) return;
      GH.set(s => { s.group = null; s.posts = []; }); GH.closeSheet(); render(); document.removeEventListener('click', leave);
    });
  }
  function memberSheet(name) {
    const member = GH.state.group.members.find(m => m.name === name);
    GH.sheet(name + '的近況', '<div class="p2-member-detail"><span class="p2-avatar">' + esc(name.slice(0, 1)) + '</span><strong>' + esc(name) + '</strong><p>' + esc(member.status || '一起參與健康圈') + '</p></div>' + (name === '我' ? '<a class="p2-secondary full" href="health.html">查看我的紀錄</a>' : '<button id="p2-send-care" class="p2-primary full">傳送關心</button>'));
    const care = document.getElementById('p2-send-care'); if (care) care.onclick = () => {
      GH.sheet('傳送關心給' + name, '<form id="p2-care-form" class="p2-form"><label>想說的話<textarea name="text" maxlength="150" required placeholder="寫一句關心的話"></textarea></label><button class="p2-primary full">送出</button></form>');
      document.getElementById('p2-care-form').onsubmit = e => { e.preventDefault(); const text = String(new FormData(e.target).get('text')).trim(); if (!text) return; GH.set(s => s.posts.unshift({ id: String(Date.now()), author: '我', time: '剛剛', createdAt: new Date().toISOString(), text: '給' + name + '：' + text, kind: '關心訊息', comments: [], likes: 0 })); GH.closeSheet(); renderFeed(); GH.toast('關心已送出'); };
    };
  }
  function postMarkup(p) {
    return '<article class="p2-social-post"><div class="p2-post-heading"><span class="p2-avatar">' + esc(p.author.slice(0, 1)) + '</span><div><strong>' + esc(p.author) + '</strong><small>' + esc(p.time) + ' · ' + esc(p.kind) + '</small></div></div><p class="p2-post-copy">' + esc(p.text) + '</p>' + (p.place ? '<div class="p2-post-tag"><i class="fa-solid fa-location-dot"></i> ' + esc(p.place) + '</div>' : '') + (p.metric ? '<div class="p2-post-tag"><i class="fa-solid fa-heart-pulse"></i> ' + esc(p.metric) + '</div>' : '') + '<div class="p2-post-actions"><button data-like="' + esc(p.id) + '"><i class="fa-regular fa-heart"></i> 鼓勵 ' + Number(p.likes || 0) + '</button><button data-comment="' + esc(p.id) + '"><i class="fa-regular fa-comment"></i> 回應 ' + (p.comments || []).length + '</button></div>' + (p.url ? '<a class="p2-secondary" style="margin-top:12px" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' + (p.kind === '文章分享' ? '閱讀文章' : '查看地點') + '</a>' : '') + (p.comments || []).map(c => '<div class="p2-comment"><strong>' + esc(c.author) + '：</strong>' + esc(c.text) + '</div>').join('') + '</article>';
  }
  function renderFeed() {
    const node = document.getElementById('p2-circle-feed'); if (!node) return;
    const posts = recentPosts();
    let previousGroup = '';
    const shown = posts.slice(0, visiblePosts).map(item => {
      const group = dateGroup(item.date);
      const heading = group === previousGroup ? '' : '<h3 class="p2-feed-date">' + group + '</h3>';
      previousGroup = group;
      return heading + postMarkup(item.post);
    }).join('');
    node.innerHTML = posts.length ? '<div class="p2-feed">' + shown + '</div>' + (visiblePosts < posts.length ? '<button id="p2-more-posts" class="p2-secondary full p2-more-posts">載入更多近況</button>' : '') : '<div class="p2-empty"><i class="fa-regular fa-comments"></i><h3>最近還沒有近況</h3><p>分享今天的一件小事，開啟健康圈的對話。</p></div>';
    const more = document.getElementById('p2-more-posts');
    if (more) more.onclick = () => { visiblePosts += 10; renderFeed(); };
    node.querySelectorAll('[data-like]').forEach(b => b.onclick = () => { GH.set(s => { const p = s.posts.find(x => x.id === b.dataset.like); if (p) p.likes = Number(p.likes || 0) + 1; }); renderFeed(); });
    node.querySelectorAll('[data-comment]').forEach(b => b.onclick = () => comment(b.dataset.comment));
  }
  function compose() {
    GH.sheet('分享近況', '<form id="p2-post-form" class="p2-form"><label>今天想分享什麼？<textarea name="text" maxlength="300" required placeholder="寫下生活中的一件小事"></textarea></label><button class="p2-primary full">分享給健康圈</button></form>');
    document.getElementById('p2-post-form').onsubmit = e => { e.preventDefault(); const text = String(new FormData(e.target).get('text')).trim(); if (!text) return; GH.set(s => s.posts.unshift({ id: String(Date.now()), author: '我', time: '剛剛', createdAt: new Date().toISOString(), text, kind: '生活近況', comments: [], likes: 0 })); GH.closeSheet(); renderFeed(); GH.toast('近況已分享'); };
  }
  function comment(id) {
    GH.sheet('回應近況', '<form id="p2-comment-form" class="p2-form"><label>留言<textarea name="text" maxlength="200" required placeholder="寫下想說的話"></textarea></label><button class="p2-primary full">送出回應</button></form>');
    document.getElementById('p2-comment-form').onsubmit = e => { e.preventDefault(); const text = String(new FormData(e.target).get('text')).trim(); if (!text) return; GH.set(s => { const p = s.posts.find(x => x.id === id); if (p) p.comments.push({ author: '我', text }); }); GH.closeSheet(); renderFeed(); GH.toast('回應已送出'); };
  }
  function shareHealth(initial = {}) {
    const types = ['steps','sleep','heart','exercise','weight'];
    const available = types.filter(type => GH.latest(type));
    const selected = available.includes(initial.type) ? initial.type : available[0];
    const choices = types.map(type => {
      const r = GH.latest(type);
      return '<label class="p2-health-choice ' + (r ? '' : 'unavailable') + '"><input type="radio" name="type" value="' + type + '"' + (r ? (type === selected ? ' checked' : '') : ' disabled') + '>' + GH.art(type) + '<span><strong>' + GH.metric(type).name + '</strong><small>' + (r ? GH.format(r.value) + ' ' + GH.metric(type).unit + ' · ' + esc(r.date) : '尚無資料') + '</small></span></label>';
    }).join('');
    GH.sheet('分享健康紀錄', '<form id="p2-health-share-form" class="p2-form"><fieldset class="p2-health-choices"><legend>選擇一筆紀錄</legend>' + choices + '</fieldset>' + (!available.length ? '<p class="p2-small p2-muted">目前沒有可分享的健康資料。連接健康資料後，再回來分享。</p><a class="p2-secondary full" href="health.html">連接健康資料</a>' : '') + '<label>補充一句話（選填）<textarea name="note" maxlength="150">' + esc(initial.note || '') + '</textarea></label><div class="p2-privacy"><i class="fa-solid fa-lock"></i><span>只分享你選取的這筆數值與文字，不包含其他紀錄或日記。</span></div><button class="p2-primary full"' + (available.length ? '' : ' disabled') + '>預覽分享</button></form>');
    document.getElementById('p2-health-share-form').onsubmit = e => {
      e.preventDefault();
      const f = new FormData(e.target), type = String(f.get('type')), r = GH.latest(type);
      if (!types.includes(type) || !r || !GH.state.group) return;
      const snapshot = {type,value:r.value,date:r.date};
      const metric = GH.metric(type).name + ' ' + GH.format(snapshot.value) + ' ' + GH.metric(type).unit + ' · ' + snapshot.date;
      const note = String(f.get('note') || '').trim();
      GH.sheet('確認分享內容', '<div class="p2-share-preview">' + GH.art(type) + '<h3>' + esc(metric) + '</h3><p>' + esc(note || '分享一筆我的健康紀錄。') + '</p><small>分享給：' + esc(GH.state.group.name) + '</small></div><div class="p2-actions"><button id="p2-confirm-health-share" class="p2-primary">確認分享</button><button id="p2-edit-health-share" class="p2-secondary">返回修改</button></div>');
      document.getElementById('p2-edit-health-share').onclick = () => shareHealth({type,note});
      document.getElementById('p2-confirm-health-share').onclick = e => {
        if (!GH.state.group) return;
        e.currentTarget.disabled = true;
        GH.set(s => s.posts.unshift({id:String(Date.now()),author:'我',time:'剛剛',createdAt:new Date().toISOString(),text:note || '分享一筆我的健康紀錄。',kind:'健康紀錄',metric,metricRecord:snapshot,comments:[],likes:0}));
        GH.closeSheet(); renderFeed(); GH.toast('健康紀錄已分享');
      };
    };
  }
  document.addEventListener('DOMContentLoaded', render);
})();
