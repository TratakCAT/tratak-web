/* Heyokat · sonido: efectos y música generativa (todo sintetizado con WebAudio, sin archivos) */
(function () {
  'use strict';
  var KEY = 'heyocat-sonido';
  var ctx = null, master = null, wet = null, musica = null, timer = null, activo = true, arrancado = false, ruido = null;
  var PENTA = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46]; // re menor pentatónica

  try { if (localStorage.getItem(KEY) === 'off') activo = false; } catch (e) {}

  function init() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = activo ? 3 : 0; master.connect(comp);
    // “reverb” sencilla: dos delays con retroalimentación y filtro
    wet = ctx.createGain(); wet.gain.value = 0.55;
    var d1 = ctx.createDelay(1.5), d2 = ctx.createDelay(1.5), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    d1.delayTime.value = 0.37; d2.delayTime.value = 0.53; fb.gain.value = 0.42; lp.type = 'lowpass'; lp.frequency.value = 2400;
    wet.connect(d1); wet.connect(d2); d1.connect(lp); d2.connect(lp); lp.connect(fb); fb.connect(d1); fb.connect(d2); lp.connect(master);
    // ruido blanco reutilizable
    var n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    ruido = b;
    document.addEventListener('visibilitychange', function () { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (activo) ctx.resume(); });
    return true;
  }

  function nota(freq, t, dur, vol, tipo, envio) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); if (envio !== false) g.connect(wet);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function campana(freq, t, vol, dur) {
    nota(freq, t, dur || 2.4, vol, 'sine');
    nota(freq * 2.76, t, (dur || 2.4) * 0.45, vol * 0.22, 'sine');
    nota(freq * 5.4, t, 0.35, vol * 0.08, 'sine');
  }
  function soplo(t, dur, f0, f1, vol, q) {
    var s = ctx.createBufferSource(); s.buffer = ruido; s.loop = true;
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.Q.value = q || 1.2; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  function golpe(t, vol, f) { // roce corto de carta
    var s = ctx.createBufferSource(); s.buffer = ruido; var h = ctx.createBiquadFilter(), g = ctx.createGain();
    h.type = 'bandpass'; h.frequency.value = f || 3200; h.Q.value = 0.9;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(h); h.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + 0.09);
  }


  // ---------- tormenta y tambor ----------
  function trueno(t, vol, dur) { // retumbo grave que rueda
    dur = dur || 4;
    var s = ctx.createBufferSource(); s.buffer = ruido; s.loop = true;
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 0.7; f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(70, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.25);
    g.gain.setValueAtTime(vol * 0.55, t + 0.9); g.gain.exponentialRampToValueAtTime(vol * 0.8, t + 1.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); g.connect(wet); s.start(t, Math.random()); s.stop(t + dur + 0.1);
    var o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(58, t); o.frequency.exponentialRampToValueAtTime(34, t + dur);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(vol * 0.9, t + 0.3); og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + dur + 0.1);
  }
  function rayo(t, vol) { // chasquido eléctrico seguido del trueno
    var s = ctx.createBufferSource(), h = ctx.createBiquadFilter(), g = ctx.createGain();
    h.type = 'highpass'; h.frequency.value = 2500;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.buffer = ruido; s.connect(h); h.connect(g); g.connect(master); g.connect(wet); s.start(t, Math.random()); s.stop(t + 0.15);
    for (var i = 1; i < 5; i++) { // crepitar
      var tt = t + 0.05 + i * 0.045 + Math.random() * 0.03, s2 = ctx.createBufferSource(), h2 = ctx.createBiquadFilter(), g2 = ctx.createGain();
      s2.buffer = ruido; h2.type = 'bandpass'; h2.frequency.value = 3500 + Math.random() * 4000; h2.Q.value = 2;
      g2.gain.setValueAtTime(vol * 0.35, tt); g2.gain.exponentialRampToValueAtTime(0.0001, tt + 0.05);
      s2.connect(h2); h2.connect(g2); g2.connect(master); s2.start(tt, Math.random()); s2.stop(tt + 0.07);
    }
    var z = ctx.createOscillator(), zg = ctx.createGain(); z.type = 'sawtooth'; z.frequency.setValueAtTime(1800, t); z.frequency.exponentialRampToValueAtTime(90, t + 0.25);
    zg.gain.setValueAtTime(vol * 0.12, t); zg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28); z.connect(zg); zg.connect(master); z.start(t); z.stop(t + 0.3);
    trueno(t + 0.35 + Math.random() * 0.3, vol * 0.9, 3.6);
  }
  function tambor(t, vol) { // tambor de piel, latido
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.18);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(master); g.connect(wet); o.start(t); o.stop(t + 0.55);
    golpe(t, vol * 0.8, 900);
  }
  function sonaja(t, vol) { for (var i = 0; i < 9; i++) golpe(t + i * 0.028, vol * (0.5 + 0.5 * Math.random()), 6500); }
  function flauta(t, notas, vol) { // flauta de madera, respiración y vibrato lento
    var tt = t;
    notas.forEach(function (n) {
      var f = n[0], d = n[1], o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f * 0.97, tt); o.frequency.exponentialRampToValueAtTime(f, tt + 0.08);
      l.frequency.value = 5; lg.gain.value = f * 0.008; l.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol, tt + 0.12); g.gain.setValueAtTime(vol, tt + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
      o.connect(g); g.connect(master); g.connect(wet); o.start(tt); l.start(tt); o.stop(tt + d + 0.05); l.stop(tt + d + 0.05);
      var s = ctx.createBufferSource(); s.buffer = ruido; var bp = ctx.createBiquadFilter(), sg = ctx.createGain();
      bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3; sg.gain.setValueAtTime(vol * 0.35, tt); sg.gain.exponentialRampToValueAtTime(0.0001, tt + d * 0.8);
      s.connect(bp); bp.connect(sg); sg.connect(master); s.start(tt, Math.random()); s.stop(tt + d);
      tt += d * 0.92;
    });
  }
  var FLAUTA = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33]; // re menor pentatónica
  function frase() { var n = 3 + Math.floor(Math.random() * 3), a = [], i = 1 + Math.floor(Math.random() * 3); for (var k = 0; k < n; k++) { a.push([FLAUTA[i], 0.9 + Math.random() * 1.1]); i = Math.max(0, Math.min(FLAUTA.length - 1, i + Math.floor(Math.random() * 3) - 1)); } a.push([FLAUTA[0], 2.2]); return a; }

  // ---------- música ----------
  function arrancarMusica() {
    if (musica || !ctx) return;
    musica = ctx.createGain(); musica.gain.value = 0.0001; musica.connect(master); musica.connect(wet);
    musica.gain.exponentialRampToValueAtTime(1.6, ctx.currentTime + 3);
    // bordón: re + la + re (octava), con respiración lenta
    [[73.42, 'sine', 0.16], [110.0, 'sine', 0.10], [146.83, 'triangle', 0.06]].forEach(function (p, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = p[1]; o.frequency.value = p[0]; f.type = 'lowpass'; f.frequency.value = 700;
      g.gain.value = p[2]; l.frequency.value = 0.07 + i * 0.03; lg.gain.value = p[2] * 0.6; l.connect(lg); lg.connect(g.gain);
      o.connect(f); f.connect(g); g.connect(musica); o.start(); l.start();
    });
    // latido de tambor (suave) y truenos / flauta ocasionales
    (function latido() {
      if (!ctx) return;
      if (activo && !document.hidden) { var t = ctx.currentTime + 0.05; tambor(t, 0.16); tambor(t + 0.5, 0.09); if (Math.random() < 0.3) sonaja(t + 1.0, 0.04); }
      setTimeout(latido, 2400);
    })();
    (function clima() {
      if (!ctx) return;
      if (activo && !document.hidden) { var t = ctx.currentTime + 0.05, r = Math.random(); if (r < 0.45) trueno(t, 0.22, 5); else if (r < 0.8) flauta(t, frase(), 0.07); else { rayo(t, 0.16); } }
      setTimeout(clima, 9000 + Math.random() * 9000);
    })();
    // campanitas sueltas
    (function siguiente() {
      if (!ctx) return;
      var t = ctx.currentTime + 0.05, f = PENTA[Math.floor(Math.random() * PENTA.length)];
      if (activo && !document.hidden) {
        var n = ctx.createGain(); n.gain.value = 1; n.connect(musica);
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        o.connect(g); g.connect(musica); o.start(t); o.stop(t + 3.3);
        var o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = f * 2.01; g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.012, t + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o2.connect(g2); g2.connect(musica); o2.start(t); o2.stop(t + 1.7);
      }
      timer = setTimeout(siguiente, 2200 + Math.random() * 3800);
    })();
  }
  function pararMusica() { if (timer) clearTimeout(timer); timer = null; }

  // ---------- efectos ----------
  var SFX = {
    baraja: function (t) {
      for (var i = 0; i < 16; i++) golpe(t + i * 0.085 + Math.random() * 0.03, 0.22, 1800 + Math.random() * 3000);
      soplo(t, 1.5, 500, 2200, 0.1, 0.8);
      for (var j = 0; j < 14; j++) golpe(t + 1.7 + j * 0.05, 0.14, 2200 + Math.random() * 2000);
      campana(PENTA[1] / 2, t + 2.2, 0.05, 2.4);
      trueno(t, 0.45, 5); tambor(t + 0.2, 0.4); tambor(t + 0.7, 0.3); tambor(t + 1.2, 0.35); sonaja(t + 0.1, 0.12); rayo(t + 2.3, 0.3);
    },
    elegir: function (t) { tambor(t, 0.45); sonaja(t, 0.1); golpe(t, 0.3, 2600); nota(520, t, 0.1, 0.05, 'triangle', false); campana(PENTA[3], t + 0.04, 0.06, 1.8); },
    voltea: function (t) {
      soplo(t, 0.7, 350, 3200, 0.14, 0.9);
      golpe(t + 0.5, 0.2, 3000);
      rayo(t + 0.4, 0.28);
      campana(PENTA[2], t + 0.45, 0.07, 2.8); campana(PENTA[5], t + 0.55, 0.045, 2.4);
    },
    listo: function (t) {
      [0, 2, 3, 5, 6].forEach(function (k, i) { campana(PENTA[k], t + i * 0.16, 0.06, 3.4); });
      nota(146.83, t, 3.6, 0.07, 'sine');
      trueno(t, 0.55, 6); rayo(t + 0.1, 0.3); tambor(t + 1.0, 0.4); tambor(t + 1.5, 0.3);
      flauta(t + 1.8, [[392, 1.1], [440, 1.0], [523.25, 1.2], [440, 0.9], [293.66, 2.6]], 0.1);
    }
  };

  window.HeyoAudio = {
    arrancar: function () {
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (!arrancado) { arrancado = true; arrancarMusica(); }
    },
    sfx: function (n) {
      if (!activo || !ctx || !SFX[n]) return;
      if (ctx.state === 'suspended') ctx.resume();
      SFX[n](ctx.currentTime + 0.02);
    },
    activo: function () { return activo; },
    alternar: function () {
      activo = !activo;
      try { localStorage.setItem(KEY, activo ? 'on' : 'off'); } catch (e) {}
      if (activo) { if (!init()) return activo; ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(3, ctx.currentTime, 0.3); if (!arrancado) { arrancado = true; arrancarMusica(); } }
      else if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.15); }
      return activo;
    }
  };
})();
