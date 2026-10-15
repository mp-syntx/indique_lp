/*
 * Formulário "Indique sua empresa" v2 — envio direto para o ActiveCampaign (formulário #12)
 * via JSONP no proc.php, o mesmo mecanismo do embed oficial da AC.
 *
 * Configuração opcional, antes deste script:
 *   window.EVA_INDIQUE = { privacidadeUrl: 'https://…', teste: true };
 * Em modo teste, valida tudo e mostra a confirmação, mas não envia nada à AC.
 * `?teste=1` na URL também liga o modo teste.
 */
(function () {
  var CONFIG = Object.assign({
    endpoint: 'https://bastasentir.activehosted.com/proc.php',
    u: '6AD0222C091DC',
    f: '12',
    // `or` muda se o formulário #12 for salvo de novo na AC; nesse caso, atualizar aqui
    or: 'ebb93716-167b-475e-8b5d-b9a99d06cca9',
    privacidadeUrl: '',
    teste: false,
    // chamado após uma indicação concluída (ex.: evento de analytics)
    aoEnviar: null
  }, window.EVA_INDIQUE || {});
  if (/[?&]teste=1/.test(location.search)) CONFIG.teste = true;

  // nome do parâmetro na AC para cada campo
  var MAPA = {
    empresa: 'field[49]', contato_nome: 'fullname', contato_email: 'email',
    contato_cargo: 'field[51]', contato_tel: 'phone', contexto: 'field[64]',
    ind_nome: 'field[59]', ind_email: 'field[60]', pode_citar: 'field[63]'
  };
  var UTM = { utm_source: 'field[28]', utm_medium: 'field[26]', utm_campaign: 'field[27]', utm_content: 'field[57]' };
  var NOMES = ['A empresa', 'Sobre você'];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var raiz = document.getElementById('eva-indique');
  if (!raiz) return;
  var form = raiz.querySelector('#ei-form');
  var passos = raiz.querySelectorAll('.ei-passo');
  var barras = raiz.querySelectorAll('.ei-prog span');
  var progTxt = raiz.querySelector('#ei-prog-txt');
  var btnAvancar = raiz.querySelector('#ei-avancar');
  var btnVoltar = raiz.querySelector('#ei-voltar');
  var erroGeral = raiz.querySelector('#ei-form-erro');
  var ok = raiz.querySelector('#ei-ok');
  var foot = raiz.querySelector('#ei-foot');
  var mais = raiz.querySelector('.ei-mais');
  var atual = 1, enviando = false, timer = null;

  raiz.querySelectorAll('.ei-priv').forEach(function (a) {
    if (CONFIG.privacidadeUrl) a.href = CONFIG.privacidadeUrl;
    else a.replaceWith(document.createTextNode(a.textContent));
  });

  function el(n) { return form.elements[n]; }
  function valor(n) {
    var e = el(n);
    if (!e) return '';
    if (!e.tagName) { var m = form.querySelector('input[name="' + n + '"]:checked'); return m ? m.value : ''; }
    return (e.value || '').trim();
  }

  el('contato_tel').addEventListener('input', function (e) {
    var d = e.target.value.replace(/\D/g, '').slice(0, 11), r = d;
    if (d.length > 2) r = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length > 6) r = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    e.target.value = r;
  });

  function marca(c, msg) {
    c.setAttribute('aria-invalid', 'true');
    var box = c.closest('.ei-f');
    if (box && !box.querySelector('.ei-err')) {
      var s = document.createElement('span');
      s.className = 'ei-err'; s.id = 'ei-err-' + c.name; s.textContent = msg;
      box.appendChild(s); c.setAttribute('aria-describedby', s.id);
    }
  }
  function limpa(c) {
    c.removeAttribute('aria-invalid'); c.removeAttribute('aria-describedby');
    var s = c.closest('.ei-f') && c.closest('.ei-f').querySelector('.ei-err');
    if (s) s.remove();
  }
  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid')) limpa(e.target);
    var fs = e.target.closest('.ei-chips'); if (fs) fs.classList.remove('erro');
    erroGeral.hidden = true;
  });

  function valida(n) {
    var primeiro = null, bloco = passos[n - 1];
    bloco.querySelectorAll('input:not([type=radio]), textarea').forEach(function (c) {
      limpa(c);
      var v = c.value.trim(), msg = '';
      if (c.required && !v) msg = 'Preencha este campo.';
      else if (v && c.type === 'email' && !EMAIL_RE.test(v)) msg = 'Confira o e-mail.';
      else if (v && c.type === 'tel' && v.replace(/\D/g, '').length < 10) msg = 'Confira o número com DDD.';
      if (msg) {
        marca(c, msg);
        if (!primeiro) primeiro = c;
        if (mais && mais.contains(c)) mais.open = true;
      }
    });
    bloco.querySelectorAll('.ei-chips[data-req]').forEach(function (fs) {
      if (!valor(fs.getAttribute('data-req'))) { fs.classList.add('erro'); primeiro = primeiro || fs.querySelector('input'); }
    });
    if (n === 2 && !primeiro && valor('ind_email').toLowerCase() === valor('contato_email').toLowerCase()) {
      marca(el('ind_email'), 'É o mesmo e-mail da pessoa indicada. Use o seu.'); primeiro = el('ind_email');
    }
    if (primeiro) {
      erroGeral.textContent = 'Falta pouco: confira os campos destacados.';
      erroGeral.hidden = false;
      primeiro.focus();
      return false;
    }
    return true;
  }

  function vaiPara(n) {
    atual = n;
    passos.forEach(function (p, i) { p.hidden = i !== n - 1; });
    barras.forEach(function (b, i) { b.className = i < n - 1 ? 'done' : (i === n - 1 ? 'on' : ''); });
    progTxt.textContent = 'Passo ' + n + ' de 2 · ' + NOMES[n - 1];
    btnVoltar.hidden = n === 1;
    btnAvancar.innerHTML = n === 2 ? 'Enviar indicação' : 'Continuar <svg class="ei-i"><use href="#ei-seta"/></svg>';
    erroGeral.hidden = true;
    var foco = passos[n - 1].querySelector('input');
    if (foco && n > 1) foco.focus({ preventScroll: true });
    if (raiz.getBoundingClientRect().top < 0) raiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  btnVoltar.addEventListener('click', function () { if (atual > 1) vaiPara(atual - 1); });

  function sucesso() {
    clearTimeout(timer); enviando = false; btnAvancar.disabled = false;
    raiz.querySelector('#ei-ok-empresa').textContent = valor('empresa') || 'empresa';
    form.hidden = true; foot.hidden = true; ok.hidden = false; ok.focus();
    raiz.dispatchEvent(new CustomEvent('eva-indique:enviado', { bubbles: true, detail: { teste: CONFIG.teste } }));
    if (typeof CONFIG.aoEnviar === 'function') CONFIG.aoEnviar({ teste: CONFIG.teste });
  }
  function falha(msg) {
    clearTimeout(timer); enviando = false;
    btnAvancar.disabled = false; btnAvancar.textContent = 'Enviar indicação';
    erroGeral.textContent = msg; erroGeral.hidden = false;
  }
  window._show_thank_you = function () { sucesso(); };
  window._show_unsubscribe = function () { sucesso(); };
  window._show_error = function (id, message) {
    falha('Não conseguimos registrar a indicação' + (message ? ': ' + String(message).replace(/<[^>]+>/g, '') : '.') + ' Tente de novo.');
  };

  function envia() {
    var p = [['u', CONFIG.u], ['f', CONFIG.f], ['s', ''], ['c', '0'], ['m', '0'], ['act', 'sub'], ['v', '2'], ['or', CONFIG.or]];
    Object.keys(MAPA).forEach(function (k) {
      var v = valor(k);
      if (k === 'contato_tel') { var d = v.replace(/\D/g, ''); v = d.length >= 10 ? '+55' + d : ''; }
      if (v) p.push([MAPA[k], v]);
    });
    var qs = new URLSearchParams(location.search);
    Object.keys(UTM).forEach(function (k) { var v = qs.get(k); if (v) p.push([UTM[k], v]); });

    enviando = true; btnAvancar.disabled = true; btnAvancar.textContent = 'Enviando…';
    if (CONFIG.teste) {
      window.__evaIndiqueUltimoEnvio = p;
      if (window.console) console.info('[eva-indique] modo teste, nada enviado à AC:', p);
      setTimeout(sucesso, 500);
      return;
    }
    var s = document.createElement('script');
    s.src = CONFIG.endpoint + '?' + p.map(function (x) {
      return encodeURIComponent(x[0]) + '=' + encodeURIComponent(x[1]);
    }).join('&') + '&jsonp=true';
    s.onerror = function () { falha('Não conseguimos enviar. Verifique sua conexão e tente de novo.'); };
    timer = setTimeout(function () { if (enviando) falha('O envio está demorando mais que o normal. Tente de novo.'); }, 15000);
    document.head.appendChild(s);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando || !valida(atual)) return;
    if (atual < 2) vaiPara(2); else envia();
  });

  // indicar outra empresa: mantém os dados de quem indica e volta ao passo 1
  raiz.querySelector('#ei-outra').addEventListener('click', function () {
    ['empresa', 'contato_nome', 'contato_email', 'contato_cargo', 'contato_tel', 'contexto'].forEach(function (n) { el(n).value = ''; });
    if (mais) mais.open = false;
    ok.hidden = true; form.hidden = false; foot.hidden = false;
    vaiPara(1);
    el('empresa').focus();
  });
})();
