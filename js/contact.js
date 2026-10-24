/* 문의 양식 (PROCEDURE 1-8, 5장)
   - 받는 메일 주소는 Apps Script 의 스크립트 속성에만 있다. 여기서는 웹 앱 주소(data-endpoint)로 보낼 뿐이다.
   - Content-Type 을 지정하지 않는다 → 문자열 본문은 text/plain 으로 가서 사전 요청(preflight)이 생기지 않는다.
   - 휴대폰은 국가번호 선택 + 번호 (2026-10-24). 국가번호는 브라우저 언어의 지역 → 페이지 언어 기본값 순으로 미리 고르고,
     번호를 '+81 …'처럼 국가번호부터 적으면 국가번호 칸을 맞춘다. 서버(Code.gs)도 같은 목록(DIAL)으로 다시 검사한다.
   - 이 화면에서 언어를 바꾸면 적던 내용을 들고 그 언어의 문의 양식으로 간다(이 탭의 sessionStorage, 다음 화면에서 바로 지움). */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint') || '';
  var openedAt = Date.now();
  var status = document.getElementById('form-status');
  var submit = form.querySelector('button[type="submit"]');
  var cc = form.elements.cc;
  var phoneEl = form.elements.phone;
  var pageLang = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  var DRAFT = 'hq-contact-draft';
  var FIELDS = ['name', 'cc', 'phone', 'email', 'product', 'time', 'message'];
  /* 안내·오류 문구는 그 페이지 언어로 (build.py 가 넣는 #hq-i18n, content/i18n/ui.json 의 js.*) */
  var T = JSON.parse(document.getElementById('hq-i18n').textContent);

  /* 상품 페이지에서 온 경우 미리 선택: contact.html?product=hk-ins-1 또는 ?country=hk */
  var params = new URLSearchParams(window.location.search);
  var product = params.get('product') || '';
  var country = params.get('country') || (product ? product.split('-')[0] : '');
  if (product && form.elements.product) {
    var opt = form.elements.product.querySelector('option[value="' + product.replace(/[^a-z0-9-]/g, '') + '"]');
    if (opt) form.elements.product.value = opt.value;
  }
  if (country) {
    var box = form.querySelector('input[name="countries"][value="' + country.replace(/[^a-z]/g, '') + '"]');
    if (box) box.checked = true;
  }

  /* ---- 국가번호 ---- */
  function hasCc(iso) { return !!cc.querySelector('option[value="' + iso + '"]'); }

  /* 브라우저 언어 가운데 이 페이지 언어와 같은 것의 지역(ko-KR·en-SG·zh-HK)이 목록에 있으면 그 나라. 없으면 빌드가 고른 기본값 그대로 */
  function pickDefaultCc() {
    var langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var m = /^([a-z]{2,3})[-_](?:[a-z]{4}[-_])?([a-z]{2})$/i.exec(langs[i] || '');
      if (!m || m[1].toLowerCase() !== pageLang) continue;
      var region = m[2].toLowerCase() === 'uk' ? 'gb' : m[2].toLowerCase();
      if (hasCc(region)) { cc.value = region; return; }
    }
  }

  function syncPlaceholder() {
    var o = cc.options[cc.selectedIndex];
    phoneEl.placeholder = (o && o.getAttribute('data-ph')) || '';
  }

  /* '+81 90 …'처럼 국가번호부터 적으면 국가번호 칸을 그 나라로 바꾸고 번호에서 국가번호를 뗀다.
     +1(미국·캐나다)처럼 같은 번호를 쓰는 나라는 지금 고른 것을 그대로 둔다. 목록에 없는 국가번호면 '기타'로 두고 번호는 그대로 */
  function absorbDial() {
    var v = phoneEl.value.trim();
    if (v.charAt(0) !== '+') return;
    var digits = v.replace(/\D/g, '');
    var best = null;
    [].forEach.call(cc.options, function (o) {
      var d = (o.getAttribute('data-dial') || '').slice(1);
      if (d && digits.indexOf(d) === 0 && (!best || d.length > best.d.length)) best = { o: o, d: d };
    });
    if (!best) {
      cc.value = 'xx';
    } else {
      var cur = cc.options[cc.selectedIndex];
      if (!(cur && cur.getAttribute('data-dial') === '+' + best.d)) cc.value = best.o.value;
      phoneEl.value = v.replace(new RegExp('^\\+[\\s-]*' + best.d.split('').join('[\\s-]*') + '[\\s-]*'), '');
    }
    syncPlaceholder();
  }

  function phoneError(phone) {
    if (!phone) return T.err_phone;
    var digits = phone.replace(/\D/g, '');
    if (cc.value === 'xx') {
      if (!/^\+[0-9 -]+$/.test(phone)) return T.err_phone_other;
      return digits.length < 8 || digits.length > 15 ? T.err_phone_len : '';
    }
    if (!/^[0-9 -]+$/.test(phone)) return T.err_phone_fmt;
    var kr = cc.value === 'kr';
    return digits.length < (kr ? 9 : 6) || digits.length > (kr ? 11 : 14) ? T.err_phone_len : '';
  }

  /* ---- 언어를 바꿀 때 적던 내용 들고 가기 ---- */
  function checkedCountries() {
    return [].slice.call(form.querySelectorAll('input[name="countries"]:checked')).map(function (b) { return b.value; });
  }

  function saveDraft() {
    var d = { countries: checkedCountries(), openedAt: openedAt };
    FIELDS.forEach(function (n) { d[n] = form.elements[n] ? form.elements[n].value : ''; });
    try { sessionStorage.setItem(DRAFT, JSON.stringify(d)); } catch (e) { /* 저장을 막은 브라우저 — 내용 없이 이동 */ }
  }

  /* 동의 체크는 들고 가지 않는다 — 바뀐 언어로 안내를 읽고 다시 동의하게 */
  function restoreDraft() {
    var d;
    try {
      d = JSON.parse(sessionStorage.getItem(DRAFT) || 'null');
      sessionStorage.removeItem(DRAFT);
    } catch (e) { return false; }
    if (!d || typeof d !== 'object') return false;
    FIELDS.forEach(function (n) {
      var el = form.elements[n];
      if (!el || typeof d[n] !== 'string') return;
      if (el.tagName === 'SELECT' && !el.querySelector('option[value="' + d[n].replace(/[^\w가-힣-]/g, '') + '"]')) return;
      el.value = d[n];
    });
    if (Array.isArray(d.countries)) {
      [].forEach.call(form.querySelectorAll('input[name="countries"]'), function (b) { b.checked = d.countries.indexOf(b.value) >= 0; });
    }
    var t = Number(d.openedAt);
    if (t > 0 && t < openedAt && openedAt - t < 864e5) openedAt = t;   // 언어를 바꿔도 '작성 시간' 봇 검사가 처음부터 다시 세지 않게
    return true;
  }

  [].forEach.call(document.querySelectorAll('.lang-mini a[hreflang], .lang-drawer a[hreflang], .lang-hero a[hreflang]'), function (a) {
    a.addEventListener('click', function () {
      if (a.getAttribute('aria-current')) return;
      saveDraft();
      if (window.location.search && a.href.indexOf('?') < 0) a.href = a.href + window.location.search;
    });
  });

  if (!restoreDraft()) pickDefaultCc();
  syncPlaceholder();
  cc.addEventListener('change', syncPlaceholder);
  phoneEl.addEventListener('change', absorbDial);
  phoneEl.addEventListener('blur', absorbDial);

  /* ---- 검사·보내기 ---- */
  function fieldOf(name) { return form.querySelector('[data-field="' + name + '"]'); }

  function setError(name, message) {
    var field = fieldOf(name);
    if (!field) return;
    var err = field.querySelector('.err');
    field.classList.toggle('invalid', !!message);
    if (err) { err.textContent = message || ''; err.hidden = !message; }
  }

  function val(name) {
    var el = form.elements[name];
    return el && typeof el.value === 'string' ? el.value.trim() : '';
  }

  function validate() {
    absorbDial();
    var errors = [];
    var name = val('name'), email = val('email'), message = val('message');
    var checks = [
      ['name', !name ? T.err_name : name.length > 30 ? T.err_name_long : ''],
      ['phone', phoneError(val('phone'))],
      ['email', email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? T.err_email : ''],
      ['message', message.length < 10 ? T.err_msg_short : message.length > 2000 ? T.err_msg_long : ''],
      ['consent', !form.elements.consent.checked ? T.err_consent : '']
    ];
    checks.forEach(function (c) {
      setError(c[0], c[1]);
      if (c[1]) errors.push(c[0]);
    });
    return errors;
  }

  function show(kind, html) {
    status.className = 'form-status ' + kind;
    status.innerHTML = html;
    status.hidden = false;
  }

  function fallbackMail() {
    var user = '78to88', host = 'gmail.com';
    var addr = user + '@' + host;
    return '<a href="mailto:' + addr + '">' + addr + '</a>';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = validate();
    if (errors.length) {
      var first = form.elements[errors[0]];
      if (first && first.focus) first.focus();
      return;
    }
    if (!endpoint) {
      show('info', T.no_endpoint);
      return;
    }
    var picked = form.elements.product.value ? form.elements.product.options[form.elements.product.selectedIndex] : null;
    var payload = {
      name: val('name'),
      phone: val('phone'),
      phoneCountry: cc.value,
      email: val('email'),
      countries: checkedCountries(),
      product: val('product'),
      productName: picked ? picked.textContent : '',
      productNameKo: picked ? (picked.getAttribute('data-ko') || '') : '',
      time: val('time'),
      message: val('message'),
      consent: form.elements.consent.checked,
      lang: pageLang,
      website: val('website'),
      elapsed: Date.now() - openedAt,
      from: product
    };
    submit.disabled = true;
    submit.firstChild.textContent = T.sending;
    fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'fail');
        var at = new Date().toLocaleString(T.locale || 'ko-KR', { timeZone: 'Asia/Seoul' }) + ' KST';
        form.hidden = true;
        var done = document.getElementById('form-done');
        done.querySelector('[data-received]').textContent = at;
        done.hidden = false;
        done.focus();
      })
      .catch(function () {
        submit.disabled = false;
        submit.firstChild.textContent = T.resend;
        show('fail', T.fail.replace('{mail}', fallbackMail()));
      });
  });
})();
