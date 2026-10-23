/* 홈 히어로 나라 사진 슬라이드 (PROCEDURE 1-4)
   - 7초마다 다음 나라로 넘어간다(겹쳐 사라지는 전환 + 사진이 천천히 당겨짐). 점에는 남은 시간이 차오른다.
   - 멈춤 단추로 세우고 다시 켤 수 있다. 마우스를 올리거나 키보드 초점이 들어오거나, 화면 밖·탭 숨김이면 잠시 멈춘다.
   - 좌우 화살표 키, 이전·다음 단추, 점, 손가락 밀기로 넘긴다. 보이지 않는 장은 inert 로 Tab 에 잡히지 않는다.
   - '동작 줄이기'면 자동 넘김을 하지 않는다. JS 가 없으면 첫 장만 보인다(home.css). */
(function () {
  'use strict';
  var car = document.querySelector('[data-carousel]');
  if (!car) return;
  var slides = [].slice.call(car.querySelectorAll('.slide'));
  var dots = [].slice.call(car.querySelectorAll('.car-dot'));
  var pauseBtn = car.querySelector('.car-pause');
  var MS = 7000;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var index = 0, timer = null, userPaused = reduce, hover = false, focusIn = false, inView = true;
  car.style.setProperty('--car-ms', MS + 'ms');

  function playing() { return !userPaused && !hover && !focusIn && inView && !document.hidden; }

  function schedule() {
    clearTimeout(timer);
    var on = playing();
    car.classList.toggle('is-playing', on);
    if (on) timer = setTimeout(function () { show(index + 1); }, MS);
  }

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) {
      var on = k === index;
      s.classList.toggle('is-active', on);
      if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
      s.inert = !on;
    });
    dots.forEach(function (d, k) {
      if (k === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
    car.classList.remove('is-playing');
    void car.offsetWidth;   /* 점 진행 애니메이션을 처음부터 다시 */
    schedule();
  }

  function setPaused(on) {
    userPaused = on;
    pauseBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    pauseBtn.setAttribute('aria-label', on ? '자동 넘김 다시 시작' : '자동 넘김 멈추기');
    schedule();
  }

  car.querySelector('.car-prev').addEventListener('click', function () { show(index - 1); });
  car.querySelector('.car-next').addEventListener('click', function () { show(index + 1); });
  dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
  pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });

  /* 진짜 마우스를 올렸을 때만 멈춘다 — 손가락으로 누르면 브라우저가 '마우스 올림'을 흉내 내고 '떠남'은 보내지 않아
     자동 넘김이 계속 멈춰 있게 된다(2026-10-23 발견). */
  function isMouse(e) { return !e.pointerType || e.pointerType === 'mouse'; }
  if (window.PointerEvent) {
    car.addEventListener('pointerenter', function (e) { if (isMouse(e)) { hover = true; schedule(); } });
    car.addEventListener('pointerleave', function (e) { if (isMouse(e)) { hover = false; schedule(); } });
  } else {
    car.addEventListener('mouseenter', function () { hover = true; schedule(); });
    car.addEventListener('mouseleave', function () { hover = false; schedule(); });
  }
  car.addEventListener('focusin', function () { focusIn = true; schedule(); });
  car.addEventListener('focusout', function (e) { if (!car.contains(e.relatedTarget)) { focusIn = false; schedule(); } });
  car.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
  });
  document.addEventListener('visibilitychange', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; schedule(); }, { threshold: .25 }).observe(car);
  }

  /* 손가락으로 좌우 밀기 */
  var x0 = null, y0 = null;
  car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  car.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    x0 = y0 = null;
  });

  setPaused(userPaused);
  show(0);
})();
