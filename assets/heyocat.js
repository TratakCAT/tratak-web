/* Heyokat · lógica de la tirada, la lectura y los enlaces de compra */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var DATA = null, MAPA = {}, escena = null, tirada = [], TESS = null, visores = [];

  function wa(txt) { return 'https://wa.me/' + DATA.whatsapp + '?text=' + encodeURIComponent(txt); }
  // mascota: Heyokat habla
  var ultima = '';
  function azar(lista) { if (!lista || !lista.length) return ''; var t, n = 0; do { t = lista[Math.floor(Math.random() * lista.length)]; n++; } while (t === ultima && n < 6); ultima = t; return t; }
  function dice(texto) {
    var el = $('m-dice'); if (!el || !texto) return;
    el.classList.add('cae');
    setTimeout(function () { el.textContent = texto; el.classList.remove('cae'); }, 280);
    var av = $('m-av'); if (av) { av.classList.remove('mueve'); void av.offsetWidth; av.classList.add('mueve'); }
    var bu = $('m-burbuja'); if (bu) { bu.classList.add('on'); clearTimeout(dice.t); dice.t = setTimeout(function () { bu.classList.remove('on'); }, 9000); }
  }
  function dichoDe(clave) { var m = DATA && DATA.mascota; if (m) dice(azar(m[clave] || m.frases)); }
  function iniciarMascota() {
    var m = DATA.mascota; if (!m) { if ($('mascota')) $('mascota').hidden = true; return; }
    setTimeout(function () { dice(azar(m.frases)); }, 1800);
    setInterval(function () { var h = $('mascota'); if (!h || document.hidden) return; h.classList.add('esconde'); setTimeout(function () { h.classList.remove('esconde'); dice(azar(m.frases)); }, 2600); }, 38000);
    $('m-av').addEventListener('click', function () { dice(azar(m.frases)); if (window.HeyoAudio) { HeyoAudio.arrancar(); HeyoAudio.sfx('elegir'); } });
    setInterval(function () { if (!document.hidden && escena && (escena.estado() === 'idle' || escena.estado() === 'done')) dice(azar(m.frases)); }, 21000);
    $('mantra').innerHTML = (m.mantra || []).map(function (x) { return '<p><b>' + esc(x.letra) + '</b>' + esc(x.texto) + '</p>'; }).join('');
  }
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
    visores.forEach(function (v) { try { v.destruir(); } catch (e) {} }); visores = [];
    $('tres').innerHTML = ids.map(function (id, i) {
      var x = MAPA[id];
      return '<article class="cl"><div class="pos">' + esc(pos[i]) + '</div><div class="cl-vis" data-id="' + esc(id) + '"><img src="' + esc(x.imagen) + '" alt="' + esc(x.nombre) + '"></div>' +
        '<h3>' + esc(x.nombre) + '</h3><div class="arq">' + esc(x.arquetipo) + '</div>' +
        '<div class="chips">' + (x.palabras || []).map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' +
        '<p class="msj">“' + esc(x.mensaje) + '”</p>' +
        '<details><summary>Leer la interpretación</summary><p>' + esc(x.interpretacion) + '</p>' + (x.contrario ? '<p class="con">Al revés (heyoka): ' + esc(x.contrario) + '</p>' : '') + '</details>' +
        '<a class="btn wa" target="_blank" rel="noopener" href="' + wa('Hola, hice mi lectura en Heyokat y quiero una print de la carta «' + x.nombre + '». ¿Cómo la consigo?') + '">Quiero una print de esta carta</a></article>';
    }).join('');
    if (window.Heyocat3D) Array.prototype.forEach.call(document.querySelectorAll('.cl-vis'), function (box) {
      var id = box.getAttribute('data-id'), cv = document.createElement('canvas'); cv.className = 'cl3d'; cv.setAttribute('aria-label', 'Carta ' + MAPA[id].nombre + ' en 3D: arrastra para girarla');
      box.appendChild(cv);
      var v = Heyocat3D.create(cv, { reverso: DATA.reverso, borde: 'heyocat/carta-borde.json', caras: [{ id: id, imagen: MAPA[id].imagen }], solo: id });
      if (v) { visores.push(v); box.classList.add('en3d'); } else cv.remove();
    });
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
    iniciarMascota();
    $('b-vivo').href = wa('Hola, vi Heyokat y quiero una lectura de oráculo en vivo.');
    var porUrl = (new URLSearchParams(location.search).get('c') || '').split(',').filter(function (id) { return MAPA[id]; });

    escena = window.Heyocat3D && Heyocat3D.create($('escena'), {
      reverso: data.reverso, borde: 'heyocat/carta-borde.json', teselado: TESS,
      caras: data.cartas.map(function (c) { return { id: c.id, imagen: c.imagen }; }), mazo: 9,
      onEvent: function (ev, a, b) {
        var A = window.HeyoAudio;
        if (A) { A.arrancar(); if (ev === 'carta') A.sfx('elegir'); else if (ev === 'voltea') A.sfx('voltea'); else if (ev === 'listo') A.sfx('listo'); }
        if (ev === 'tocar-mazo') barajar();
        else if (ev === 'elegir') { guia('Elige tres cartas.', 'Confía en la mano. Toca las que te llamen.'); }
        else if (ev === 'carta') { dichoDe('alElegir'); guia('Carta ' + (a + 1) + ' de 3', a < 2 ? 'Elige otra' : ''); }
        else if (ev === 'voltear') guia('Ahora voltéalas.', 'Toca cada carta para descubrirla');
        else if (ev === 'listo') { dichoDe('alTerminar'); $('escena').classList.add('compacta'); setTimeout(function () { if (escena) escena.compactar(); }, 60); mostrarLectura(a, true); }
        else if (ev === 'voltea') { dichoDe('alVoltear'); guia(DATA.posiciones[a] + '…', MAPA[b] ? MAPA[b].nombre : ''); }
      }
    });
    window.__hy = escena; // (diagnóstico)
    function barajar() {
      if (!escena || escena.estado() !== 'idle') return;
      $('b-barajar').hidden = true; $('b-reiniciar').hidden = false;
      guia('Barajando…', 'Piensa en tu pregunta'); dichoDe('alBarajar');
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

  fetch('heyocat/teselado.json').then(function (r) { return r.json(); }).catch(function () { return null; }).then(function (t) {
    TESS = t; if (t) fondoTeselado(t);
    return fetch('heyocat/cartas.json?_=' + Date.now()).then(function (r) { return r.json(); }).then(iniciar);
  });

  // fondo decorativo: la silueta de la carta encaja consigo misma sin huecos (red hexagonal)
  function fondoTeselado(t) {
    var cv = $('teselado'); if (!cv) return;
    var P = new Path2D(t.path), a = t.a, b = t.b, cols = ['192,162,236', '240,139,209', '232,199,106', '120,200,230'];
    function pinta() {
      var esc2 = (innerWidth < 700 ? 0.34 : 0.46), dpr2 = Math.min(devicePixelRatio || 1, 2);
      var W = innerWidth, H = innerHeight;
      cv.width = (W + Math.abs(b[0]) * esc2 * 2) * dpr2; cv.height = (H + Math.abs(a[1]) * esc2 * 2) * dpr2;
      cv.style.width = cv.width / dpr2 + 'px'; cv.style.height = cv.height / dpr2 + 'px';
      cv.style.setProperty('--dx', (a[0] * esc2) + 'px'); cv.style.setProperty('--dy', (a[1] * esc2) + 'px');
      var g = cv.getContext('2d'); g.setTransform(dpr2, 0, 0, dpr2, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
      for (var i = -14; i <= 14; i++) for (var j = -14; j <= 14; j++) {
        var x = (a[0] * i + b[0] * j) * esc2 + cv.width / dpr2 / 2, y = (a[1] * i + b[1] * j) * esc2 + cv.height / dpr2 / 2;
        if (x < -200 || y < -200 || x > cv.width / dpr2 + 200 || y > cv.height / dpr2 + 200) continue;
        var h = ((i * 73856093) ^ (j * 19349663)) >>> 0, col = cols[h % 4], al = .035 + (h % 7) * .011;
        g.save(); g.translate(x, y); g.scale(esc2, esc2); g.fillStyle = 'rgba(' + col + ',' + al + ')'; g.fill(P, 'evenodd');
        g.lineWidth = 1.4 / esc2; g.strokeStyle = 'rgba(232,199,106,.22)'; g.stroke(P); g.restore();
      }
    }
    pinta(); var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(pinta, 250); });
  }

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
