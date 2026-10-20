const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4175/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Taipei'});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.clock.setFixedTime(new Date('2026-10-22T12:00:00+08:00'));
 const go=path=>p.goto(base+path);
 const task=()=>p.evaluate(()=>GH.family.taskStatus(GH_DEMO.tasks[0]));
 fs.mkdirSync('qa/visuals',{recursive:true});
 try{
  await go('demo.html');assert.equal(await p.locator('.scenario-card').count(),18);assert.equal(await p.locator('a a').count(),0);
  for(const path of ['group.html?scenario=S07','group.html?scenario=S07&careCase=returned','group.html?scenario=S07&careCase=next-week','activities.html?scenario=S11&taskCase=revoked','activities.html?scenario=S12&taskCase=switched','group.html?scenario=S14&taskCase=member-exit']){
   await go(path);await p.locator('#p2-main h1').waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  console.log('PASS 18 guide cards and integrated subcases');

  await go('group.html?scenario=S07');
  const initial=await p.evaluate(()=>({week:GH.family.careWeek(),events:GH.family.visibleCare(),notices:GH.state.notifications.filter(n=>n.careWeek)}));
  assert.equal(initial.week.start,'2026-10-19');assert.equal(initial.week.from,'2026-10-12');assert.equal(initial.week.to,'2026-10-18');
  assert.equal(initial.events.length,4);assert.equal(initial.notices.length,4);assert.equal(initial.events.find(e=>e.subject==='媽媽').rules.length,2);
  assert.equal(await p.locator('.p2-care-person:visible').count(),3);await p.locator('#p2-more-care').click();assert.equal(await p.locator('.p2-care-person:visible').count(),4);
  await p.getByRole('button',{name:'傳送關心',exact:true}).first().click();await p.locator('#p2-care-event-form textarea').fill('最近還好嗎？有空一起聊聊');await p.locator('#p2-care-event-form .p2-primary').click();
  assert.match(await p.locator('.p2-care-done summary').innerText(),/已關心 1 位/);
  assert.equal(await p.locator('.p2-care-done').getAttribute('open'),null);
  assert.equal(await p.evaluate(()=>GH.state.posts.filter(x=>x.kind==='關心訊息').length),1);
  const independent=await p.evaluate(()=>{const e=GH.family.visibleCare().find(e=>GH.family.caredByMe(e)),saved=GH.state.member.id;GH.state.member.id='another-viewer';const result=GH.family.caredByMe(e);GH.state.member.id=saved;return result;});assert.equal(independent,false);
  await p.reload();assert.equal(await p.evaluate(()=>GH.state.notifications.filter(n=>n.careWeek==='2026-10-19').length),4);assert.match(await p.locator('.p2-care-done summary').innerText(),/1 位/);
  const conditions=await p.evaluate(()=>{const m=GH.state.group.members.find(m=>m.name==='媽媽'),rows=m.healthRecords;m.healthRecords=rows.filter(r=>r.type==='sleep').slice(0,4);const few=GH.family.healthConditions(m);m.healthRecords=rows.filter(r=>r.type==='sleep').map((r,i)=>({...r,value:i<2?6:8}));const two=GH.family.healthConditions(m);m.healthRecords=rows;return {few,two};});assert.equal(conditions.few.sleep,null);assert.equal(conditions.two.sleep,false);
  await p.evaluate(()=>{const g=GH.state.group;g.members.find(m=>m.name==='爸爸').lastLoginAt=new Date().toISOString();g.members.find(m=>m.name==='姊姊').lastGameAt=new Date().toISOString();GH.family.evaluateCare();});
  let members=await p.evaluate(()=>GH.family.visibleCare().map(e=>e.subject));assert.deepEqual(members.sort(),['媽媽','阿姨'].sort());
  await p.evaluate(()=>{const m=GH.state.group.members.find(m=>m.name==='媽媽');m.healthRecords.push({type:'sleep',date:'2026-10-22',value:8,validDay:true,fullDay:true,sleepDailyTotal:true});});
  assert.equal(await p.evaluate(()=>GH.family.visibleCare().find(e=>e.subject==='媽媽').rules.includes('sleep')),true);
  console.log('PASS weekly snapshot, thresholds, return/game resolution, per-viewer acknowledgement');

  await go('group.html?scenario=S07');
  await p.evaluate(()=>{const m=GH.state.group.members.find(m=>m.name==='媽媽');m.healthRecords=[];GH.family.evaluateCare();});
  assert.equal(await p.evaluate(()=>GH.family.visibleCare().some(e=>e.subject==='媽媽')),false);
  await p.evaluate(()=>{const m=GH.state.group.members.find(m=>m.name==='媽媽');m.healthRecords=Array.from({length:5},(_,i)=>({type:'sleep',date:'2026-10-'+String(12+i),value:i<3?6:8,validDay:true,fullDay:true,sleepDailyTotal:true}));GH.family.evaluateCare();GH.family.evaluateCare();});
  assert.equal(await p.evaluate(()=>GH.family.visibleCare().filter(e=>e.subject==='媽媽').length),1);
  assert.equal(await p.evaluate(()=>GH.state.notifications.filter(n=>n.careWeek==='2026-10-19'&&n.title.includes('媽媽')).length),1);
  await p.evaluate(()=>{GH.state.group.members.find(m=>m.name==='媽媽').careConsent=false;GH.family.evaluateCare();});assert.equal(await p.evaluate(()=>GH.family.visibleCare().some(e=>e.subject==='媽媽')),false);
  await p.evaluate(()=>{const m=GH.state.group.members.find(m=>m.name==='媽媽');m.careConsent=true;GH.family.evaluateCare();GH.family.visibleCare().find(e=>e.subject==='媽媽').responses.push({author:'我',text:'上週已關心'});m.healthRecords=Array.from({length:7},(_,i)=>({type:'sleep',date:'2026-10-'+String(19+i),value:i<3?6:8,validDay:true,fullDay:true,sleepDailyTotal:true}));GH.save();});
  await p.clock.setFixedTime(new Date('2026-10-26T00:00:00+08:00'));
  const next=await p.evaluate(()=>{const e=GH.family.visibleCare().find(e=>e.subject==='媽媽');return {week:e.weekStart,cared:GH.family.caredByMe(e),notices:GH.state.notifications.filter(n=>n.careWeek==='2026-10-26'&&n.title.includes('媽媽')).length};});
  assert.deepEqual(next,{week:'2026-10-26',cared:false,notices:1});
  await p.clock.setFixedTime(new Date('2026-10-22T12:00:00+08:00'));
  console.log('PASS late upload, consent withdrawal and next-week notification');

  await go('activities.html?scenario=S11&taskCase=revoked');assert.equal((await task()).canClaim,true);
  await p.locator('[data-task="group_steps"]').click();await p.locator('#p2-claim-task').click();assert.equal((await task()).claimed,true);
  assert.equal(await p.evaluate(()=>GH.family.claim(GH_DEMO.tasks[0])),false);
  const balance=await p.evaluate(()=>GH.pointBalance());
  await p.evaluate(()=>{const g=GH.state.group;GH.state.group={...g,id:'new-circle',name:'另一個健康圈',members:g.members.map(m=>({...m}))};GH.family.remember();GH.save();});
  const switched=await task();assert.equal(switched.self,true);assert.equal(switched.unlocked,true);assert.equal(switched.claimedElsewhere,true);assert.equal(switched.canClaim,false);assert.equal(await p.evaluate(()=>GH.pointBalance()),balance);
  await p.reload();assert.equal((await task()).claimedElsewhere,true);
  await go('activities.html?scenario=S12&taskCase=switched');assert.match(await p.locator('.p2-task-card').first().innerText(),/其他健康圈/);assert.equal((await task()).canClaim,false);
  console.log('PASS qualification after revocation, global weekly claims across circles, refresh');

  await go('group.html?scenario=S14&taskCase=member-exit');assert.equal((await task()).count,2);assert.equal((await task()).canClaim,true);
  await p.locator('#p2-group-menu').click();await p.locator('#p2-manage-members').click();await p.locator('[data-relation]').filter({hasText:'爸爸'}).click();await p.locator('#p2-remove-member').click();await p.locator('#p2-confirm-remove').click();
  const removed=await task();assert.equal(removed.count,1);assert.equal(removed.unlocked,false);assert.equal(removed.canClaim,false);
  await p.evaluate(()=>{GH.state.group.members.push({id:'new-qualified-person',name:'新朋友',healthRecords:[{type:'steps',date:GH.family.weekRange().start,value:5000}],joinedAt:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'})});GH.family.remember();GH.save();});assert.equal((await task()).canClaim,true);
  await p.evaluate(()=>GH.family.claim(GH_DEMO.tasks[0]));const earned=await p.evaluate(()=>GH.pointBalance());
  await p.evaluate(()=>{GH.set(s=>s.group.members=s.group.members.filter(m=>m.name!=='新朋友'));});assert.equal((await task()).unlocked,false);assert.equal((await task()).claimed,true);assert.equal(await p.evaluate(()=>GH.pointBalance()),earned);assert.equal(await p.evaluate(()=>GH.state.activityHistory.find(x=>x.taskId==='group_steps').teamCompleted),true);
  console.log('PASS member removal relocks, newly joined qualifiers, existing award survives');

  await go('activities.html?scenario=S09');
  const dates=await p.evaluate(()=>{const s=GH.state;s.taskAchievements={};s.taskClaimLedger={};s.taskPeriods={};s.group.members.forEach(m=>m.healthRecords=[]);s.device='connected';s.healthPreferences=['steps'];s.records=[{date:'2026-10-18',type:'steps',value:9000,source:'手機健康資料'}];const first=GH.family.taskStatus(GH_DEMO.tasks[0]);s.records.push({date:'2026-10-19',type:'steps',value:5000,source:'手機健康資料'});return {previous:first.self,current:GH.family.taskStatus(GH_DEMO.tasks[0]).self};});assert.deepEqual(dates,{previous:false,current:true});
  await go('activities.html?scenario=S13');assert.equal(await p.getByRole('button',{name:'領取',exact:true}).count(),0);assert.equal(await p.locator('[data-history-task]').count(),0);assert.ok(await p.getByRole('link',{name:'查看任務',exact:true}).count()>0);
  console.log('PASS task week boundaries and history navigation only');

  await go('health.html?view=mood&scenario=S15');const before=await p.evaluate(()=>GH.state.moods.length);
  await p.locator('[data-delete-mood="mood-1"]').click();assert.match(await p.locator('.p2-delete-description').innerText(),/貼文會保留/);await p.locator('#p2-cancel-delete').click();assert.equal(await p.evaluate(()=>GH.state.moods.length),before);
  await p.locator('[data-delete-mood="mood-1"]').click();await p.locator('#p2-confirm-delete').click();assert.equal(await p.evaluate(()=>GH.state.moods.length),before-1);assert.equal(await p.evaluate(()=>GH.state.posts.some(x=>x.diaryId==='mood-1')),true);
  const todayBall=p.locator('[data-mood-date="2026-10-22"]');assert.match(await todayBall.getAttribute('aria-label'),/平靜/);
  await go('group.html');await p.locator('[data-delete-post="shared-mood-demo"]').click();await p.locator('#p2-confirm-delete').click();assert.equal(await p.evaluate(()=>GH.state.posts.some(x=>x.id==='shared-mood-demo')),false);assert.equal(await p.evaluate(()=>GH.state.moods.length),before-1);
  await go('health.html?view=mood&scenario=S15');
  await p.evaluate(()=>{const s=GH.state;s.taskAchievements={};s.taskPeriods={};s.moods=['2026-10-19','2026-10-20','2026-10-21'].map((date,i)=>({id:'qualified-'+i,value:'平靜',date,time:'10:00',createdAt:date+'T10:00:00+08:00'}));GH.family.remember();GH.save();});
  assert.equal(await p.evaluate(()=>GH.family.taskStatus(GH_DEMO.tasks.find(t=>t.id==='group_mood')).self),true);await p.reload();await p.locator('[data-delete-mood="qualified-2"]').click();await p.locator('#p2-confirm-delete').click();assert.equal(await p.evaluate(()=>GH.family.taskStatus(GH_DEMO.tasks.find(t=>t.id==='group_mood')).self),true);
  console.log('PASS diary deletion, daily latest ball fallback, independent shared snapshot, qualified task retained');

  await go('group.html?scenario=S05');assert.equal(await p.locator('[data-delete-post]').count(),1);
  await p.locator('[data-comment="my-demo-post"]').click();assert.equal(await p.locator('.p2-comment-entry').count(),3);assert.equal(await p.locator('[data-delete-comment]').count(),1);
  await p.locator('#p2-comment-form textarea').fill('保留這份草稿');await p.locator('[data-delete-comment]').click();await p.locator('#p2-cancel-delete').click();assert.equal(await p.locator('#p2-comment-form textarea').inputValue(),'保留這份草稿');
  await p.locator('[data-delete-comment]').click();await p.locator('#p2-confirm-delete').click();assert.match(await p.locator('#p2-comment-total').innerText(),/15 則/);assert.equal(await p.locator('#p2-comment-form textarea').inputValue(),'保留這份草稿');
  await p.keyboard.press('Escape');await p.locator('[data-delete-post="my-demo-post"]').click();await p.locator('#p2-confirm-delete').click();assert.equal(await p.evaluate(()=>GH.state.posts.some(x=>x.id==='my-demo-post')),false);assert.equal(await p.evaluate(()=>GH.state.posts.some(x=>x.author==='媽媽')),true);
  console.log('PASS own-only post/comment deletion, cascade and cancelled draft preservation');

  await go('group.html?scenario=S05');
  await p.locator('#p2-group-menu').click();await p.locator('#p2-leave').click();await p.locator('#p2-sheet').getByRole('button',{name:'取消',exact:true}).click();assert.equal(await p.evaluate(()=>!!GH.state.group),true);
  await p.locator('#p2-group-menu').click();await p.locator('#p2-leave').click();await p.locator('#p2-confirm-leave').click();assert.equal(await p.evaluate(()=>GH.state.group),null);assert.equal(await p.evaluate(()=>GH.family.visibleCare().length),0);
  console.log('PASS cancelled then confirmed circle dissolution');

  for(const width of [320,390,480]){
   await p.setViewportSize({width,height:844});
   for(const [name,path] of [['weekly','group.html?scenario=S07'],['switched','activities.html?scenario=S12&taskCase=switched'],['mood','health.html?view=mood&scenario=S15']]){
    await go(path);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===390)await p.screenshot({path:'qa/visuals/weekly-'+name+'.png',fullPage:true});
   }
  }
  assert.deepEqual(errors,[]);console.log('ALL PASS: 320/390/480px and no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
