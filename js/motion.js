/* 숫자 띠 — 화면에 들어오면 0부터 목표 숫자까지 올라간다(1.2초, 끝에서 느려짐).
   '동작 줄이기'거나 IntersectionObserver 가 없으면 처음부터 최종 숫자가 그대로 보인다(마크업 값). */
(function () {
  'use strict';
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!nums.length || reduce || !('IntersectionObserver' in window)) return;

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function run(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / 1200), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pad(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { io.unobserve(en.target); run(en.target); }
    });
  }, { threshold: .6 });
  nums.forEach(function (el) { el.textContent = '00'; io.observe(el); });
})();
