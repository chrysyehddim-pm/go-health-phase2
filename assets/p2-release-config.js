// Peter can set environment to 'production' for the member deployment.
window.GH_RELEASE_CONFIG = {
  environment: 'demo',
  productionMode: 'launch',
  launch: {
    brainTeamTask: true,
    personalRewards: true,
    pointsExchange: true,
    automaticCare: false
  },
  announcement: { enabled: false, title: '', body: '' },
  maintenance: { enabled: false, title: '服務維護中', body: 'GO HEALTH 正在維護，請稍後再回來。', period: '' },
  happyGoReturnUrl: ''
};
