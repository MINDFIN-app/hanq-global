/* 홈 판매 Top 3 나라 탭 (PROCEDURE 1-5)
   - 좌우 화살표·Home·End 로 이동. 패널을 다시 보이면 카드 등장 애니메이션이 다시 돈다.
   - 히어로 슬라이드·나라 카드·메뉴의 'Top 3' 링크(data-tab-target)는 해당 나라 탭을 고른 뒤 #top3 으로 이동한다.
   - JS 가 없으면 탭은 숨고 나라별 패널이 모두 차례로 보인다(home.css). */
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
    reveal(tabs[index]);
    if (focus) tabs[index].focus();
  }

  /* 900px 이하에서 탭 줄이 옆으로 넘칠 때, 고른 탭이 줄 가운데에 오도록 탭 줄만 옆으로 민다(페이지는 움직이지 않음) */
  function reveal(tab) {
    if (list.scrollWidth <= list.clientWidth) return;
    var offset = tab.getBoundingClientRect().left - list.getBoundingClientRect().left;
    list.scrollLeft = Math.max(0, list.scrollLeft + offset - (list.clientWidth - tab.offsetWidth) / 2);
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

  /* 다른 페이지 메뉴에서 index.html#pane-sg 처럼 들어오면(또는 주소의 # 만 바뀌면) 그 나라 탭을 고르고 Top 3 로 이동 */
  function scrollTop3() {
    var top3 = document.getElementById('top3');
    if (top3) top3.scrollIntoView();
  }
  function fromHash() {
    var m = /^#pane-([a-z]{2})$/.exec(window.location.hash);
    var i = m ? indexOf(m[1]) : -1;
    if (i < 0) return false;
    select(i);
    return true;
  }
  if (fromHash()) {
    /* 브라우저가 로딩 끝에 #pane-xx 로 다시 스크롤하므로, 그 뒤에 탭 줄이 보이도록 맞춘다 */
    if (document.readyState === 'complete') scrollTop3();
    else window.addEventListener('load', function () { setTimeout(scrollTop3, 0); });
  } else {
    select(0);
  }
  window.addEventListener('hashchange', function () { if (fromHash()) scrollTop3(); });
})();
