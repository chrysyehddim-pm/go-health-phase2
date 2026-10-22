const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const assets=name=>fs.readFileSync(require('node:path').join(__dirname,'../assets',name+'.js'),'utf8');
function app(instant,storage=new Map(),search='?journey=xiaohua'){
  const fixed=new Date(instant),NativeDate=Date;
  class Clock extends NativeDate{constructor(...args){super(...(args.length?args:[fixed.getTime()]));}static now(){return fixed.getTime();}}
  const document={body:{classList:{add(){}}},addEventListener(){},dispatchEvent(){},getElementById(){return null;},querySelector(){return null;}};
  const context={Date:Clock,Intl,URL,URLSearchParams,crypto,console,document,setTimeout,clearTimeout,location:{search,pathname:'/index.html',hash:''},history:{replaceState(){}},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},CustomEvent:class{}};
  context.window=context;vm.createContext(context);
  ['p2-core','p2-data','p2-family','p2-scenarios','p2-journey','p2-advice'].forEach(name=>vm.runInContext(assets(name),context,{filename:name+'.js'}));
  return context;
}
for(const instant of ['2026-10-22T02:00:00+08:00','2026-10-26T00:03:00+08:00','2026-11-01T23:59:00+08:00']){
  const store=new Map(),c=app(instant,store),{GH,GH_DEMO}=c,s=GH.state,today=new Date(instant).toLocaleDateString('sv-SE',{timeZone:'Asia/Taipei'});
  assert.equal(s.group.members.length,5);assert.equal(s.group.members[0].role,'圈主');assert.equal(new Set(s.group.members.map(m=>m.id)).size,5);
  assert.equal(s.group.members.find(m=>m.name==='老公').relationship,'配偶');assert(!s.group.members.some(m=>m.name==='姊姊'));
  assert(s.records.every(r=>r.date<=today));assert(s.moods.every(r=>Date.parse(r.createdAt)<=Date.parse(instant)));
  const result=c.GH_ADVICE.compute(s,new Date(instant));assert.equal(result.ordered.length,5);assert(result.items.every(x=>x.days>=3));
  const walk=GH_DEMO.tasks.find(x=>x.id==='group_steps');assert.equal(GH.family.taskStatus(walk).canClaim,true);assert.equal(GH.family.taskStatus(walk).count,2);
  assert.equal(GH.family.claim(walk),true);assert.equal(GH.family.claim(walk),false);assert.equal(GH.pointBalance(),1500);
  GH.set(state=>state.posts.unshift({id:'test-share',author:'我',text:'旅程分享',createdAt:instant}));
  const next=app(instant,store),reloaded=next.GH;
  assert.equal(reloaded.state.posts[0].id,'test-share');assert.equal(reloaded.pointBalance(),1500);assert.equal(reloaded.family.taskStatus(next.GH_DEMO.tasks[0]).claimed,true);
  store.set('gohealth_p2_exchanges',JSON.stringify([{status:'success',healthPointsUsed:500}]));assert.equal(reloaded.pointBalance(),1000);
  const reset=app(instant,store,'?journey=xiaohua&restart=1');assert.equal(reset.GH.pointBalance(),1200);assert(!reset.GH.state.posts.some(x=>x.id==='test-share'));
  const other=app(instant,store,'?scenario=S02');assert.equal(other.GH.state.journey,undefined);assert.equal(other.GH.state.group,null);
}
const normal=app('2026-10-22T09:00:00+08:00',new Map(),'');assert.equal(normal.GH.state.journey,undefined);assert.equal(normal.GH.state.group,null);
const oldStore=new Map(),before=app('2026-10-22T09:00:00+08:00',oldStore);
before.GH.family.claim(before.GH_DEMO.tasks[0]);
const old=JSON.parse(oldStore.get(before.GH.KEY)),partner=old.group.members.find(m=>m.name==='老公');
partner.name='姊姊';partner.age=48;partner.relationship='姊妹';partner.avatarUrl='images/avatars/member-aunt.webp';
old.posts.find(p=>p.id==='journey-post-place').author='姊姊';
old.posts.unshift({id:'retained-user-post',author:'我',text:'保留這則分享'});
oldStore.set(before.GH.KEY,JSON.stringify(old));
const migrated=app('2026-10-22T09:00:00+08:00',oldStore);
assert.equal(migrated.GH.pointBalance(),1500);assert.equal(migrated.GH.state.posts[0].id,'retained-user-post');
assert.equal(migrated.GH.state.posts.find(p=>p.id==='journey-post-place').author,'老公');
assert.equal(migrated.GH.state.group.members.find(m=>m.name==='老公').age,47);
console.log('PASS: five-member seed, seven-day advice, no future dates, Monday/month rollover, claim deduplication, navigation persistence, exchange balance, restart and standalone scenario isolation.');
