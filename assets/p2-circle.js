(function () {
  'use strict';
  const GH = window.GH;
  const esc = GH.escape;
  const main = () => document.getElementById('p2-main');
  let visiblePosts = 5;
  const displayName=name=>name==='我'?(GH.state.group?.nickname || '我'):name;
  const moodChoices=[['開心','happy'],['平靜','calm'],['疲倦','tired'],['焦慮','anxious'],['低落','low']];
  const careMessages=['辛苦了，記得休息','今天也一起加油','看到你的分享很開心'];
  function quickCare(form) {
    form.querySelector('textarea').insertAdjacentHTML('beforebegin','<div class="p2-quick-care">'+careMessages.map(text=>'<button type="button" data-care-text="'+esc(text)+'">'+esc(text)+'</button>').join('')+'</div>');
    form.querySelectorAll('[data-care-text]').forEach(b=>b.onclick=()=>{form.querySelector('textarea').value=b.dataset.careText;form.querySelector('textarea').dispatchEvent(new Event('input',{bubbles:true}));form.querySelector('textarea').focus();});
  }

  function locationStatus(member) { return GH.locationContext.get(member?.name); }
  function sendCare(name) {
    GH.sheet('傳送關心給' + displayName(name), '<form id="p2-care-form" class="p2-form"><label>想說的話<textarea name="text" maxlength="150" required placeholder="寫一句關心的話"></textarea></label><button class="p2-primary full">送出</button></form>');
    quickCare(document.getElementById('p2-care-form'));
    document.getElementById('p2-care-form').onsubmit = e => { e.preventDefault(); const text = String(new FormData(e.target).get('text')).trim(); if (!text) return; GH.set(s => s.posts.unshift({ id: String(Date.now()), author: '我', time: '剛剛', createdAt: new Date().toISOString(), text: '給' + displayName(name) + '：' + text, kind: '關心訊息', comments: [], likes: 0 })); GH.closeSheet(); renderFeed(); GH.toast('關心已送出'); };
  }
  function selfMember(){return GH.state.group?.members.find(m=>m.name==='我');}
  function myLocationState(){
    const own=selfMember(),location=GH.state.location||{};
    return {permission:location.permission===true?'granted':location.permission||'prompt',sharing:Boolean(location.sharing&&own?.locationSharing),updatedAt:location.updatedAt||own?.lastLocation?.updatedAt};
  }
  function myLocationSettings(){
    const current=myLocationState(),own=selfMember();
    const permissionLabel=current.permission==='granted'?'手機定位已允許':current.permission==='denied'?'手機定位未允許':'尚未允許手機定位';
    const sharingLabel=current.sharing?'位置分享已開啟':'位置分享已關閉';
    const updateLabel=current.updatedAt?locationStatus({...own,locationSharing:true,lastLocation:{...(own?.lastLocation||{}),updatedAt:current.updatedAt}}).label:'尚無位置更新';
    const action=current.sharing?'<button id="p2-refresh-location" class="p2-primary full"><i class="fa-solid fa-rotate"></i> 立即更新我的位置</button><button id="p2-stop-location" class="p2-quiet full">關閉位置分享</button>':current.permission==='denied'?'<button id="p2-open-device-settings" class="p2-primary full">前往手機定位設定</button><button id="p2-retry-location" class="p2-secondary full">重新檢查</button>':'<button id="p2-start-location" class="p2-primary full">開啟位置分享</button>';
    GH.sheet('我的位置分享','<div class="p2-location-setting-summary"><div><span class="p2-location-setting-icon"><i class="fa-solid fa-mobile-screen-button"></i></span><p><strong>'+permissionLabel+'</strong><small>由 HAPPY GO App 取得位置</small></p></div><div><span class="p2-location-setting-icon"><i class="fa-solid fa-users"></i></span><p><strong>'+sharingLabel+'</strong><small>'+(current.sharing?updateLabel:'健康圈成員目前無法查看')+'</small></p></div></div><div class="p2-location-consent-copy"><h3>開啟後會怎麼更新？</h3><ul><li>開啟或回到 HAPPY GO App、進入 GO HEALTH 時，系統會嘗試更新。</li><li>同一次使用期間最多每 30 分鐘更新一次。</li><li>App 未開啟時不會持續追蹤位置。</li><li>家人只會看到最後位置與更新時間，不會看到移動軌跡。</li></ul></div>'+action+'<p class="p2-small p2-muted">你可以隨時關閉。關閉後，健康圈成員立即無法查看既有位置。</p>');
    document.getElementById('p2-start-location')?.addEventListener('click',locationConsentConfirm);
    document.getElementById('p2-refresh-location')?.addEventListener('click',()=>updateMyLocation(true));
    document.getElementById('p2-stop-location')?.addEventListener('click',stopLocationSharing);
    document.getElementById('p2-open-device-settings')?.addEventListener('click',()=>GH.toast('請到手機設定允許 HAPPY GO 使用定位'));
    document.getElementById('p2-retry-location')?.addEventListener('click',locationConsentConfirm);
  }
  function locationConsentConfirm(){
    GH.sheet('開啟我的位置分享？','<div class="p2-location-consent-hero"><i class="fa-solid fa-location-dot"></i><h3>分享最後位置給健康圈</h3><p>同意後，HAPPY GO App 會在你使用 App 時更新位置。這不是即時追蹤，也不會顯示移動路徑。</p></div><div class="p2-privacy"><i class="fa-solid fa-lock"></i><span>加入健康圈或使用探索定位，都不會自動開啟這項分享。</span></div><div class="p2-actions"><button id="p2-confirm-location" class="p2-primary">允許並開啟分享</button><button id="p2-cancel-location" class="p2-secondary">先不要</button></div>');
    document.getElementById('p2-cancel-location').onclick=myLocationSettings;
    document.getElementById('p2-confirm-location').onclick=()=>updateMyLocation(false);
  }
  function updateMyLocation(manual){
    const now=new Date().toISOString();
    GH.set(s=>{
      s.location={permission:'granted',sharing:true,updatedAt:now,source:'HAPPY GO App'};
      const own=s.group?.members.find(m=>m.name==='我');
      if(own){own.locationSharing=true;own.lastLocation=s.journey?.id==='xiaohua'?{lat:25.0142,lng:121.4638,area:'新北市板橋區',place:'板橋車站附近（展示位置）',updatedAt:now}:{lat:25.0330,lng:121.5654,area:'臺北市信義區',place:'信義生活圈附近',updatedAt:now};}
    });
    render();myLocationSettings();GH.toast(manual?'位置已更新':'位置分享已開啟');
  }
  function stopLocationSharing(){
    GH.sheet('關閉位置分享？','<p>關閉後，健康圈成員將立即無法查看你的既有位置。之後可隨時重新開啟。</p><div class="p2-actions"><button class="p2-secondary" data-close-sheet>取消</button><button id="p2-confirm-stop-location" class="p2-danger">確認關閉</button></div>');
    document.getElementById('p2-confirm-stop-location').onclick=()=>{GH.set(s=>{s.location||={};s.location.sharing=false;const own=s.group?.members.find(m=>m.name==='我');if(own)own.locationSharing=false;});render();myLocationSettings();GH.toast('位置分享已關閉');};
  }

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
    const cutoff = new Date(Date.now() - 7 * 86400000);
    return GH.state.posts.map((post, index) => ({ post, index, date: postDate(post) }))
      .filter(item => item.date >= cutoff)
      .sort((a, b) => b.date - a.date || a.index - b.index)
      .slice(0, 20);
  }
  const seedMembers = [
    { name: '我', role: '成員', avatarUrl: 'images/avatars/member-self.webp', status: '今天記錄了健康近況' },
    { name: '爸爸', role: '圈主', avatarUrl: 'images/avatars/member-father.webp', status: '昨天分享了散步近況', steps: 7200, exercise: 20 },
    { name: '媽媽', role: '成員', avatarUrl: 'images/avatars/member-mother.webp', status: '今天完成了活動紀錄', steps: 8300, exercise: 25 },
    { name: '姊姊', role: '成員', avatarUrl: 'images/avatars/member-sister.webp', status: '剛分享了一處散步好去處', steps: 6500, exercise: 18 }
  ];
  function render() {
    GH.shell('健康圈', '健康圈');
    if (!GH.state.group) return renderEntry();
    if(new URLSearchParams(location.search).get('view')==='location')return renderFamilyLocation();
    const group=GH.state.group,tasks=GH.family.activeTasks().map(task=>({task,status:GH.family.taskStatus(task)}));
    const allClaimed=tasks.length>0&&tasks.every(x=>x.status.claimed);
    const task=(tasks.find(x=>x.status.canClaim)||tasks.find(x=>!x.status.claimed))?.task;
    main().innerHTML='<section class="p2-circle-head"><div class="p2-row"><h1 class="p2-page-title">'+esc(group.name)+'</h1><button id="p2-group-menu" class="p2-round-button" aria-label="健康圈設定"><i class="fa-solid fa-ellipsis"></i></button></div><div class="p2-member-stories" aria-label="健康圈成員">'+group.members.map(m=>{const status=locationStatus(m),self=m.name==='我',shared=self?myLocationState().sharing:m.locationSharing===true;const recent=status.available&&status.age<=86400000;const label=self?(shared?'已開啟':'未開啟'):!shared?'未開啟':status.available?(recent?'近期位置':'較早位置'):'待更新';return '<button type="button" class="p2-member-story '+(recent?'has-recent-location':status.available?'has-older-location':'')+'" data-story-member="'+esc(m.name)+'" aria-label="'+esc(displayName(m.name)+'，'+label+(self?'，管理我的位置分享':''))+'"><span class="p2-story-portrait">'+GH.avatar(m,{label:displayName(m.name)})+(shared?'<i class="fa-solid fa-location-dot p2-story-pin" aria-hidden="true"></i>':'')+'</span><strong>'+esc(displayName(m.name))+'</strong><small>'+esc(label)+'</small></button>';}).join('')+'</div><p class="p2-location-entry-hint">點自己的頭像，管理位置分享。</p><button id="p2-members" class="p2-text-button">查看所有成員 <i class="fa-solid fa-chevron-right"></i></button></section>'+
    (allClaimed?'<section class="p2-weekly-summary"><div class="p2-section-head"><h2>本週共同任務</h2><a href="activities.html">查看全部</a></div><p class="p2-task-week-complete">本週任務獎勵都已領取，謝謝你和家人一起完成。</p></section>':task?'<section class="p2-weekly-summary"><div class="p2-section-head"><h2>本週共同任務</h2><a href="activities.html">查看全部</a></div>'+GH.taskCard(task,{joined:true,href:'activities.html'})+'</section>':'')+
    '<section><button id="p2-share-entry" class="p2-primary full"><i class="fa-solid fa-pen"></i> 分享近況</button></section><section><div class="p2-section-head"><h2>家人近況</h2><span class="p2-subtle">近 7 天 · 最多 20 筆</span></div><div id="p2-circle-feed"></div></section>';
    GH.scene('circle');renderFeed();
    document.getElementById('p2-group-menu').onclick=groupSettings;
    document.getElementById('p2-members').onclick=memberList;
    document.querySelectorAll('[data-story-member]').forEach(b=>b.onclick=()=>{const m=group.members.find(x=>x.name===b.dataset.storyMember);if(m.name==='我')myLocationSettings();else location.href='group.html?view=location&member='+encodeURIComponent(m.name);});
    document.getElementById('p2-share-entry').onclick=shareMenu;
  }
  function renderFamilyLocation(){
    const params=new URLSearchParams(location.search),name=params.get('member')||'爸爸';
    const member=GH.state.group.members.find(m=>m.name===name);
    const app=document.getElementById('app-root');
    if(!member){main().innerHTML='<section><a class="p2-back-button" href="group.html"><i class="fa-solid fa-chevron-left"></i> 回到健康圈</a><div class="p2-empty"><i class="fa-solid fa-location-dot"></i><h2>找不到這位成員</h2><p>成員可能已離開健康圈。</p></div></section>';GH.scene('circle');app.classList.add('p2-plain-page');return;}
    const status=locationStatus(member),loc=member.lastLocation||{};
    const intro=status.available?['這是最後一次取得的位置','位置可能因手機更新時間而有落差，並非即時定位。']:status.state==='off'?['不分享位置，也能保持關心',displayName(name)+'尚未開啟位置分享，你仍可以傳句訊息，問候他的近況。']:['傳句關心，邀家人一起回來看看','最近沒有取得'+displayName(name)+'的新位置，可以問候一下，也邀他回健康圈分享近況。'];
    const freshnessNote=status.freshness==='aging'?'位置可能已有變動。':status.freshness==='stale'?'這是較早的位置，建議先確認家人目前所在。':'由家人同意分享的最後位置';
    const map=status.available?'<div class="p2-family-location-map"><iframe title="'+esc(displayName(name))+'的最後位置地圖" src="https://www.google.com/maps?q='+encodeURIComponent(String(loc.lat)+','+String(loc.lng))+'&z=15&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div><div class="p2-location-info"><div><span>位置範圍</span><strong>'+esc(loc.place||loc.area||'位置附近')+'</strong><small>'+esc(loc.area||'')+'</small></div><div><span>更新時間</span><strong>'+esc(status.label)+'</strong><small>'+freshnessNote+'</small></div></div><a class="p2-secondary full" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(String(loc.lat)+','+String(loc.lng))+'" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> 用 Google 地圖查看</a>':'<div class="p2-empty p2-location-empty"><i class="fa-solid fa-location-dot"></i><h2>'+esc(status.label)+'</h2><p>'+esc(status.reason)+'</p></div>';
    main().innerHTML='<section class="p2-family-location-page"><a class="p2-back-button" href="group.html"><i class="fa-solid fa-chevron-left"></i> 回到健康圈</a><div class="p2-family-location-head">'+GH.avatar(member,{label:displayName(name)})+'<div><p class="p2-eyebrow">家人最後位置</p><h1 class="p2-page-title">'+esc(displayName(name))+'的最後位置</h1></div></div><div class="p2-location-privacy"><i class="fa-solid fa-circle-info"></i><p><strong>'+esc(intro[0])+'</strong><span>'+esc(intro[1])+'</span></p></div>'+map+(name!=='我'?'<button id="p2-location-care" class="p2-primary full"><i class="fa-solid fa-heart"></i> 傳送關心</button>':'')+'</section>';
    GH.scene('circle');app.classList.add('p2-plain-page');
    document.getElementById('p2-location-care')?.addEventListener('click',()=>sendCare(name));
    if(status.available){
      const demo=''; // Family locations use the same live Google list as Explore.
      const nearby=document.createElement('a');nearby.className='p2-primary full p2-family-nearby';nearby.href='explore.html?tab=places&family='+encodeURIComponent(name)+demo;nearby.innerHTML='<i class="fa-solid fa-map-location-dot"></i> 看看附近健康去處';
      document.querySelector('.p2-family-location-page').appendChild(nearby);
    }
  }
  function memberList(){
    const group=GH.state.group;
    GH.sheet('健康圈成員','<div class="p2-list">'+group.members.map(m=>'<button class="p2-list-card" data-member="'+esc(m.name)+'">'+GH.avatar(m,{label:displayName(m.name)})+'<span class="body"><strong>'+esc(displayName(m.name))+'</strong><small>'+esc(m.role||'成員')+'</small></span><i class="fa-solid fa-chevron-right"></i></button>').join('')+'</div><button id="p2-invite" class="p2-secondary full" style="margin-top:16px">邀請成員</button>');
    const inviteButton=document.getElementById('p2-invite');inviteButton.disabled=group.members.length>=5;inviteButton.textContent=group.members.length>=5?'5/5 位成員・已滿員':'邀請成員';inviteButton.onclick=invite;document.querySelectorAll('[data-member]').forEach(b=>b.onclick=()=>memberSheet(b.dataset.member));
  }
  function shareMenu(){
    GH.sheet('分享近況','<div class="p2-share-choices"><button id="p2-compose" class="p2-choice">'+GH.art('journal')+'<strong>寫近況</strong></button><button id="p2-share-mood" class="p2-choice">'+GH.art('mood-happy')+'<strong>分享心情</strong></button><button id="p2-share-health" class="p2-choice">'+GH.art('heart')+'<strong>健康紀錄</strong></button><a class="p2-choice" href="explore.html?tab=places">'+GH.art('explore')+'<strong>分享地點</strong></a></div>');
    document.getElementById('p2-compose').onclick=compose;document.getElementById('p2-share-mood').onclick=shareMood;document.getElementById('p2-share-health').onclick=()=>shareHealth();
  }
  function renderEntry() {
    const guideTip=GH_GUIDE.tip('circle')?GH_GUIDE.tipCard('circle','從這裡開始和家人相聚','建立自己的健康圈，或輸入家人的邀請碼加入。'):'';
    main().innerHTML = '<section><p class="p2-eyebrow">一起更健康</p><h1 class="p2-page-title">我的健康圈</h1><p class="p2-lead">邀請家人與好友，分享生活、互相鼓勵，一起完成健康任務。</p></section>'+guideTip+'<section class="p2-entry-hero"><div class="p2-entry-graphic"><span><i class="fa-solid fa-heart"></i></span><span><i class="fa-solid fa-person-walking"></i></span><span><i class="fa-solid fa-comment-dots"></i></span></div><h2>讓健康成為共同的日常</h2><p>你可以自己建立健康圈，也可以用邀請碼加入。</p></section><section class="p2-entry-actions"><button id="p2-create-group" class="p2-choice"><span class="p2-icon"><i class="fa-solid fa-plus"></i></span><span><strong>建立健康圈</strong><small>邀請重要的人加入</small></span><i class="fa-solid fa-chevron-right"></i></button><button id="p2-join-group" class="p2-choice"><span class="p2-icon blue"><i class="fa-solid fa-user-plus"></i></span><span><strong>加入健康圈</strong><small>輸入收到的邀請碼</small></span><i class="fa-solid fa-chevron-right"></i></button></section>';
    GH_GUIDE.bind(main());
    GH.scene('circle');
    document.getElementById('p2-create-group').onclick = createGroup;
    document.getElementById('p2-join-group').onclick = joinGroup;
  }
  function createGroup() {
    if(GH.state.group)return GH.toast('你已加入健康圈，請先退出再建立');
    GH.sheet('建立健康圈', '<form id="p2-create-form" class="p2-form"><label>健康圈名稱<input name="name" maxlength="20" required placeholder="例如：我們家的健康圈"></label><button class="p2-primary full">建立健康圈</button></form>');
    document.getElementById('p2-create-form').onsubmit = e => {
      e.preventDefault(); if(GH.state.group)return GH.toast('你已加入健康圈');const name = String(new FormData(e.target).get('name')).trim(); if (!name) return;
      GH.set(s => { s.group = { id: 'circle-' + crypto.randomUUID(), name, code: '00000', members: [{ name: '我', role: '圈主', avatarUrl: 'images/avatars/member-self.webp', status: '健康圈建立者' }] }; s.posts = []; });
      GH.family.period();GH.save();GH.closeSheet(); render(); main().scrollTop = 0; GH.family.careConsent();
    };
  }
  function joinGroup() {
    if(GH.state.group)return GH.toast('你已加入健康圈，請先退出再加入');
    GH.sheet('加入健康圈', '<form id="p2-join-form" class="p2-form"><label>五位數邀請碼<input name="code" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" required placeholder="請輸入邀請碼"></label><button class="p2-primary full">加入健康圈</button></form>');
    document.getElementById('p2-join-form').onsubmit = e => {
      e.preventDefault(); if(GH.state.group)return GH.toast('你已加入健康圈');const code = String(new FormData(e.target).get('code')).trim();
      if (code !== '00000') return GH.toast('邀請碼錯誤，請確認後再試一次');
      if (GH.state.disbandedGroupIds?.includes('circle-family')) return GH.sheet('邀請碼已失效','<p>這個健康圈已解散，請向圈主索取新邀請碼。</p><button class="p2-secondary full" data-close-sheet>我知道了</button>');
      const target=GH.state.circleDirectory?.['circle-family'] || (GH.state.group?.id==='circle-family'?GH.state.group:{id:'circle-family',name:'我們家的健康圈',code:'00000',members:seedMembers.filter(m=>m.name!=='我')});
      const permission=GH.family.joinPermission(target);if(!permission.allowed)return permission.reason==='already'?GH.toast('你已加入這個健康圈'):GH.sheet('健康圈已滿員','<p>這個健康圈已達5人上限，請聯繫圈主。</p><button class="p2-secondary full" data-close-sheet>我知道了</button>');
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      GH.set(s => {
        s.group = { ...target, code, members: [{...seedMembers[0],id:s.member.id||'demo-member-self',joinedAt:dayKey(new Date()),lastLoginAt:new Date().toISOString(),careConsent:false},...target.members.map(m=>({...m,joinedAt:m.joinedAt||dayKey(new Date())}))] };
        s.posts = [
          { id: 'sample-1', author: '爸爸', time: '昨天', createdAt: yesterday.toISOString(), text: '傍晚到公園走了走，今天的步數也達標了。', kind: '生活近況', comments: [{ author: '媽媽', text: '下次一起去！' }], likes: 2, place: '信義區' },
          { id: 'sample-2', author: '媽媽', time: '今天', createdAt: new Date().toISOString(), text: '完成今天的運動紀錄，感覺精神不錯。', kind: '健康紀錄', comments: [], likes: 1, metric: '運動 25 分鐘' },
          { id: 'sample-3', author: '姊姊', time: '今天', createdAt: new Date(Date.now()-3600000).toISOString(), text: '找到一條樹蔭很多的步道，週末一起去走走吧。', kind: '地點分享', place: '大安森林公園', comments: [], likes: 2 }
        ];
      });
      visiblePosts=5;GH.family.period();GH.save();GH.closeSheet();render();main().scrollTop=0;GH.family.careConsent();
    };
  }
  function invite() {
    if(GH.state.group.members.length>=5)return GH.sheet('健康圈已滿員','<p>每個健康圈最多5位成員，包含圈主。目前無法邀請新成員。</p><button class="p2-secondary full" data-close-sheet>我知道了</button>');
    GH.sheet('邀請成員', '<p>分享邀請碼，讓家人與好友加入「' + esc(GH.state.group.name) + '」。</p><div class="p2-invite-code">' + esc(GH.state.group.code) + '</div><button class="p2-primary full" id="p2-copy-code">複製邀請碼</button>');
    document.getElementById('p2-copy-code').onclick = async () => { try { await navigator.clipboard.writeText(GH.state.group.code); GH.toast('邀請碼已複製'); } catch (_) { GH.toast('請長按邀請碼複製'); } };
  }
  function groupSettings() {
    const owner=GH.state.group.members.some(m=>m.name==='我'&&m.role==='圈主');
    const locationState=myLocationState();
    GH.sheet('健康圈設定','<div class="p2-group-setting-actions p2-circle-settings">'+(owner?'<button id="p2-edit-circle-name" class="p2-secondary full">編輯健康圈名稱</button>':'<div class="p2-setting-readonly"><strong>健康圈名稱</strong><p>'+esc(GH.state.group.name)+'</p><small>由圈主修改</small></div>')+(owner?'<button id="p2-manage-members" class="p2-secondary full">管理成員與親友關係</button>':'')+'<button id="p2-edit-nickname" class="p2-secondary full">編輯我的暱稱</button><button id="p2-care-settings" class="p2-secondary full">家人關心提醒設定</button><div class="p2-info-list"><p><strong>邀請碼</strong><br>'+esc(GH.state.group.code)+'</p><p><strong>健康與位置資料由本人決定是否分享</strong><br>加入健康圈不會自動公開健康數值、日記或位置。</p></div><button id="p2-leave" class="p2-quiet full">退出健康圈</button></div>');
    document.getElementById('p2-edit-circle-name')?.addEventListener('click',editCircleName);
    document.getElementById('p2-manage-members')?.addEventListener('click',GH.family.manageMembers);
    document.getElementById('p2-care-settings').onclick=GH.family.careConsent;
    document.getElementById('p2-edit-nickname').onclick = editNickname;
    document.getElementById('p2-leave').textContent=owner?'解散健康圈':'退出健康圈';
    document.getElementById('p2-leave').onclick = () => {
      const groupId=GH.state.group?.id;if(!groupId)return;
      GH.sheet(owner?'解散健康圈？':'退出健康圈？','<p>'+(owner?'你是圈主。解散後，所有成員都將離開健康圈，邀請碼也會失效。已領取的個人健康點與參與紀錄會保留。':'退出後，你不再計入這個圈的任務解鎖人數，也無法查看圈內近況。已領取的健康點與個人參與紀錄會保留。')+'</p><div class="p2-actions"><button class="p2-secondary" data-close-sheet>取消</button><button class="p2-danger" id="p2-confirm-leave">'+(owner?'確認解散':'確認退出')+'</button></div>');
      document.getElementById('p2-confirm-leave').onclick=()=>{
        const current=GH.state.group,isOwner=current?.members.some(m=>m.name==='我'&&m.role==='圈主');
        if(current?.id!==groupId||isOwner!==owner)return GH.toast('健康圈權限已變更，請重新查看');
        GH.family.remember();
        GH.set(s=>{s.circleDirectory||={};if(owner){delete s.circleDirectory[groupId];s.disbandedGroupIds||=[];if(!s.disbandedGroupIds.includes(groupId))s.disbandedGroupIds.push(groupId);}else s.circleDirectory[groupId]={...current,members:current.members.filter(m=>m.name!=='我')};(s.careEvents||[]).filter(e=>e.groupId===groupId).forEach(e=>e.withdrawn=true);s.notifications.filter(n=>n.groupId===groupId).forEach(n=>n.read=true);s.group=null;s.posts=[];});
        GH.closeSheet();render();
      };
    };
  }

  function memberSheet(name) {
    const member = GH.state.group.members.find(m => m.name === name);
    const status=locationStatus(member);
    const locationCard=name==='我'?'':status.available?'<a class="p2-member-location-card" href="group.html?view=location&member='+encodeURIComponent(name)+'"><span class="p2-icon"><i class="fa-solid fa-location-dot"></i></span><span><strong>查看最後位置</strong><small>'+esc(status.label)+' · '+esc(member.lastLocation.place||member.lastLocation.area||'位置附近')+'</small></span><i class="fa-solid fa-chevron-right"></i></a>':'<div class="p2-member-location-card is-disabled"><span class="p2-icon"><i class="fa-solid fa-location-dot"></i></span><span><strong>'+esc(status.label)+'</strong><small>'+esc(status.reason)+'</small></span></div>';
    GH.sheet(displayName(name) + '的近況', '<div class="p2-member-detail">' + GH.avatar(member,{label:displayName(name)}) + '<strong>' + esc(displayName(name)) + '</strong><p>' + esc(member.status || '一起參與健康圈') + '</p></div>'+locationCard+(name === '我' ? '<a class="p2-secondary full" href="health.html">查看我的紀錄</a>' : '<button id="p2-send-care" class="p2-primary full">傳送關心</button>'));
    const care = document.getElementById('p2-send-care'); if (care) care.onclick = () => sendCare(name);
  }
  function postMarkup(p) {
    const author=GH.state.group?.members.find(m=>m.name===p.author)||{name:p.author};
    return '<article class="p2-social-post"><div class="p2-post-heading">' + GH.avatar(author,{label:displayName(p.author)}) + '<div><strong>' + esc(displayName(p.author)) + '</strong><small>' + esc(p.time) + ' · ' + esc(p.kind)+(p.originalDate?' · 心情日期 '+esc(p.originalDate)+(p.originalTime?' '+esc(p.originalTime):''):'') + '</small></div>'+(GH.ownsContent(p)?'<button type="button" class="p2-icon-btn p2-delete-post" data-delete-post="'+esc(p.id)+'" aria-label="刪除我的貼文"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>':'')+'</div><p class="p2-post-copy">' + esc(p.text) + '</p>' + (p.place ? '<div class="p2-post-tag"><i class="fa-solid fa-location-dot"></i> ' + esc(p.place) + '</div>' : '') + (p.mood ? '<div class="p2-shared-mood">'+GH.art('mood-'+(moodChoices.find(x=>x[0]===p.mood)?.[1] || 'calm'))+'<strong>'+esc(p.mood)+'</strong></div>' : '') + (p.metric ? '<div class="p2-post-tag"><i class="fa-solid fa-heart-pulse"></i> ' + esc(p.metric) + '</div>' : '') + '<div class="p2-post-actions"><button data-like="' + esc(p.id) + '" aria-pressed="'+(p.likedByMe?'true':'false')+'"><i class="'+(p.likedByMe?'fa-solid':'fa-regular')+' fa-heart"></i> 鼓勵 ' + Number(p.likes || 0) + '</button><button data-comment="' + esc(p.id) + '"><i class="fa-regular fa-comment"></i> 留言 ' + (p.comments || []).length + '</button></div>' + (p.url ? '<a class="p2-secondary" style="margin-top:12px" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' + (p.kind === '文章分享' ? '閱讀文章' : '查看地點') + '</a>' : '') + '</article>';
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
    node.innerHTML = GH.family.careCards() + (posts.length ? '<div class="p2-feed">' + shown + '</div>' + (visiblePosts < posts.length ? '<button id="p2-more-posts" class="p2-secondary full p2-more-posts">載入更多近況</button>' : '') : '<div class="p2-empty"><i class="fa-regular fa-comments"></i><h3>最近還沒有近況</h3><p>分享今天的一件小事，開啟健康圈的對話。</p></div>');GH.family.bindCare(renderFeed);
    const more = document.getElementById('p2-more-posts');
    if (more) more.onclick = () => { visiblePosts += 10; renderFeed(); };
    node.querySelectorAll('[data-like]').forEach(b => b.onclick = () => { GH.set(s => { const p = s.posts.find(x => x.id === b.dataset.like); if (!p) return; p.likedByMe=!p.likedByMe;p.likes=Math.max(0,Number(p.likes||0)+(p.likedByMe?1:-1)); }); renderFeed(); });
    node.querySelectorAll('[data-comment]').forEach(b => b.onclick = () => comment(b.dataset.comment));
    node.querySelectorAll('[data-delete-post]').forEach(b=>b.onclick=()=>deletePost(b.dataset.deletePost));
  }
  function compose() {
    GH.sheet('分享近況', '<form id="p2-post-form" class="p2-form"><label>今天想分享什麼？<textarea name="text" maxlength="300" required placeholder="寫下生活中的一件小事"></textarea></label><button class="p2-primary full">分享給健康圈</button></form>');
    document.getElementById('p2-post-form').onsubmit = e => { e.preventDefault(); const text = String(new FormData(e.target).get('text')).trim(); if (!text) return; GH.set(s => s.posts.unshift({ id: String(Date.now()), author: '我', time: '剛剛', createdAt: new Date().toISOString(), text, kind: '生活近況', comments: [], likes: 0 })); GH.closeSheet(); renderFeed(); GH.toast('近況已分享'); };
  }
  function deletePost(id){
    const groupId=GH.state.group?.id,post=GH.state.posts.find(x=>x.id===id);if(!post||!GH.ownsContent(post))return;
    GH.confirmDelete('刪除這則貼文？','刪除後，這則貼文及所有附屬留言都不再顯示，且無法復原。若由心情日記分享，私人日記仍會保留。',()=>{
      const current=GH.state.posts.find(x=>x.id===id);
      if(!groupId||GH.state.group?.id!==groupId||!current||!GH.ownsContent(current))return GH.toast('貼文狀態已變更，請重新查看');
      GH.set(s=>s.posts=s.posts.filter(x=>x.id!==id));renderFeed();GH.toast('貼文已刪除');
    });
  }
  function comment(id,options={}) {
    const post=GH.state.posts.find(x=>x.id===id),groupId=GH.state.group?.id;if(!post||!groupId)return;
    let shown=options.shown||3,sending=false;
    (post.comments||[]).forEach(c=>c.id||=crypto.randomUUID());GH.save();
    GH.sheet('留言','<div class="p2-comment-parent"><strong>'+esc(displayName(post.author))+'</strong><p>'+esc(post.text)+'</p></div><p id="p2-comment-total" class="p2-subtle"></p><div id="p2-comment-history"></div><form id="p2-comment-form" class="p2-form"><label>留言<textarea name="text" maxlength="150" required placeholder="寫一句關心，和家人聊聊"></textarea></label><small id="p2-comment-counter" class="p2-comment-counter">0／150 字</small><button id="p2-send-comment" class="p2-primary full" disabled>送出留言</button><p id="p2-comment-status" class="p2-small" role="status"></p></form>');
    const form=document.getElementById('p2-comment-form'),field=form.querySelector('textarea'),button=document.getElementById('p2-send-comment');field.value=options.draft||'';
    const draw=()=>{
      const comments=(post.comments||[]).map((item,index)=>({item,index,time:Date.parse(item.createdAt)||((Date.parse(post.createdAt)||0)+index)})).sort((a,b)=>a.time-b.time||a.index-b.index),visible=comments.slice(-shown);
      document.getElementById('p2-comment-total').textContent='共 '+comments.length+' 則留言'+(comments.length?' · 顯示 '+Math.min(shown,comments.length)+' 則':'');
      document.getElementById('p2-comment-history').innerHTML=(shown<comments.length?'<button id="p2-earlier-comments" type="button" class="p2-secondary full">查看更早留言</button>':'')+'<div class="p2-comment-thread">'+(visible.length?visible.map(({item:c})=>{const person=GH.state.group?.members.find(m=>m.name===c.author)||{name:c.author};return '<article class="p2-comment-entry">'+GH.avatar(person,{label:displayName(c.author)})+'<div><div class="p2-comment-heading"><strong>'+esc(displayName(c.author))+'</strong><time>'+esc(Number.isFinite(Date.parse(c.createdAt))?new Date(c.createdAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'先前留言')+'</time></div><p>'+esc(c.text)+'</p>'+(GH.ownsContent(c)?'<button type="button" class="p2-delete-link" data-delete-comment="'+esc(c.id)+'">刪除我的留言</button>':'')+'</div></article>';}).join(''):'<p class="p2-comment-empty">還沒有留言，傳一句關心給家人吧。</p>')+'</div>';
      document.getElementById('p2-earlier-comments')?.addEventListener('click',()=>{shown+=10;draw();});
      document.querySelectorAll('[data-delete-comment]').forEach(control=>control.onclick=()=>{
        const target=post.comments.find(c=>c.id===control.dataset.deleteComment);if(!target||!GH.ownsContent(target))return;
        const restore=()=>comment(id,{shown,draft:field.value});
        GH.confirmDelete('刪除這則留言？','刪除後無法復原，其他人的留言不受影響。',()=>{
          const current=GH.state.posts.find(x=>x.id===id),entry=current?.comments?.find(c=>c.id===target.id);
          if(GH.state.group?.id!==groupId||!entry||!GH.ownsContent(entry))return GH.toast('留言狀態已變更，請重新查看');
          GH.set(()=>current.comments=current.comments.filter(c=>c.id!==entry.id));renderFeed();restore();GH.toast('留言已刪除');
        },restore);
      });
    };
    const update=()=>{document.getElementById('p2-comment-counter').textContent=field.value.length+'／150 字';button.disabled=sending||!field.value.trim()||field.value.length>150;};
    draw();quickCare(form);field.addEventListener('input',update);update();
    form.onsubmit=e=>{
      e.preventDefault();if(sending)return;
      const text=field.value.trim();if(!text||text.length>150)return;
      if(GH.state.group?.id!==groupId||!GH.state.posts.some(x=>x.id===id))return GH.toast('健康圈或貼文已變更，請重新開啟');
      sending=true;update();
      GH.set(s=>{const current=s.posts.find(x=>x.id===id);current.comments||=[];current.comments.push({id:crypto.randomUUID(),author:'我',authorId:s.member.id||'demo-member-self',text,createdAt:new Date().toISOString()});});
      form.reset();sending=false;draw();update();renderFeed();document.getElementById('p2-comment-status').textContent='留言已送出';
    };
  }
  function editCircleName() {
    const isOwner=()=>GH.state.group?.members.some(m=>m.name==='我'&&m.role==='圈主');
    if(!isOwner())return;
    GH.sheet('編輯健康圈名稱','<form id="p2-circle-name-form" class="p2-form"><label>健康圈名稱<input name="name" maxlength="20" required value="'+esc(GH.state.group.name)+'"></label><p class="p2-small p2-muted">所有成員會看到新名稱，邀請碼與既有分享保持不變。</p><div class="p2-actions"><button class="p2-primary">儲存名稱</button><button type="button" id="p2-cancel-circle-name" class="p2-secondary">取消</button></div></form>');
    document.getElementById('p2-cancel-circle-name').onclick=groupSettings;
    document.getElementById('p2-circle-name-form').onsubmit=e=>{e.preventDefault();if(!isOwner())return;const name=String(new FormData(e.target).get('name')).trim();if(!name)return GH.toast('請輸入健康圈名稱');GH.set(s=>s.group.name=name);GH.closeSheet();render();GH.toast('健康圈名稱已更新');};
  }
  function editNickname() {
    GH.sheet('健康圈暱稱','<form id="p2-nickname-form" class="p2-form"><p>只影響這個健康圈的名稱顯示，不更動 HAPPY GO 會員資料。</p><label>我的暱稱<input name="nickname" maxlength="12" required value="'+esc(GH.state.group.nickname || '我')+'"></label><button class="p2-primary full">儲存暱稱</button></form>');
    document.getElementById('p2-nickname-form').onsubmit=e=>{e.preventDefault();const nickname=String(new FormData(e.target).get('nickname')).trim();if(!nickname)return;GH.set(s=>s.group.nickname=nickname);GH.closeSheet();render();GH.toast('健康圈暱稱已更新');};
  }
  function shareMood() {
    GH.sheet('分享現在的心情','<form id="p2-mood-share-form" class="p2-form"><fieldset class="p2-mood-choices"><legend>選擇想分享的心情</legend>'+moodChoices.map(([label,key])=>'<label class="p2-mood-choice"><input type="radio" name="mood" value="'+label+'" required>'+GH.art('mood-'+key)+'<span>'+label+'</span><i class="fa-solid fa-check"></i></label>').join('')+'</fieldset><label>補充一句話（選填）<textarea name="note" maxlength="200"></textarea></label><label class="p2-mood-save-option"><input type="checkbox" name="saveDiary"> 同時存成我的心情日記</label><p class="p2-small">分享給：'+esc(GH.state.group.name)+'。私人日記不會自動分享。</p><button id="p2-confirm-mood-share" class="p2-primary full" disabled>確認分享心情</button></form>');
    const form=document.getElementById('p2-mood-share-form');
    form.onchange=()=>document.getElementById('p2-confirm-mood-share').disabled=!form.querySelector('[name=mood]:checked');
    form.onsubmit=e=>{e.preventDefault();if(!GH.state.group)return;const f=new FormData(form),mood=String(f.get('mood')),note=String(f.get('note')||'').trim();if(!moodChoices.some(x=>x[0]===mood))return;document.getElementById('p2-confirm-mood-share').disabled=true;const id=String(Date.now());GH.set(s=>{s.posts.unshift({id,author:'我',createdAt:new Date().toISOString(),time:'剛剛',kind:'心情分享',mood,text:note || '今天的心情：'+mood,comments:[],likes:0});if(f.has('saveDiary'))s.moods.push({...GH.createMoodEntry(mood,note),id});});GH.closeSheet();renderFeed();GH.toast('心情已分享');};
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
  document.addEventListener('gh:circle-refresh', render);
  document.addEventListener('DOMContentLoaded', render);
})();
