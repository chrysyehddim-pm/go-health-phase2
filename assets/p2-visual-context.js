(function () {
  'use strict';
  const params = new URLSearchParams(location.search);
  const hour = () => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    return Number(parts.find(part => part.type === 'hour')?.value || 0);
  };
  const month = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit' }).format(new Date());
  function normalizeGender(value) {
    const gender = String(value || '').toLowerCase();
    if (['m', 'male', 'man', '男'].includes(gender)) return 'male';
    if (['f', 'female', 'woman', '女'].includes(gender)) return 'female';
    return 'neutral';
  }
  function homePeriod(value) {
    const requested = String(value || '').toLowerCase();
    if (['morning', 'day', 'evening', 'sleep'].includes(requested)) return requested;
    const current = hour();
    if (current < 6) return 'sleep';
    if (current < 12) return 'morning';
    if (current < 18) return 'day';
    return 'evening';
  }
  function binaryPeriod(value) {
    const requested = String(value || '').toLowerCase();
    if (['day', 'morning'].includes(requested)) return 'day';
    if (['night', 'evening', 'sleep'].includes(requested)) return 'night';
    const current = hour();
    return current >= 6 && current < 18 ? 'day' : 'night';
  }
  const fallbacks = {
    home: 'images/scene/home.webp', circle: 'images/scene/circle.webp', records: 'images/scene/records.webp',
    explore: 'images/scene/explore.webp', tasks: 'images/scene/tasks.webp'
  };
  function context(scene, member) {
    const requestedPeriod = params.get('period');
    const gender = normalizeGender(params.get('gender') || member?.gender);
    if (scene === 'home') {
      const period = homePeriod(requestedPeriod);
      return { scene, period, gender, src: gender === 'neutral' ? fallbacks.home : `images/heroes/home/home-${gender}-${period}.webp`, fallback: fallbacks.home };
    }
    if (scene === 'explore') {
      const period = binaryPeriod(requestedPeriod);
      return { scene, period, gender: 'neutral', src: `images/heroes/explore/explore-${period}.webp`, fallback: fallbacks.explore };
    }
    if (scene === 'circle' || scene === 'records') {
      const period = binaryPeriod(requestedPeriod);
      return { scene, period, gender: 'neutral', src: `images/heroes/${scene}/${scene}-${period}.webp`, fallback: fallbacks[scene] };
    }
    if (scene === 'tasks') {
      const yearMonth = params.get('month') || month();
      return { scene, period: yearMonth, gender: 'neutral', src: `images/heroes/tasks/tasks-${yearMonth}.webp`, fallback: fallbacks.tasks };
    }
    return { scene, period: 'default', gender, src: fallbacks[scene] || '', fallback: fallbacks[scene] || '' };
  }
  const homeCopy = {
    morning: ['早安', '今天也要元氣滿滿 ☀️'], day: ['午安', '吃飽喝足，來動動身體吧 ☕'],
    evening: ['晚安', '今天過得好嗎？放鬆一下 🌙'], sleep: ['夜深了', '注意保暖，早點休息喔 🦉']
  };
  window.GH_VISUALS = { context, homeCopy(period) { return homeCopy[period] || homeCopy.morning; }, taipeiHour: hour };
})();
