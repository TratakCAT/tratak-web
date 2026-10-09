/* Shishi, guardián del CAT — mascota viva, guía sin costo, bordes de tinta */
(function (global) {
  'use strict';
  var BOX = { w: 700, h: 570 };
  var NUBES=['M74.7 54.9 L71.2 61.5 L66.2 66.9 L60.2 70.9 L53.4 73.3 L46.4 73.8 L39.6 72.6 L33.4 69.8 L28.1 65.6 L24.2 60.3 L21.8 54.3 L20.9 47.9 L21.7 41.7 L23.9 36.0 L27.4 31.1 L32.0 27.3 L37.2 24.8 L42.9 23.7 L48.5 24.1 L53.7 25.8 L58.2 28.7 L61.8 32.5 L64.3 37.1 L65.5 42.0 L65.4 46.9 L64.2 51.6 L61.8 55.7 L58.6 59.0 L54.7 61.4 L50.5 62.6 L46.2 62.8 L42.2 61.9 L38.5 60.1 L35.6 57.4 L33.4 54.2 L32.2 50.7 L31.9 47.1 L32.5 43.6 L33.9 40.5 L36.0 38.0 L38.6 36.1 L41.4 34.9 L44.4 34.6 L47.2 35.0 L49.8 36.1 L51.9 37.7 L53.4 39.7 L54.4 41.9 L54.7 44.2 L54.4 46.4 L53.6 48.4 L52.4 50.0 L50.9 51.1 L49.3 51.8 L47.6 52.0 L46.1 51.8 L44.7 51.2 L43.7 50.3 L43.0 49.3 L42.6 48.2 L42.6 47.2 M76.0 40.0 L79.8 42.3 L83.7 44.5 L87.5 46.5 L91.3 48.2 L95.2 49.7 L99.0 50.9 L102.8 51.7 L106.7 52.2 L110.5 52.3 L114.3 52.1 L118.2 51.5 L122.0 50.6 L125.8 49.5 L129.7 48.1 L133.5 46.6 L137.3 44.9 L141.2 43.1 L145.0 41.3 L148.8 39.6 L152.7 37.9 L156.5 36.3 L160.3 34.9 L164.2 33.7 L168.0 32.7 L171.8 31.9 L175.7 31.4 L179.5 31.2 L183.3 31.2 L187.2 31.5 L191.0 32.0 M121.2 80.0 L125.3 77.1 L128.6 73.4 L130.9 69.2 L132.2 64.5 L132.4 59.8 L131.5 55.2 L129.6 51.0 L126.8 47.5 L123.4 44.7 L119.5 42.8 L115.3 41.8 L111.1 41.9 L107.0 42.9 L103.4 44.8 L100.4 47.4 L98.1 50.5 L96.6 54.1 L96.0 57.8 L96.2 61.5 L97.3 65.0 L99.1 68.0 L101.5 70.5 L104.3 72.4 L107.5 73.5 L110.7 73.9 L113.8 73.5 L116.8 72.4 L119.3 70.7 L121.3 68.6 L122.7 66.0 L123.5 63.3 L123.7 60.6 L123.2 58.0 L122.1 55.6 L120.6 53.6 L118.7 52.1 L116.6 51.0 L114.3 50.5 L112.1 50.6 L110.0 51.1 L108.2 52.1 L106.7 53.4 L105.6 55.0 L104.9 56.8 L104.7 58.5 L104.8 60.2 L105.4 61.8 L106.3 63.1 L107.4 64.1 L108.6 64.8 L109.9 65.1 L111.2 65.2 L112.4 64.9 L113.4 64.4 L114.2 63.7 L114.7 62.8 L115.0 62.0 L115.1 61.1 L114.9 60.3 L114.6 59.7 M14.0 78.0 L19.0 76.7 L24.0 75.4 L29.0 74.3 L34.0 73.3 L39.0 72.5 L44.0 71.8 L49.0 71.3 L54.0 71.0 L59.0 71.0 L64.0 71.1 L69.0 71.4 L74.0 71.9 L79.0 72.6 L84.0 73.4 L89.0 74.2 L94.0 75.2 L99.0 76.2 L104.0 77.2 L109.0 78.3 L114.0 79.2 L119.0 80.1 L124.0 80.9 L129.0 81.6 L134.0 82.2 L139.0 82.6 L144.0 82.9 L149.0 83.0 L154.0 83.0 L159.0 82.9 L164.0 82.6','M26.0 61.9 L32.2 64.4 L38.8 65.2 L45.3 64.3 L51.2 61.7 L56.2 57.8 L60.0 52.8 L62.2 47.1 L62.9 41.1 L62.1 35.2 L59.7 29.8 L56.1 25.3 L51.6 22.0 L46.4 20.0 L41.0 19.4 L35.7 20.2 L30.9 22.3 L26.9 25.6 L23.9 29.7 L22.1 34.3 L21.6 39.1 L22.4 43.8 L24.4 48.1 L27.3 51.6 L30.9 54.2 L35.0 55.7 L39.2 56.1 L43.3 55.3 L47.0 53.6 L50.1 51.1 L52.3 47.9 L53.5 44.3 L53.8 40.7 L53.1 37.1 L51.6 34.0 L49.4 31.5 L46.6 29.7 L43.6 28.7 L40.5 28.5 L37.6 29.1 L35.1 30.4 L33.0 32.3 L31.6 34.6 L30.9 37.1 L30.8 39.6 L31.4 41.9 L32.5 43.9 L34.0 45.4 L35.8 46.5 L37.8 47.0 L39.7 46.9 L41.4 46.4 L42.8 45.5 L43.9 44.3 L44.6 42.9 L44.8 41.5 L44.6 40.2 L44.2 39.1 L43.5 38.2 L42.6 37.6 L41.7 37.4 M66.0 36.0 L69.3 34.0 L72.7 32.2 L76.0 30.5 L79.3 28.9 L82.7 27.7 L86.0 26.7 L89.3 26.0 L92.7 25.6 L96.0 25.5 L99.3 25.7 L102.7 26.1 L106.0 26.9 L109.3 27.9 L112.7 29.0 L116.0 30.4 L119.3 31.8 L122.7 33.3 L126.0 34.9 L129.3 36.4 L132.7 37.8 L136.0 39.2 L139.3 40.4 L142.7 41.4 L146.0 42.3 L149.3 42.9 L152.7 43.3 L156.0 43.5 L159.3 43.5 L162.7 43.3 L166.0 42.8 M119.6 60.0 L117.9 64.2 L115.3 67.9 L112.0 70.9 L108.2 73.0 L104.0 74.1 L99.8 74.2 L95.7 73.4 L92.0 71.7 L88.8 69.2 L86.3 66.2 L84.6 62.6 L83.8 58.9 L83.8 55.1 L84.7 51.6 L86.4 48.3 L88.7 45.6 L91.6 43.6 L94.7 42.3 L98.1 41.7 L101.3 41.9 L104.4 42.9 L107.2 44.5 L109.4 46.6 L111.0 49.2 L112.0 52.0 L112.3 54.8 L112.0 57.7 L111.0 60.2 L109.5 62.5 L107.6 64.3 L105.3 65.5 L103.0 66.2 L100.5 66.3 L98.2 65.9 L96.1 64.9 L94.4 63.6 L93.0 61.9 L92.1 60.0 L91.7 58.0 L91.7 56.1 L92.2 54.3 L93.1 52.7 L94.3 51.3 L95.7 50.4 L97.2 49.8 L98.7 49.6 L100.2 49.8 L101.5 50.3 L102.7 51.0 L103.5 52.0 L104.1 53.1 L104.4 54.2 L104.4 55.3 L104.1 56.3 L103.7 57.2 L103.1 57.8 L102.4 58.3 L101.6 58.5 L100.9 58.5 L100.3 58.4 M10.0 74.0 L14.0 75.3 L18.0 76.6 L22.0 77.7 L26.0 78.7 L30.0 79.5 L34.0 80.2 L38.0 80.7 L42.0 81.0 L46.0 81.0 L50.0 80.9 L54.0 80.6 L58.0 80.1 L62.0 79.4 L66.0 78.6 L70.0 77.8 L74.0 76.8 L78.0 75.8 L82.0 74.8 L86.0 73.7 L90.0 72.8 L94.0 71.9 L98.0 71.1 L102.0 70.4 L106.0 69.8 L110.0 69.4 L114.0 69.1 L118.0 69.0 L122.0 69.0 L126.0 69.1 L130.0 69.4'];
  var KEY = 'tratak-shishi';
  var cfg = {}, el = null, bordes = null, bubbleTimer = null, ultimaFrase = 0, montado = false;
  var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function R() { return global.TratakRender; }
  function visible() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  function setVisible(v) {
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {}
    document.documentElement.classList.toggle('sh-oculto', !v);
    if (!v) cerrarPanel();
    return v;
  }
  function toggle() { return setVisible(!visible()); }

  // ---------- frases por sección ----------
  var FRASES = {
    pilares: ['Tres pilares, un solo giro.', 'Materia, técnica y contemplación.'],
    lista_precios: ['Aquí empieza el camino. Mira la espiral que sostengo.', 'Cada espiral es un tópico. Tócalas.'],
    galeria: ['Todo esto salió de las manos.', 'Mira con calma…'],
    productos: ['Materia que se vuelve objeto.'],
    eventos_pasados: ['Estos talleres pueden volver a vivirse.'],
    evento_proximo: ['¡Hay un evento pronto!'],
    media: ['Mira con atención…'],
    blog: ['Historias para leer despacio.'],
    personajes: ['Gente que inspira el camino.'],
    destacado: ['Este es el taller donde todo se prueba.'],
    carrusel: ['Un vistazo a lo que hacemos.'],
    estadisticas: ['Los números también cuentan una historia.'],
    texto_destacado: ['Respira un momento.'],
    contacto: ['¿Hablamos? Aquí estoy.'],
    _: ['Respira. Mira.', 'Sigo aquí, cuidando el sitio.']
  };

  // ---------- construcción ----------
  function construir() {
    var gk = R() && R().gankyilSVG ? R().gankyilSVG({ id: 'shgk' }) : '';
    var lado = cfg.lado === 'derecha' ? ' lado-der' : '';
    var d = document.createElement('div');
    d.id = 'shishi'; d.className = 'shishi' + lado;
    d.innerHTML =
      '<span class="sh-box">' +
        '<span class="sh-bola">' + gk + '</span>' +
        '<img class="sh-cuerpo" alt="" src="images/shishi/shishi-cuerpo.webp" draggable="false">' +
        '<img class="sh-cola" alt="" src="images/shishi/shishi-cola.webp" draggable="false">' +
        '<svg class="sh-front" viewBox="0 0 ' + BOX.w + ' ' + BOX.h + '" aria-hidden="true">' +
          '<g class="sh-pup" data-ojo="0"><ellipse class="sh-pupila" cx="241.4" cy="124.1" rx="5.8" ry="6"/><circle class="sh-brillo" cx="239.2" cy="121.8" r="1.7"/></g>' +
          '<g class="sh-pup" data-ojo="1"><ellipse class="sh-pupila" cx="300.1" cy="125.4" rx="5.8" ry="6"/><circle class="sh-brillo" cx="297.9" cy="123.1" r="1.7"/></g>' +
        '</svg>' +
        '<button type="button" class="sh-hot" aria-label="Hablar con Shishi, guardián del sitio" aria-expanded="false"></button>' +
      '</span>' +
      '<span class="sh-zzz" aria-hidden="true">z z z</span>' +
      '<div class="sh-bubble" role="status" aria-live="polite"></div>';
    document.body.appendChild(d);
    el = d;

    var p = document.createElement('section');
    p.className = 'sh-panel'; p.hidden = true; p.setAttribute('aria-label', 'Guía de Shishi');
    p.innerHTML =
      '<header><span class="sh-avatar">' + (R() ? R().gankyilSVG({ id: 'shav' }) : '') + '</span><div><strong>Shishi</strong><small>guardián del CAT</small></div><button type="button" class="sh-cerrar" aria-label="Cerrar">✕</button></header>' +
      '<div class="sh-msgs"></div><div class="sh-chips"></div>' +
      '<form class="sh-form" autocomplete="off"><input type="text" name="q" placeholder="Pregúntame algo…" aria-label="Pregúntale a Shishi"><button type="submit" aria-label="Enviar">➤</button></form>';
    document.body.appendChild(p);
  }

  // ---------- vida: mirada, parpadeo, sueño ----------
  function vida() {
    var hot = el.querySelector('.sh-hot');
    var front = el.querySelector('.sh-front');
    var ojos = el.querySelectorAll('.sh-pup');
    var ult = 0;
    document.addEventListener('pointermove', function (e) {
      var now = Date.now(); if (now - ult < 40) return; ult = now;
      if (!visible()) return;
      var r = front.getBoundingClientRect(); if (!r.width) return;
      var sc = r.width / BOX.w;
      var cx = [241.4, 300.1], cy = [124.1, 125.4];
      for (var i = 0; i < 2; i++) {
        var ex = r.left + cx[i] * sc, ey = r.top + cy[i] * sc;
        var vx = e.clientX - ex, vy = e.clientY - ey, dist = Math.sqrt(vx * vx + vy * vy) || 1;
        var k = Math.min(1, dist / 220) * 3.4;
        ojos[i].style.transform = 'translate(' + (vx / dist * k).toFixed(2) + 'px,' + (vy / dist * k).toFixed(2) + 'px)';
      }
      if (cfg.gotas !== false && !reduce && global.matchMedia('(pointer:fine)').matches) gota(e.clientX, e.clientY, now);
    }, { passive: true });

    function parpadeo() {
      if (!reduce) { el.classList.add('parpadea'); setTimeout(function () { el.classList.remove('parpadea'); }, 150); }
      setTimeout(parpadeo, 2600 + Math.random() * 3800);
    }
    setTimeout(parpadeo, 2200);

    hot.addEventListener('mouseenter', function () { el.classList.add('contento'); despertar(); });
    hot.addEventListener('mouseleave', function () { el.classList.remove('contento'); });
    hot.addEventListener('click', function () { var abierto = !panel().hidden; abierto ? cerrarPanel() : abrirPanel(); });

    // modo noche: duerme (se despierta al tocarlo)
    var despierto = 0;
    function actualizarSueno() {
      var noche = document.body.classList.contains('modo-noche');
      el.classList.toggle('dormido', noche && Date.now() > despierto);
    }
    function despertar() { despierto = Date.now() + 9000; actualizarSueno(); setTimeout(actualizarSueno, 9100); }
    new MutationObserver(function () { actualizarSueno(); if (document.body.classList.contains('modo-noche')) decir('Zzz… buenas noches.'); else decir('¡Buen día!'); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    actualizarSueno();
  }

  var gotaN = 0, gotaT = 0;
  function gota(x, y, now) {
    if (now - gotaT < 90 || gotaN > 14) return; gotaT = now;
    var g = document.createElement('i'); g.className = 'sh-gota'; g.style.left = x + 'px'; g.style.top = y + 'px';
    document.body.appendChild(g); gotaN++;
    setTimeout(function () { g.remove(); gotaN--; }, 1350);
  }

  // ---------- burbujas ----------
  function decir(txt, ms) {
    if (!el || !visible()) return;
    var b = el.querySelector('.sh-bubble');
    b.textContent = txt; b.classList.add('on');
    ultimaFrase = Date.now();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { b.classList.remove('on'); }, ms || 4600);
  }

  function observarSecciones() {
    if (!('IntersectionObserver' in global)) return;
    var vistas = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var sec = en.target, key = sec.id || sec.className;
        if (vistas[key] || Date.now() - ultimaFrase < 9000) return;
        if (document.body.classList.contains('menu-abierto') || !panel().hidden) return;
        vistas[key] = true;
        var tipo = sec.getAttribute('data-tipo') || (sec.id === 'contacto' ? 'contacto' : '_');
        var lista = FRASES[tipo] || FRASES._;
        decir(lista[Math.floor(Math.random() * lista.length)]);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('section.seccion-bloque, section#contacto, section.agenda, section.mapa, section.explora').forEach(function (s) { io.observe(s); });
  }

  // ---------- panel / guía ----------
  function panel() { return document.querySelector('.sh-panel'); }
  function msgs() { return document.querySelector('.sh-msgs'); }
  function agrega(quien, html) {
    var m = document.createElement('div'); m.className = 'sh-m ' + quien; m.innerHTML = html;
    msgs().appendChild(m); msgs().scrollTop = msgs().scrollHeight; return m;
  }
  function chips(lista) {
    var c = document.querySelector('.sh-chips'); c.innerHTML = '';
    lista.forEach(function (it) {
      var n = document.createElement(it.href ? 'a' : 'button');
      n.className = 'sh-chip'; n.textContent = it.t;
      if (it.href) { n.href = it.href; if (/^https?:/.test(it.href)) { n.target = '_blank'; n.rel = 'noopener'; } }
      else n.addEventListener('click', function () { agrega('yo', esc(it.t)); responder(it.fn); });
      c.appendChild(n);
    });
  }
  function responder(fn) { setTimeout(fn, 380); }
  function abrirPanel() {
    var p = panel(); p.hidden = false;
    el.querySelector('.sh-hot').setAttribute('aria-expanded', 'true');
    if (!msgs().childElementCount) inicio();
    el.querySelector('.sh-bubble').classList.remove('on');
  }
  function cerrarPanel() {
    var p = panel(); if (!p) return; p.hidden = true;
    if (el) el.querySelector('.sh-hot').setAttribute('aria-expanded', 'false');
  }

  function inicioChips() {
    var hayPlan = R() && R().buscarAncla && R().buscarAncla('plan');
    chips([
      { t: 'Ver el plan de estudios', fn: accionPlan },
      { t: 'Próximo evento', fn: accionEvento },
      { t: '¿Qué es el gankyil?', fn: accionGankyil },
      { t: 'Hablar por WhatsApp', fn: accionContacto }
    ]);
  }
  function inicio() {
    agrega('sh', esc(cfg.saludo || 'Soy Shishi, guardián del CAT. Cuido este sitio y te acompaño en el recorrido. ¿Qué te gustaría ver?'));
    inicioChips();
  }
  function otraCosa(extra) { agrega('sh', extra || '¿Algo más?'); inicioChips(); }

  function waHref() { var a = document.getElementById('whatsapp-flotante'); return a ? a.href : 'https://wa.me/'; }

  function accionPlan() {
    var plan = R() && R().buscarAncla('plan');
    if (!plan) { agrega('sh', 'El plan de estudios está en la página principal.'); chips([{ t: 'Ir al plan →', href: 'index.html#plan' }]); return; }
    cerrarPanel(); R().irA(plan);
    var items = plan.querySelectorAll('.plan-item');
    agrega('sh', 'Te llevo al plan. Hay ' + items.length + ' opciones; toca una espiral para ver qué tópico incluye cada una.');
    var lista = [];
    items.forEach(function (it, i) { if (i < 4) { var h = it.querySelector('h3'); if (h) lista.push({ t: h.textContent.slice(0, 34) + (h.textContent.length > 34 ? '…' : ''), fn: function () { cerrarPanel(); R().irA(it); agrega('sh', 'Aquí está. ¿Te mando por WhatsApp para platicar?'); chips([{ t: 'Escribir por WhatsApp', href: waHref() }, { t: 'Volver al inicio de la guía', fn: function () { otraCosa(); } }]); } }); } });
    lista.push({ t: '¿Qué es el gankyil?', fn: accionGankyil });
    chips(lista);
    setTimeout(abrirPanelSilencioso, 900);
  }
  function abrirPanelSilencioso() { var p = panel(); if (p) p.hidden = false; }
  function accionEvento() {
    var s = document.querySelector('[data-tipo="evento_proximo"]');
    var t = s && s.querySelector('h2') ? s.querySelector('h2').textContent : '';
    agrega('sh', t ? 'Próximo: <strong>' + esc(t) + '</strong>. Ahí están la fecha, la sede y cómo reservar.' : 'Los eventos y talleres están en su propia página, con fecha, sede y cómo reservar.');
    chips([{ t: 'Ver eventos →', href: 'landing.html' }, { t: 'Volver', fn: function () { otraCosa(); } }]);
  }
  function accionGankyil() {
    if (R() && R().abrirGankyil && R().abrirGankyil()) {
      cerrarPanel();
      agrega('sh', 'Te lo muestro: toca cada espiral y mira qué tópico del plan se ilumina. Abajo hay dos lecturas, la STEAM y la Dzogchen.');
      setTimeout(abrirPanelSilencioso, 900);
      chips([{ t: 'Gracias', fn: function () { otraCosa('Con gusto. ¿Algo más?'); } }]);
      return;
    }
    agrega('sh', esc((R() && R().gkTexto ? R().gkTexto('lead') : '') ));
    chips([{ t: 'Verlo en el plan de estudios →', href: 'index.html#plan' }, { t: 'Volver', fn: function () { otraCosa(); } }]);
  }
  function accionContacto() {
    var mail = document.querySelector('#contacto a[href^="mailto:"]');
    agrega('sh', 'Con gusto. Puedes escribirnos por WhatsApp o dejar tu mensaje en el formulario del final de la página.');
    var l = [{ t: 'WhatsApp', href: waHref() }];
    if (mail) l.push({ t: 'Correo', href: mail.href });
    var c = document.getElementById('contacto'); if (c && R()) l.push({ t: 'Ir al formulario', fn: function () { cerrarPanel(); R().irA(c); } });
    chips(l);
  }
  function accionBuscar(q) {
    var t = norm(q), secs = (R() && R().seccionesDeLaPagina) ? R().seccionesDeLaPagina() : [], hall = [];
    secs.forEach(function (sc) {
      if (hall.length >= 4) return;
      var txt = norm(sc.el.textContent);
      if (txt.indexOf(t) !== -1 || norm(sc.titulo).indexOf(t) !== -1) hall.push(sc);
    });
    if (!hall.length) { agrega('sh', 'No encontré «' + esc(q) + '» en esta página. Puedes preguntarme por el plan, los eventos o el contacto.'); inicioChips(); return; }
    agrega('sh', 'Encontré esto:');
    chips(hall.map(function (sc) { return { t: sc.titulo.slice(0, 40), fn: function () { cerrarPanel(); R().irA(sc.el); } }; }));
  }
  function intencion(q) {
    var t = norm(q);
    if (/^(hola|buenas|hey|buen dia|que tal)/.test(t)) { agrega('sh', '¡Hola! Qué gusto verte por aquí.'); return inicioChips(); }
    if (/gankyil|espiral|dzogchen|tratak|shishi|simbolo|significa/.test(t)) return accionGankyil();
    if (/precio|cuesta|costo|cuanto|inscrib|programa|plan|curso|estudi|taller|topic/.test(t) && !/evento|retiro/.test(t)) return accionPlan();
    if (/evento|retiro|proximo|fecha|sede/.test(t)) return accionEvento();
    if (/whatsapp|contacto|correo|mail|escrib|llam|telefono|ubicacion|donde/.test(t)) return accionContacto();
    accionBuscar(q);
  }

  // ---------- bordes de tinta ----------
  function construirBordes() {
    if (cfg.bordes === false) return;
    var c = document.createElement('div'); c.className = 'sh-bordes'; c.setAttribute('aria-hidden', 'true');
    var defs = [
      ['izq', 'd1', '8%', 0], ['izq', 'd2', '40%', 1], ['izq', 'd3', '72%', 0],
      ['der', 'd2', '16%', 1], ['der', 'd1', '52%', 0], ['der', 'd3', '84%', 1]
    ];
    c.innerHTML = defs.map(function (d, i) {
      return '<div class="sh-nube ' + d[0] + ' ' + d[1] + '" data-f="' + (0.04 + (i % 3) * 0.035).toFixed(3) + '" style="top:' + d[2] + '"><svg viewBox="0 0 160 100"><path d="' + NUBES[d[3]] + '" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    }).join('') +
      '<button type="button" class="sh-gk-scroll der" aria-label="Ver el gankyil del plan de estudios" title="El gankyil · ver el plan de estudios">' + (R() ? R().gankyilSVG({ id: 'shsc' }) : '') + '</button>';
    document.body.appendChild(c);
    bordes = c;
    var giro = c.querySelector('.sh-gk-scroll .gk-rota'), nubes = c.querySelectorAll('.sh-nube'), tick = false;
    function act() {
      tick = false; var y = global.scrollY || 0;
      if (giro) giro.style.transform = 'rotate(' + (-60 + y * 0.22) + 'deg)';
      nubes.forEach(function (n) { n.style.transform = 'translateY(' + (-y * parseFloat(n.getAttribute('data-f'))).toFixed(1) + 'px)'; });
    }
    global.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(act); } }, { passive: true });
    act();
    c.querySelector('.sh-gk-scroll').addEventListener('click', function () {
      if (R() && R().abrirGankyil && R().abrirGankyil()) return;
      location.href = 'index.html#plan';
    });
  }

  // ---------- montar ----------
  function montar(content) {
    if (montado) return;
    cfg = (content && content.shishi) || {};
    if (R() && R().setShishiCfg) R().setShishiCfg(cfg);
    if (cfg.activo === false) return;
    montado = true;
    construir();
    vida();
    construirBordes();
    document.documentElement.classList.toggle('sh-oculto', !visible());
    var form = document.querySelector('.sh-form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = form.q.value.trim(); if (!q) return; form.q.value = '';
      agrega('yo', esc(q)); setTimeout(function () { intencion(q); }, 380);
    });
    document.querySelector('.sh-cerrar').addEventListener('click', cerrarPanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarPanel(); });
    setTimeout(observarSecciones, 1200);
    try {
      if (!sessionStorage.getItem('tratak-shishi-saludo') && visible()) {
        setTimeout(function () { decir(cfg.saludo_corto || 'Soy Shishi, guardián del CAT. Tócame y te guío.', 6000); try { sessionStorage.setItem('tratak-shishi-saludo', '1'); } catch (e) {} }, 3200);
      }
    } catch (e) {}
  }

  global.Shishi = { montar: montar, toggle: toggle, visible: visible, decir: decir };
})(window);
