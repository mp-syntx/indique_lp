/* LP "Indique sua empresa", alternativa B: atalhos para o formulário, topo, barra do celular e entrada das telas do app. */
(function () {
  var card = document.getElementById('eva-indique');
  var barra = document.getElementById('barra');
  var top = document.getElementById('top');
  var hero = document.querySelector('.hero');
  var desktop = window.matchMedia('(min-width:1100px)');
  if (!card) return;

  // CTAs: no desktop o formulário já está visível, então só realça; no celular e no tablet, rola até ele
  document.querySelectorAll('[data-ir-form]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!desktop.matches) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card.classList.remove('realce'); void card.offsetWidth; card.classList.add('realce');
      var campo = card.querySelector('.ei-passo:not([hidden]) input, #ei-outra:not([hidden])');
      if (campo) setTimeout(function () { campo.focus({ preventScroll: true }); }, desktop.matches ? 0 : 500);
    });
  });

  function aoRolar() { top.classList.toggle('rolou', window.scrollY > 24); }
  window.addEventListener('scroll', aoRolar, { passive: true }); aoRolar();

  if ('IntersectionObserver' in window) {
    // barra fixa do celular: aparece quando a abertura e o formulário já saíram da tela
    var vistos = new Map();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vistos.set(e.target, e.isIntersecting || e.boundingClientRect.top > 0); });
      var on = !desktop.matches && !vistos.get(hero) && !vistos.get(card);
      barra.classList.toggle('on', on);
      barra.setAttribute('aria-hidden', on ? 'false' : 'true');
      barra.querySelector('a').tabIndex = on ? 0 : -1;
    });
    io.observe(hero); io.observe(card);

    // telas do app abrem em leque quando chegam à tela
    var telas = document.querySelector('.telas');
    if (telas) new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { telas.classList.add('vis'); o.disconnect(); }
    }, { threshold: .25 }).observe(telas);
  } else {
    var t = document.querySelector('.telas'); if (t) t.classList.add('vis');
  }
})();
