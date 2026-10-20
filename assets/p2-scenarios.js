(function(){
 const GH=window.GH,param=new URLSearchParams(location.search),requested=param.get('scenario'),aliases={S01:'new',S02:'new',S03:'no-consent',S04:'all-metrics',S05:'owner',S06:'no-posts',S07:'care-many',S08:'family-location',S09:'task-wait',S10:'task-unlocked',S11:'task-ready',S12:'task-claimed',S13:'history',S14:'task-full',S15:'mood'},id=aliases[requested]||requested;if(!id)return;
 if(requested==='S13')param.set('view','history');
 const valid=['history','new','member','owner','no-posts','no-consent','no-data','one-metric','two-metrics','all-metrics','stale','care','care-health','family-location','task-wait','task-unlocked','task-ready','task-claimed','task-full','task-expired','task-next','task-joined','task-game','task-rollover','care-expired','care-many','care-recovered','care-insufficient','care-steps','mood'];if(!valid.includes(id))return;
 const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});};
 const s=GH.fresh();s.member.age=58;s.healthPreferences=[];s.taskPeriods={};s.careEvents=[];s.scenario=id;s.demoScenarioCode=requested;s.healthSync=null;
 s.guideMode=requested==='S01'?'demo':'off';s.guideProgress={};
 const rows=(steps,exercise)=>[{type:'steps',value:steps,date:day(0),source:'HAPPY GO App · 手機健康資料'},{type:'exercise',value:exercise,date:day(0),source:'HAPPY GO App · 手機健康資料'}];
 if(id!=='new')s.group={id:'circle-family',name:'我們家的健康圈',code:'00000',nickname:'小晴',members:[{name:'我',role:id==='owner'?'圈主':'成員',avatarUrl:'images/avatars/member-self.webp',joinedAt:day(-20),careConsent:id!=='no-consent',lastLoginAt:day(0),lastGameAt:day(0)},{name:'爸爸',role:id==='owner'?'成員':'圈主',avatarUrl:'images/avatars/member-father.webp',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:rows(7200,20)},{name:'媽媽',role:'成員',avatarUrl:'images/avatars/member-mother.webp',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:rows(8300,25)},{name:'姊姊',role:'成員',avatarUrl:'images/avatars/member-sister.webp',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:rows(6500,18)}]};
 if(id==='task-full')s.group.members.push({name:'阿姨',role:'成員',avatarUrl:'images/avatars/member-aunt.webp',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:[]});
 if(s.group&&!['no-posts','no-consent'].includes(id))s.posts=[{id:'sample-1',author:'媽媽',createdAt:new Date().toISOString(),time:'今天',kind:'生活近況',text:'今天到公園走走，和大家一起累積健康生活。',comments:[],likes:2}];
 if(!['new','no-data','no-consent'].includes(id)){
  s.device='connected';s.healthConsent=true;s.healthPreferences=id==='one-metric'?['steps']:id==='two-metrics'?['steps','sleep']:['steps','sleep','exercise','heart','weight'];
  const values={steps:7840,sleep:7.3,exercise:22,heart:72,weight:65};s.records=s.healthPreferences.map(type=>({type,value:values[type],date:day(id==='stale'?-12:0),source:'HAPPY GO App · 手機健康資料'}));s.healthUpdatedAt=new Date().toISOString();s.healthSync='ready';
 }
 if(id==='no-data'){s.device='connected';s.healthPreferences=['steps','sleep'];s.healthConsent=true;s.demoHealthMode='empty';}
 if(id==='stale')s.demoHealthMode='stale';
 if(id==='care'||id.startsWith('care-')){
  const current=GH.family.weekRange(),shift=(date,n)=>new Date(new Date(date+'T12:00:00+08:00').getTime()+n*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  const lastWeek=shift(current.start,-7),before=shift(current.start,-8),health=(type,low=true,count=7)=>Array.from({length:count},(_,i)=>({type,value:type==='sleep'?(low&&i<3?6:7.5):(low&&i<3?3800:6500),date:shift(lastWeek,i),validDay:true,fullDay:true,sleepDailyTotal:type==='sleep'}));
  s.careRulesVersion=2;s.group.members.forEach(m=>{m.joinedAt=shift(current.start,-30);m.lastLoginAt=day(0);m.lastGameAt=day(0);m.healthRecords=[];m.age=60;});
  const father=s.group.members[1],mom=s.group.members[2],sister=s.group.members[3];
  mom.healthRecords=health('sleep');
  if(id==='care'){mom.healthRecords=[];mom.lastLoginAt=before;mom.lastGameAt=before;}
  if(id==='care-insufficient')mom.healthRecords=health('sleep',true,4);
  if(id==='care-steps')mom.healthRecords=health('steps');
  if(id==='care-many'){
   father.lastLoginAt=before;mom.healthRecords=[...health('sleep'),...health('steps')];sister.lastGameAt=before;
   s.group.members.push({name:'阿姨',role:'成員',age:62,careConsent:true,joinedAt:shift(current.start,-30),lastLoginAt:day(0),lastGameAt:day(0),healthRecords:health('steps')});
  }
  if(id==='care-recovered')mom.healthRecords=health('sleep',false);
  if(param.get('careCase')==='returned'){father.lastLoginAt=new Date().toISOString();sister.lastGameAt=new Date().toISOString();}
  if(param.get('careCase')==='next-week'||id==='care-expired'){
   s.careEvents=[{id:'care-previous-week',groupId:s.group.id,subject:'媽媽',subjectId:'demo-member-媽媽',weekStart:lastWeek,weekEnd:shift(current.start,-1),rules:['sleep'],reasons:['上週有幾天休息較少'],recipients:['我','爸爸','姊姊'],responses:[{author:'我',text:'記得休息',createdAt:lastWeek+'T10:00:00+08:00'}],createdAt:lastWeek+'T00:00:00+08:00'}];
   if(id==='care-expired')mom.healthRecords=health('sleep',false);
  }
  s.demoCareCase=param.get('careCase')||'weekly';
 }

 if(id==='family-location'){
  const father=s.group.members.find(m=>m.name==='爸爸');
  father.status='剛更新了最後位置';
  father.locationSharing=true;
  father.lastLocation={lat:25.0338,lng:121.5350,area:'臺北市大安區',place:'大安森林公園附近',updatedAt:new Date(Date.now()-18*60000).toISOString()};
  s.demoFamilyLocation=true;
  const sister=s.group.members.find(m=>m.name==='姊姊');sister.locationSharing=true;sister.lastLocation={lat:25.0338,lng:121.5350,area:'臺北市大安區',updatedAt:new Date(Date.now()-8*86400000).toISOString()};
  const mom=s.group.members.find(m=>m.name==='媽媽');mom.locationSharing=true;mom.lastLocation={lat:25.0338,lng:121.5350,area:'臺北市大安區',place:'大安森林公園附近',updatedAt:new Date(Date.now()-2*86400000).toISOString()};
 }

 if(id.startsWith('task-')){
  const g=s.group,p={id:g.id+':'+GH.family.weekRange().start,...GH.family.weekRange(),members:g.members.map(m=>m.name),unlocked:{},completed:{}};s.taskPeriods[g.id]=p;
  if(id==='task-wait'){g.members.slice(1).forEach(m=>m.healthRecords=[]);}
  if(id==='task-unlocked'){s.records=[];s.demoHealthMode='empty';p.completed.group_steps=['爸爸','媽媽'];p.unlocked.group_steps=true;g.members.filter(m=>m.name==='姊姊').forEach(m=>m.healthRecords=[]);}
  if(id==='task-ready'||id==='task-claimed'){p.completed.group_steps=['我','爸爸','媽媽'];p.unlocked.group_steps=true;}
  if(id==='task-claimed'){const key=p.id+':group_steps';s.taskClaims=[key];s.pointAwards=[{id:key,title:'雙人步行接力',points:300,date:day(0)}];}
  if(id==='task-full'){s.records=[];s.demoHealthMode='empty';s.gameHistory=[];g.members.forEach(m=>{m.healthRecords=[];m.gameHistory=[];});p.completed.group_steps=['我'];p.completed.group_exercise=['爸爸','媽媽'];p.unlocked.group_exercise=true;}
  if(['task-expired','task-rollover'].includes(id)){p.start=day(-8);p.end=day(-2);p.completed.group_steps=['我','爸爸'];p.unlocked.group_steps=true;s.demoClosedWeek=id==='task-expired';}
  if(['task-next','task-joined'].includes(id)){p.members=p.members.filter(n=>n!=='我');g.members[0].joinedAt=day(0);s.records[0].date=p.start;}
  if(id==='task-game'){s.device='disconnected';s.records=[];s.healthPreferences=[];g.members.slice(1).forEach(m=>m.gameHistory=[{date:day(0),completed:true},{date:day(-1),completed:true}]);}
 }
 if(param.get('taskCase')==='all-claimed'&&id==='task-claimed'){
  const g=s.group,p=s.taskPeriods[g.id],selfId=s.member.id||'demo-member-self',now=new Date().toISOString();
  p.rulesVersion=2;p.completionDates={};s.taskClaims=[];s.pointAwards=[];s.taskClaimLedger={};s.taskAchievements={};
  GH_DEMO.tasks.forEach(t=>{
   p.completed[t.id]=['我','爸爸'];p.unlocked[t.id]=true;p.completionDates[t.id]={'我':p.start,'爸爸':p.start};
   ['我','爸爸'].forEach(name=>{const memberId=name==='我'?selfId:'demo-member-爸爸';s.taskAchievements[memberId+':'+p.start+':'+t.id]={memberId,periodStart:p.start,taskId:t.id,achievedAt:p.start};});
   const key=selfId+':'+p.start+':'+t.id;s.taskClaims.push(p.id+':'+t.id);s.taskClaimLedger[key]={memberId:selfId,taskId:t.id,periodStart:p.start,groupId:g.id,createdAt:now};
   s.pointAwards.push({id:key,title:t.title,points:t.points,date:day(0)});
  });
 }
 if(param.get('taskCase')==='switched'&&id==='task-claimed'){
  const old=s.group,range=GH.family.weekRange();s.group={...old,id:'circle-friends',name:'親友健康圈',members:old.members.map(m=>({...m}))};
  const oldKey='demo-member-self:'+range.start+':group_steps';s.taskClaimLedger={[oldKey]:{memberId:'demo-member-self',taskId:'group_steps',periodStart:range.start,groupId:old.id,createdAt:new Date().toISOString()}};
 }
 if(param.get('taskCase')==='member-exit'&&id==='task-full'){
  s.group.members.forEach(m=>m.role=m.name==='我'?'圈主':'成員');
  const p=s.taskPeriods[s.group.id];p.completed={group_steps:['我','爸爸']};p.unlocked={group_steps:true};
 }
 if(param.get('taskCase')==='revoked'&&id==='task-ready'){s.device='disconnected';s.healthPreferences=[];}
 if(param.has('taskCase'))s.demoTaskCase=param.get('taskCase');
 if(id==='mood'){
  const samples=[['開心','今天和家人一起散步，很開心。'],['疲倦','今天事情比較多，想早一點休息。'],['平靜','在家聽音樂，心情很放鬆。'],['開心','午餐吃到喜歡的料理。'],['焦慮','明天有事情要處理，提醒自己慢慢來。'],['平靜','傍晚散步吹吹風。'],['低落','今天有點提不起精神。'],['開心','和朋友聊了很久。'],['疲倦','昨晚睡得比較少。'],['平靜','今天過得很平穩。'],['開心','完成了想做的事情。'],['焦慮','事情有點多，先列清單整理。'],['平靜','泡杯茶休息一下。'],['開心','收到家人的關心。']];
  s.moods=samples.map(([value,note],i)=>({id:'mood-'+(i+1),date:day(-i*2),time:i%2?'21:10':'18:30',value,note}));
  s.moods.push({id:'mood-same-day',date:day(0),time:'08:20',value:'平靜',note:'早上喝杯茶，慢慢開始今天。'});
 }
 if(id==='mood')s.posts.unshift({id:'shared-mood-demo',author:'我',diaryId:'mood-1',mood:'開心',kind:'心情分享',text:'今天和家人一起散步，很開心。',createdAt:new Date().toISOString(),time:'今天',comments:[],likes:0});
 if(id==='new')s.gameHistory=[];
 if(requested==='S05'){s.group.members.push({name:'阿姨',role:'成員',avatarUrl:'images/avatars/member-aunt.webp',careConsent:false,lastLoginAt:day(0),lastGameAt:day(0)});}
 if(requested==='S05')s.posts.unshift({id:'my-demo-post',author:'我',createdAt:new Date().toISOString(),time:'剛剛',kind:'生活近況',text:'今天和家人一起走走，留下一段好心情。',comments:[],likes:0});
 if(requested==='S05'&&s.posts[0])s.posts[0].comments=Array.from({length:16},(_,i)=>({id:'comment-demo-'+i,author:s.group.members[i%5].name,text:['今天一起走走，很開心。','慢慢來，照自己的步調。','謝謝分享，記得好好休息。','下次也想一起去！'][i%4],createdAt:new Date(Date.now()-(16-i)*60000).toISOString()}));
 if(requested==='S06'){s.group.name='我的健康圈';s.group.members=[{name:'我',role:'圈主',avatarUrl:'images/avatars/member-self.webp',careConsent:false,lastLoginAt:day(0),lastGameAt:day(0)}];s.device='disconnected';s.healthPreferences=[];s.records=[];s.gameHistory=[];}
 if(id==='history'){
  const g=s.group,range=GH.family.weekRange(),p={id:g.id+':'+range.start,...range,members:g.members.map(m=>m.name),unlocked:{group_steps:true},completed:{group_steps:['我','爸爸']},completionDates:{}};
  s.taskPeriods[g.id]=p;g.members.slice(1).forEach(m=>m.healthRecords=[]);
  s.activityHistory=[{taskId:'group_steps',claimKey:'past-claimed',periodId:'past-1',periodEnd:day(-7),groupId:g.id,groupName:g.name,title:'雙人步行接力',date:day(-7),points:300,kind:'健康圈任務',teamCompleted:true,status:'claimed'},{taskId:'group_brain',claimKey:'past-expired',periodId:'past-2',periodEnd:day(-8),groupId:g.id,groupName:g.name,title:'一起動動腦',date:day(-8),points:300,kind:'健康圈任務',teamCompleted:true,status:'expired'}];
  s.pointAwards=[{id:'past-claimed',title:'雙人步行接力',points:300,date:day(-7)}];
 }
 Object.keys(GH.state).forEach(k=>delete GH.state[k]);Object.assign(GH.state,s);GH.save();GH.family.remember();GH.save();
 ['gohealth_p2_exchanges','gohealth_latest_exchange'].forEach(k=>sessionStorage.removeItem(k));
 param.delete('scenario');param.delete('careCase');param.delete('taskCase');history.replaceState(null,'',location.pathname+(param.size?'?'+param:'')+location.hash);
})();
