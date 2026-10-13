(function(){
 const GH=window.GH,param=new URLSearchParams(location.search),requested=param.get('scenario'),aliases={S01:'new',S02:'no-consent',S03:'all-metrics',S04:'owner',S05:'no-posts',S06:'care-many',S07:'task-wait',S08:'task-unlocked',S09:'task-ready',S10:'task-claimed',S11:'history',S12:'mood'},id=aliases[requested]||requested;if(!id)return;
 if(requested==='S11')param.set('view','history');
 const valid=['history','new','member','owner','no-posts','no-consent','no-data','one-metric','two-metrics','all-metrics','stale','care','care-health','task-wait','task-unlocked','task-ready','task-claimed','task-expired','task-next','task-joined','task-game','task-rollover','care-expired','care-many','care-recovered','care-insufficient','care-steps','mood'];if(!valid.includes(id))return;
 const day=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});};
 const s=GH.fresh();s.member.age=58;s.healthPreferences=[];s.taskPeriods={};s.careEvents=[];s.scenario=id;s.demoScenarioCode=requested;s.healthSync=null;
 const rows=(steps,exercise)=>[{type:'steps',value:steps,date:day(0),source:'HAPPY GO App · 手機健康資料'},{type:'exercise',value:exercise,date:day(0),source:'HAPPY GO App · 手機健康資料'}];
 if(id!=='new')s.group={id:'circle-family',name:'我們家的健康圈',code:'00000',nickname:'小晴',members:[{name:'我',role:id==='owner'?'圈主':'成員',joinedAt:day(-20),careConsent:id!=='no-consent',lastLoginAt:day(0),lastGameAt:day(0)},{name:'爸爸',role:id==='owner'?'成員':'圈主',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:rows(7200,20)},{name:'媽媽',role:'成員',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:rows(8300,25)},{name:'姊姊',role:'成員',joinedAt:day(-20),careConsent:true,lastLoginAt:day(0),lastGameAt:day(0),healthRecords:rows(6500,18)}]};
 if(s.group&&!['no-posts','no-consent'].includes(id))s.posts=[{id:'sample-1',author:'媽媽',createdAt:new Date().toISOString(),time:'今天',kind:'生活近況',text:'今天到公園走走，和大家一起累積健康生活。',comments:[],likes:2}];
 if(!['new','no-data','no-consent'].includes(id)){
  s.device='connected';s.healthConsent=true;s.healthPreferences=id==='one-metric'?['steps']:id==='two-metrics'?['steps','sleep']:['steps','sleep','exercise','heart','weight'];
  const values={steps:7840,sleep:7.3,exercise:22,heart:72,weight:65};s.records=s.healthPreferences.map(type=>({type,value:values[type],date:day(id==='stale'?-12:0),source:'HAPPY GO App · 手機健康資料'}));s.healthUpdatedAt=new Date().toISOString();s.healthSync='ready';
 }
 if(id==='no-data'){s.device='connected';s.healthPreferences=['steps','sleep'];s.healthConsent=true;s.demoHealthMode='empty';}
 if(id==='stale')s.demoHealthMode='stale';
 if(id==='care'){s.group.members[2].lastLoginAt=day(-8);s.group.members[2].lastGameAt=day(-8);}
 if(['care-health','care-expired','care-many','care-recovered','care-insufficient','care-steps'].includes(id)){
  const health=(short=true,count=30)=>Array.from({length:count},(_,i)=>({type:'sleep',value:short&&i<8?6:7.5,date:day(-1-i),validDay:true,fullDay:true,sleepDailyTotal:true}));
  const mom=s.group.members[2];mom.age=68;mom.healthRecords=health();
  if(id==='care-insufficient')mom.healthRecords=health(true,10);
  if(id==='care-steps'){mom.stepReminderApplicable=true;mom.healthRecords=health().map((r,i)=>({...r,type:'steps',value:i<8?4000:6000}));}
  if(id==='care-many'){s.group.members[1].age=70;s.group.members[1].healthRecords=health();s.group.members[3].lastLoginAt=day(-8);s.group.members[3].lastGameAt=day(-8);s.group.members.push({name:'阿姨',role:'成員',age:62,careConsent:true,lastLoginAt:day(-8),lastGameAt:day(0)});}
  if(['care-expired','care-recovered'].includes(id)){s.careEpisodes={'circle-family:媽媽:sleep':{active:true}};s.careEvents=[{id:'care-old',groupId:'circle-family',subject:'媽媽',rules:['sleep'],reasons:['近期有幾天休息較少'],createdAt:new Date(Date.now()-8*86400000).toISOString(),recipients:['我','爸爸','姊姊'],responses:[]}];s.notifications.unshift({id:'care-old-note',title:'一起關心媽媽',detail:'先前收到的關心提醒',url:'group.html',read:true});if(id==='care-recovered')mom.healthRecords=health(false);}
 }

 if(id.startsWith('task-')){
  const g=s.group,p={id:g.id+':'+day(-3),...GH.family.weekRange(),members:g.members.map(m=>m.name),unlocked:{},completed:{}};s.taskPeriods[g.id]=p;
  if(id==='task-wait'){g.members.slice(1).forEach(m=>m.healthRecords=[]);}
  if(id==='task-unlocked'){s.records=[];s.demoHealthMode='empty';p.completed.group_steps=['爸爸','媽媽'];p.unlocked.group_steps=true;g.members.filter(m=>m.name==='姊姊').forEach(m=>m.healthRecords=[]);}
  if(id==='task-ready'||id==='task-claimed'){p.completed.group_steps=['我','爸爸','媽媽'];p.unlocked.group_steps=true;}
  if(id==='task-claimed'){const key=p.id+':group_steps';s.taskClaims=[key];s.pointAwards=[{id:key,title:'雙人步行接力',points:300,date:day(0)}];}
  if(['task-expired','task-rollover'].includes(id)){p.start=day(-8);p.end=day(-2);p.completed.group_steps=['我','爸爸'];p.unlocked.group_steps=true;s.demoClosedWeek=id==='task-expired';}
  if(['task-next','task-joined'].includes(id)){p.members=p.members.filter(n=>n!=='我');g.members[0].joinedAt=day(0);s.records[0].date=p.start;}
  if(id==='task-game'){s.device='disconnected';s.records=[];s.healthPreferences=[];g.members.slice(1).forEach(m=>m.gameHistory=[{date:day(0),completed:true},{date:day(-1),completed:true}]);}
 }
 if(id==='mood')s.moods=[{id:'mood-1',date:day(0),value:'開心',note:'今天和家人一起散步，很開心。'},{id:'mood-2',date:day(-1),value:'疲倦',note:'想早一點休息。'}];
 if(id==='new')s.gameHistory=[];
 if(requested==='S04'){s.group.members.push({name:'阿姨',role:'成員',careConsent:false,lastLoginAt:day(0),lastGameAt:day(0)});}
 if(requested==='S05'){s.group.name='我的健康圈';s.group.members=[{name:'我',role:'圈主',careConsent:false,lastLoginAt:day(0),lastGameAt:day(0)}];s.device='disconnected';s.healthPreferences=[];s.records=[];s.gameHistory=[];}
 if(id==='history'){
  const g=s.group,range=GH.family.weekRange(),p={id:g.id+':'+range.start,...range,members:g.members.map(m=>m.name),unlocked:{group_steps:true},completed:{group_steps:['我','爸爸']},completionDates:{}};
  s.taskPeriods[g.id]=p;g.members.slice(1).forEach(m=>m.healthRecords=[]);
  s.activityHistory=[{taskId:'group_steps',claimKey:'past-claimed',periodId:'past-1',periodEnd:day(-7),groupId:g.id,groupName:g.name,title:'雙人步行接力',date:day(-7),points:300,kind:'健康圈任務',teamCompleted:true,status:'claimed'},{taskId:'group_brain',claimKey:'past-expired',periodId:'past-2',periodEnd:day(-8),groupId:g.id,groupName:g.name,title:'一起動動腦',date:day(-8),points:300,kind:'健康圈任務',teamCompleted:true,status:'expired'}];
  s.pointAwards=[{id:'past-claimed',title:'雙人步行接力',points:300,date:day(-7)}];
 }
 Object.keys(GH.state).forEach(k=>delete GH.state[k]);Object.assign(GH.state,s);GH.save();GH.family.remember();GH.save();
 ['gohealth_p2_exchanges','gohealth_latest_exchange'].forEach(k=>sessionStorage.removeItem(k));
 param.delete('scenario');history.replaceState(null,'',location.pathname+(param.size?'?'+param:'')+location.hash);
})();
