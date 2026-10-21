/* 홈 판매 Top 3 나라 탭 (PROCEDURE 1-5)
   - 좌우 화살표·Home·End 로 이동. 패널을 다시 보이면 카드 등장 애니메이션이 다시 돈다.
   - 아코디언의 'Top 3 리서치' 링크(data-tab-target)는 해당 나라 탭을 고른 뒤 #top3 으로 이동한다.
   - JS 가 없으면 탭은 숨고 다섯 나라 패널이 모두 차례로 보인다(home.css). */
(function () {
  'use strict';
  var list = document.querySelector('[role="tablist"]');
  if (!list) return;
  var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));

  function select(index, focus) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      var pane = document.getElementById(tab.getAttribute('aria-controls'));
      if (pane) pane.hidden = !on;
    });
    if (focus) tabs[index].focus();
  }

  function indexOf(code) {
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-code') === code) return i;
    }
    return -1;
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(i); });
    tab.addEventListener('keydown', function (e) {
      var n = tabs.length, t = null;
      if (e.key === 'ArrowRight') t = (i + 1) % n;
      else if (e.key === 'ArrowLeft') t = (i - 1 + n) % n;
      else if (e.key === 'Home') t = 0;
      else if (e.key === 'End') t = n - 1;
      if (t !== null) { e.preventDefault(); select(t, true); }
    });
  });

  [].slice.call(document.querySelectorAll('[data-tab-target]')).forEach(function (link) {
    link.addEventListener('click', function () {
      var i = indexOf(link.getAttribute('data-tab-target'));
      if (i >= 0) select(i);
    });
  });

  select(0);
})();
