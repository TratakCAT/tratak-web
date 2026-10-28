/* Heyocat · escena 3D de las cartas (WebGL puro, sin librerías)
   Usa la geometría del borde del modelo Heyokard_1_3D.obj (heyocat/carta-borde.json)
   y dos caras con textura (frente y reverso). */
(function () {
  'use strict';

  // ---------- matrices 4x4 (column-major) ----------
  function ident() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  }
  function trans(x, y, z) { var m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function scl(s) { var m = ident(); m[0] = m[5] = m[10] = s; return m; }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function persp(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0];
  }
  function xf(m, x, y, z, w) {
    return [m[0] * x + m[4] * y + m[8] * z + m[12] * w, m[1] * x + m[5] * y + m[9] * z + m[13] * w,
            m[2] * x + m[6] * y + m[10] * z + m[14] * w, m[3] * x + m[7] * y + m[11] * z + m[15] * w];
  }

  var ease = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    io: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    back: function (t) { var c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };

  var VS = 'attribute vec3 aPos;attribute vec2 aUV;attribute vec3 aNor;uniform mat4 uVP;uniform mat4 uM;' +
    'varying vec2 vUV;varying vec3 vN;varying vec3 vW;' +
    'void main(){vec4 w=uM*vec4(aPos,1.);vW=w.xyz;vN=mat3(uM)*aNor;vUV=aUV;gl_Position=uVP*w;}';
  var FS_FACE = 'precision mediump float;uniform sampler2D uTex;uniform vec3 uCam;uniform float uDim;uniform float uGlow;uniform float uT;' +
    'varying vec2 vUV;varying vec3 vN;varying vec3 vW;' +
    'void main(){vec4 c=texture2D(uTex,vUV);if(c.a<.5)discard;' +
    'vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);vec3 L=normalize(vec3(-.35,.55,.85));' +
    'float nv=clamp(abs(dot(N,V)),0.,1.);float d=.62+.38*max(dot(N,L),0.);' +
    'float sp=pow(max(dot(reflect(-L,N),V),0.),38.);' +
    'vec3 ir=.5+.5*cos(6.2831*(nv*1.15+vec3(0.,.33,.67)+vUV.x*.35+uT*.03));' +
    'vec3 col=c.rgb*d+sp*vec3(1.,.92,.72)*.55+ir*.13*pow(1.-nv,1.6)+uGlow*vec3(1.,.82,.4)*.22;' +
    'gl_FragColor=vec4(col*uDim,1.);}';
  var FS_RIM = 'precision mediump float;uniform vec3 uCam;uniform float uDim;varying vec2 vUV;varying vec3 vN;varying vec3 vW;' +
    'void main(){vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);vec3 L=normalize(vec3(-.35,.55,.85));' +
    'float d=.5+.5*max(dot(N,L),0.);float sp=pow(max(dot(reflect(-L,N),V),0.),22.);' +
    'vec3 col=vec3(.06,.05,.045)*d+sp*vec3(.85,.7,.35)*.6;gl_FragColor=vec4(col*uDim,1.);}';

  function sh(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function prog(gl, fs) {
    var p = gl.createProgram(); gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  function create(canvas, cfg) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true }) ||
             canvas.getContext('experimental-webgl');
    if (!gl) return null;
    var pF, pR;
    try { pF = prog(gl, FS_FACE); pR = prog(gl, FS_RIM); } catch (e) { return null; }
    var aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 284, H = 258.4, TH = 2.02, K = 1; // medidas del modelo
    // caras: frente (+y) y reverso (−y)
    var fd = [], bd = [];
    [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].forEach(function (p) {
      var u = (p[0] + W / 2) / W, v = (p[1] + H / 2) / H;
      fd.push(p[0], TH, p[1], u, v, 0, 1, 0);
      bd.push(p[0], -TH, p[1], 1 - u, v, 0, -1, 0);
    });
    var idx = new Uint16Array([0, 1, 2, 0, 2, 3]);
    function vbo(arr) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return b; }
    var bFront = vbo(fd), bBack = vbo(bd), bIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    var rimN = 0, bRim = null;

    function loadTex(src, size) {
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 18, 24, 255]));
      var img = new Image();
      img.onload = function () {
        // recorta los bordes transparentes (así sirven imágenes exportadas con márgenes)
        var sx = 0, sy = 0, sw = img.naturalWidth, sh2 = img.naturalHeight;
        try {
          var m = document.createElement('canvas'), mw = 320, mh = Math.max(1, Math.round(320 * img.naturalHeight / img.naturalWidth));
          m.width = mw; m.height = mh; var mx = m.getContext('2d'); mx.drawImage(img, 0, 0, mw, mh);
          var d = mx.getImageData(0, 0, mw, mh).data, x0 = mw, x1 = -1, y0 = mh, y1 = -1;
          for (var yy = 0; yy < mh; yy++) for (var xx = 0; xx < mw; xx++) if (d[(yy * mw + xx) * 4 + 3] > 12) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
          if (x1 > x0 && y1 > y0) { var fx = img.naturalWidth / mw, fy = img.naturalHeight / mh; sx = x0 * fx; sy = y0 * fy; sw = (x1 - x0 + 1) * fx; sh2 = (y1 - y0 + 1) * fy; }
        } catch (e) {}
        var c = document.createElement('canvas'); c.width = c.height = size;
        var x = c.getContext('2d'); x.drawImage(img, sx, sy, sw, sh2, 0, 0, size, size);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        dirty = true;
      };
      img.src = src;
      return tex;
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var texSize = (dpr > 1.5 || canvas.clientWidth > 900) ? 2048 : 1024;
    var texBack = loadTex(cfg.reverso, texSize);
    var texFace = {};
    (cfg.caras || []).forEach(function (c) { texFace[c.id] = loadTex(c.imagen, texSize); });

    fetch(cfg.borde).then(function (r) { return r.json(); }).then(function (j) {
      var n = j.pos.length / 3, a = new Float32Array(n * 8);
      for (var i = 0; i < n; i++) {
        a[i * 8] = j.pos[i * 3]; a[i * 8 + 1] = j.pos[i * 3 + 1]; a[i * 8 + 2] = j.pos[i * 3 + 2];
        a[i * 8 + 5] = j.nor[i * 3]; a[i * 8 + 6] = j.nor[i * 3 + 1]; a[i * 8 + 7] = j.nor[i * 3 + 2];
      }
      bRim = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bRim); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
      rimN = n; dirty = true;
    }).catch(function () {});

    // ---------- escena ----------
    var FOV = 32 * Math.PI / 180, DIST = 900;
    var cards = [], tweens = [], dirty = true, t0 = performance.now(), now = 0;
    var vw = 1, vh = 1, aspect = 1, VP = ident(), Wv = 1, Hv = 1, k = 1;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0, in: false };
    var state = 'idle', picked = [], hoverCard = null, onEvent = cfg.onEvent || function () {};

    function mkCard(i) {
      return { i: i, x: 0, y: 0, z: 0, ry: Math.PI, rz: 0, rx: 0, s: 1, dim: 1, glow: 0, face: null, flipped: false, picked: false };
    }
    var N = cfg.mazo || 9;
    for (var i = 0; i < N; i++) cards.push(mkCard(i));

    function tween(c, to, dur, delay, ez, done) {
      var from = {}; var keys = Object.keys(to);
      var tw = { c: c, to: to, dur: dur * 1000, delay: (delay || 0) * 1000, ez: ez || ease.io, start: null, from: from, keys: keys, done: done };
      tweens.push(tw);
      return tw;
    }
    function stepTweens(t) {
      for (var i = tweens.length - 1; i >= 0; i--) {
        var tw = tweens[i];
        if (tw.start === null) { tw.start = t + tw.delay; }
        if (t < tw.start) continue;
        if (!tw.init) { tw.keys.forEach(function (k) { tw.from[k] = tw.c[k]; }); tw.init = true; }
        var p = Math.min(1, (t - tw.start) / Math.max(1, tw.dur)), e = tw.ez(p);
        tw.keys.forEach(function (k) { tw.c[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e; });
        if (p >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
      }
    }
    function snap(c, to) { Object.keys(to).forEach(function (k) { c[k] = to[k]; }); }

    // ---------- disposición según el tamaño ----------
    var L = {};
    function layout() {
      Hv = 2 * DIST * Math.tan(FOV / 2); Wv = Hv * aspect;
      var cw = Math.min(Wv * 0.29, Hv * 0.40 * (W / H));
      k = cw / W; L.k = k; L.cw = cw; L.ch = cw * H / W;
      L.deckS = k * 1.12;
      L.slotY = Hv * 0.16;
      L.slotX = [-cw * 1.12, 0, cw * 1.12];
      L.fanY = -Hv * 0.31;
    }
    function stackPose(i) {
      return { x: 0, y: 0, z: i * 1.6, rx: 0, ry: Math.PI, rz: (((i * 37) % 11) - 5) * .006, s: L.deckS, dim: 1, glow: 0 };
    }
    function fanPose(i, n) {
      var step = Math.min(L.cw * 0.42, Wv * 0.9 / n), x = (i - (n - 1) / 2) * step, u = x / (Wv / 2);
      return { x: x, y: L.fanY - u * u * Hv * 0.09, z: i * 2, rx: 0, ry: Math.PI, rz: -u * 0.62, s: k * (aspect < 1 ? 0.95 : 0.76), dim: 1, glow: 0 };
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      vw = Math.max(1, Math.round(r.width)); vh = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      aspect = vw / vh; layout();
      VP = mul(persp(FOV, aspect, 100, 3000), trans(0, 0, -DIST));
      if (state === 'idle') cards.forEach(function (c) { snap(c, stackPose(c.i)); });
      else if (state === 'pick') {
        var rest = cards.filter(function (c) { return !c.picked; });
        rest.forEach(function (c, j) { snap(c, fanPose(j, rest.length)); });
        picked.forEach(function (c, j) { snap(c, { x: L.slotX[j], y: L.slotY, s: k, z: 0, rz: 0 }); });
      } else if (state === 'reveal') {
        picked.forEach(function (c, j) { snap(c, { x: L.slotX[j], y: L.slotY, s: k, z: 0, rz: 0 }); });
      } else if (state === 'done') {
        picked.forEach(function (c, j) { snap(c, { x: L.slotX[j] * 1.1, y: 0, s: k * 1.12, z: 0, rz: 0 }); });
      }
      dirty = true;
    }

    // ---------- dibujo ----------
    function modelOf(c, extra) {
      var tiltX = (pointer.ty * -0.18), tiltY = (pointer.tx * 0.25);
      var m = trans(c.x, c.y, c.z);
      m = mul(m, rotZ(c.rz));
      m = mul(m, rotY(c.ry + (c.sway || 0)));
      m = mul(m, rotX(c.rx));
      m = mul(m, scl(c.s));
      m = mul(m, rotX(Math.PI / 2));
      return m;
    }
    function bind(p, buf, stride, hasUV) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      var a = gl.getAttribLocation(p, 'aPos'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 3, gl.FLOAT, false, stride * 4, 0);
      var u = gl.getAttribLocation(p, 'aUV'); if (u >= 0) { gl.enableVertexAttribArray(u); gl.vertexAttribPointer(u, 2, gl.FLOAT, false, stride * 4, 12); }
      var n = gl.getAttribLocation(p, 'aNor'); if (n >= 0) { gl.enableVertexAttribArray(n); gl.vertexAttribPointer(n, 3, gl.FLOAT, false, stride * 4, 20); }
    }
    var cam = [0, 0, DIST];
    function draw(t) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      var order = cards.slice().sort(function (a, b) { return a.z - b.z; });
      // rim
      if (bRim) {
        gl.useProgram(pR); bind(pR, bRim, 8);
        gl.uniformMatrix4fv(gl.getUniformLocation(pR, 'uVP'), false, VP);
        gl.uniform3fv(gl.getUniformLocation(pR, 'uCam'), cam);
        order.forEach(function (c) {
          gl.uniformMatrix4fv(gl.getUniformLocation(pR, 'uM'), false, c.M);
          gl.uniform1f(gl.getUniformLocation(pR, 'uDim'), c.dim);
          gl.drawArrays(gl.TRIANGLES, 0, rimN);
        });
      }
      gl.useProgram(pF);
      gl.uniformMatrix4fv(gl.getUniformLocation(pF, 'uVP'), false, VP);
      gl.uniform3fv(gl.getUniformLocation(pF, 'uCam'), cam);
      gl.uniform1f(gl.getUniformLocation(pF, 'uT'), t / 1000);
      gl.uniform1i(gl.getUniformLocation(pF, 'uTex'), 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
      order.forEach(function (c) {
        gl.uniformMatrix4fv(gl.getUniformLocation(pF, 'uM'), false, c.M);
        gl.uniform1f(gl.getUniformLocation(pF, 'uDim'), c.dim);
        gl.uniform1f(gl.getUniformLocation(pF, 'uGlow'), c.glow);
        gl.activeTexture(gl.TEXTURE0);
        bind(pF, bBack, 8); gl.bindTexture(gl.TEXTURE_2D, texBack); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        bind(pF, bFront, 8); gl.bindTexture(gl.TEXTURE_2D, (c.face && texFace[c.face]) || texBack); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      });
    }

    function frame(ts) {
      now = ts - t0;
      var had = tweens.length > 0;
      stepTweens(now);
      pointer.x += (pointer.tx - pointer.x) * .08; pointer.y += (pointer.ty - pointer.y) * .08;
      var animated = !reduce;
      cards.forEach(function (c) {
        var idle = state === 'idle' ? Math.sin(now / 1400 + c.i) * 0.03 : 0;
        c.sway = (state === 'idle') ? idle + pointer.x * .12 : (c.picked && !c.flipped ? Math.sin(now / 900 + c.i) * .05 + pointer.x * .1 : (c.picked ? pointer.x * .12 : 0));
        var bob = (state === 'idle' && animated) ? Math.sin(now / 1100 + c.i * .7) * 3 : 0;
        var save = c.y; c.y += bob; c.M = modelOf(c); c.y = save;
      });
      draw(now);
      requestAnimationFrame(frame);
    }

    // ---------- selección por toque ----------
    function project(c, lx, lz) {
      var p = xf(c.M, lx, 0, lz, 1); var q = xf(VP, p[0], p[1], p[2], 1);
      return [(q[0] / q[3] * .5 + .5) * vw, (1 - (q[1] / q[3] * .5 + .5)) * vh];
    }
    function hit(c, px, py) {
      var pts = [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]].map(function (p) { return project(c, p[0], p[1]); });
      var s = 0;
      for (var i = 0; i < 4; i++) {
        var a = pts[i], b = pts[(i + 1) % 4], cr = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
        if (cr !== 0) { if (s === 0) s = cr > 0 ? 1 : -1; else if ((cr > 0 ? 1 : -1) !== s) return false; }
      }
      return true;
    }
    function cardAt(ev) {
      var r = canvas.getBoundingClientRect(), px = ev.clientX - r.left, py = ev.clientY - r.top;
      var order = cards.slice().sort(function (a, b) { return b.z - a.z; });
      for (var i = 0; i < order.length; i++) if (hit(order[i], px, py)) return order[i];
      return null;
    }
    canvas.addEventListener('pointermove', function (ev) {
      var r = canvas.getBoundingClientRect();
      pointer.tx = ((ev.clientX - r.left) / r.width - .5) * 2; pointer.ty = ((ev.clientY - r.top) / r.height - .5) * 2;
      var c = cardAt(ev); var canTap = (state === 'idle' && c) || (state === 'pick' && c && !c.picked) || (state === 'reveal' && c && c.picked && !c.flipped);
      canvas.style.cursor = canTap ? 'pointer' : 'default';
    });
    canvas.addEventListener('pointerleave', function () { pointer.tx = pointer.ty = 0; });
    canvas.addEventListener('click', function (ev) {
      var c = cardAt(ev);
      if (state === 'idle') { if (c) onEvent('tocar-mazo'); }
      else if (state === 'pick' && c && !c.picked) pickCard(c);
      else if (state === 'reveal' && c && c.picked && !c.flipped) flipCard(c);
    });

    // ---------- acciones ----------
    var perm = [];
    function shuffle(faceIds) {
      if (state === 'shuffling') return;
      state = 'shuffling'; picked = [];
      cards.forEach(function (c) { c.picked = false; c.flipped = false; c.face = null; c.dim = 1; c.glow = 0; });
      perm = faceIds.slice();
      for (var i = perm.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
      var n = cards.length, spread = Hv * 0.34;
      // 1) se abren en abanico circular
      cards.forEach(function (c, i) {
        var a = i / n * Math.PI * 2;
        tween(c, { x: Math.cos(a) * spread * 1.3, y: Math.sin(a) * spread * .95, rz: a + Math.PI / 2, s: k * .9, z: 20 + i }, .7, i * .03, ease.out);
      });
      // 2) giran entre sí
      cards.forEach(function (c, i) {
        var a = i / n * Math.PI * 2 + Math.PI * 1.6;
        tween(c, { x: Math.cos(a) * spread * .55, y: Math.sin(a) * spread * .4, rz: a + Math.PI / 2 + 1.2, z: ((i * 7) % n) * 3 }, .85, .85 + i * .02, ease.io);
      });
      // 3) se juntan en un solo mazo con orden nuevo
      var order = cards.map(function (c, i) { return i; }).sort(function () { return Math.random() - .5; });
      cards.forEach(function (c, i) {
        tween(c, { x: 0, y: 0, rz: (((i * 37) % 11) - 5) * .006, s: L.deckS, z: order[i] * 1.6 }, .6, 1.85 + i * .02, ease.io);
      });
      // 4) se abren en abanico para elegir
      setTimeout(function () {
        state = 'pick';
        var ord = cards.slice().sort(function (a, b) { return a.z - b.z; });
        ord.forEach(function (c, j) { tween(c, fanPose(j, n), .75, j * .035, ease.out); });
        onEvent('elegir');
      }, 2750 + n * 20);
    }
    function pickCard(c) {
      if (picked.length >= 3) return;
      var slot = picked.length;
      c.picked = true; c.face = perm[slot % perm.length]; picked.push(c);
      tween(c, { z: 160, s: k * 1.08 }, .22, 0, ease.out);
      tween(c, { x: L.slotX[slot], y: L.slotY, rz: 0, rx: 0 }, .65, .05, ease.io);
      tween(c, { z: 0, s: k }, .4, .45, ease.out);
      onEvent('carta', slot);
      if (picked.length === 3) {
        state = 'reveal';
        cards.forEach(function (o) { if (!o.picked) tween(o, { y: o.y - Hv * .5, dim: .2 }, .8, .2, ease.io); });
        setTimeout(function () { onEvent('voltear'); }, 900);
      }
    }
    var volteadas = 0;
    function flipCard(c) {
      c.flipped = true;
      tween(c, { z: 140, s: k * 1.12 }, .35, 0, ease.out);
      tween(c, { ry: 0 }, .9, 0, ease.io);
      tween(c, { z: 0, s: k, glow: 1 }, .45, .55, ease.out, function () { tween(c, { glow: 0 }, 1.2, 0, ease.out); });
      volteadas++; onEvent('voltea', picked.indexOf(c), c.face);
      if (volteadas === 3) { state = 'reveal'; setTimeout(function () { onEvent('listo', picked.map(function (p) { return p.face; })); }, 1100); }
    }
    // abre directamente un tirón conocido (para enlaces compartidos)
    function compactar() {
      state = 'done';
      picked.forEach(function (c, j) { tween(c, { x: L.slotX[j] * 1.1, y: 0, s: k * 1.12 }, .8, 0, ease.io); });
    }
    function mostrar(ids) {
      state = 'done'; volteadas = 3; picked = [];
      cards.forEach(function (c) { c.picked = false; c.dim = 1; });
      for (var j = 0; j < 3; j++) {
        var c = cards[j]; c.picked = true; c.flipped = true; c.face = ids[j]; picked.push(c);
        snap(c, { x: L.slotX[j] * 1.1, y: 0, z: 0, rz: 0, rx: 0, ry: 0, s: k * 1.12, dim: 1 });
      }
      for (var q = 3; q < cards.length; q++) snap(cards[q], { y: -Hv, dim: .2 });
    }
    function reiniciar() {
      state = 'idle'; picked = []; volteadas = 0; tweens.length = 0;
      cards.forEach(function (c, i) { c.picked = false; c.flipped = false; c.face = null; c.glow = 0; c.dim = 1; c.ry = Math.PI; c.rx = 0; c.sway = 0; });
      cards.forEach(function (c, i) { tween(c, stackPose(i), .6, i * .02, ease.io); });
    }

    resize();
    state = 'idle'; cards.forEach(function (c) { snap(c, stackPose(c.i)); });
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    requestAnimationFrame(frame);

    return { shuffle: shuffle, reiniciar: reiniciar, mostrar: mostrar, compactar: compactar, estado: function () { return state; },
             lleno: function () { return picked.length; },
             dbg: function () { return { k: k, cw: L.cw, ch: L.ch, Wv: Wv, Hv: Hv, vw: vw, vh: vh, slotX: L.slotX, slotY: L.slotY, fanY: L.fanY }; } };
  }

  window.Heyocat3D = { create: create };
})();
