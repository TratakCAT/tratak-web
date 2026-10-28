/* Heyokat · lógica de la tirada, la lectura y los enlaces de compra */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var DATA = null, MAPA = {}, escena = null, tirada = [];

  function wa(txt) { return 'https://wa.me/' + DATA.whatsapp + '?text=' + encodeURIComponent(txt); }
  function guia(texto, pequeno) { $('guia').innerHTML = esc(texto) + (pequeno ? '<small>' + esc(pequeno) + '</small>' : ''); }

  // número pseudoaleatorio estable según las cartas (la misma tirada da la misma lectura)
  function semilla(ids) { var h = 2166136261; ids.join('|').split('').forEach(function (c) { h = Math.imul(h ^ c.charCodeAt(0), 16777619); }); return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) >>> 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function aLista(arr) { return arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]; }

  // la mezcla de las tres interpretaciones
  function sintesis(ids) {
    var c = ids.map(function (id) { return MAPA[id]; }), pos = DATA.posiciones, r = rng(semilla(ids));
    var h = '<h3>Tu lectura</h3>';
    h += '<p>Tu tirada dibuja un recorrido: de <b>' + esc(c[0].arquetipo) + '</b> a <b>' + esc(c[1].arquetipo) + '</b>, y de ahí hacia <b>' + esc(c[2].arquetipo) + '</b>.</p>';
    c.forEach(function (x, i) { h += '<p><b>' + esc(pos[i]) + ' · ' + esc(x.nombre) + '.</b> ' + esc(x.mensaje) + '</p>'; });
    var pal = []; c.forEach(function (x) { var p = (x.palabras || []).filter(function (w) { return pal.indexOf(w) < 0; }); if (p.length) pal.push(p[Math.floor(r() * p.length)]); });
    if (pal.length) h += '<p>Palabras que se repiten en tu lectura: <b>' + esc(aLista(pal)) + '</b>. Anótalas: sirven de brújula para los próximos días.</p>';
    var con = c.map(function (x) { return x.contrario; }).filter(Boolean);
    if (con.length) h += '<p>Y como todo heyoka, el oráculo habla al revés: ' + esc(con.join(' ')) + '</p>';
    h += '<p class="fin">Quédate con la carta que más te movió: es la que quiere seguir hablándote.</p>';
    return h;
  }

  function mostrarLectura(ids, desplazar) {
    tirada = ids.slice();
    var pos = DATA.posiciones;
    $('tres').innerHTML = ids.map(function (id, i) {
      var x = MAPA[id];
      return '<article class="cl"><div class="pos">' + esc(pos[i]) + '</div><img src="' + esc(x.imagen) + '" alt="' + esc(x.nombre) + '">' +
        '<h3>' + esc(x.nombre) + '</h3><div class="arq">' + esc(x.arquetipo) + '</div>' +
        '<div class="chips">' + (x.palabras || []).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' +
        '<p class="msj">“' + esc(x.mensaje) + '”</p>' +
        '<details><summary>Leer la interpretación</summary><p>' + esc(x.interpretacion) + '</p>' + (x.contrario ? '<p class="con">Al revés (heyoka): ' + esc(x.contrario) + '</p>' : '') + '</details>' +
        '<a class="btn wa" target="_blank" rel="noopener" href="' + wa('Hola, hice mi lectura en Heyokat y quiero una print de la carta «' + x.nombre + '». ¿Cómo la consigo?') + '">Quiero una print de esta carta</a></article>';
    }).join('');
    $('sintesis').innerHTML = sintesis(ids);
    var nombres = ids.map(function (id) { return '«' + MAPA[id].nombre + '»'; });
    $('llevar').innerHTML = '<h3>Llévate tu tirada</h3><p>Si te gustaron tus cartas, pídelas como print. También puedes compartir tu lectura.</p>' +
      '<div class="acciones"><a class="btn wa" target="_blank" rel="noopener" href="' + wa('Hola, hice mi lectura en Heyokat y quiero las tres prints: ' + nombres.join(', ') + '. ¿Cómo las consigo?') + '">Quiero las tres</a>' +
      '<button class="btn sec" id="b-compartir" type="button">Compartir mi lectura</button></div>' +
      '<p style="margin-top:18px">Cuéntanos qué te salió: síguenos o etiquétanos en Instagram.</p>' +
      '<div class="acciones"><a class="btn ig" target="_blank" rel="noopener" href="https://www.instagram.com/heyokat/">Seguir @heyokat</a>' +
      '<button class="btn sec" id="b-mencion" type="button">Mencionarnos en mi historia</button></div>';
    $('b-compartir').addEventListener('click', compartir);
    $('b-mencion').addEventListener('click', mencionar);
    $('lectura').hidden = false;
    $('b-reiniciar').hidden = false; $('b-barajar').hidden = true;
    try { history.replaceState(null, '', '?c=' + ids.join(',')); } catch (e) {}
    guia('Tu lectura está lista.', 'Baja para leer tus cartas');
    if (desplazar) setTimeout(function () { $('lectura').scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 250);
  }

  function compartir() {
    var url = location.href, txt = 'Mi lectura en Heyokat';
    if (navigator.share) { navigator.share({ title: 'Heyokat', text: txt, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { $('b-compartir').textContent = '¡Enlace copiado!'; });
    else prompt('Copia tu enlace:', url);
  }

  function mencionar() {
    var txt = 'Mi lectura en @heyokat ✦ ' + location.href + ' #Heyokat', b = $('b-mencion');
    function ok() { b.textContent = '¡Texto copiado! Pégalo en tu historia y etiqueta @heyokat'; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () { prompt('Copia este texto:', txt); });
    else prompt('Copia este texto:', txt);
  }

  function ids3() {
    var ids = DATA.cartas.map(function (c) { return c.id; });
    for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
    while (ids.length < 3) ids.push(ids[ids.length % Math.max(1, ids.length)]);
    return ids.slice(0, 3);
  }

  function reiniciar() {
    $('lectura').hidden = true; $('b-reiniciar').hidden = true; $('b-barajar').hidden = false;
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    guia('Respira hondo. Piensa en lo que quieres ver con más claridad…', 'Toca el mazo para barajar');
    $('escena').classList.remove('compacta');
    if (escena) escena.reiniciar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function iniciar(data) {
    DATA = data;
    function slug(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    data.cartas = (data.cartas || []).filter(function (c) { return c && c.imagen; });
    data.cartas.forEach(function (c, i) { c.id = c.id || slug(c.nombre) || ('carta-' + (i + 1)); c.palabras = c.palabras || []; MAPA[c.id] = c; });
    data.posiciones = data.posiciones && data.posiciones.length >= 3 ? data.posiciones : ['Lo que traes', 'Lo que te mueve', 'El camino que se abre'];
    $('b-vivo').href = wa('Hola, vi Heyokat y quiero una lectura de oráculo en vivo.');
    var porUrl = (new URLSearchParams(location.search).get('c') || '').split(',').filter(function (id) { return MAPA[id]; });

    escena = window.Heyocat3D && Heyocat3D.create($('escena'), {
      reverso: data.reverso, borde: 'heyocat/carta-borde.json',
      caras: data.cartas.map(function (c) { return { id: c.id, imagen: c.imagen }; }), mazo: 9,
      onEvent: function (ev, a, b) {
        var A = window.HeyoAudio;
        if (A) { A.arrancar(); if (ev === 'carta') A.sfx('elegir'); else if (ev === 'voltea') A.sfx('voltea'); else if (ev === 'listo') A.sfx('listo'); }
        if (ev === 'tocar-mazo') barajar();
        else if (ev === 'elegir') { guia('Elige tres cartas.', 'Confía en la mano. Toca las que te llamen.'); }
        else if (ev === 'carta') { guia('Carta ' + (a + 1) + ' de 3', a < 2 ? 'Elige otra' : ''); }
        else if (ev === 'voltear') guia('Ahora voltéalas.', 'Toca cada carta para descubrirla');
        else if (ev === 'listo') { $('escena').classList.add('compacta'); setTimeout(function () { if (escena) escena.compactar(); }, 60); mostrarLectura(a, true); }
        else if (ev === 'voltea') { guia(DATA.posiciones[a] + '…', MAPA[b] ? MAPA[b].nombre : ''); }
      }
    });
    window.__hy = escena; // (diagnóstico)
    function barajar() {
      if (!escena || escena.estado() !== 'idle') return;
      $('b-barajar').hidden = true; $('b-reiniciar').hidden = false;
      guia('Barajando…', 'Piensa en tu pregunta');
      if (window.HeyoAudio) { HeyoAudio.arrancar(); HeyoAudio.sfx('baraja'); }
      escena.shuffle(data.cartas.map(function (c) { return c.id; }));
    }
    $('b-barajar').addEventListener('click', barajar);
    $('b-reiniciar').addEventListener('click', reiniciar);
    if (!escena) {
      $('escena').style.display = 'none'; $('sin3d').classList.add('on'); $('b-barajar').hidden = true;
      guia('Respira hondo. Piensa en lo que quieres ver con más claridad…', 'Toca el botón para sacar tus cartas');
      $('b-directo').addEventListener('click', function () { $('b-directo').hidden = true; mostrarLectura(ids3(), true); });
    } else if (porUrl.length >= 3) {
      $('escena').classList.add('compacta'); escena.mostrar(porUrl.slice(0, 3)); mostrarLectura(porUrl.slice(0, 3), false);
    }
  }

  (function () {
    var b = $('b-sonido'); if (!b || !window.HeyoAudio) { if (b) b.hidden = true; return; }
    function pinta() { var on = HeyoAudio.activo(); b.textContent = on ? '🔊' : '🔇'; b.classList.toggle('off', !on); b.setAttribute('aria-pressed', on); }
    pinta();
    b.addEventListener('click', function () { HeyoAudio.arrancar(); HeyoAudio.alternar(); pinta(); });
    var una = function () { HeyoAudio.arrancar(); ['pointerdown','touchend','click','keydown'].forEach(function (e) { document.removeEventListener(e, una, true); }); };
    ['pointerdown','touchend','click','keydown'].forEach(function (e) { document.addEventListener(e, una, true); });
  })();

  fetch('heyocat/cartas.json?_=' + Date.now()).then(function (r) { return r.json(); }).then(iniciar);

  // banner, menú y botón de WhatsApp del sitio
  fetch('content.json?_=' + Date.now()).then(function (r) { return r.json(); }).then(function (content) {
    var R = window.TratakRender;
    R.applyTheme(content.theme, document.documentElement.style);
    $('site-top').innerHTML = R.renderNav(content.theme);
    $('site-floating').innerHTML = R.renderFloatingButtons(content.contacto);
    document.body.classList.add('con-nav');
    R.bindGlobalInteractions(content.theme);
  }).catch(function () {});
})();
