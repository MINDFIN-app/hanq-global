/* 문의 양식 (PROCEDURE 1-8, 5장)
   - 받는 메일 주소는 Apps Script 의 스크립트 속성에만 있다. 여기서는 웹 앱 주소(data-endpoint)로 보낼 뿐이다.
   - Content-Type 을 지정하지 않는다 → 문자열 본문은 text/plain 으로 가서 사전 요청(preflight)이 생기지 않는다. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint') || '';
  var openedAt = Date.now();
  var status = document.getElementById('form-status');
  var submit = form.querySelector('button[type="submit"]');

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
    var errors = [];
    var name = val('name'), phone = val('phone'), email = val('email'), message = val('message');
    var checks = [
      ['name', !name ? '이름을 적어 주세요.' : name.length > 30 ? '이름은 30자 이내로 적어 주세요.' : ''],
      ['phone', !phone ? '휴대폰 번호를 적어 주세요.' : !/^[0-9-]{10,13}$/.test(phone) ? '숫자와 하이픈만, 10~13자로 적어 주세요.' : ''],
      ['email', email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '이메일 형식을 확인해 주세요.' : ''],
      ['message', message.length < 10 ? '문의 내용을 10자 이상 적어 주세요.' : message.length > 2000 ? '문의 내용은 2,000자 이내로 줄여 주세요.' : ''],
      ['consent', !form.elements.consent.checked ? '개인정보 수집·이용에 동의해야 문의를 보낼 수 있습니다.' : '']
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
      show('info', '시안 화면이라 아직 문의가 전송되지 않습니다. 문의 메일 연결(Apps Script) 설정이 끝나면 이 양식으로 바로 접수됩니다.');
      return;
    }
    var payload = {
      name: val('name'),
      phone: val('phone'),
      email: val('email'),
      countries: [].slice.call(form.querySelectorAll('input[name="countries"]:checked')).map(function (b) { return b.value; }),
      product: val('product'),
      time: val('time'),
      message: val('message'),
      consent: form.elements.consent.checked,
      website: val('website'),
      elapsed: Date.now() - openedAt,
      from: product
    };
    submit.disabled = true;
    submit.firstChild.textContent = '보내는 중… ';
    fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'fail');
        var at = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        form.hidden = true;
        var done = document.getElementById('form-done');
        done.querySelector('[data-received]').textContent = at;
        done.hidden = false;
        done.focus();
      })
      .catch(function () {
        submit.disabled = false;
        submit.firstChild.textContent = '다시 보내기 ';
        show('fail', '문의를 보내지 못했습니다. 입력하신 내용은 그대로 있으니 잠시 뒤 다시 보내 주세요. 계속 안 되면 ' + fallbackMail() + ' 로 메일을 보내 주세요.');
      });
  });
})();
