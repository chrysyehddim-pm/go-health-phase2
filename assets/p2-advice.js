(function(){
 'use strict';
 const GH=window.GH,types=['steps','sleep','exercise','heart','weight'];
 const copy={
  generic:['今天找個舒服的時間走一小段，讓活動融入生活。','吃飯時試著多搭配不同顏色的蔬菜，慢慢享用一餐。','忙碌之間也留一點時間休息，照自己的步調照顧健康。'],
  steps_low:['今天找個舒服的時間，出門走一小段吧。','坐了一段時間，可以起身走走，慢慢累積日常活動。','邀家人一起散步，走多遠可以照自己的體力決定。'],
  steps_keep:['把走動融入生活，照自己的步調繼續就好。','持續用喜歡的方式走動，也記得留時間休息。','散步、買菜都能增加走動，讓活動自然融入生活。'],
  sleep_low:['今晚試著提早放下手機，留一點時間慢慢放鬆。','安排一段安靜的睡前時間，讓今天慢慢收尾。','試著維持相近的上床時間，給自己足夠的休息機會。'],
  sleep_keep:['除了睡眠時間，也留意起床後是否有精神。','維持規律作息，也給自己一段放鬆的睡前時間。','照自己的生活節奏，持續留下睡眠紀錄。'],
  exercise_goal:['已達每週建議的基本活動量。依自己的體力持續活動，也安排休息。','活動累積得不錯，接下來也照自己的步調持續。','把活動分散在生活中，讓規律運動更容易維持。'],
  exercise_low:['可以從今天多活動十分鐘開始，慢慢累積。','找一種喜歡的活動，分幾次累積也可以。','和家人約一段活動時間，照自己的體力慢慢增加。'],
  exercise_partial:['持續記錄，也讓活動慢慢成為習慣；缺少資料的日子不代表沒有運動。','目前只看到部分日期的紀錄，先肯定已累積的活動。','找個適合自己的時間活動，並持續更新紀錄。'],
  exercise_recorded:['這裡先呈現運動紀錄總分鐘；沒有強度資訊，不判定是否達到每週建議量。','持續累積喜歡的活動；運動強度不同，適合的活動量也會不同。','照自己的體力持續活動，並留意運動後的身體感受。'],
  heart_high:['最近幾天的靜息心率紀錄較高。找個安靜時間休息後再確認；若持續與平常不同，建議詢問醫療專業人員。','有幾天靜息心率超過參考範圍。可以再確認量測情境，持續出現時請教醫療專業人員。','先休息，再確認安靜狀態下的心率；若持續與平常不同，請尋求專業建議。'],
  heart_low:['最近幾天的靜息心率紀錄較低，可能受到運動習慣或藥物等因素影響。有疑問時請教醫療專業人員。','可以留意靜息心率是否和平常不同，不自行調整藥物；有疑問時請教醫療專業人員。','先確認安靜休息時的量測紀錄。若持續與平常不同，建議詢問醫療專業人員。'],
  heart_keep:['持續留下安靜休息時的心率紀錄，也留意自己的身體感受。','心率數字是觀察的一部分，休息與身體感受也值得留意。','在相近的休息情境下記錄心率，比較時更有依據。'],
  heart_context:['心率會隨活動與情緒改變。下次可在安靜休息時量測，讓紀錄更容易比較。','目前沒有靜息心率標記，先不判斷高低；可以確認裝置是否提供靜息紀錄。','一般心率不適合直接和靜息參考範圍比較，先持續留下量測情境。'],
  weight_same:['體重紀錄不一定每次都要改變。持續均衡飲食、規律活動，不必為了數字刻意少吃。','最近一次與這段期間最早的紀錄相同，繼續照顧好日常飲食與活動。','固定使用同一台體重計、在相近時間量測，會更容易比較。'],
  weight_change:['先維持相近的量測時間與條件，再慢慢觀察後續變化。','單次數字差異不代表好壞，先持續留下可比較的紀錄。','體重會受量測條件影響，不需要只因短期數字改變就刻意少吃。']
 };
 const round=n=>Math.round(n*10)/10;
 function compute(s,now=new Date()){
  const end=now.toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'}),start=new Date(new Date(end+'T12:00:00+08:00').getTime()-7*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  const consent=s.device==='connected'&&(s.healthPreferences||[]).length>0;
  const items=types.map(type=>{
   const authorized=consent&&s.healthPreferences.includes(type),daily=new Map();
   if(authorized)(s.records||[]).filter(r=>r.type===type&&r.date>=start&&r.date<end&&r.value!==null&&r.value!==''&&Number.isFinite(Number(r.value))&&Number(r.value)>=0&&r.validDay!==false&&(type!=='weight'||Number(r.value)>0)&&(type!=='sleep'||(r.sleepDailyTotal===true&&Number(r.value)>0))&&(type!=='heart'||Number(r.value)>0)).forEach(r=>daily.set(r.date,r));
   const rows=[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)),n=rows.length;
   const item={type,authorized,days:n,state:!authorized?'unauthorized':!n?'empty':n<3?'insufficient':'maintain',rule:null,summary:n?'最近七天有 '+n+' 天紀錄':'最近七天尚無資料'};
   if(!authorized||n<3)return item;
   const avg=round(rows.reduce((a,r)=>a+Number(r.value),0)/n);item.average=avg;
   if(type==='steps'){item.rule=avg<5000?'steps_low':'steps_keep';item.summary='有紀錄日期平均每天 '+Math.round(avg).toLocaleString('zh-TW')+' 步';}
   if(type==='sleep'){item.rule=avg<7?'sleep_low':'sleep_keep';item.summary='有紀錄日期平均睡眠 '+avg+' 小時';}
   if(type==='exercise'){
    const total=round(rows.reduce((a,r)=>a+Number(r.value),0)),intensity=rows.every(r=>['moderate','vigorous','light','mixed'].includes(r.intensity)),complete=n===7&&rows.every(r=>r.fullDay===true);
    const equivalent=intensity?rows.reduce((a,r)=>a+(r.intensity==='vigorous'?Number(r.value)*2:r.intensity==='moderate'?Number(r.value):r.intensity==='mixed'?Number(r.moderateMinutes||0)+2*Number(r.vigorousMinutes||0):0),0):null;
    item.totalMinutes=total;item.equivalentMinutes=equivalent;
    item.rule=!intensity?'exercise_recorded':equivalent>=150?'exercise_goal':!complete?'exercise_partial':'exercise_low';
    item.summary='最近七天已記錄 '+total+' 分鐘運動'+(intensity?'，中等強度等量 '+round(equivalent)+' 分鐘':'（尚無強度資訊）');
   }
   if(type==='heart'){
    const resting=rows.filter(r=>r.resting===true||r.measurementContext==='resting');item.restingDays=resting.length;item.highDays=resting.filter(r=>r.value>100).length;item.lowDays=resting.filter(r=>r.value<60).length;
    item.rule=resting.length<3?'heart_context':resting.filter(r=>r.value>100).length>=2?'heart_high':resting.filter(r=>r.value<60).length>=2?'heart_low':'heart_keep';
    item.summary=resting.length>=3?'最近七天有 '+resting.length+' 天靜息心率紀錄':'已有 '+n+' 天心率紀錄，靜息資料尚不足三天';
   }
   if(type==='weight'){const first=Number(rows[0].value),last=Number(rows.at(-1).value),delta=round(last-first);item.lastWeight=last;item.weightDelta=delta;item.rule=delta===0?'weight_same':'weight_change';item.summary='最近一次 '+last+' 公斤；較期間最早一筆'+(delta===0?'相同':delta>0?'增加 '+delta+' 公斤':'減少 '+Math.abs(delta)+' 公斤');}
   if(['steps_low','sleep_low','exercise_low','heart_high','heart_low'].includes(item.rule))item.state='triggered';return item;
  });
  const hash=Array.from(end).reduce((a,c)=>a+c.charCodeAt(0),0),candidates=items.filter(i=>i.rule),priority=candidates.filter(i=>/^heart_(high|low)$/.test(i.rule));
  const matching=candidates.filter(i=>i.state==='triggered'),pool=priority.length?priority:matching.length?matching:candidates;
  const selected=pool.length?pool[hash%pool.length]:null;
  items.forEach(i=>{if(i.rule)i.message=copy[i.rule][hash%copy[i.rule].length];});
  return {start,end,items,selected,consent,partial:consent&&s.healthPreferences.length<5,generic:copy.generic[hash%copy.generic.length]};
 }
 function preview(s,key){
  s.records=[];s.healthPreferences=[];s.device='disconnected';s.healthUpdatedAt=null;s.healthSync=null;s.demoAdvice=true;
  if(key==='none')return;
  s.device='connected';s.healthConsent=true;s.healthPreferences=key==='partial'?['steps','sleep']:types.slice();
  const end=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'}),day=i=>new Date(new Date(end+'T12:00:00+08:00').getTime()-i*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  if(key!=='empty')s.records=s.healthPreferences.flatMap(type=>Array.from({length:key==='short'?2:7},(_,i)=>({type,date:day(i+1),value:({steps:key==='maintain'?6500:3800,sleep:key==='maintain'?7.5:6.2,exercise:key==='maintain'?25:[15,15,15,15,10,10,10][i],heart:key==='maintain'?72:[103,102,78,76,75,74,73][i],weight:65})[type],validDay:true,fullDay:true,sleepDailyTotal:type==='sleep',resting:type==='heart',intensity:type==='exercise'?'moderate':undefined,source:'HAPPY GO App · 手機健康資料'})));
  s.healthUpdatedAt=new Date().toISOString();s.healthSync=key==='error'?'error':'ready';
 }
 window.GH_ADVICE={compute,preview};
})();
