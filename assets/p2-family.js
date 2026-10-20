(function(){
 'use strict';
 const GH=window.GH,esc=GH.escape,today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
 const owner=()=>GH.state.group?.members.some(m=>m.name==='我'&&m.role==='圈主');
 const relationships=[['配偶／伴侶',['配偶','伴侶']],['父母／子女',['父親','母親','兒子','女兒']],['兄弟姊妹',['哥哥','弟弟','姊姊','妹妹']],['祖孫',['爺爺','奶奶','外公','外婆','孫子','孫女','外孫子','外孫女']],['其他親屬',['堂兄弟','堂姊妹','表兄弟','表姊妹','伯父','叔叔','姑姑','舅舅','阿姨','姪子','姪女','外甥','外甥女']],['非親屬',['朋友','其他']]];
 function dayShift(date,days){return new Date(new Date(date+'T12:00:00+08:00').getTime()+days*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});}
 function weekRange(date=today()){const d=new Date(date+'T12:00:00+08:00'),offset=(d.getUTCDay()+6)%7;return {start:dayShift(date,-offset),end:dayShift(date,6-offset)};}
 // Demo identities stay stable across circles; production uses the HG Health ID.
 function memberId(m){if(!m)return '';return m.id||=(m.name==='我'?(GH.state.member.id||'demo-member-self'):'demo-member-'+m.name);}
 function achievementKey(m,t,p){return memberId(m)+':'+p.start+':'+t.id;}
 function claimRecord(t,p){
  const s=GH.state,id=s.member.id||'demo-member-self',key=id+':'+p.start+':'+t.id;s.taskClaimLedger||={};
  if(!s.taskClaimLedger[key]){
   const periods=[...Object.values(s.taskPeriods||{}),...(s.pastTaskPeriods||[])];
   const previous=periods.find(old=>old.start===p.start&&(s.taskClaims||[]).includes(old.id+':'+t.id));
   if(previous)s.taskClaimLedger[key]={groupId:previous.id.slice(0,previous.id.lastIndexOf(':')),periodStart:p.start,taskId:t.id,memberId:id};
  }
  return {key,record:s.taskClaimLedger[key]};
 }
 function period(){
  const s=GH.state,g=s.group;if(!g)return null;g.id||='circle-'+crypto.randomUUID();s.taskPeriods||={};
  let p=s.taskPeriods[g.id];
  if(p&&p.end<today()&&!s.demoClosedWeek){(window.GH_DEMO?.tasks||[]).forEach(t=>recordResult(t,taskStatus(t,p)));s.pastTaskPeriods||=[];if(!s.pastTaskPeriods.some(x=>x.id===p.id))s.pastTaskPeriods.push(p);p=null;}
  if(!p){const range=weekRange();p=s.taskPeriods[g.id]={id:g.id+':'+range.start,...range,members:g.members.map(m=>m.name),unlocked:{},completed:{},completionDates:{}};}
  p.unlocked||={};p.completed||={};p.completionDates||={};
  if(!p.rulesVersion||p.rulesVersion<2){delete p.completed.group_balance;delete p.unlocked.group_balance;}
  p.rulesVersion=3;g.members.forEach(m=>{memberId(m);if(!p.members.includes(m.name))p.members.push(m.name);});return p;
 }
 function taskStatus(t,existing){
  const s=GH.state,g=s.group,p=existing||period();if(!p||!g)return {count:0,joined:false,label:'共同任務預覽',active:false};
  const key=p.id+':'+t.id,active=today()>=p.start&&today()<=p.end;
  p.completed||={};p.completionDates||={};p.completionDates[t.id]||={};s.taskAchievements||={};
  const valid=r=>r.date>=p.start&&r.date<=p.end&&r.date<=today();
  const has=(rows,type,min)=>rows.some(r=>r.type===type&&Number(r.value)>=min&&valid(r));
  const total=(rows,type)=>[...rows.filter(r=>r.type===type&&valid(r)).reduce((days,r)=>days.set(r.date,Number(r.value)),new Map()).values()].reduce((a,b)=>a+b,0);
  let completed=p.completed[t.id]||[];
  if(active){
   g.members.forEach(m=>{
    const akey=achievementKey(m,t,p);
    // Migrate established local qualifications without reading revoked health data again.
    if(completed.includes(m.name)&&!s.taskAchievements[akey])s.taskAchievements[akey]={memberId:memberId(m),periodStart:p.start,taskId:t.id,achievedAt:p.completionDates[t.id][m.name]||today()};
    const rows=m.name==='我'?(s.device==='connected'?s.records.filter(r=>s.healthPreferences.includes(r.type)&&/手機|裝置/.test(r.source)):[]):(m.healthRecords||[]);
    const games=(m.name==='我'?s.gameHistory:m.gameHistory)||[],journals=m.name==='我'?(s.moods||[]):(m.moods||[]);
    const diaryDays=new Set(journals.filter(r=>r.value).map(r=>r.createdAt?new Date(r.createdAt).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'}):r.date).filter(date=>date>=p.start&&date<=p.end&&date<=today())).size;
    const sleepDays=new Set(rows.filter(r=>r.type==='sleep'&&Number(r.value)>0&&r.sleepDailyTotal===true&&valid(r)).map(r=>r.date)).size;
    const eligible=t.type==='gameDays'?new Set(games.filter(r=>r.completed===true&&valid(r)).map(r=>r.date)).size>=t.min:t.type==='moodDays'?diaryDays>=t.min:t.type==='both'?has(rows,'steps',6000)&&total(rows,'exercise')>=15&&sleepDays>=3:t.type==='exercise'?total(rows,'exercise')>=t.min:has(rows,t.type,t.min);
    if(eligible&&!s.taskAchievements[akey])s.taskAchievements[akey]={memberId:memberId(m),periodStart:p.start,taskId:t.id,achievedAt:today()};
   });
   // Team unlock follows current membership, while qualifications and payouts persist.
   completed=g.members.filter(m=>s.taskAchievements[achievementKey(m,t,p)]).map(m=>m.name);
   p.completed[t.id]=completed;
   completed.forEach(name=>{const m=g.members.find(x=>x.name===name);p.completionDates[t.id][name]=s.taskAchievements[achievementKey(m,t,p)].achievedAt;});
   p.unlocked[t.id]=completed.length>=t.members;
  }
  const payout=claimRecord(t,p),self=completed.includes('我'),unlocked=!!p.unlocked[t.id],claimed=!!payout.record,claimedElsewhere=claimed&&payout.record.groupId!==g.id;
  const stateKey=claimed?'claimed':!active?'closed':self&&unlocked?'ready':self?'self':unlocked?'unlocked':completed.length?'progress':'new';
  const label=claimed?(claimedElsewhere?'本週已領取':'已領取'):!active?'本期已結束':self&&unlocked?'已完成待領取':self?'本人已完成':unlocked?'團隊已解鎖':completed.length?'進行中':'尚未開始';
  return {key,claimKey:payout.key,period:p,count:completed.length,completedMembers:completed,joined:true,enrolled:true,self,unlocked,claimed,claimedElsewhere,active,canClaim:active&&self&&unlocked&&!claimed,label,stateKey};
 }
 function activeTasks(){const p=period();return !p||today()>=p.start&&today()<=p.end?(window.GH_DEMO?.tasks||[]):[];}
 function recordResult(t,x){
  if(!x.self||x.claimedElsewhere)return;const s=GH.state;
  let row=s.activityHistory.find(r=>r.claimKey===x.key);
  if(!row){row={taskId:t.id,claimKey:x.key,periodId:x.period.id,periodStart:x.period.start,periodEnd:x.period.end,groupId:s.group.id,groupName:s.group.name,title:t.title,date:x.period.completionDates?.[t.id]?.['我']||x.period.start,points:t.points,kind:'健康圈任務'};s.activityHistory.unshift(row);}
  row.periodEnd=x.period.end;row.teamCompleted=x.claimed?true:x.unlocked;
  row.status=x.claimed?'claimed':!x.active?(x.unlocked?'expired':'team_expired'):x.unlocked?'pending':'waiting';
 }
 function remember(){
  if(!GH.state.group||!window.GH_DEMO)return;
  window.GH_DEMO.tasks.forEach(t=>{const x=taskStatus(t);recordResult(t,x);const notificationId='reward-'+x.key;
   if(!x.canClaim)GH.state.notifications.filter(n=>n.id===notificationId).forEach(n=>n.read=true);
   else if(!GH.state.notifications.some(n=>n.id===notificationId))GH.state.notifications.unshift({id:notificationId,title:'可以領取健康點了',detail:t.title+'已解鎖，請於'+x.period.end+' 23:59前領取。',url:'activities.html',actionLabel:'前往領取',read:false});
  });
 }
 function claim(t){const x=taskStatus(t);if(!x.canClaim)return false;GH.set(s=>{
  s.taskClaimLedger[x.claimKey]={memberId:s.member.id||'demo-member-self',taskId:t.id,periodStart:x.period.start,groupId:s.group.id,createdAt:new Date().toISOString()};
  if(!s.taskClaims.includes(x.key))s.taskClaims.push(x.key);
  s.pointAwards.unshift({id:x.claimKey,title:t.title,points:t.points,date:today()});s.notifications.filter(n=>n.id==='reward-'+x.key).forEach(n=>n.read=true);
 });return true;}
 function completedMarkup(task){
  const x=taskStatus(task),g=GH.state.group;if(!g)return '';
  const members=g.members.map(member=>{const label=member.name==='我'?(g.nickname||'我'):(member.nickname||member.name),done=x.completedMembers.includes(member.name);return '<span class="p2-task-member '+(done?'is-complete':'is-pending')+'">'+GH.avatar(member,{label,check:done})+'<small>'+esc(label)+'</small></span>';});
  const remaining=Math.max(0,task.members-x.count);
  const note=x.claimedElsewhere?'已在其他健康圈領取，仍可協助本圈解鎖':x.claimed?'本週獎勵已領取':x.self&&x.unlocked?'請於本週期限內領取':x.self?'再 '+remaining+' 人即可解鎖':x.unlocked?'完成任務即可領取':x.count?'再 '+remaining+' 人即可解鎖':'等待成員開始任務';
  return '<div class="p2-task-member-progress"><div class="p2-task-result-row"><span class="p2-task-state '+esc(x.stateKey)+'">'+esc(x.label)+'</span><strong>'+x.count+' 人達成</strong></div><div class="p2-task-members" aria-label="全體成員完成狀態">'+members.join('')+'</div><p class="p2-completed-note">'+esc(note)+'</p></div>';
 }
 function joinPermission(group){if(group.members.some(m=>m.name==='我'))return {allowed:false,reason:'already'};return {allowed:group.members.length<5,reason:group.members.length>=5?'full':null};}
 function manageMembers(){
  if(!owner())return;const g=GH.state.group;
  GH.sheet('管理成員','<p>設定你與成員的關係，或將成員移出健康圈。關係只有你能查看。</p><div class="p2-list">'+g.members.filter(m=>m.name!=='我').map((m,i)=>'<button class="p2-list-card" data-relation="'+i+'"><span class="body"><strong>'+esc(m.name)+'</strong><small>與我的關係：'+esc(m.relationship||'未設定')+'</small></span><i class="fa-solid fa-chevron-right"></i></button>').join('')+'</div>'+(g.members.length===1?'<p>邀請親友加入後，就能管理成員。</p>':''));
  document.querySelectorAll('[data-relation]').forEach(b=>b.onclick=()=>{const m=g.members.filter(m=>m.name!=='我')[Number(b.dataset.relation)];GH.sheet('管理 '+esc(m.name),'<form id="p2-relation-form" class="p2-form"><p>'+esc(m.name)+'</p><label>與我的關係<select name="relationship"><option value="">未設定</option>'+relationships.map(([title,items])=>'<optgroup label="'+title+'">'+items.map(x=>'<option'+(m.relationship===x?' selected':'')+'>'+x+'</option>').join('')+'</optgroup>').join('')+'</select></label><p class="p2-small">此關係由你填寫，僅供健康圈管理使用。</p><button class="p2-primary full">儲存關係</button></form><button type="button" id="p2-remove-member" class="p2-danger full">將 '+esc(m.name)+' 移出健康圈</button>');document.getElementById('p2-relation-form').onsubmit=e=>{e.preventDefault();if(!owner())return;const value=String(new FormData(e.target).get('relationship'));if(value&&!relationships.some(x=>x[1].includes(value)))return;GH.set(()=>m.relationship=value);manageMembers();};document.getElementById('p2-remove-member').onclick=()=>{if(!owner())return;GH.sheet('移出 '+esc(m.name)+'？','<p>移出後，'+esc(m.name)+' 將無法查看這個健康圈的近況，也無法繼續參與本圈任務。已領取的個人健康點不受影響。</p><div class="p2-actions"><button type="button" class="p2-secondary" data-close-sheet>取消</button><button type="button" class="p2-danger" id="p2-confirm-remove">確認移出</button></div>');document.getElementById('p2-confirm-remove').onclick=()=>{if(!owner())return;GH.set(s=>{if(s.group?.id!==g.id)return;s.group.members=s.group.members.filter(member=>member!==m);if(s.circleDirectory?.[g.id])s.circleDirectory[g.id].members=s.group.members;});GH.closeSheet();manageMembers();document.dispatchEvent(new Event('gh:circle-refresh'));GH.toast('已將 '+m.name+' 移出健康圈');};};});
 }
 function careConsent(){
  const me=GH.state.group?.members.find(m=>m.name==='我');if(!me)return;
  GH.sheet('家人關心提醒','<form id="p2-care-consent" class="p2-form"><p>同意後，系統每週整理值得家人關心的近況，提供給健康圈其他成員。</p><div class="p2-info-list"><p><strong>參與近況</strong><br>加入滿七天後，七天未使用 GO HEALTH，或七天未完成動腦遊戲。</p><p><strong>上週睡眠與走動</strong><br>上週至少五天有有效資料，其中至少三天睡眠少於七小時，或步數少於 5,000 步。</p></div><p>每週一整理，同一家人的原因合併顯示，每週最多通知一次；不公開逐日數值，也不是醫療警報。你可以隨時關閉。</p><label class="p2-mood-save-option"><input type="checkbox" name="consent"'+(me.careConsent?' checked':'')+'> 我同意讓圈內家人收到關心提醒</label><button class="p2-primary full">儲存設定</button></form>');
  document.getElementById('p2-care-consent').onsubmit=e=>{e.preventDefault();GH.set(()=>me.careConsent=new FormData(e.target).has('consent'));evaluateCare();GH.closeSheet();location.reload();};
 }
 function careWeek(){const current=weekRange();return {...current,from:dayShift(current.start,-7),to:dayShift(current.start,-1)};}
 function healthConditions(m,range=careWeek()){
  const isSelf=m.name==='我',s=GH.state,rows=isSelf?(s.device==='connected'?s.records.filter(r=>s.healthPreferences.includes(r.type)):[]):(m.healthRecords||[]);
  const sustained=(type,threshold)=>{
   const days=new Map();rows.filter(r=>r.type===type&&r.date>=range.from&&r.date<=range.to&&r.validDay===true&&r.fullDay===true&&(type!=='sleep'||r.sleepDailyTotal===true)&&r.value!==null&&r.value!==''&&Number.isFinite(Number(r.value))&&Number(r.value)>=0&&(type!=='sleep'||Number(r.value)>0)).forEach(r=>days.set(r.date,Number(r.value)));
   return days.size<5?null:[...days.values()].filter(value=>value<threshold).length>=3;
  };
  const age=isSelf?s.member.age:m.age;
  return {sleep:age>=18?sustained('sleep',7):null,steps:m.stepReminderApplicable===false||(isSelf&&s.member.stepReminderApplicable===false)?null:sustained('steps',5000)};
 }
 const careTime=value=>{if(!value)return null;const n=Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T00:00:00+08:00':value);return Number.isFinite(n)?n:null;};
 function evaluateCare(){
  const s=GH.state,g=s.group;if(!g)return;s.careEvents||=[];
  if(s.careRulesVersion!==2){s.careEvents.forEach(e=>e.withdrawn=true);s.notifications.filter(n=>n.careBatch).forEach(n=>n.read=true);s.careRulesVersion=2;}
  const range=careWeek(),cutoff=careTime(range.start),sevenDays=7*86400000;
  const labels={login:'已有七天未使用 GO HEALTH，邀請他回來看看',game:'已有七天未完成動腦遊戲',sleep:'上週有幾天休息較少，傳句話關心一下',steps:'上週有幾天走動較少，有空一起散步吧'};
  // Withdraw access immediately after consent or membership changes. Old weeks are history only.
  s.careEvents.filter(e=>e.groupId===g.id).forEach(e=>{
   const member=g.members.find(m=>memberId(m)===e.subjectId||(!e.subjectId&&m.name===e.subject));
   if(!member?.careConsent){e.withdrawn=true;s.notifications.filter(n=>n.careEventId===e.id).forEach(n=>n.read=true);}
  });
  g.members.forEach(m=>{
   if(!m.careConsent)return;
   const id=memberId(m),joined=careTime(m.joinedAt)??Date.now(),oldEnough=joined<=cutoff-sevenDays;
   const games=m.name==='我'?s.gameHistory:(m.gameHistory||[]);
   const gameTimes=games.filter(r=>r.completed===true).map(r=>careTime(r.completedAt||r.date)).filter(n=>n!==null);
   const lastLogin=Math.max(joined,careTime(m.lastLoginAt)??joined),lastGame=Math.max(joined,careTime(m.lastGameAt)??joined,...gameTimes);
   const health=healthConditions(m,range),conditions={login:oldEnough&&lastLogin<=cutoff-sevenDays,game:oldEnough&&lastGame<=cutoff-sevenDays,...health};
   const rules=Object.entries(conditions).filter(([,value])=>value===true).map(([key])=>key);
   let event=s.careEvents.find(e=>e.groupId===g.id&&e.subjectId===id&&e.weekStart===range.start);
   if(!event&&!rules.length)return;
   if(!event){event={id:crypto.randomUUID(),groupId:g.id,subject:m.name,subjectId:id,weekStart:range.start,weekEnd:range.end,observationStart:range.from,observationEnd:range.to,createdAt:new Date().toISOString(),responses:[]};s.careEvents.unshift(event);}
   event.subject=m.name;event.rules=rules;event.reasons=rules.map(rule=>labels[rule]);event.withdrawn=false;event.closed=!rules.length;
   event.recipients=g.members.filter(x=>memberId(x)!==id).map(x=>x.name);
   const notificationId='care-week-'+g.id+'-'+id+'-'+range.start;
   if(event.closed){s.notifications.filter(n=>n.careEventId===event.id).forEach(n=>n.read=true);return;}
   // Late uploads update this week's single summary, never a second notification.
   if(event.recipients.includes('我')&&!s.notifications.some(n=>n.id===notificationId))s.notifications.unshift({id:notificationId,careEventId:event.id,careWeek:range.start,groupId:g.id,title:'本週一起關心'+m.name,detail:'家人有值得關心的近況，傳句話陪伴一下。',url:'group.html',read:false});
  });GH.save();
 }
 function visibleCare(){evaluateCare();const g=GH.state.group,range=careWeek();return g?(GH.state.careEvents||[]).filter(e=>e.groupId===g.id&&e.weekStart===range.start&&!e.withdrawn&&!e.closed&&e.recipients.includes('我')):[];}
 function caredByMe(event){const id=GH.state.member.id||'demo-member-self';return (event.responses||[]).some(r=>r.authorId?r.authorId===id:r.author==='我');}
 function careCards(){
  const events=visibleCare();if(!events.length)return '';const range=careWeek(),pending=events.filter(e=>!caredByMe(e)),done=events.filter(caredByMe);
  const person=(e,i,answered=false)=>'<div class="p2-care-person '+(!answered&&i>=3?'p2-care-extra':'')+'" '+(!answered&&i>=3?'hidden':'')+'><div><strong>'+esc(e.subject)+'</strong><p>'+esc(e.reasons.join('；'))+'</p></div><button class="p2-text-button" data-care-event="'+esc(e.id)+'">'+(answered?'查看關心':'傳送關心')+'</button></div>';
  return '<div class="p2-card warm p2-care-summary"><h3>本週家人關心</h3><p class="p2-care-period">'+esc(range.start.slice(5).replace('-','/'))+'–'+esc(range.end.slice(5).replace('-','/'))+' · 每週一整理</p><p class="p2-care-intro">'+(pending.length?'有 '+pending.length+' 位家人可以傳句關心。':'本週已傳送關心，謝謝你的陪伴。')+'</p>'+pending.map((e,i)=>person(e,i)).join('')+(pending.length>3?'<button id="p2-more-care" class="p2-text-button">查看其他 '+(pending.length-3)+' 位家人</button>':'')+(done.length?'<details class="p2-care-done"><summary>本週已關心 '+done.length+' 位</summary>'+done.map((e,i)=>person(e,i,true)).join('')+'</details>':'')+'</div>';
 }
 function bindCare(refresh){
  document.getElementById('p2-more-care')?.addEventListener('click',e=>{document.querySelectorAll('.p2-care-extra').forEach(n=>n.hidden=false);e.currentTarget.remove();});
  document.querySelectorAll('[data-care-event]').forEach(b=>b.onclick=()=>{
   const event=visibleCare().find(e=>e.id===b.dataset.careEvent);if(!event)return;
   const response=(event.responses||[]).find(r=>r.authorId?r.authorId===(GH.state.member.id||'demo-member-self'):r.author==='我');
   if(response)return GH.sheet('本週已關心'+esc(event.subject),'<p>你已傳送關心，這張卡只在你的畫面收合；其他圈員仍可關心。</p><div class="p2-card"><p>'+esc(response.text)+'</p></div><button class="p2-secondary full" data-close-sheet>完成</button>');
   GH.sheet('關心'+esc(event.subject),'<form id="p2-care-event-form" class="p2-form"><p>'+esc(event.reasons.join('；'))+'</p><div class="p2-quick-care">'+['最近還好嗎？有空一起聊聊','今天也一起加油','辛苦了，記得休息'].map(x=>'<button type="button" data-care-reply="'+x+'">'+x+'</button>').join('')+'</div><label>想說的話<textarea name="text" maxlength="150" required placeholder="寫一句關心的話"></textarea></label><p class="p2-small">訊息會顯示在健康圈近況；送出後只收合你自己的關心卡。</p><button class="p2-primary full">確認送出</button></form>');
   document.querySelectorAll('[data-care-reply]').forEach(x=>x.onclick=()=>document.querySelector('#p2-care-event-form textarea').value=x.dataset.careReply);
   document.getElementById('p2-care-event-form').onsubmit=e=>{
    e.preventDefault();const text=String(new FormData(e.target).get('text')).trim();if(!text||text.length>150)return;
    if(!visibleCare().some(current=>current.id===event.id)||caredByMe(event))return GH.toast('提醒狀態已更新，請重新查看');
    e.target.querySelector('button[type="submit"],button.p2-primary').disabled=true;
    GH.set(s=>{const now=new Date().toISOString(),postId=crypto.randomUUID();event.responses.push({author:'我',authorId:s.member.id||'demo-member-self',text,createdAt:now,postId});s.posts.unshift({id:postId,groupId:s.group.id,author:'我',kind:'關心訊息',text:'給'+event.subject+'：'+text,createdAt:now,time:'剛剛',comments:[],likes:0});s.notifications.filter(n=>n.careEventId===event.id).forEach(n=>n.read=true);});
    GH.closeSheet();refresh();GH.toast('關心已送出');
   };
  });
 }
 function shareDiary(id,refresh,draft={}){
  const entry=GH.state.moods.find(m=>m.id===id);if(!entry)return;
  if(!GH.state.group)return GH.sheet('分享心情','<p>心情已保留在你的私人日記。加入健康圈後，就能分享給家人。</p><a class="p2-primary full" href="group.html">前往健康圈</a>');
  const posted=(GH.state.posts||[]).some(p=>p.diaryId===id);
  GH.sheet(posted?'再次分享心情':'分享心情','<form id="p2-diary-share-form" class="p2-form"><div class="p2-share-source"><strong>'+esc(entry.value)+'</strong><span>'+esc(entry.date)+(entry.time?' '+esc(entry.time):'')+'</span></div><p>分享給：<strong>'+esc(GH.state.group.name)+'</strong></p>'+(posted?'<p class="p2-small">這筆心情已分享過，本次會新增一則貼文。</p>':'')+(entry.note?'<label class="p2-mood-save-option"><input type="checkbox" name="includeNote"'+(draft.includeNote?' checked':'')+'> 一併分享這篇日記的文字</label>':'')+'<label>想對家人說的話（選填）<textarea name="text" maxlength="200" placeholder="例如：今天心情很好，想和大家分享">'+esc(draft.text||'')+'</textarea></label><div class="p2-privacy"><i class="fa-solid fa-lock"></i><span>只有下一步預覽中的內容會發布；其他私人日記不會公開。</span></div><button class="p2-primary full">預覽分享內容</button></form>');
  document.getElementById('p2-diary-share-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),next={includeNote:f.has('includeNote'),text:String(f.get('text')||'').trim()};const text=[next.includeNote?entry.note:'',next.text].filter(Boolean).join('\n')||'分享 '+entry.date+' 的心情：'+entry.value;GH.sheet('確認分享內容','<div class="p2-share-preview"><p class="p2-subtle">將發布到 '+esc(GH.state.group.name)+'</p><div class="p2-share-preview-card"><strong>'+esc(entry.value)+'</strong><small>'+esc(entry.date)+(entry.time?' '+esc(entry.time):'')+'</small><p>'+esc(text)+'</p></div><p class="p2-small">發布後會保留這次預覽的內容；之後編輯私人日記，不會同步修改這則貼文。</p><div class="p2-actions"><button id="p2-confirm-diary-share" class="p2-primary">確認發布</button><button id="p2-back-diary-share" class="p2-secondary">返回修改</button></div></div>');document.getElementById('p2-back-diary-share').onclick=()=>shareDiary(id,refresh,next);document.getElementById('p2-confirm-diary-share').onclick=e=>{e.currentTarget.disabled=true;GH.set(s=>s.posts.unshift({id:crypto.randomUUID(),author:'我',kind:'心情分享',mood:entry.value,diaryId:id,originalDate:entry.date,originalTime:entry.time||'',createdAt:new Date().toISOString(),time:'剛剛',text,comments:[],likes:0}));GH.closeSheet();refresh?.();GH.toast('心情已分享至健康圈');};};
 }
 GH.family=window.GH_FAMILY={completedMarkup,joinPermission,weekRange,activeTasks,healthConditions,visibleCare,shareDiary,taskStatus,remember,claim,manageMembers,careConsent,evaluateCare,careCards,bindCare,relationships,period,memberId,careWeek,caredByMe};
 document.addEventListener('DOMContentLoaded',()=>{const me=GH.state.group?.members.find(m=>m.name==='我');if(me)me.lastLoginAt=new Date().toISOString();evaluateCare();});
})();
