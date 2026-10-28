/* Heyocat · sonido: efectos y música generativa (todo sintetizado con WebAudio, sin archivos) */
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
    master = ctx.createGain(); master.gain.value = activo ? 0.9 : 0; master.connect(ctx.destination);
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

  // ---------- música ----------
  function arrancarMusica() {
    if (musica || !ctx) return;
    musica = ctx.createGain(); musica.gain.value = 0.0001; musica.connect(master); musica.connect(wet);
    musica.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 3);
    // bordón: re + la + re (octava), con respiración lenta
    [[73.42, 'sine', 0.10], [110.0, 'sine', 0.06], [146.83, 'triangle', 0.035]].forEach(function (p, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = p[1]; o.frequency.value = p[0]; f.type = 'lowpass'; f.frequency.value = 700;
      g.gain.value = p[2]; l.frequency.value = 0.07 + i * 0.03; lg.gain.value = p[2] * 0.6; l.connect(lg); lg.connect(g.gain);
      o.connect(f); f.connect(g); g.connect(musica); o.start(); l.start();
    });
    // campanitas sueltas
    (function siguiente() {
      if (!ctx) return;
      var t = ctx.currentTime + 0.05, f = PENTA[Math.floor(Math.random() * PENTA.length)];
      if (activo && !document.hidden) {
        var n = ctx.createGain(); n.gain.value = 1; n.connect(musica);
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
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
    },
    elegir: function (t) { golpe(t, 0.3, 2600); nota(520, t, 0.1, 0.05, 'triangle', false); campana(PENTA[3], t + 0.04, 0.06, 1.8); },
    voltea: function (t) {
      soplo(t, 0.7, 350, 3200, 0.14, 0.9);
      golpe(t + 0.5, 0.2, 3000);
      campana(PENTA[2], t + 0.45, 0.07, 2.8); campana(PENTA[5], t + 0.55, 0.045, 2.4);
    },
    listo: function (t) {
      [0, 2, 3, 5, 6].forEach(function (k, i) { campana(PENTA[k], t + i * 0.16, 0.06, 3.4); });
      nota(146.83, t, 3.6, 0.07, 'sine');
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
      if (activo) { if (!init()) return activo; ctx.resume(); master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.3); if (!arrancado) { arrancado = true; arrancarMusica(); } }
      else if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(0, ctx.currentTime, 0.15); }
      return activo;
    }
  };
})();
