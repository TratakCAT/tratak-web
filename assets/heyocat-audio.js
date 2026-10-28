/* Heyokat · sonido: efectos y música generativa (todo sintetizado con WebAudio, sin archivos) */
(function () {
  'use strict';
  var KEY = 'heyocat-sonido';
  var ctx = null, master = null, wet = null, busM = null, wetM = null, musica = null, timer = null, activo = true, arrancado = false, ruido = null;
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
    busM = ctx.createGain(); busM.gain.value = 0.3; busM.connect(master);
    wetM = ctx.createGain(); wetM.gain.value = 0.3; wetM.connect(wet);
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

  // ---------- música: flauta de las llanuras, tambor de latido y bordón (más una brisa cósmica) ----------
  var N_ = { D3: 146.83, A3: 220.0, D4: 293.66, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, F5: 698.46, G5: 783.99, A5: 880.0 };
  // frases en re menor pentatónica: [nota, segundos]; null = respiro
  var FRASES_FLAUTA = [
    [['A4', 1.3], ['C5', .8], ['D5', 2.4], ['C5', .7], ['A4', 1.1], ['G4', 1.5], ['F4', .9], ['D4', 3.4]],
    [['D4', 1.6], ['F4', .8], ['G4', .8], ['A4', 2.2], ['G4', .7], ['A4', .7], ['C5', 2.6], ['A4', 1.2], ['G4', 1.0], ['F4', .9], ['D4', 3.6]],
    [['C5', 1.2], ['D5', 1.0], ['F5', 2.8], ['D5', .9], ['C5', .9], ['A4', 2.2], ['G4', 1.1], ['A4', .9], ['D4', 3.8]],
    [['D5', 1.8], ['A4', 1.2], ['D5', .9], ['C5', 2.6], null, ['A4', 1.2], ['G4', .9], ['F4', 1.3], ['D4', 3.6]],
    [['G4', 1.4], ['A4', 1.0], ['C5', 1.0], ['D5', 3.0], ['F5', 1.2], ['D5', 1.2], ['C5', 1.0], ['A4', 2.6], ['G4', 1.2], ['D4', 4.0]]
  ];
  function nFlauta(t, f, dur, vol) { // timbre de flauta nativa: casi seno, soplo y vibrato que entra tarde
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(), lg = ctx.createGain(), l = ctx.createOscillator(), env = ctx.createGain();
    o.type = 'sine'; o2.type = 'sine';
    o.frequency.setValueAtTime(f * 0.985, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12); o2.frequency.value = f * 2; g2.gain.value = 0.09; g.gain.value = 1;
    l.frequency.value = 5.0; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.5, dur * 0.5)); l.connect(lg); lg.connect(o.frequency);
    env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(vol, t + 0.11); env.gain.setValueAtTime(vol * 0.92, t + dur * 0.7); env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(g); o2.connect(g2); g.connect(env); g2.connect(env); env.connect(busM); env.connect(wetM);
    var s = ctx.createBufferSource(); s.buffer = ruido; s.loop = true; var bp = ctx.createBiquadFilter(), sg = ctx.createGain();
    bp.type = 'bandpass'; bp.frequency.value = f * 2.1; bp.Q.value = 2.2; sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(vol * 0.16, t + 0.08); sg.gain.exponentialRampToValueAtTime(vol * 0.05, t + dur * 0.5); sg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    s.connect(bp); bp.connect(sg); sg.connect(busM); sg.connect(wetM);
    o.start(t); o2.start(t); l.start(t); s.start(t, Math.random()); var fin = t + dur + 0.35; o.stop(fin); o2.stop(fin); l.stop(fin); s.stop(fin);
  }
  function tocaFrase(t, fr, vol) { var tt = t; fr.forEach(function (n) { if (!n) { tt += 0.6; return; } nFlauta(tt, N_[n[0]], n[1], vol); tt += n[1] * 0.94; }); return tt - t; }
  function latido(t, vol) { // tambor de marco, cálido y grave
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.2);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); o.connect(g); g.connect(busM); g.connect(wetM); o.start(t); o.stop(t + 0.6);
    var s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), sg = ctx.createGain(); s.buffer = ruido; lp.type = 'lowpass'; lp.frequency.value = 520;
    sg.gain.setValueAtTime(vol * 0.5, t); sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.09); s.connect(lp); lp.connect(sg); sg.connect(busM); s.start(t, Math.random()); s.stop(t + 0.12);
  }
  var archivoUrl = null, audioEl = null;
  function arrancarMusica() {
    if (musica || !ctx) return;
    musica = ctx.createGain(); musica.gain.value = 1; musica.connect(busM);
    if (archivoUrl) { // música grabada (si se subió un archivo en el CMS) reemplaza la sintetizada
      audioEl = new Audio(archivoUrl); audioEl.loop = true; audioEl.crossOrigin = 'anonymous';
      try { var src = ctx.createMediaElementSource(audioEl); var ag = ctx.createGain(); ag.gain.value = 0.9; src.connect(ag); ag.connect(musica); } catch (e) {}
      audioEl.play().catch(function () {}); return;
    }
    // bordón: re y la abiertos, muy suaves, respirando
    [[73.42, 'sine', 0.075], [110.0, 'sine', 0.045], [146.83, 'triangle', 0.022]].forEach(function (p, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = p[1]; o.frequency.value = p[0]; f.type = 'lowpass'; f.frequency.value = 420;
      g.gain.value = p[2]; l.frequency.value = 0.05 + i * 0.02; lg.gain.value = p[2] * 0.5; l.connect(lg); lg.connect(g.gain);
      o.connect(f); f.connect(g); g.connect(musica); g.connect(wetM); o.start(); l.start();
    });
    // latido de tambor, firme pero bajito (alterna fuerte-suave)
    var beat = 0.95, n = 0, prox = ctx.currentTime + 0.4;
    timer = setInterval(function () {
      while (prox < ctx.currentTime + 0.4) { if (activo && !document.hidden) latido(prox, n % 2 ? 0.07 : 0.14); prox += beat; n++; }
    }, 120);
    // melodía de flauta: frases compuestas, con respiros largos
    var orden = [0, 1, 2, 3, 4].sort(function () { return Math.random() - .5; }), ip = 0;
    (function siguiente(espera) {
      setTimeout(function () {
        if (!ctx) return;
        var dur = 6;
        if (activo && !document.hidden) { dur = tocaFrase(ctx.currentTime + 0.05, FRASES_FLAUTA[orden[ip % orden.length]], 0.085); ip++; }
        siguiente(dur * 1000 + 3500 + Math.random() * 4500);
      }, espera);
    })(2500);
    // destellos cósmicos: campanitas muy espaciadas (la capa digital, sin estorbar)
    (function destello() {
      setTimeout(function () {
        if (!ctx) return;
        if (activo && !document.hidden) { var f = [N_.D5, N_.A5, N_.G5, N_.F5, N_.C5][Math.floor(Math.random() * 5)]; campana(f, ctx.currentTime + 0.05, 0.028, 3.6); }
        destello();
      }, 5000 + Math.random() * 6000);
    })();
  }
  function pararMusica() { if (timer) clearInterval(timer); timer = null; if (audioEl) audioEl.pause(); }

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
    archivo: function (u) { archivoUrl = u || null; },
    activo: function () { return activo; },
    alternar: function () {
      activo = !activo;
      try { localStorage.setItem(KEY, activo ? 'on' : 'off'); } catch (e) {}
      if (audioEl) { if (activo) audioEl.play().catch(function () {}); else audioEl.pause(); }
      if (activo) { if (!init()) return activo; ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(3, ctx.currentTime, 0.3); if (!arrancado) { arrancado = true; arrancarMusica(); } }
      else if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.15); }
      return activo;
    }
  };
})();
