window.GH_DEMO = {
  games: [
    { title: '幸福柑仔店', image: 'symbol-shop', detail: '從生活情境開始動腦', points: '每月 +200 點', url: 'https://ad8test.vercel.app/', icon: 'fa-brain' },
    { title: '眼力極限考驗', image: 'symbol-eye', detail: '觀察畫面，完成眼力挑戰', points: '每日 +100 點', url: 'https://concentration-ad.vercel.app/', icon: 'fa-eye' },
    { title: '生活好時光', image: 'symbol-memory', detail: '一起回想生活中的細節', points: '每日 +100 點', url: 'https://memory-game-ad.vercel.app/', icon: 'fa-clock-rotate-left' },
    { title: '24H 一日店長', image: 'symbol-manager', detail: '完成一段生活情境挑戰', points: '每日 +100 點', url: 'https://execution.vercel.app/', icon: 'fa-store' },
    { title: '家事達人', image: 'symbol-house', detail: '輕鬆完成日常情境挑戰', points: '每日 +100 點', url: 'https://www.st.happygocard.com.tw/HAPUPLOAD/game/one-day-housekeeper_v2_8_54.html', icon: 'fa-broom' },
    { title: '健康小學堂', image: 'symbol-school', detail: '用幾道題目認識健康知識', points: '每日 +50 點', url: 'https://go-health-school-prototype.vercel.app/', icon: 'fa-book-open' }
  ],
  tasks: [
    { id: 'group_steps', image: 'task-walk-portrait', shortDetail: '7 天內，2 人各有一天達到 6,000 步。', title: '雙人步行接力', detail: '最近 7 天至少 2 位成員各記錄一天 6,000 步。', icon: 'fa-shoe-prints', points: 300, type: 'steps', min: 6000, members: 2 },
    { id: 'group_exercise', image: 'task-move-portrait', shortDetail: '7 天內，2 人各完成 15 分鐘運動。', title: '一起動一動', detail: '最近 7 天至少 2 位成員各記錄 15 分鐘運動。', icon: 'fa-person-walking', points: 200, type: 'exercise', min: 15, members: 2 },
    { id: 'group_balance', image: 'task-family-portrait', shortDetail: '7 天內，3 人各完成 6,000 步＋15 分鐘運動。', title: '全家活力週', detail: '最近 7 天至少 3 位成員各完成 6,000 步與 15 分鐘運動紀錄。', icon: 'fa-people-group', points: 500, type: 'both', members: 3 }
  ]
};
