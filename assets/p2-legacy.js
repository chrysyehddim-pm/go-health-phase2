(function () {
  'use strict';
  window.navigateTo = page => { window.location.href = page; };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('p2-large');
  });
})();
