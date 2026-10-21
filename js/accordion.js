/* 홈 국기 아코디언 (PROCEDURE 1-4)
   - 클릭·Enter·Space 로만 펼친다. 항상 하나는 펼친 상태. 자동 회전 없음.
   - JS 가 없으면 마크업 그대로 모든 패널이 펼친 채 세로로 보인다(home.css). */
(function () {
  'use strict';
  var acc = document.querySelector('[data-accordion]');
  if (!acc) return;
  var panels = [].slice.call(acc.querySelectorAll('.acc-panel'));

  function open(index) {
    panels.forEach(function (panel, i) {
      var on = i === index;
      panel.classList.toggle('is-open', on);
      panel.querySelector('.acc-btn').setAttribute('aria-expanded', on ? 'true' : 'false');
      panel.querySelector('.acc-body').hidden = !on;
    });
  }

  panels.forEach(function (panel, i) {
    panel.querySelector('.acc-btn').addEventListener('click', function () { open(i); });
  });
  open(0);
})();
