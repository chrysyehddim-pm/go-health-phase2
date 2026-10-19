(function () {
  'use strict';
  const GH = window.GH;
  function get(name) {
    const group = GH.state.group;
    const member = group?.members.find(m => m.name === name);
    const unavailable = (label, reason) => ({available:false, label, reason});
    if (!member) return unavailable('找不到這位成員', '成員可能已離開健康圈。');
    if (!member.locationSharing) return unavailable('尚未開啟位置分享', '這位家人尚未同意分享最後位置。');
    const loc = member.lastLocation, time = Date.parse(loc?.updatedAt);
    if (!Number.isFinite(time) || !Number.isFinite(loc?.lat) || !Number.isFinite(loc?.lng) || Math.abs(loc.lat)>90 || Math.abs(loc.lng)>180 || time>Date.now()+300000) return unavailable('尚無位置紀錄', '目前還沒有可顯示的位置資料。');
    const age = Math.max(0,Date.now()-time);
    if (age>7*86400000) return unavailable('近期沒有位置更新', '最後位置已超過 7 天，暫不顯示地圖與附近去處。');
    const date=new Date(time), label=new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+' 更新';
    return {available:true, groupId:group.id, member, name:member.name, center:{lat:loc.lat,lng:loc.lng}, age, label, freshness:age<7200000?'fresh':age<86400000?'aging':'stale', area:loc.area||loc.place||''};
  }
  GH.locationContext = {get};
})();
