/* 머리글 (PROCEDURE 1-2)
   - 데스크톱: 아랫줄 메뉴 버튼을 누르면 내용 위로 드롭다운 패널이 펼쳐지고 뒤 화면이 어두워진다. 한 번에 하나.
     Esc·어두운 막·메뉴 속 링크로 닫힌다. 마우스 올림으로는 열리지 않는다.
   - 스크롤을 내리면 머리글이 숨고, 올리면 다시 나타난다. 메뉴가 열려 있거나 머리글에 초점이 있으면 숨지 않는다.
   - 900px 이하(또는 가로로 눕힌 폰): '메뉴' 버튼 → 오른쪽에서 밀려 나오는 서랍(안은 아코디언). 서랍이 열리면 뒤 페이지
     스크롤을 막고 Tab 이 서랍 안에서만 돈다. Esc·막·닫기 버튼으로 닫고 '메뉴' 버튼으로 초점을 돌려준다.
   - 화면을 돌리거나 창 크기가 바뀌어 휴대폰↔데스크톱 머리글이 바뀌면, 열려 있던 서랍·드롭다운을 닫는다. */
(function () {
  'use strict';
  var hdr = document.querySelector('[data-hdr]');
  if (!hdr) return;
  var root = document.documentElement;
  var drawer = document.getElementById('mnav');
  var scrim = document.querySelector('[data-scrim]');
  var toggle = hdr.querySelector('.menu-toggle');
  var closeBtn = drawer ? drawer.querySelector('.drawer-close') : null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* 휴대폰 머리글 조건 — tokens.css·base.css 의 미디어 조건과 같아야 한다 */
  var MOBILE = '(max-width: 900px), (orientation: landscape) and (max-height: 500px)';

  function setExpanded(btn, on) { btn.setAttribute('aria-expanded', on ? 'true' : 'false'); }

  /* 한 그룹 안에서 하나만 펼치는 아코디언(서랍 속 메뉴·나라). itemOf(btn) 이 펼침 표시(is-open)를 달 요소. */
  function group(buttons, itemOf) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(function (other) { setExpanded(other, false); itemOf(other).classList.remove('is-open'); });
        if (on) { setExpanded(btn, true); itemOf(btn).classList.add('is-open'); }
      });
    });
  }

  /* ---------- 데스크톱 드롭다운 ---------- */
  var topButtons = [].slice.call(hdr.querySelectorAll('.gnav-btn'));
  function panelOf(btn) { return document.getElementById(btn.getAttribute('aria-controls')); }
  function openTop() {
    for (var i = 0; i < topButtons.length; i++) if (topButtons[i].getAttribute('aria-expanded') === 'true') return topButtons[i];
    return null;
  }
  function drawerOpen() { return !!drawer && drawer.classList.contains('is-open'); }
  function syncScrim() { if (scrim) scrim.classList.toggle('is-on', !!openTop() || drawerOpen()); }

  function openPanel(btn) {
    topButtons.forEach(function (b) { var on = b === btn; setExpanded(b, on); panelOf(b).classList.toggle('is-open', on); });
    showHdr();
    syncScrim();
  }
  function closePanels(instant) {
    if (instant) hdr.classList.add('no-anim');
    topButtons.forEach(function (b) { setExpanded(b, false); panelOf(b).classList.remove('is-open'); });
    syncScrim();
    if (instant) { void hdr.offsetHeight; requestAnimationFrame(function () { hdr.classList.remove('no-anim'); }); }
  }
  topButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-expanded') === 'true') closePanels(false);
      else openPanel(btn);
    });
  });

  /* ---------- 모바일 서랍 ---------- */
  var lastFocus = null;
  function focusables() {
    return [].slice.call(drawer.querySelectorAll('a[href], button:not([disabled])')).filter(function (el) {
      return el.offsetParent !== null && !el.closest('[aria-hidden="true"]') && getComputedStyle(el).visibility !== 'hidden';
    });
  }
  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    document.body.classList.add('lock');
    setExpanded(toggle, true);
    syncScrim();
    setTimeout(function () { if (closeBtn) closeBtn.focus(); }, reduce ? 0 : 60);
  }
  function closeDrawer(returnFocus) {
    if (!drawerOpen()) return;
    drawer.classList.remove('is-open');
    document.body.classList.remove('lock');
    setExpanded(toggle, false);
    syncScrim();
    if (returnFocus && toggle) toggle.focus();
  }
  if (toggle) toggle.addEventListener('click', function () { if (drawerOpen()) closeDrawer(true); else openDrawer(); });
  if (closeBtn) closeBtn.addEventListener('click', function () { closeDrawer(true); });
  if (drawer) {
    group([].slice.call(drawer.querySelectorAll('.macc-btn')), function (b) { return b.parentNode; });
    [].slice.call(drawer.querySelectorAll('.cacc')).forEach(function (acc) {
      group([].slice.call(acc.querySelectorAll('.cacc-btn')), function (b) { return b.parentNode; });
    });
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
  }
  if (scrim) scrim.addEventListener('click', function () { closePanels(false); closeDrawer(false); });
  if (window.matchMedia) {
    var mq = window.matchMedia(MOBILE);
    var onMq = function () { if (mq.matches) closePanels(true); else closeDrawer(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (drawerOpen()) { closeDrawer(true); return; }
    var btn = openTop();
    if (btn) { closePanels(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (openTop() && !hdr.contains(e.target)) closePanels(false);
  });

  /* 메뉴·서랍 속 링크: 즉시 닫은 뒤 이동. 같은 페이지 앵커면 닫힌 상태 기준으로 다시 스크롤한다. */
  function onLink(e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    closePanels(true);
    closeDrawer(false);
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
  }
  [].slice.call(hdr.querySelectorAll('.gpanels')).forEach(function (el) { el.addEventListener('click', onLink); });
  if (drawer) drawer.querySelector('.drawer-body').addEventListener('click', onLink);

  /* ---------- 스크롤에 따라 숨김·나타남 ---------- */
  var lastY = window.scrollY, ticking = false;
  function showHdr() { hdr.classList.remove('is-hidden'); root.classList.remove('hdr-gone'); }
  function hideHdr() { hdr.classList.add('is-hidden'); root.classList.add('hdr-gone'); }
  function onScroll() {
    ticking = false;
    var y = window.scrollY, dy = y - lastY;
    hdr.classList.toggle('is-solid', y > 4);
    if (openTop() || drawerOpen() || hdr.contains(document.activeElement)) { showHdr(); lastY = y; return; }
    if (y < hdr.offsetHeight + 40) showHdr();
    else if (dy > 6) hideHdr();
    else if (dy < -6) showHdr();
    lastY = y;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  hdr.addEventListener('focusin', showHdr);
  onScroll();
})();
