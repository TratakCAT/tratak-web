// Pantalla de carga: una de tres experiencias al azar (el punto de Tratak, el holograma que se imprime, la respiración).
// Solo se ve al entrar por primera vez en la sesión. Para probar: ?precarga=a, ?precarga=b, ?precarga=c o ?precarga=1 (al azar).
(function () {
  var el = document.getElementById('precarga');
  var q = (location.search.match(/[?&]precarga=([abc1])/) || [])[1];
  var visto = false;
  try { visto = sessionStorage.getItem(window.PRECARGA_KEY || 'tk-precarga') === '1'; } catch (e) {}
  window.__precargaFuera = function () {};
  if (!el || (visto && !q)) { if (el && el.parentNode) el.parentNode.removeChild(el); return; }
  var tipos = ['a', 'b', 'c'], tipo = q && q !== '1' ? q : null;
  if (!tipo) {
    var ultimo = null; try { ultimo = localStorage.getItem('tk-precarga-ultimo'); } catch (e) {}
    var otros = tipos.filter(function (t) { return t !== ultimo; });
    tipo = otros[Math.floor(Math.random() * otros.length)];
  }
  try { localStorage.setItem('tk-precarga-ultimo', tipo); } catch (e) {}
  var html = '', ciclo = null;
  if (tipo === 'a') {
    var lemas = ['La curiosidad despertó al gato', 'El maullido del dharma', 'Más allá de la industria'];
    html = '<div class="pc-stage"><i class="pc-punto"></i><div class="pc-gk" id="pc-gk"></div></div><div class="pc-txt">' + lemas[Math.floor(Math.random() * lemas.length)] + '</div>';
  } else if (tipo === 'b') {
    var N = 30, capas = '', i, y, t, r, g, b;
    for (i = 0; i < N; i++) {
      y = 228 - i * (186 / (N - 1)); t = i / (N - 1);
      r = Math.round(192 + (185 - 192) * t); g = Math.round(162 + (237 - 162) * t); b = Math.round(236 + (178 - 236) * t);
      capas += '<line class="pc-capa" x1="50" x2="170" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="rgb(' + r + ',' + g + ',' + b + ')" stroke-width="5.4" style="--d:' + (i * 0.052).toFixed(3) + 's"/>';
    }
    // hongos blancos y minimalistas: x, y, escala, inclinación, retraso
    var hongos = [[100, 41, 1, -4, 1.9], [119, 40, .72, 8, 2.05], [66, 104, 1, -14, 2.2], [155, 104, .85, 12, 2.35], [64, 176, .7, -12, 2.5], [157, 172, .8, 10, 2.65]];
    var mh = hongos.map(function (h) {
      return '<g transform="translate(' + h[0] + ' ' + h[1] + ') rotate(' + h[3] + ') scale(' + h[2] + ')"><g class="pc-hongo" style="--d:' + h[4] + 's">' +
        '<rect x="-2" y="-11" width="4" height="11.5" rx="2" fill="#fff"/><path d="M-10 -10A10 9 0 0 1 10 -10Z" fill="#fff"/></g></g>';
    }).join('');
    // casco de VR en perspectiva (tres cuartos, visto desde arriba), apoyado con los lentes hacia arriba
    var top = 'M70 244H150Q166 244 166 258Q166 272 152 276Q138 278 130 272Q110 262 90 272Q82 278 68 276Q54 272 54 258Q54 244 70 244Z', grosor = '';
    [18, 15, 12, 9, 6, 3].forEach(function (d, k) {
      grosor += '<path transform="translate(0 ' + d + ')" d="' + top + '" fill="' + ['#0a1122', '#0d1529', '#111a31', '#15203a', '#19264a', '#1c2b52'][k] + '"/>';
    });
    html = '<div class="pc-stage"><svg viewBox="0 0 220 304" aria-hidden="true"><defs>' +
      '<linearGradient id="pch" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9fcbec" stop-opacity=".6"/><stop offset="1" stop-color="#9fcbec" stop-opacity=".05"/></linearGradient>' +
      '<pattern id="pcs" width="220" height="6" patternUnits="userSpaceOnUse"><rect width="220" height="1.2" fill="#cfe9ff" opacity=".22"/></pattern>' +
      '<clipPath id="pcc"><path d="M72 256L148 256L204 22L16 22Z"/></clipPath>' +
      '<clipPath id="pcv"><path transform="translate(30 30)" d="M62 10C62 30 40 40 34 72C26 112 38 170 52 198L108 198C122 170 134 112 126 72C120 40 98 30 98 10Z"/></clipPath></defs>' +
      '<g class="pc-holo"><path d="M72 256L148 256L204 22L16 22Z" fill="url(#pch)"/><g clip-path="url(#pcc)"><rect class="pc-scan" x="0" y="16" width="220" height="252" fill="url(#pcs)"/></g>' +
      '<path d="M72 256L16 22M148 256L204 22" stroke="#9fcbec" stroke-opacity=".5" stroke-width="1" fill="none"/>' +
      '<ellipse cx="110" cy="240" rx="54" ry="6" fill="#9fcbec" opacity=".4"/>' +
      '<g class="pc-escena"><g clip-path="url(#pcv)">' + capas + '</g>' + mh +
      '<g class="pc-boq"><circle cx="110" cy="232" r="4" fill="#fff"/><path d="M106 226l4 -8l4 8z" fill="#fff"/></g></g></g>' +
      '<rect x="34" y="262" width="30" height="14" rx="7" fill="#0d1529"/><rect x="156" y="262" width="30" height="14" rx="7" fill="#0d1529"/>' +
      grosor +
      '<path d="' + top + '" fill="#1d2d52" stroke="#7fa6d9" stroke-width="1.3"/>' +
      '<path transform="translate(110 260) scale(.88 .72) translate(-110 -260)" d="' + top + '" fill="none" stroke="#9fcbec" stroke-opacity=".35"/>' +
      '<ellipse cx="88" cy="259" rx="16" ry="8.5" fill="#0a1122" stroke="#9fcbec" stroke-width="1"/><ellipse cx="132" cy="259" rx="16" ry="8.5" fill="#0a1122" stroke="#9fcbec" stroke-width="1"/>' +
      '<ellipse cx="88" cy="259" rx="10" ry="5" fill="#9fcbec" opacity=".75"/><ellipse cx="132" cy="259" rx="10" ry="5" fill="#9fcbec" opacity=".75"/>' +
      '<ellipse cx="88" cy="258" rx="4" ry="2" fill="#fff"/><ellipse cx="132" cy="258" rx="4" ry="2" fill="#fff"/>' +
      '</svg></div><div class="pc-txt">Biofabricando la materia</div>';
    ciclo = 5200;
  } else {
    html = '<div class="pc-stage"><i class="pc-aro"></i><i class="pc-aro"></i><i class="pc-aro"></i><i class="pc-aro"></i><i class="pc-bindu"></i></div><div class="pc-txt"><span>Inhala por la nariz</span><span>Exhala por la nariz</span></div>';
  }
  el.className = 'pc-' + tipo; el.innerHTML = html;
  var timer = null;
  if (ciclo) {
    el.classList.add('go');
    timer = setInterval(function () { el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); }, ciclo);
  }
  var inicio = Date.now(), MIN = (window.PRECARGA_MIN || { a: 2400, b: 4400, c: 7800 })[tipo], quitado = false;
  window.__precargaFuera = function () {
    if (quitado) return; quitado = true;
    setTimeout(function () {
      el.classList.add('fuera');
      try { sessionStorage.setItem(window.PRECARGA_KEY || 'tk-precarga', '1'); } catch (e) {}
      setTimeout(function () { if (timer) clearInterval(timer); if (el.parentNode) el.parentNode.removeChild(el); }, 900);
    }, Math.max(0, MIN - (Date.now() - inicio)));
  };
  window.__precargaTipo = tipo;
})();
