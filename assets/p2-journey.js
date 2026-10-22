(function () {
  'use strict';
  const GH = window.GH;
  if (!GH) return;
  const params = new URLSearchParams(location.search);
  // Standalone scenario checks must not inherit the journey's presentation controls.
  if(params.has('placeState')&&!params.has('journey')&&GH.state.journey){delete GH.state.journey;GH.save();}
  const VERSION = 1, DAY = 86400000;
  const dateKey = value => new Date(value).toLocaleDateString('sv-SE', {timeZone:'Asia/Taipei'});
  const shift = (date, n) => dateKey(Date.parse(date+'T12:00:00+08:00') + n*DAY);
  const source = 'HAPPY GO App · 手機健康資料（展示）';
  function healthRecords(requested, now = new Date()) {
    const today = dateKey(now), rows = [];
    for (let ago=29; ago>=0; ago--) {
      const date=shift(today,-ago), complete=ago>0;
      const values={steps:ago===0?6280:ago===1?6840:[3900,4600,4300,5200,4100,4800,6500][ago%7],sleep:[6.4,6.6,7.1,6.8,7.3,6.5,7.2][ago%7],exercise:ago===0?18:[12,15,10,15,10,12,18][ago%7],heart:[72,74,71,73,70,75,72][ago%7],weight:57.8+(ago%3)/10};
      requested.forEach(type=>{
        if(!(type in values) || (type==='sleep'&&!complete) || (type==='weight'&&ago%2===0))return;
        rows.push({type,date,value:Math.round(values[type]*10)/10,source,validDay:true,fullDay:complete,sleepDailyTotal:type==='sleep',resting:type==='heart',intensity:type==='exercise'?'moderate':undefined});
      });
    }
    return rows;
  }
  function seed(now = new Date()) {
    const s=GH.fresh(),today=dateKey(now),iso=now.toISOString(),past=hours=>new Date(now.getTime()-hours*3600000).toISOString();
    s.journey={id:'xiaohua',version:VERSION,startedAt:iso};
    s.guideMode='off';s.guideProgress={};s.member={id:'journey-xiaohua',name:'吳小花',age:45,gender:'female',isHappyGo:true,consent:true};
    s.healthSchema='happygo-health-v2';s.healthPreferences=['steps','sleep','exercise','heart','weight'];s.healthConsent=true;s.device='connected';s.records=healthRecords(s.healthPreferences,now);s.healthSync='ready';s.healthUpdatedAt=iso;
    s.location={permission:'prompt',sharing:false};
    const member=(name,age,asset,relationship)=>({id:name==='我'?'journey-xiaohua':'journey-'+name,name,age,avatarUrl:'images/avatars/member-'+asset+'.webp',role:name==='我'?'圈主':'成員',relationship,joinedAt:shift(today,-60),lastLoginAt:iso,lastGameAt:iso,careConsent:true,locationSharing:false,healthRecords:[],gameHistory:[],moods:[]});
    s.group={id:'journey-family',name:'小花家的健康圈',code:'00000',nickname:'小花',members:[member('我',45,'self',''),member('爸爸',72,'father','父親'),member('媽媽',69,'mother','母親'),member('姊姊',48,'aunt','姊妹'),member('女兒',20,'sister','女兒')]};
    const father=s.group.members[1],mother=s.group.members[2],sister=s.group.members[3],daughter=s.group.members[4];
    father.healthRecords=[{type:'steps',value:7200,date:today,source,validDay:true,fullDay:false}];
    father.locationSharing=true;father.lastLocation={lat:25.0142,lng:121.4638,area:'新北市板橋區',place:'板橋車站附近（展示位置）',updatedAt:past(0.3)};
    sister.locationSharing=true;sister.lastLocation={lat:25.0142,lng:121.4638,area:'新北市板橋區',place:'板橋車站附近（展示位置）',updatedAt:past(48)};
    s.demoFamilyLocation=true;
    // A gentle, weekly care example based on last week's complete sleep records.
    const range=GH.family.weekRange(today),previousMonday=shift(range.start,-7);
    mother.healthRecords=Array.from({length:7},(_,i)=>({type:'sleep',value:i<3?6.3:7.4,date:shift(previousMonday,i),validDay:true,fullDay:true,sleepDailyTotal:true}));
    s.careRulesVersion=2;s.careEvents=[];
    const moods=[['平靜','忙碌之間喝杯茶，也留一點時間給自己。'],['開心','和爸爸約好，下班後一起走一小段。'],['疲倦','工作比較忙，今晚想早一點休息。'],['開心','收到女兒的訊息，平凡的一天也很溫暖。'],['平靜','散步時看見樹影，心情慢慢安定下來。'],['焦慮','事情有點多，先一件一件慢慢完成。'],['開心','和家人一起吃飯，聊了好多生活小事。']];
    s.moods=Array.from({length:22},(_,i)=>{
      const [value,note]=moods[i%moods.length],at=i===0?new Date(now.getTime()-600000):new Date(shift(today,-i)+'T20:10:00+08:00');
      return {...GH.createMoodEntry(value,note,at),id:'journey-mood-'+i};
    });
    s.moods.push({...GH.createMoodEntry('開心','今天也有人陪伴，感覺很好。',new Date(now.getTime()-300000)),id:'journey-mood-today-latest'});
    s.gameHistory=Array.from({length:18},(_,i)=>({id:'journey-game-'+i,title:['眼力極限考驗','生活好時光','健康小學堂'][i%3],date:shift(today,-i-1),time:'19:20',seconds:48+i%6*5,level:'Level '+(i%3+1),points:i%3===2?50:100,kind:'個人任務',completed:true}));
    daughter.gameHistory=[{date:today,completed:true}];
    const post=(id,author,hours,kind,text,extra={})=>({id:'journey-post-'+id,groupId:s.group.id,author,createdAt:past(hours),time:dateKey(past(hours))===today?'今天':dateKey(past(hours))===shift(today,-1)?'昨天':'近七天',kind,text,comments:[],likes:1,...extra});
    s.posts=[
      post('walk','爸爸',1,'健康紀錄','今天走了 7,200 步！走得舒服最重要，小花有空也一起走走。',{metric:'步數 7,200 步',comments:[{id:'journey-comment-1',author:'媽媽',text:'慢慢走，也記得喝水喔。',createdAt:past(0.8)}],likes:3}),
      post('mood','女兒',3,'心情分享','今天完成了作業，想跟大家分享這份小小的開心。',{mood:'開心',likes:2}),
      post('place','姊姊',22,'地點分享','週末想和大家到附近走走，板橋車站集合很方便。',{place:'板橋車站',url:'https://www.google.com/maps/search/?api=1&query=25.0142,121.4638',likes:2}),
      post('rest','媽媽',28,'生活近況','最近睡得比較少，今晚準備早點休息。謝謝大家的關心。',{comments:[{id:'journey-comment-2',author:'我',text:'辛苦了，週末我帶晚餐回去，一起慢慢吃。',createdAt:past(26)}]}),
      post('article','我',40,'文章分享','想和大家一起認識大腦健康，日常多一點陪伴和活動。',{url:'https://www.femh.org.tw/magazine/viewmag.aspx?ID=11889',likes:3}),
      post('life','爸爸',52,'生活近況','公園的樹蔭很舒服，和朋友邊走邊聊天，心情也變好了。'),
      post('meal','女兒',74,'生活近況','今天午餐多加一份蔬菜，下次也想煮給大家吃。')
    ];
    s.activityHistory=[{taskId:'group_steps',claimKey:'journey-past-walk',periodId:'journey-family:'+previousMonday,periodEnd:shift(range.start,-1),groupId:s.group.id,groupName:s.group.name,title:'雙人步行接力',date:shift(range.start,-2),points:300,kind:'健康圈任務',teamCompleted:true,status:'claimed'}];
    s.pointAwards=[];s.taskPeriods={};s.taskClaims=[];s.taskClaimLedger={};s.taskAchievements={};
    Object.keys(GH.state).forEach(k=>delete GH.state[k]);Object.assign(GH.state,s);
    ['gohealth_p2_exchanges','gohealth_latest_exchange'].forEach(k=>sessionStorage.removeItem(k));
    GH.family.remember();GH.family.evaluateCare();GH.save();
  }
  if(params.get('journey')==='xiaohua' && (GH.state.journey?.version!==VERSION || params.get('restart')==='1')) {
    seed();params.delete('restart');history.replaceState(null,'',location.pathname+'?'+params+location.hash);
  }
  if(GH.state.journey?.id!=='xiaohua')return;
  document.body.classList.add('journey-active');
  // P1 screens keep their layout; bind their examples to this member's dates and ledger.
  const legacy=window.GOHEALTH_DATA;
  if(legacy){
    const today=dateKey(new Date()),brain=legacy.brainRecords;
    if(brain){
      brain.games.forEach((game,i)=>{
        game.records=GH.state.gameHistory.filter(row=>row.title===game.name).map(row=>({date:row.date.replaceAll('-','/'),time:row.time,level:row.level,seconds:row.seconds,status:'completed'}));
        game.totalChallenges=game.records.length;
        game.recentPerformance={...(game.recentPerformance||{}),updatedAt:today.replaceAll('-','/')};
      });
      const monthly=GH.state.gameHistory.filter(row=>row.date.startsWith(today.slice(0,7)));
      brain.summary={interactionDays:new Set(monthly.map(row=>row.date)).size,completedGames:monthly.length,lastInteractionDate:GH.state.gameHistory[0]?.date.replaceAll('-','/')||'—',referenceDate:today.replaceAll('-','/')};
    }
    legacy.pointHistory=[{id:'journey-opening',type:'earn',title:'過往個人任務累積',occurredAt:shift(today,-40)+' 12:00',points:900,balanceAfter:900},{id:'journey-past-walk',type:'earn',title:'上週雙人步行接力',occurredAt:GH.state.activityHistory[0]?.date+' 12:00',points:300,balanceAfter:1200}];
    legacy.exchangeHistory=[];
    legacy.healthPointExpiry={...legacy.healthPointExpiry,nextExpiryPoints:0,nextExpiryDate:'—'};
  }
  const steps=[
    ['首頁','index.html','從房間出發','一眼掌握家人近況、健康建議和自己的紀錄，知道今天可以做什麼。'],
    ['健康建議','ai.html','把數字變成小行動','從前七天的紀錄，找到適合今天的走動與休息建議。'],
    ['健康與心情紀錄','health.html?view=mood','先照顧自己','看看健康指標、動腦成果與心情樹，選擇一筆心情預覽分享給家人。'],
    ['健康圈','group.html','走進家人的客廳','讓一則分享變成對話；留言、鼓勵與關心，都是陪伴的開始。'],
    ['任務中心','activities.html','一起養成小習慣','小花和爸爸已達步行門檻，可各自領獎；也能查看個人動腦任務與參與紀錄。'],
    ['爸爸的最後位置','group.html?view=location&member='+encodeURIComponent('爸爸'),'把關心帶到戶外','查看爸爸同意分享的最後位置和時間，找附近去處，再推薦回健康圈。'],
    ['探索','explore.html?tab=places','走進健康街區','從板橋車站周邊開始找去處，也能閱讀健康文章、找到健康服務。'],
    ['健康點兌換','exchange.html','讓累積有回饋','回首頁確認領到的健康點，再體驗兌換 HAPPY GO 點數。']
  ];
  const page=location.pathname.split('/').pop();
  const index=page==='ai.html'?1:['health.html','records.html'].includes(page)?2:page==='group.html'?(params.get('view')==='location'?5:3):page==='activities.html'?4:page==='explore.html'?(params.has('family')?5:6):['exchange.html','points-history.html','exchange-history.html'].includes(page)?7:0;
  function guide(){
    GH.sheet('吳小花的健康生活旅程','<p>45 歲的吳小花，和爸爸、媽媽、姊姊、女兒在同一個健康圈。從照顧自己，走向陪伴家人，再一起探索戶外。</p><ol class="journey-chapters">'+steps.map((step,i)=>'<li'+(i===index?' class="is-current"':'')+'><a href="'+step[1]+'"><small>'+step[2]+'</small><strong>'+step[0]+'</strong><span>'+step[3]+'</span></a></li>').join('')+'</ol><p class="p2-small">這是獨立展示情境。人物、健康、心情與家人位置均為示意資料；附近地點使用 Google 即時搜尋，需網路連線。切換頁面與重新整理會保留本次操作。</p><a class="p2-secondary full" href="journey.html">返回旅程介紹</a><button type="button" id="journey-restart" class="p2-quiet full">重新開始展示</button>');
    document.getElementById('journey-restart').onclick=()=>{
      GH.sheet('重新開始展示？','<p>將回到吳小花最初的展示資料，清除本次新增、刪除、分享與領獎結果。</p><div class="p2-actions"><button class="p2-secondary" data-close-sheet>取消</button><a class="p2-primary" href="index.html?journey=xiaohua&restart=1">確認重新開始</a></div>');
    };
  }
  function mount(){
    const main=document.getElementById('p2-main')||document.querySelector('main');
    if(!main||document.getElementById('journey-tools'))return;
    const tools=document.createElement('aside');tools.id='journey-tools';tools.className='journey-tools';tools.setAttribute('aria-label','完整旅程展示導覽');
    tools.innerHTML='<div><small>完整旅程體驗 · 吳小花</small><strong>'+steps[index][2]+'</strong></div><button type="button">旅程導覽 <span aria-hidden="true">☰</span></button>';
    tools.querySelector('button').onclick=guide;(main.querySelector(':scope > .p2-sheet-content')||main).prepend(tools);
  }
  window.GH_JOURNEY={healthRecords,seed,steps,guide};
  document.addEventListener('DOMContentLoaded',()=>{
    mount();
    const main=document.getElementById('p2-main');
    if(main)new MutationObserver(mount).observe(main,{childList:true});
  });
  // Keep the shareable context in same-origin navigation without changing the product links.
  document.addEventListener('click',event=>{
    const a=event.target.closest?.('a[href]');if(!a||a.target==='_blank'||a.hasAttribute('download'))return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||!url.pathname.endsWith('.html')||url.searchParams.has('scenario')||['demo.html','journey.html'].includes(url.pathname.split('/').pop()))return;
    url.searchParams.set('journey','xiaohua');a.href=url.href;
  },true);
})();
