/* 머리글 아코디언 메뉴 (PROCEDURE 1-2)
   - 데스크톱: 메뉴 버튼을 누르면 머리글 아래로 패널이 펼쳐지며 내용을 밀어 내린다. 한 번에 하나.
   - 900px 이하: '메뉴' 버튼 → 세로 아코디언. 안의 '나라별 상품'은 나라 → 보험·투자 Top 3 로 한 번 더 펼쳐진다.
   - Esc 로 닫고 버튼으로 초점을 돌려준다. 바깥을 누르거나 메뉴 속 링크를 누르면 닫힌다. */
(function () {
  'use strict';
  var hdr = document.querySelector('[data-hdr]');
  if (!hdr) return;
  var toggle = hdr.querySelector('.menu-toggle');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setExpanded(btn, on) { btn.setAttribute('aria-expanded', on ? 'true' : 'false'); }

  /* 한 그룹 안에서 하나만 펼치는 아코디언. itemOf(btn) 이 펼침 표시(is-open)를 달 요소를 돌려준다. */
  function group(buttons, itemOf, allowNone) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-expanded') !== 'true';
        if (!on && !allowNone) return;
        buttons.forEach(function (other) {
          setExpanded(other, false);
          itemOf(other).classList.remove('is-open');
        });
        if (on) {
          setExpanded(btn, true);
          itemOf(btn).classList.add('is-open');
        }
      });
    });
  }

  var topButtons = [].slice.call(hdr.querySelectorAll('.gnav-btn'));
  function panelOf(btn) { return document.getElementById(btn.getAttribute('aria-controls')); }
  group(topButtons, panelOf, true);

  group([].slice.call(hdr.querySelectorAll('.macc-btn')), function (btn) { return btn.parentNode; }, true);

  [].slice.call(hdr.querySelectorAll('.cacc')).forEach(function (acc) {
    group([].slice.call(acc.querySelectorAll('.cacc-btn')), function (btn) { return btn.parentNode; }, true);
  });

  function openTop() {
    for (var i = 0; i < topButtons.length; i++) {
      if (topButtons[i].getAttribute('aria-expanded') === 'true') return topButtons[i];
    }
    return null;
  }

  function closeAll(instant) {
    if (instant) hdr.classList.add('no-anim');
    topButtons.forEach(function (btn) { setExpanded(btn, false); panelOf(btn).classList.remove('is-open'); });
    hdr.classList.remove('menu-open');
    if (toggle) setExpanded(toggle, false);
    if (instant) {
      void hdr.offsetHeight;
      requestAnimationFrame(function () { hdr.classList.remove('no-anim'); });
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var on = !hdr.classList.contains('menu-open');
      hdr.classList.toggle('menu-open', on);
      setExpanded(toggle, on);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var btn = openTop();
    if (btn) { closeAll(false); btn.focus(); }
    else if (hdr.classList.contains('menu-open')) { closeAll(false); toggle.focus(); }
  });

  document.addEventListener('click', function (e) {
    if (!hdr.contains(e.target) && (openTop() || hdr.classList.contains('menu-open'))) closeAll(false);
  });

  /* 메뉴 속 링크: 패널을 즉시 닫은 뒤 이동한다. 같은 페이지 앵커면 닫힌 높이 기준으로 다시 스크롤한다. */
  hdr.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.gpanels a, .mnav a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    closeAll(true);
    if (href.charAt(0) === '#') {
      var target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
          if (history.replaceState) history.replaceState(null, '', href);
        });
      }
    }
  });
})();
