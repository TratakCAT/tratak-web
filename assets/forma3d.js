/* Taller 3D · TRATAK CAT — modelador de piezas de revolución/prismas, sin dependencias.
   Z hacia arriba, medidas en mm. Exporta STL binario y OBJ. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var LS = 'tk-forma3d';

  /* ---------- estado ---------- */
  var PRESETS = {
    cilindro: { n: 'Cilindro', v: [100, 100, 100, 100, 100] },
    jarron:   { n: 'Jarrón', v: [60, 80, 100, 88, 70] },
    copa:     { n: 'Copa', v: [100, 80, 45, 35, 70] },
    cono:     { n: 'Cono (ancho arriba)', v: [100, 85, 70, 55, 40] },
    esfera:   { n: 'Esfera / huevo', v: [30, 80, 100, 80, 30] },
    reloj:    { n: 'Reloj de arena', v: [90, 50, 25, 50, 90] },
    custom:   { n: 'Personalizada', v: null }
  };
  var LET = ['A · boca', 'B', 'C', 'D', 'E · base'];
  var S = {
    forma: 'circ', pre: 'jarron', prof: PRESETS.jarron.v.slice(), suave: true,
    D: 80, H: 100, sx: 100, sy: 100, tw: 0,
    hueco: true, pared: 3, base: 3,
    tex: 'lisa', amp: 1, frec: 12,
    color: '#c98f6a', capa: 1, dens: 0, nombre: '', they: ''
  };
  try { var g = JSON.parse(localStorage.getItem(LS) || 'null'); if (g) for (var k in g) if (k in S) S[k] = g[k]; } catch (e) {}
  function guardar() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }

  /* ---------- UI ---------- */
  var ctlRefs = {};
  function slider(parent, key, label, min, max, step, unit, idx) {
    var d = document.createElement('div'); d.className = 'ctl';
    var val = idx == null ? S[key] : S[key][idx];
    d.innerHTML = '<label>' + label + '<output></output></label><input type="range" min="' + min + '" max="' + max + '" step="' + step + '">';
    var inp = d.querySelector('input'), out = d.querySelector('output');
    inp.value = val; out.textContent = val + unit;
    inp.addEventListener('input', function () {
      var v = parseFloat(inp.value); out.textContent = v + unit;
      if (idx == null) S[key] = v; else { S.prof[idx] = v; S.pre = 'custom'; $('pre').value = 'custom'; }
      pedir();
    });
    parent.appendChild(d);
    ctlRefs[key + (idx == null ? '' : idx)] = { inp: inp, out: out, unit: unit };
  }
  function setSlider(ref, v) { ref.inp.value = v; ref.out.textContent = v + ref.unit; }

  function montarUI() {
    var f = $('c-forma');
    slider(f, 'D', 'Diámetro máximo', 20, 300, 1, ' mm');
    slider(f, 'H', 'Altura de la pieza', 20, 400, 1, ' mm');
    slider(f, 'sx', 'Escala X', 50, 200, 1, ' %');
    slider(f, 'sy', 'Escala Y', 50, 200, 1, ' %');
    slider(f, 'tw', 'Torsión total', -360, 360, 5, '°');
    var pre = $('pre');
    for (var k in PRESETS) { var o = document.createElement('option'); o.value = k; o.textContent = PRESETS[k].n; pre.appendChild(o); }
    var p = $('c-perfil');
    for (var i = 0; i < 5; i++) slider(p, 'prof', LET[i], 10, 150, 1, ' %', i);
    var sw = document.createElement('label'); sw.className = 'check';
    sw.innerHTML = '<input type="checkbox" id="suave"> Suavizar con B-spline';
    p.appendChild(sw);
    $('suave').checked = S.suave;
    $('suave').onchange = function () { S.suave = this.checked; pedir(); };
    var pa = $('c-pared');
    slider(pa, 'pared', 'Grosor de pared', 0.8, 12, 0.1, ' mm');
    slider(pa, 'base', 'Grosor de base', 1, 20, 0.5, ' mm');
    var t = $('c-tex');
    slider(t, 'amp', 'Profundidad del relieve', 0, 5, 0.1, ' mm');
    slider(t, 'frec', 'Frecuencia', 1, 40, 1, '');

    pre.value = S.pre;
    pre.onchange = function () {
      S.pre = pre.value;
      if (PRESETS[S.pre].v) { S.prof = PRESETS[S.pre].v.slice(); for (var i = 0; i < 5; i++) setSlider(ctlRefs['prof' + i], S.prof[i]); }
      pedir();
    };
    $('forma').value = S.forma; $('forma').onchange = function () { S.forma = this.value; pedir(); };
    $('hueco').checked = S.hueco; $('hueco').onchange = function () { S.hueco = this.checked; pedir(); };
    $('tex').value = S.tex; $('tex').onchange = function () { S.tex = this.value; pedir(); };
    $('color').value = S.color; $('color').onchange = function () { S.color = this.value; pedir(); };
    $('capa').value = S.capa; $('capa').oninput = function () { S.capa = Math.max(0.1, parseFloat(this.value) || 1); pedir(); };
    $('dens').value = S.dens || ''; $('dens').oninput = function () { S.dens = Math.max(0, parseFloat(this.value) || 0); pedir(); };
    $('nombre').value = S.nombre; $('nombre').oninput = function () { S.nombre = this.value; pedir(); };
    $('they').value = S.they; $('they').oninput = function () { S.they = this.value; guardar(); };
  }

  /* ---------- perfil (B-spline cúbico uniforme con extremos triples) ---------- */
  function radioPerfil(t) { // t=0 base (E), t=1 boca (A); devuelve % del diámetro
    var v = S.prof.slice().reverse(); // E..A
    if (!S.suave) {
      var s = t * 4, i = Math.min(3, Math.floor(s)), f = s - i;
      return v[i] * (1 - f) + v[i + 1] * f;
    }
    var P = [v[0], v[0]].concat(v, [v[4], v[4]]);
    var seg = P.length - 3, s2 = t * seg, j = Math.min(seg - 1, Math.floor(s2)), u = s2 - j;
    var u2 = u * u, u3 = u2 * u;
    var b0 = (1 - 3 * u + 3 * u2 - u3) / 6, b1 = (4 - 6 * u2 + 3 * u3) / 6, b2 = (1 + 3 * u + 3 * u2 - 3 * u3) / 6, b3 = u3 / 6;
    return P[j] * b0 + P[j + 1] * b1 + P[j + 2] * b2 + P[j + 3] * b3;
  }

  /* ---------- contorno de la sección (circunradio 1) ---------- */
  var LADOS = { tri: 3, cuad: 4, pent: 5, hex: 6, oct: 8 };
  function contorno() {
    var pts = [], i, m;
    if (S.forma === 'circ') {
      for (i = 0; i < 96; i++) { var a = i / 96 * Math.PI * 2; pts.push([Math.cos(a), Math.sin(a)]); }
      return pts;
    }
    var V = [];
    if (S.forma === 'est') { for (i = 0; i < 10; i++) { var a2 = -Math.PI / 2 + i / 10 * Math.PI * 2, r = i % 2 ? 0.45 : 1; V.push([Math.cos(a2) * r, Math.sin(a2) * r]); } }
    else { var n = LADOS[S.forma]; for (i = 0; i < n; i++) { var a3 = -Math.PI / 2 + i / n * Math.PI * 2; V.push([Math.cos(a3), Math.sin(a3)]); } }
    m = 10;
    for (i = 0; i < V.length; i++) {
      var A = V[i], B = V[(i + 1) % V.length];
      for (var q = 0; q < m; q++) pts.push([A[0] + (B[0] - A[0]) * q / m, A[1] + (B[1] - A[1]) * q / m]);
    }
    return pts;
  }

  /* ---------- textura (mm) ---------- */
  function textura(th, t, z) {
    var a = S.amp, f = S.frec, T = Math.PI * 2;
    switch (S.tex) {
      case 'estrias': return a * Math.sin(f * th);
      case 'ondas': return a * Math.sin(T * f * t);
      case 'espiral': return a * Math.sin(f * th + T * f * 0.5 * t);
      case 'rombos': return a * Math.sin(f * th + T * f * 0.5 * t) * Math.sin(f * th - T * f * 0.5 * t);
      case 'rugosa': return a * 0.5 * (Math.sin(th * 7 + 1.3) * Math.sin(t * 61 + th * 3) + Math.sin(th * 17 + t * 37) * Math.cos(t * 23 - 2));
      case 'capas': return a * 0.5 * Math.sin(T * z / S.capa);
      default: return 0;
    }
  }

  /* ---------- malla ---------- */
  var M = null; // {pos, nor, n, bbox, vol, voladizo, capasN}
  function construir() {
    var C = contorno(), K = C.length, H = S.H, D2 = S.D / 2, sx = S.sx / 100, sy = S.sy / 100;
    var rows = S.tex === 'capas' ? Math.min(400, Math.max(40, Math.round(2 * H / S.capa))) : (S.tex === 'lisa' ? 70 : 120);
    var cosf = S.forma === 'circ' || S.forma === 'est' ? 1 : Math.cos(Math.PI / LADOS[S.forma]);
    var th = C.map(function (p) { return Math.atan2(p[1], p[0]); });
    var tris = [];
    function P(r, k, t, z, tw) {
      var x = r * C[k][0] * sx, y = r * C[k][1] * sy, a = tw * t * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      return [x * c - y * s, x * s + y * c, z];
    }
    function tri(a, b, c) { tris.push(a, b, c); }
    var O = [], j, k, t, ring, rr;
    for (j = 0; j <= rows; j++) {
      t = j / rows; rr = radioPerfil(t) / 100 * D2; ring = []; var z = t * H;
      for (k = 0; k < K; k++) ring.push(P(Math.max(0.3, rr + textura(th[k], t, z)), k, t, z, S.tw));
      O.push(ring);
    }
    for (j = 0; j < rows; j++) for (k = 0; k < K; k++) {
      var k2 = (k + 1) % K;
      tri(O[j][k], O[j][k2], O[j + 1][k2]); tri(O[j][k], O[j + 1][k2], O[j + 1][k]);
    }
    var c0 = [0, 0, 0];
    for (k = 0; k < K; k++) tri(c0, O[0][(k + 1) % K], O[0][k]);
    var topC = [0, 0, H];
    if (!S.hueco) {
      for (k = 0; k < K; k++) tri(topC, O[rows][k], O[rows][(k + 1) % K]);
    } else {
      var tb = Math.min(0.9, S.base / H), nI = Math.max(8, Math.round(rows * (1 - tb))), I = [];
      for (j = 0; j <= nI; j++) {
        t = tb + (1 - tb) * j / nI; rr = radioPerfil(t) / 100 * D2; var zi = t * H;
        var ri = Math.max(0.6, rr - S.pared / cosf); ring = [];
        for (k = 0; k < K; k++) ring.push(P(ri, k, t, zi, S.tw));
        I.push(ring);
      }
      for (j = 0; j < nI; j++) for (k = 0; k < K; k++) {
        var q = (k + 1) % K;
        tri(I[j][k], I[j + 1][q], I[j][q]); tri(I[j][k], I[j + 1][k], I[j + 1][q]);
      }
      for (k = 0; k < K; k++) {
        var w = (k + 1) % K;
        tri(O[rows][k], O[rows][w], I[nI][w]); tri(O[rows][k], I[nI][w], I[nI][k]);
      }
      var fl = [0, 0, tb * H];
      for (k = 0; k < K; k++) tri(fl, I[0][k], I[0][(k + 1) % K]);
    }
    // volumen con signo; si es negativo se invierte el giro
    var n = tris.length / 3, vol = 0, i;
    for (i = 0; i < n; i++) {
      var a = tris[3 * i], b = tris[3 * i + 1], c = tris[3 * i + 2];
      vol += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
    }
    var flip = vol < 0; vol = Math.abs(vol);
    var pos = new Float32Array(n * 9), nor = new Float32Array(n * 9);
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (i = 0; i < n; i++) {
      var A = tris[3 * i], B = tris[3 * i + (flip ? 2 : 1)], Cc = tris[3 * i + (flip ? 1 : 2)];
      var ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = Cc[0] - A[0], vy = Cc[1] - A[1], vz = Cc[2] - A[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      var V3 = [A, B, Cc];
      for (var q2 = 0; q2 < 3; q2++) {
        for (var d = 0; d < 3; d++) {
          pos[i * 9 + q2 * 3 + d] = V3[q2][d]; nor[i * 9 + q2 * 3 + d] = d === 0 ? nx : d === 1 ? ny : nz;
          if (V3[q2][d] < mn[d]) mn[d] = V3[q2][d]; if (V3[q2][d] > mx[d]) mx[d] = V3[q2][d];
        }
      }
    }
    // voladizo máximo del perfil (grados desde la vertical)
    var maxo = 0, sc = Math.max(sx, sy), N = 100;
    for (j = 0; j < N; j++) {
      var r1 = radioPerfil(j / N) / 100 * D2 * sc, r2 = radioPerfil((j + 1) / N) / 100 * D2 * sc, dz = H / N, dr = r2 - r1;
      var ang = Math.atan2(S.hueco ? Math.abs(dr) : Math.max(0, dr), dz) * 180 / Math.PI;
      if (ang > maxo) maxo = ang;
    }
    M = { pos: pos, nor: nor, n: n, bbox: [mn, mx], vol: vol, volcm3: vol / 1000, vol_: vol, voladizo: maxo, capasN: Math.round(H / S.capa) };
  }

  /* ---------- exportadores ---------- */
  function bajar(blob, nombre) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function slug() { return (S.nombre || 'pieza').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pieza'; }
  function stlBlob() {
    var n = M.n, buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf), o = 84, i, q;
    var h = 'TRATAK CAT Taller 3D'; for (i = 0; i < h.length; i++) dv.setUint8(i, h.charCodeAt(i));
    dv.setUint32(80, n, true);
    for (i = 0; i < n; i++) {
      for (q = 0; q < 3; q++) dv.setFloat32(o + q * 4, M.nor[i * 9 + q], true);
      for (q = 0; q < 9; q++) dv.setFloat32(o + 12 + q * 4, M.pos[i * 9 + q], true);
      dv.setUint16(o + 48, 0, true); o += 50;
    }
    return new Blob([buf], { type: 'model/stl' });
  }
  function objBlob() {
    var map = {}, vs = [], fs = [], i, q;
    for (i = 0; i < M.n; i++) {
      var idx = [];
      for (q = 0; q < 3; q++) {
        var x = M.pos[i * 9 + q * 3], y = M.pos[i * 9 + q * 3 + 1], z = M.pos[i * 9 + q * 3 + 2];
        var key = x.toFixed(4) + ',' + y.toFixed(4) + ',' + z.toFixed(4);
        if (map[key] == null) { map[key] = vs.length + 1; vs.push('v ' + x.toFixed(4) + ' ' + y.toFixed(4) + ' ' + z.toFixed(4)); }
        idx.push(map[key]);
      }
      if (idx[0] !== idx[1] && idx[1] !== idx[2] && idx[0] !== idx[2]) fs.push('f ' + idx.join(' '));
    }
    return new Blob(['# TRATAK CAT · Taller 3D (mm, Z arriba)\no ' + slug() + '\n' + vs.join('\n') + '\n' + fs.join('\n') + '\n'], { type: 'text/plain' });
  }

  /* ---------- visor WebGL ---------- */
  var cv, gl, prog, lprog, bufP, bufN, bufG, nGrid = 0, cam = { yaw: -50 * Math.PI / 180, pitch: 28 * Math.PI / 180, dist: 300, zoom: 1 }, auto = false, pend = false;
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
  function mk(vs, fs) { var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255]; }
  function mul(a, b) { var r = new Float32Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; } return r; }
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), r = new Float32Array(16); r[0] = t / asp; r[5] = t; r[10] = (f + n) / (n - f); r[11] = -1; r[14] = 2 * f * n / (n - f); return r; }
  function look(e, c, u) {
    var z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]], l = Math.hypot(z[0], z[1], z[2]); z = z.map(function (v) { return v / l; });
    var x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; l = Math.hypot(x[0], x[1], x[2]); x = x.map(function (v) { return v / l; });
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1]);
  }
  function iniciarGL() {
    cv = $('cv'); gl = cv.getContext('webgl', { antialias: true, preserveDrawingBuffer: true }) || cv.getContext('experimental-webgl', { preserveDrawingBuffer: true });
    if (!gl) { cv.insertAdjacentHTML('afterend', '<div class="aviso">Tu navegador no pudo iniciar WebGL. Prueba con Chrome o Safari actualizado.</div>'); return false; }
    prog = mk('attribute vec3 p;attribute vec3 n;uniform mat4 m;varying vec3 vn;void main(){vn=n;gl_Position=m*vec4(p,1.);}',
      'precision mediump float;varying vec3 vn;uniform vec3 c;uniform vec3 L;void main(){float d=abs(dot(normalize(vn),normalize(L)));float h=.5+.5*normalize(vn).z;vec3 col=c*(.28+.55*d+.17*h);gl_FragColor=vec4(col,1.);}');
    lprog = mk('attribute vec3 p;uniform mat4 m;void main(){gl_Position=m*vec4(p,1.);}', 'precision mediump float;uniform vec3 c;void main(){gl_FragColor=vec4(c,1.);}');
    bufP = gl.createBuffer(); bufN = gl.createBuffer(); bufG = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
    // interacción
    var ptrs = {}, last = 0;
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointerup', function (e) { delete ptrs[e.pointerId]; last = 0; cv.style.cursor = 'grab'; });
    cv.addEventListener('pointercancel', function (e) { delete ptrs[e.pointerId]; last = 0; });
    cv.addEventListener('pointermove', function (e) {
      var p = ptrs[e.pointerId]; if (!p) return;
      var ids = Object.keys(ptrs);
      if (ids.length === 1) { cam.yaw -= (e.clientX - p.x) * 0.008; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch + (e.clientY - p.y) * 0.008)); }
      else if (ids.length === 2) {
        var o = ptrs[ids[0] == e.pointerId ? ids[1] : ids[0]], d0 = Math.hypot(p.x - o.x, p.y - o.y), d1 = Math.hypot(e.clientX - o.x, e.clientY - o.y);
        if (d0 > 0) cam.zoom = Math.max(0.3, Math.min(4, cam.zoom * d1 / d0));
      }
      p.x = e.clientX; p.y = e.clientY; dibujar();
    });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); cam.zoom = Math.max(0.3, Math.min(4, cam.zoom * (e.deltaY > 0 ? 0.92 : 1.09))); dibujar(); }, { passive: false });
    window.addEventListener('resize', dibujar);
    return true;
  }
  function subir() {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.bufferData(gl.ARRAY_BUFFER, M.pos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufN); gl.bufferData(gl.ARRAY_BUFFER, M.nor, gl.STATIC_DRAW);
    var half = Math.max(M.bbox[1][0] - M.bbox[0][0], M.bbox[1][1] - M.bbox[0][1], 80) * 0.9, g = [], i, st = half / 5;
    for (i = -5; i <= 5; i++) { g.push(i * st, -half, 0, i * st, half, 0, -half, i * st, 0, half, i * st, 0); }
    nGrid = g.length / 3; gl.bindBuffer(gl.ARRAY_BUFFER, bufG); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g), gl.STATIC_DRAW);
  }
  function dibujar() {
    if (!gl || !M) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var ext = Math.max(M.bbox[1][0] - M.bbox[0][0], M.bbox[1][1] - M.bbox[0][1], M.bbox[1][2]);
    var d = ext * 2.3 / cam.zoom, tgt = [0, 0, M.bbox[1][2] / 2];
    var eye = [tgt[0] + d * Math.cos(cam.pitch) * Math.cos(cam.yaw), tgt[1] + d * Math.cos(cam.pitch) * Math.sin(cam.yaw), tgt[2] + d * Math.sin(cam.pitch)];
    var mat = mul(persp(0.7, w / h, d / 20, d * 6), look(eye, tgt, [0, 0, 1]));
    var a;
    gl.useProgram(lprog); a = gl.getAttribLocation(lprog, 'p');
    gl.uniformMatrix4fv(gl.getUniformLocation(lprog, 'm'), false, mat); gl.uniform3f(gl.getUniformLocation(lprog, 'c'), 0.62, 0.56, 0.78);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufG); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.LINES, 0, nGrid);
    gl.useProgram(prog);
    var pa = gl.getAttribLocation(prog, 'p'), na = gl.getAttribLocation(prog, 'n'), c = hex(S.color);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'm'), false, mat); gl.uniform3f(gl.getUniformLocation(prog, 'c'), c[0], c[1], c[2]);
    gl.uniform3f(gl.getUniformLocation(prog, 'L'), eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2] + d * 0.6);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.enableVertexAttribArray(pa); gl.vertexAttribPointer(pa, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufN); gl.enableVertexAttribArray(na); gl.vertexAttribPointer(na, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, M.n * 3);
  }
  function bucle() { if (auto) { cam.yaw += 0.01; dibujar(); } requestAnimationFrame(bucle); }

  /* ---------- panel de datos, perfil SVG, alertas ---------- */
  var FORMAS = { circ: 'Círculo', tri: 'Triángulo', cuad: 'Cuadrado', pent: 'Pentágono', hex: 'Hexágono', oct: 'Octágono', est: 'Estrella' };
  var TEXS = { lisa: 'Lisa', estrias: 'Estrías verticales', ondas: 'Ondas horizontales', espiral: 'Espiral', rombos: 'Rombos', rugosa: 'Rugosa', capas: 'Capas visibles' };
  function f1(x) { return (Math.round(x * 10) / 10).toString(); }
  function datos() {
    var W = M.bbox[1][0] - M.bbox[0][0], Dp = M.bbox[1][1] - M.bbox[0][1], g = S.dens ? M.volcm3 * S.dens : 0;
    var L = [
      ['Figura', FORMAS[S.forma] + (S.hueco ? ', hueca' : ', maciza')],
      ['Medidas', f1(W) + ' × ' + f1(Dp) + ' × ' + f1(M.bbox[1][2]) + ' mm (ancho × fondo × alto)'],
      ['Silueta', PRESETS[S.pre].n + ' · A–E: ' + S.prof.join(' / ') + ' %' + (S.suave ? ' (B-spline)' : '')],
      ['Escala X / Y', S.sx + ' % / ' + S.sy + ' %' + (S.tw ? ' · torsión ' + S.tw + '°' : '')],
      ['Pared y base', S.hueco ? f1(S.pared) + ' mm de pared · ' + f1(S.base) + ' mm de base' : 'No aplica (pieza maciza)'],
      ['Textura', TEXS[S.tex] + (S.tex === 'lisa' ? '' : ' · ' + f1(S.amp) + ' mm · frecuencia ' + S.frec)],
      ['Capas', M.capasN + ' capas de ' + f1(S.capa) + ' mm'],
      ['Volumen de material', f1(M.volcm3) + ' cm³' + (g ? ' · ≈ ' + f1(g) + ' g de pasta' : '')],
      ['Voladizo máximo', f1(M.voladizo) + '° desde la vertical']
    ];
    return L;
  }
  function panel() {
    var L = datos();
    $('fichab').innerHTML = L.map(function (r) { return '<div><b>' + r[0] + ':</b> ' + r[1] + '</div>'; }).join('');
    $('stats').innerHTML = '<b>' + f1(M.bbox[1][0] - M.bbox[0][0]) + ' × ' + f1(M.bbox[1][1] - M.bbox[0][1]) + ' × ' + f1(M.bbox[1][2]) + ' mm</b> · ' + f1(M.volcm3) + ' cm³ · ' + (M.n).toLocaleString('es-MX') + ' triángulos';
    var al = [];
    if (M.voladizo > 30) al.push('El perfil tiene un voladizo de ' + f1(M.voladizo) + '°. En LDM se suele limitar a cerca de 30° respecto a la vertical (fuente 3); prueba con tu pasta o reduce la inclinación.');
    else al.push('<span>Voladizo máximo ' + f1(M.voladizo) + '°, dentro del límite orientativo de ~30° (fuente 3).</span>');
    if (S.hueco && S.amp > S.pared * 0.6 && S.tex !== 'lisa') al.push('El relieve (' + f1(S.amp) + ' mm) es grande frente a la pared (' + f1(S.pared) + ' mm). Sube la pared o baja el relieve.');
    if (S.hueco && S.pared >= S.D / 2 * 0.5) al.push('La pared es muy gruesa para este diámetro: casi no hay hueco.');
    $('alertas').innerHTML = al.map(function (t, i) { return '<div class="aviso' + (i === 0 && M.voladizo <= 30 ? ' ok' : '') + '">' + t + '</div>'; }).join('');
    // SVG del perfil
    var s = $('svgp'), pts = [], i, ctl = '';
    for (i = 0; i <= 40; i++) { var t = i / 40, hw = radioPerfil(t) / 150 * 80; pts.push([100 + hw, 110 - t * 100]); }
    var L2 = pts.map(function (p) { return (p[0]).toFixed(1) + ',' + p[1].toFixed(1); });
    var R2 = pts.map(function (p) { return (200 - p[0]).toFixed(1) + ',' + p[1].toFixed(1); }).reverse();
    for (i = 0; i < 5; i++) { var tt = 1 - i / 4, hx = 100 + S.prof[i] / 150 * 80, hy = 110 - tt * 100; ctl += '<circle cx="' + hx + '" cy="' + hy + '" r="3.5" fill="#6d49b8"/><text x="' + (hx + 6) + '" y="' + (hy + 4) + '" font-size="9" fill="#241f18">' + 'ABCDE'[i] + '</text>'; }
    s.innerHTML = '<line x1="100" y1="6" x2="100" y2="112" stroke="#999" stroke-dasharray="3 3"/><polygon points="' + L2.concat(R2).join(' ') + '" fill="rgba(109,73,184,.12)" stroke="#6d49b8" stroke-width="1.6"/>' + ctl;
  }

  /* ---------- ficha (PNG) ---------- */
  function envolver(ctx, txt, x, y, maxW, lh) {
    var palabras = String(txt).split(/\s+/), linea = '', yy = y;
    palabras.forEach(function (p) { var t = linea ? linea + ' ' + p : p; if (ctx.measureText(t).width > maxW && linea) { ctx.fillText(linea, x, yy); yy += lh; linea = p; } else linea = t; });
    if (linea) { ctx.fillText(linea, x, yy); yy += lh; }
    return yy;
  }
  function ficha() {
    dibujar();
    var W = 1080, c = document.createElement('canvas'), L = datos();
    c.width = W; c.height = 3200; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, W, 3200); g.addColorStop(0, '#c9a6ee'); g.addColorStop(.55, '#a9d2f0'); g.addColorStop(1, '#c3f0b9');
    x.fillStyle = g; x.fillRect(0, 0, W, 3200);
    x.fillStyle = 'rgba(255,255,255,.92)'; rr(x, 40, 40, W - 80, 3120, 40); x.fill();
    x.fillStyle = '#241f18'; x.font = '700 26px system-ui,sans-serif'; x.fillText('TRATAK CAT · TALLER 3D', 90, 110);
    x.font = '400 64px Georgia,serif'; var y = envolver(x, S.nombre || 'Mi pieza', 90, 190, W - 180, 70);
    var sz = 900, ix = (W - sz) / 2; x.fillStyle = '#efeaf8'; rr(x, ix, y + 10, sz, sz, 30); x.fill();
    x.drawImage(cv, ix, y + 10, sz, sz); y += sz + 70;
    x.font = '400 30px system-ui,sans-serif';
    L.forEach(function (r) { x.font = '700 30px system-ui,sans-serif'; x.fillStyle = '#6d49b8'; x.fillText(r[0], 90, y); x.font = '400 30px system-ui,sans-serif'; x.fillStyle = '#241f18'; y = envolver(x, r[1], 90, y + 40, W - 180, 38) + 18; });
    y += 10; x.font = '700 30px system-ui,sans-serif'; x.fillStyle = '#6d49b8'; x.fillText('Método THEY (Cuevas y Pugliese, 2020)', 90, y);
    x.font = '400 28px system-ui,sans-serif'; x.fillStyle = '#241f18';
    y = envolver(x, S.they ? S.they : 'Sin notas: revisa el libro «Advanced 3D Printing with Grasshopper: Clay and FDM» para orientar tu pieza.', 90, y + 40, W - 180, 36) + 30;
    x.font = '400 24px system-ui,sans-serif'; x.fillStyle = 'rgba(36,31,24,.7)';
    x.fillText('tratakcat.com · Recursos · Taller 3D', 90, y + 10);
    var fin = y + 60, o = document.createElement('canvas'); o.width = W; o.height = fin + 40;
    o.getContext('2d').drawImage(c, 0, 0, W, fin + 40, 0, 0, W, fin + 40);
    // recorte del fondo blanco: se recorta el lienzo sin dibujar tarjeta incompleta
    var oc = o.getContext('2d'); oc.fillStyle = g;
    return recortar(c, fin);
  }
  function recortar(c, fin) {
    var H = fin + 40, o = document.createElement('canvas'); o.width = c.width; o.height = H; var x = o.getContext('2d');
    var g = x.createLinearGradient(0, 0, c.width, H); g.addColorStop(0, '#c9a6ee'); g.addColorStop(.55, '#a9d2f0'); g.addColorStop(1, '#c3f0b9');
    x.fillStyle = g; x.fillRect(0, 0, c.width, H);
    x.fillStyle = 'rgba(255,255,255,.92)'; rr(x, 40, 40, c.width - 80, H - 80, 40); x.fill();
    x.drawImage(c, 0, 40, c.width, H - 80, 0, 40, c.width, H - 80);
    return o;
  }
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

  /* ---------- ciclo ---------- */
  function actualizar() { pend = false; construir(); if (gl) { subir(); dibujar(); } panel(); guardar(); }
  function pedir() { if (!pend) { pend = true; requestAnimationFrame(actualizar); } }

  function vista(v) { cam.zoom = 1; if (v === 'f') { cam.yaw = -Math.PI / 2; cam.pitch = 0.03; } else if (v === 'a') { cam.yaw = -Math.PI / 2; cam.pitch = 1.5; } else { cam.yaw = -50 * Math.PI / 180; cam.pitch = 28 * Math.PI / 180; } dibujar(); }

  function init() {
    montarUI(); iniciarGL();
    Array.prototype.forEach.call(document.querySelectorAll('[data-v]'), function (b) { b.onclick = function () { vista(b.getAttribute('data-v')); }; });
    $('auto').onclick = function () { auto = !auto; this.classList.toggle('on', auto); this.setAttribute('aria-pressed', auto); };
    $('x-stl').onclick = function () { bajar(stlBlob(), slug() + '.stl'); };
    $('x-obj').onclick = function () { bajar(objBlob(), slug() + '.obj'); };
    $('x-png').onclick = function () { dibujar(); cv.toBlob(function (b) { bajar(b, slug() + '-captura.png'); }); };
    $('x-ficha').onclick = function () { ficha().toBlob(function (b) { bajar(b, slug() + '-ficha.png'); }); };
    construir(); if (gl) subir(); panel(); dibujar(); bucle();
    window.__forma3d = { S: S, mesh: function () { return M; }, stl: stlBlob, obj: objBlob, ficha: ficha };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
