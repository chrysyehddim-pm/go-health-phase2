(function () {
  'use strict';
  const curated = [
    {id:'daan-park',name:'大安森林公園',type:'公園步道',address:'台北市大安區新生南路二段 1 號',lat:25.0319,lng:121.5356,icon:'fa-tree'},
    {id:'songshan-sports',name:'臺北市松山運動中心',type:'運動場所',address:'台北市松山區敦化北路 1 號',lat:25.0508,lng:121.5497,icon:'fa-person-running'},
    {id:'femh',name:'亞東紀念醫院',type:'醫院診所',address:'新北市板橋區南雅南路二段 21 號',lat:24.9971,lng:121.4524,icon:'fa-hospital'},
    {id:'ntuh',name:'國立臺灣大學醫學院附設醫院',type:'醫院診所',address:'台北市中正區中山南路 7 號',lat:25.0408,lng:121.5185,icon:'fa-hospital'},
    {id:'taipei-healthy-food',name:'信義區健康餐飲',type:'健康飲食',address:'台北市信義區',lat:25.0330,lng:121.5654,icon:'fa-bowl-food'},
    {id:'taipei-pharmacy',name:'大安區社區藥局',type:'藥局',address:'台北市大安區',lat:25.0268,lng:121.5434,icon:'fa-prescription-bottle-medical'}
  ].map(place=>({...place,url:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place.name+' '+place.address),source:'GO HEALTH 精選'}));
  const distance=(a,b,c,d)=>{const rad=x=>x*Math.PI/180,R=6371,p1=rad(a),p2=rad(c),dp=rad(c-a),dl=rad(d-b),v=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));};
  function showMap(lat,lng,container){
    const key=window.GOHEALTH_MAPS_API_KEY;
    if(!key)throw new Error('地圖服務暫時無法使用');
    const src='https://www.google.com/maps/embed/v1/view?key='+encodeURIComponent(key)+'&center='+encodeURIComponent(lat+','+lng)+'&zoom=14&maptype=roadmap';
    container.classList.remove('fallback');
    container.innerHTML='<iframe title="附近健康服務地圖" src="'+src+'" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }
  async function load(lat,lng,container){
    showMap(lat,lng,container);
    return curated.map(place=>({...place,distance:distance(lat,lng,place.lat,place.lng)})).sort((a,b)=>a.distance-b.distance).slice(0,10);
  }
  window.GH_MAPS={load,curated};
})();
