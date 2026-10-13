(function () {
  'use strict';
  const GH = window.GH;
  const KEY = 'gohealth_p2_guide_v1';
  const disabled = () => GH.state.guideMode === 'off';
  const demo = () => GH.state.guideMode === 'demo';
  const read = () => {
    if (demo()) return GH.state.guideProgress || {};
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (_) { return GH.state.guideProgress || {}; }
  };
  const seen = topic => !disabled() && !!read()[topic];
  const mark = topic => {
    if (disabled()) return;
    const progress = { ...read(), [topic]: true };
    GH.state.guideProgress = progress;
    GH.save();
    if (!demo()) try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch (_) {}
  };
  const welcome = () => !disabled() && !seen('welcome') && !GH.state.group;
  const tip = topic => !disabled() && !seen(topic);
  const tipCard = (topic, title, description, action = '') =>
    '<aside class="p2-guide-tip" aria-label="使用提示"><div class="p2-guide-tip-copy"><span class="p2-guide-kicker"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> 使用提示</span><h3>' + title + '</h3><p>' + description + '</p></div><div class="p2-guide-tip-actions">' + action + '<button type="button" class="p2-guide-dismiss" data-guide-dismiss="' + topic + '">我知道了</button></div></aside>';
  const bind = (root = document) => {
    root.querySelectorAll('[data-guide-dismiss]').forEach(button => {
      button.onclick = () => { mark(button.dataset.guideDismiss); button.closest('.p2-guide-tip')?.remove(); };
    });
  };
  const help = () => {
    GH.sheet('使用說明', '<div class="p2-guide-help-list">' +
      '<section><span class="p2-guide-help-art"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span><div><h3>和家人建立健康圈</h3><p>建立健康圈，或輸入家人的邀請碼加入；在圈內分享近況、互相關心。</p><a href="group.html">前往健康圈 <i class="fa-solid fa-chevron-right"></i></a></div></section>' +
      '<section><span class="p2-guide-help-art">' + GH.art('connect') + '</span><div><h3>連接健康資料</h3><p>選擇同意讀取的項目，連接後可在紀錄頁查看有資料的健康指標。</p><a href="health.html">前往紀錄 <i class="fa-solid fa-chevron-right"></i></a></div></section>' +
      '<section><span class="p2-guide-help-art">' + GH.art('missions') + '</span><div><h3>一起完成健康任務</h3><p>家人各自完成條件；達到任務人數後，符合條件的成員可在期限內各自領取健康點。</p><a href="activities.html">前往任務 <i class="fa-solid fa-chevron-right"></i></a></div></section>' +
      '</div>');
  };
  window.GH_GUIDE = { welcome, tip, tipCard, bind, mark, help };
})();
