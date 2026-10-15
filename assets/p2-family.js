(function(){
 'use strict';
 const GH=window.GH,esc=GH.escape,today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
 const dateOffset=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});};
 const owner=()=>GH.state.group?.members.some(m=>m.name==='我'&&m.role==='圈主');
 const relationships=[['配偶／伴侶',['配偶','伴侶']],['父母／子女',['父親','母親','兒子','女兒']],['兄弟姊妹',['哥哥','弟弟','姊姊','妹妹']],['祖孫',['爺爺','奶奶','外公','外婆','孫子','孫女','外孫子','外孫女']],['其他親屬',['堂兄弟','堂姊妹','表兄弟','表姊妹','伯父','叔叔','姑姑','舅舅','阿姨','姪子','姪女','外甥','外甥女']],['非親屬',['朋友','其他']]];
 function weekRange(){const d=new Date(today()+'T12:00:00+08:00'),offset=(d.getUTCDay()+6)%7;const start=new Date(d.getTime()-offset*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'}),end=new Date(d.getTime()+(6-offset)*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});return {start,end};}
 function period(){
  const s=GH.state,g=s.group;if(!g)return null;g.id||='circle-'+crypto.randomUUID();s.taskPeriods||={};
  let p=s.taskPeriods[g.id];
  if(p&&p.end<today()&&!s.demoClosedWeek){(window.GH_DEMO?.tasks||[]).forEach(t=>recordResult(t,taskStatus(t,p)));s.pastTaskPeriods||=[];if(!s.pastTaskPeriods.some(x=>x.id===p.id))s.pastTaskPeriods.push(p);p=null;}
  if(!p){const range=weekRange();p=s.taskPeriods[g.id]={id:g.id+':'+range.start,...range,members:g.members.map(m=>m.name),unlocked:{},completed:{},completionDates:{}};}
  p.unlocked||={};p.completed||={};p.completionDates||={};g.members.forEach(m=>{if(!p.members.includes(m.name))p.members.push(m.name);});return p;
 }
 function taskStatus(t,existing){
  const s=GH.state,g=s.group,p=existing||period();if(!p)return {count:0,joined:false,label:'共同任務預覽',active:false};
  const key=p.id+':'+t.id,completed=p.completed[t.id]||=[],active=today()>=p.start&&today()<=p.end;
  p.completionDates||={};p.completionDates[t.id]||={};
  const valid=r=>r.date>=p.start&&r.date<=p.end&&r.date<=today();
  const has=(rows,type,min)=>rows.some(r=>r.type===type&&r.value>=min&&valid(r));
  if(active)g.members.forEach(m=>{
   const rows=m.name==='我'?(s.device==='connected'?s.records.filter(r=>s.healthPreferences.includes(r.type)&&/手機|裝置/.test(r.source)):[]):(m.healthRecords||[]);
   const games=(m.name==='我'?s.gameHistory:m.gameHistory)||[];
   const eligible=t.type==='gameDays'?new Set(games.filter(r=>r.completed===true&&valid(r)).map(r=>r.date)).size>=t.min:t.type==='both'?has(rows,'steps',6000)&&has(rows,'exercise',15):has(rows,t.type,t.min);
   if(eligible&&!completed.includes(m.name)){completed.push(m.name);p.completionDates[t.id][m.name]=today();}
  });
  if(completed.length>=t.members)p.unlocked[t.id]=true;
  const self=completed.includes('我'),unlocked=!!p.unlocked[t.id],claimed=s.taskClaims.includes(key);
  const label=claimed?'已領取健康點':!active?'本期已結束':self&&unlocked?'可領取健康點':self?'你已完成，等待家人達標':unlocked?'團隊已解鎖，完成即可領獎':'一起完成，解鎖獎勵';
  return {key,period:p,count:completed.length,completedMembers:completed,joined:true,enrolled:true,self,unlocked,claimed,active,canClaim:active&&self&&unlocked&&!claimed,label};
 }
 function activeTasks(){const p=period();return !p||today()>=p.start&&today()<=p.end?(window.GH_DEMO?.tasks||[]):[];}
 function recordResult(t,x){
  if(!x.self)return;const s=GH.state;
  let row=s.activityHistory.find(r=>r.claimKey===x.key);
  if(!row){row={taskId:t.id,claimKey:x.key,periodId:x.period.id,periodStart:x.period.start,periodEnd:x.period.end,groupId:s.group.id,groupName:s.group.name,title:t.title,date:x.period.completionDates?.[t.id]?.['我']||x.period.start,points:t.points,kind:'健康圈任務'};s.activityHistory.unshift(row);}
  row.periodEnd=x.period.end;row.teamCompleted=x.unlocked;
  row.status=x.claimed?'claimed':!x.active?(x.unlocked?'expired':'team_expired'):x.unlocked?'pending':'waiting';
 }
 function remember(){
  if(!GH.state.group||!window.GH_DEMO)return;
  window.GH_DEMO.tasks.forEach(t=>{const x=taskStatus(t);recordResult(t,x);if(x.canClaim&&!GH.state.notifications.some(n=>n.id==='reward-'+x.key))GH.state.notifications.unshift({id:'reward-'+x.key,title:'可以領取健康點了',detail:t.title+'已解鎖，請於'+x.period.end+' 23:59前領取。',url:'activities.html',actionLabel:'前往領取',read:false});});
 }
 function claim(t){const x=taskStatus(t);if(!x.canClaim)return false;GH.set(s=>{s.taskClaims.push(x.key);s.pointAwards.unshift({id:x.key,title:t.title,points:t.points,date:today()});s.notifications.filter(n=>n.id==='reward-'+x.key).forEach(n=>n.read=true);});return true;}
 function completedMarkup(task){
  const x=taskStatus(task),g=GH.state.group;if(!g)return '';
  if(!x.completedMembers.length)return '<p class="p2-completed-empty">還沒有成員完成，一起開始吧</p>';
  const names=x.completedMembers.map(name=>{const member=g.members.find(m=>m.name===name);return name==='我'?(g.nickname||'我'):member?(member.nickname||member.name):'已離開成員';});
  return '<div class="p2-completed-members" aria-label="已完成成員">'+names.map((label,i)=>'<span class="p2-completed-person"><span class="p2-avatar" aria-hidden="true">'+esc(label.slice(0,1))+'</span><span>'+esc(label)+(x.completedMembers[i]==='我'?'・你已完成':'')+'</span></span>').join('')+'</div><p class="p2-completed-note">'+(x.unlocked?'團隊已解鎖，完成者皆可各自領獎':'還差 '+Math.max(0,task.members-x.count)+' 人解鎖')+'</p>';
 }
 function joinPermission(group){if(group.members.some(m=>m.name==='我'))return {allowed:false,reason:'already'};return {allowed:group.members.length<5,reason:group.members.length>=5?'full':null};}
 function manageMembers(){
  if(!owner())return;const g=GH.state.group;
  GH.sheet('管理成員','<p>設定你與成員的關係，或將成員移出健康圈。關係只有你能查看。</p><div class="p2-list">'+g.members.filter(m=>m.name!=='我').map((m,i)=>'<button class="p2-list-card" data-relation="'+i+'"><span class="body"><strong>'+esc(m.name)+'</strong><small>與我的關係：'+esc(m.relationship||'未設定')+'</small></span><i class="fa-solid fa-chevron-right"></i></button>').join('')+'</div>'+(g.members.length===1?'<p>邀請親友加入後，就能管理成員。</p>':''));
  document.querySelectorAll('[data-relation]').forEach(b=>b.onclick=()=>{const m=g.members.filter(m=>m.name!=='我')[Number(b.dataset.relation)];GH.sheet('管理 '+esc(m.name),'<form id="p2-relation-form" class="p2-form"><p>'+esc(m.name)+'</p><label>與我的關係<select name="relationship"><option value="">未設定</option>'+relationships.map(([title,items])=>'<optgroup label="'+title+'">'+items.map(x=>'<option'+(m.relationship===x?' selected':'')+'>'+x+'</option>').join('')+'</optgroup>').join('')+'</select></label><p class="p2-small">此關係由你填寫，僅供健康圈管理使用。</p><button class="p2-primary full">儲存關係</button></form><button type="button" id="p2-remove-member" class="p2-danger full">將 '+esc(m.name)+' 移出健康圈</button>');document.getElementById('p2-relation-form').onsubmit=e=>{e.preventDefault();if(!owner())return;const value=String(new FormData(e.target).get('relationship'));if(value&&!relationships.some(x=>x[1].includes(value)))return;GH.set(()=>m.relationship=value);manageMembers();};document.getElementById('p2-remove-member').onclick=()=>{if(!owner())return;GH.sheet('移出 '+esc(m.name)+'？','<p>移出後，'+esc(m.name)+' 將無法查看這個健康圈的近況，也無法繼續參與本圈任務。已領取的個人健康點不受影響。</p><div class="p2-actions"><button type="button" class="p2-secondary" data-close-sheet>取消</button><button type="button" class="p2-danger" id="p2-confirm-remove">確認移出</button></div>');document.getElementById('p2-confirm-remove').onclick=()=>{if(!owner())return;GH.set(s=>{if(s.group?.id!==g.id)return;s.group.members=s.group.members.filter(member=>member!==m);if(s.circleDirectory?.[g.id])s.circleDirectory[g.id].members=s.group.members;});GH.closeSheet();manageMembers();document.dispatchEvent(new Event('gh:circle-refresh'));GH.toast('已將 '+m.name+' 移出健康圈');};};});
 }
 function careConsent(){
  const me=GH.state.group.members.find(m=>m.name==='我');
  GH.sheet('家人關心提醒','<form id="p2-care-consent" class="p2-form"><p>若你七天未登入、七天未完成遊戲，或近 30 天的健康資料持續符合關心條件，系統會提醒圈內其他成員。</p><p>健康判定至少需要 21 天有效資料；同一狀況持續時，每週最多提醒一次。通知不公開完整健康數值，也不代表醫療警報。</p><label class="p2-mood-save-option"><input type="checkbox" name="consent"'+(me.careConsent?' checked':'')+'> 我同意向家人發出關心提醒</label><button class="p2-primary full">儲存設定</button></form>');
  document.getElementById('p2-care-consent').onsubmit=e=>{e.preventDefault();GH.set(()=>me.careConsent=new FormData(e.target).has('consent'));evaluateCare();GH.closeSheet();location.reload();};
 }
 function healthConditions(m){
  const isSelf=m.name==='我',s=GH.state,rows=isSelf?(s.device==='connected'?s.records.filter(r=>s.healthPreferences.includes(r.type)):[]):(m.healthRecords||[]),from=dateOffset(-30),to=dateOffset(-1);
  const valid=type=>{const dates=new Map();rows.filter(r=>r.type===type&&r.date>=from&&r.date<=to&&r.validDay===true&&r.fullDay===true&&(type!=='sleep'||r.sleepDailyTotal===true)&&Number.isFinite(Number(r.value))).forEach(r=>dates.set(r.date,Number(r.value)));return [...dates.entries()].sort((a,b)=>a[0].localeCompare(b[0]));};
  const sustained=(entries,threshold)=>{if(entries.length<21)return null;const latest=entries.filter(([date])=>date>=dateOffset(-7));if(latest.length<4)return false;const average=latest.reduce((sum,[,value])=>sum+value,0)/latest.length;return entries.filter(([,value])=>value<threshold).length>=8&&average<threshold;};
  const age=isSelf?(s.member.age||null):m.age,sleep=valid('sleep'),steps=valid('steps');
  return {sleep:age>=18?sustained(sleep,7):null,steps:m.stepReminderApplicable===false||(isSelf&&s.member.stepReminderApplicable===false)?null:sustained(steps,5000)};
 }
 function evaluateCare(){
  const s=GH.state,g=s.group;if(!g)return;s.careEvents||=[];s.careEpisodes||={};const cutoff=dateOffset(-7),week=7*86400000,now=Date.now();
  const labels={login:'近期較少登入，邀請他回來看看',game:'近期較少完成動腦遊戲',sleep:'近 30 天有多次睡眠少於 7 小時',steps:'近 30 天有多次每日步數少於 5,000 步'};
  g.members.forEach(m=>{
   const joined=m.joinedAt||today(),health=healthConditions(m),conditions={login:(m.lastLoginAt||joined)<=cutoff,game:(m.lastGameAt||joined)<=cutoff,...health};
   if(!m.careConsent){s.careEvents.filter(e=>e.groupId===g.id&&e.subject===m.name).forEach(e=>{e.withdrawn=true;});Object.keys(s.careEpisodes).filter(k=>k.startsWith(g.id+':'+m.name+':')).forEach(k=>s.careEpisodes[k].active=false);return;}
   const activeRules=[],notifyRules=[];
   Object.entries(conditions).forEach(([rule,value])=>{const key=g.id+':'+m.name+':'+rule,ep=s.careEpisodes[key]||={active:false,lastNotifiedAt:null};if(value===null)return;if(!value){ep.active=false;return;}activeRules.push(rule);const due=!ep.active||!ep.lastNotifiedAt||now-new Date(ep.lastNotifiedAt).getTime()>=week;if(!ep.active){ep.active=true;ep.since=new Date().toISOString();}if(due)notifyRules.push(rule);});
   s.careEvents.filter(e=>e.groupId===g.id&&e.subject===m.name&&!e.withdrawn).forEach(e=>{e.rules=(e.rules||[]).filter(rule=>activeRules.includes(rule));e.reasons=e.rules.map(rule=>labels[rule]);if(!e.rules.length)e.withdrawn=true;});
   if(!activeRules.length||!notifyRules.length)return;
   let event=s.careEvents.find(e=>e.groupId===g.id&&e.subject===m.name&&!e.withdrawn&&now-new Date(e.createdAt).getTime()<week);
   if(event){event.rules=[...new Set([...(event.rules||[]),...activeRules])];event.reasons=event.rules.map(r=>labels[r]);return;}
   event={id:crypto.randomUUID(),groupId:g.id,subject:m.name,rules:activeRules,reasons:activeRules.map(r=>labels[r]),createdAt:new Date().toISOString(),recipients:g.members.filter(x=>x.name!==m.name).map(x=>x.name),responses:[]};s.careEvents.unshift(event);notifyRules.forEach(rule=>{s.careEpisodes[g.id+':'+m.name+':'+rule].lastNotifiedAt=event.createdAt;});
   if(event.recipients.includes('我')){
    let notification=s.notifications.find(n=>n.careBatch===today()&&n.groupId===g.id);
    if(!notification){notification={id:'care-batch-'+g.id+'-'+today(),careBatch:today(),groupId:g.id,careIds:[],title:'家人有值得關心的近況',detail:'傳句話，讓家人感受到你的陪伴。',url:'group.html',read:false};s.notifications.unshift(notification);}notification.careIds.push(event.id);
   }
  });GH.save();
 }
 function visibleCare(){evaluateCare();const g=GH.state.group;return g?(GH.state.careEvents||[]).filter(e=>e.groupId===g.id&&!e.withdrawn&&Date.now()-new Date(e.createdAt).getTime()<7*86400000&&e.recipients.includes('我')):[];}
 function careCards(){const events=visibleCare();if(!events.length)return '';return '<div class="p2-card warm p2-care-summary"><h3>最近有 '+events.length+' 位家人值得關心</h3>'+events.map((e,i)=>'<div class="p2-care-person '+(i>=3?'p2-care-extra':'')+'" '+(i>=3?'hidden':'')+'><div><strong>'+esc(e.subject)+'</strong><p>'+esc(e.reasons.join('；'))+'</p></div><button class="p2-text-button" data-care-event="'+e.id+'">'+(e.responses.some(r=>r.author==='我')?'已關心':'關心')+'</button></div>').join('')+(events.length>3?'<button id="p2-more-care" class="p2-text-button">查看其他 '+(events.length-3)+' 位家人</button>':'')+'</div>';}
 function bindCare(refresh){document.getElementById('p2-more-care')?.addEventListener('click',e=>{document.querySelectorAll('.p2-care-extra').forEach(n=>n.hidden=false);e.currentTarget.remove();});document.querySelectorAll('[data-care-event]').forEach(b=>b.onclick=()=>{const event=GH.state.careEvents.find(e=>e.id===b.dataset.careEvent);GH.sheet('關心'+esc(event.subject),'<form id="p2-care-event-form" class="p2-form"><div class="p2-quick-care">'+['最近還好嗎？有空一起聊聊','今天也一起加油','辛苦了，記得休息'].map(x=>'<button type="button" data-care-reply="'+x+'">'+x+'</button>').join('')+'</div><label>想說的話<textarea name="text" maxlength="200" required></textarea></label><button class="p2-primary full">確認送出</button></form>');document.querySelectorAll('[data-care-reply]').forEach(x=>x.onclick=()=>document.querySelector('#p2-care-event-form textarea').value=x.dataset.careReply);document.getElementById('p2-care-event-form').onsubmit=e=>{e.preventDefault();const text=String(new FormData(e.target).get('text')).trim();if(!text||event.withdrawn||!event.recipients.includes('我'))return;GH.set(()=>event.responses.push({author:'我',text}));GH.closeSheet();refresh();};});}
 function shareDiary(id,refresh){
  const entry=GH.state.moods.find(m=>m.id===id);if(!entry)return;
  if(!GH.state.group)return GH.sheet('分享心情','<p>心情已保留在你的私人日記。加入健康圈後，就能分享給家人。</p><a class="p2-primary full" href="group.html">前往健康圈</a>');
  const posted=(GH.state.posts||[]).some(p=>p.diaryId===id);
  GH.sheet(posted?'再次分享心情':'預覽分享心情','<form id="p2-diary-share-form" class="p2-form"><p><strong>'+esc(entry.value)+'</strong> · '+esc(entry.date)+'</p><p>分享給：'+esc(GH.state.group.name)+'</p>'+(posted?'<p>這筆日記已分享過，確認後會新增一則貼文。</p>':'')+(entry.note?'<label class="p2-mood-save-option"><input type="checkbox" name="includeNote"> 加入原本的日記文字</label>':'')+'<label>補充一句話（選填）<textarea name="text" maxlength="200"></textarea></label><p class="p2-small">私人日記不會自動公開。日後修改日記，不會改動已發布貼文。</p><button class="p2-primary full">確認分享到健康圈</button></form>');
  document.getElementById('p2-diary-share-form').onsubmit=e=>{e.preventDefault();e.target.querySelector('button').disabled=true;const f=new FormData(e.target),note=String(f.get('text')||'').trim();GH.set(s=>s.posts.unshift({id:crypto.randomUUID(),author:'我',kind:'心情分享',mood:entry.value,diaryId:id,originalDate:entry.date,originalTime:entry.time||'',createdAt:new Date().toISOString(),time:'剛剛',text:[f.has('includeNote')?entry.note:'',note].filter(Boolean).join('\n')||'分享'+entry.date+'的心情：'+entry.value,comments:[],likes:0}));GH.closeSheet();refresh?.();GH.toast('心情已分享至健康圈');};
 }
 GH.family=window.GH_FAMILY={completedMarkup,joinPermission,weekRange,activeTasks,healthConditions,visibleCare,shareDiary,taskStatus,remember,claim,manageMembers,careConsent,evaluateCare,careCards,bindCare,relationships,period};
 document.addEventListener('DOMContentLoaded',()=>{const me=GH.state.group?.members.find(m=>m.name==='我');if(me)me.lastLoginAt=today();evaluateCare();});
})();
