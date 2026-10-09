/* ============================================================
   TRATAK CAT — motor de renderizado compartido
   Usado por: index.html (sitio real), admin/index.html (preview
   en vivo del panel), y pagina-seccion.html (páginas dedicadas).
   Mantener este archivo como única fuente de verdad del diseño.
   ============================================================ */
(function (global) {
  'use strict';

  var FONT_PAIRS = {
    fraunces_space: { heading: "'Fraunces', serif", body: "'Space Grotesk', sans-serif" },
    playfair_inter: { heading: "'Playfair Display', serif", body: "'Inter', sans-serif" },
    baskerville_plex: { heading: "'Libre Baskerville', serif", body: "'IBM Plex Sans', sans-serif" },
    dmserif_work: { heading: "'DM Serif Display', serif", body: "'Work Sans', sans-serif" },
    cormorant_manrope: { heading: "'Cormorant Garamond', serif", body: "'Manrope', sans-serif" }
  };

  // Lee todos los eventos directamente desde la carpeta /events/ del repositorio en GitHub
  // (cada evento es su propio archivo — así aparecen como entradas separadas en el panel)
  var GITHUB_OWNER = 'TratakCAT';
  var GITHUB_REPO = 'tratak-web';

  // Fetch con límite de tiempo: si tarda demasiado, falla en vez de colgarse para siempre
  function fetchConTiempoLimite(url, ms) {
    ms = ms || 8000;
    return Promise.race([
      fetch(url),
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Tiempo de espera agotado: ' + url)); }, ms);
      })
    ]);
  }

  function fetchEventosDesdeGitHub() {
    var url = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/events?_=' + Date.now();
    return fetchConTiempoLimite(url, 8000)
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo listar la carpeta de eventos (¿el repo es público?)');
        return r.json();
      })
      .then(function (archivos) {
        var jsonFiles = (archivos || []).filter(function (f) { return f.name && f.name.indexOf('.json') === f.name.length - 5; });
        return Promise.all(jsonFiles.map(function (f) {
          return fetchConTiempoLimite(f.download_url, 8000)
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (!data.slug) data.slug = f.name.replace(/\.json$/, '');
              return data;
            })
            .catch(function () { return null; });
        })).then(function (lista) { return lista.filter(Boolean); });
      })
      .catch(function (err) {
        console.error('Error cargando eventos desde GitHub:', err);
        return [];
      });
  }

  function esc(str) {
    if (str === undefined || str === null) return '';
    return String(str);
  }

  function youtubeIdFromUrl(url) {
    if (!url) return '';
    var m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  }

  // Aplica colores/tipografías del tema a un elemento raíz (documentElement normalmente)
  function themeStyleTag(theme) {
    if (!theme) return '';
    var extra = { grande: '2px', muy_grande: '4px' }[theme.tamano_texto] || '0px';
    var fp = FONT_PAIRS[theme.font_pair] || FONT_PAIRS.fraunces_space;
    var vars = ['--fs-extra:' + extra];
    if (theme.color_paper) vars.push('--paper:' + theme.color_paper);
    if (theme.color_ink) vars.push('--ink:' + theme.color_ink);
    if (theme.color_clay) vars.push('--clay:' + theme.color_clay);
    if (theme.color_moss) vars.push('--moss:' + theme.color_moss);
    if (theme.color_dust) vars.push('--dust:' + theme.color_dust);
    vars.push('--font-heading:' + fp.heading);
    vars.push('--font-body:' + fp.body);
    return '<style>:root{' + vars.join(';') + '}</style>';
  }

  function deltaTexto() {
    try { return parseInt(localStorage.getItem('tratak-fs-delta') || '0', 10) || 0; } catch (e) { return 0; }
  }

  function applyTheme(theme, rootStyle) {
    if (!theme || !rootStyle) return;
    if (theme.color_paper) rootStyle.setProperty('--paper', theme.color_paper);
    if (theme.color_ink) rootStyle.setProperty('--ink', theme.color_ink);
    if (theme.color_clay) rootStyle.setProperty('--clay', theme.color_clay);
    if (theme.color_moss) rootStyle.setProperty('--moss', theme.color_moss);
    if (theme.color_dust) rootStyle.setProperty('--dust', theme.color_dust);
    var base = { grande: 2, muy_grande: 4 }[theme.tamano_texto] || 0;
    applyTheme.base = base;
    rootStyle.setProperty('--fs-extra', (base + deltaTexto()) + 'px');
    var fp = FONT_PAIRS[theme.font_pair] || FONT_PAIRS.fraunces_space;
    rootStyle.setProperty('--font-heading', fp.heading);
    rootStyle.setProperty('--font-body', fp.body);
  }

  // ---------- nav ----------

  // ---------- menú desplegable (tres rayitas) ----------
  var MENU_CSS =
    '.menu-burger{display:inline-flex;align-items:center;justify-content:center;flex:none;width:44px;min-width:44px;height:44px;margin-left:12px;padding:0;background:var(--paper,#e9e2d1);border:1px solid var(--ink,#241f18);border-radius:12px;cursor:pointer;color:var(--ink,#241f18)}' +
    '.menu-burger svg{display:block;flex:none;width:24px;height:24px;stroke:var(--ink,#241f18)}' +
    '.nav-gk{display:inline-block;width:15px;height:15px;margin-right:6px;vertical-align:-2px;color:var(--clay,#a3552b)}.nav-gk svg{width:100%;height:100%;display:block}a:hover .nav-gk svg,.menu-item:hover .nav-gk svg{animation:gkGiro 2s linear infinite}@keyframes gkGiro{to{transform:rotate(-360deg)}}' +
    '.menu-logos{display:flex;align-items:center;gap:10px;min-width:0}.menu-logos img{height:28px;width:auto;max-width:42vw}' +
    '.menu-item .mi-ico{width:22px;height:22px;flex:none;color:#111}body.modo-noche .menu-item .mi-ico,body.modo-noche .menu-buscar-wrap .mi-ico{color:#f3ece0}.menu-item .mi-ico svg{width:100%;height:100%;display:block}' +
    '.menu-buscar-wrap{position:relative}.menu-buscar-wrap .mi-ico{position:absolute;left:14px;top:50%;width:20px;height:20px;transform:translateY(-50%);opacity:.8;color:#111;pointer-events:none}.menu-buscar-wrap .menu-buscar{padding-left:42px}' +
    'nav .bar{gap:10px}nav .bar ul{margin-left:auto;margin-right:14px}' +
    '@media (max-width:780px){nav{position:fixed!important;top:0;left:0;right:0;width:100%;transform:translateZ(0)}body{padding-top:var(--nav-h,78px)}.whatsapp-flotante,.modo-noche-toggle{transform:translateZ(0);margin-bottom:env(safe-area-inset-bottom,0px)}}' +
    '.menu-overlay{position:fixed;inset:0;background:rgba(20,17,12,.55);opacity:0;pointer-events:none;transition:opacity .25s;z-index:200}' +
    '.menu-panel{position:fixed;top:0;right:0;bottom:0;width:min(380px,92vw);background:var(--paper,#e9e2d1);color:var(--ink,#241f18);z-index:201;transform:translateX(105%);transition:transform .28s ease;display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(0,0,0,.25);border-radius:22px 0 0 22px;font-family:var(--font-body,sans-serif)}' +
    'body.menu-abierto .menu-overlay{opacity:1;pointer-events:auto}body.menu-abierto .menu-panel{transform:none}body.menu-abierto{overflow:hidden}' +
    '.menu-top{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 10px}.menu-top strong{font-size:18px}' +
    '.menu-cerrar{width:40px;height:40px;border-radius:50%;border:1px solid var(--line,rgba(0,0,0,.18));background:transparent;color:inherit;font-size:18px;cursor:pointer}' +
    '.menu-scroll{flex:1;overflow-y:auto;padding:0 20px 24px}' +
    '.menu-buscar{width:100%;padding:13px 16px;border-radius:999px;border:1px solid var(--line,rgba(0,0,0,.25));background:color-mix(in srgb,var(--paper-2,#ddd4bd) 60%,transparent);color:inherit;font:inherit;font-size:16px;margin:6px 0 4px}' +
    '.menu-titulo{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.65;margin:20px 0 8px}' +
    '.menu-lista{list-style:none;margin:0;padding:0}.menu-lista li{margin:0}' +
    '.menu-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px 14px;border:0;background:transparent;color:inherit;font:inherit;font-size:16px;border-radius:14px;cursor:pointer;text-decoration:none}' +
    '.menu-item:hover,.menu-item:focus-visible{background:color-mix(in srgb,var(--clay,#a3552b) 14%,transparent);outline:none}' +
    '.menu-item small{display:block;opacity:.65;font-size:13px;line-height:1.35;margin-top:2px}' +
    '.menu-ajustes{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;border-radius:14px;border:1px solid var(--line,rgba(0,0,0,.18));margin-bottom:8px}' +
    '.menu-ajustes .grupo{display:flex;gap:6px}.menu-mini{min-width:42px;height:38px;border-radius:999px;border:1px solid var(--line,rgba(0,0,0,.3));background:transparent;color:inherit;font:inherit;cursor:pointer;padding:0 12px}' +
    '.menu-mini[aria-pressed=true]{background:var(--ink,#241f18);color:var(--paper,#e9e2d1)}' +
    '.menu-vacio{opacity:.7;padding:8px 14px;font-size:14px}' +
    '.menu-resaltado{animation:menuRes 1.6s ease}@keyframes menuRes{0%,40%{box-shadow:0 0 0 6px color-mix(in srgb,var(--clay,#a3552b) 45%,transparent)}100%{box-shadow:0 0 0 0 transparent}}';

  function mi(n) { return '<span class="mi-ico">' + iconoSVG(n) + '</span>'; }

  function renderMenu(homeHref, theme) {
    homeHref = homeHref || 'index.html';
    var logos;
    if (theme && (theme.logo_tratak || theme.logo_cat)) {
      logos =
        (theme.logo_tratak ? '<img src="' + esc(theme.logo_tratak) + '" data-logo-oscuro="' + esc(theme.logo_tratak_oscuro || '') + '" class="logo-tema" alt="TRATAK">' : '') +
        (theme.logo_cat ? '<img src="' + esc(theme.logo_cat) + '" data-logo-oscuro="' + esc(theme.logo_cat_oscuro || '') + '" class="logo-tema" alt="CAT">' : '');
    } else {
      logos = '<strong>tratak·cat</strong>';
    }
    return (
      '<style id="menu-css">' + MENU_CSS + '</style>' +
      '<div class="menu-overlay" data-menu-cerrar></div>' +
      '<aside class="menu-panel" id="menu-panel" role="dialog" aria-label="Menú del sitio" aria-hidden="true" data-home="' + esc(homeHref) + '">' +
      '<div class="menu-top"><a class="menu-logos" href="' + esc(homeHref) + '" aria-label="Inicio" style="text-decoration:none;color:inherit">' + logos + '</a><button type="button" class="menu-cerrar" data-menu-cerrar aria-label="Cerrar menú">✕</button></div>' +
      '<div class="menu-scroll">' +
      '<div class="menu-buscar-wrap"><span class="mi-ico">' + iconoSVG('lupa') + '</span><input type="search" class="menu-buscar" id="menu-buscar" placeholder="Buscar en el sitio…" aria-label="Buscar en el sitio" autocomplete="off"></div>' +
      '<ul class="menu-lista" id="menu-resultados"></ul>' +
      '<div id="menu-bloque-secciones"><p class="menu-titulo">Secciones</p><ul class="menu-lista" id="menu-secciones"></ul></div>' +
      '<p class="menu-titulo">Ir a</p><ul class="menu-lista">' +
      '<li><a class="menu-item" href="' + esc(homeHref) + '">' + mi('casa') + 'Inicio</a></li>' +
      '<li><a class="menu-item" href="landing.html">' + mi('calendario') + 'Próximos eventos</a></li>' +
      '<li><a class="menu-item" id="menu-contacto" href="' + esc(homeHref) + '#contacto">' + mi('correo') + 'Contacto</a></li>' +
      '<li><a class="menu-item" id="menu-wa" href="#" target="_blank" rel="noopener">' + mi('chat') + 'WhatsApp</a></li>' +
      '</ul>' +
      '<p class="menu-titulo">Ajustes</p>' +
      '<div class="menu-ajustes"><span>🌙 Modo noche</span><div class="grupo"><button type="button" class="menu-mini" id="menu-noche" aria-pressed="false">Activar</button></div></div>' +
      '<div class="menu-ajustes"><span>Tamaño del texto</span><div class="grupo"><button type="button" class="menu-mini" data-fs="-2" aria-label="Texto más pequeño">A−</button><button type="button" class="menu-mini" data-fs="0" aria-label="Texto normal">A</button><button type="button" class="menu-mini" data-fs="2" aria-label="Texto más grande">A+</button></div></div>' +
      '<div class="menu-ajustes" id="menu-fila-shishi" style="display:none"><span>🐾 Shishi (mascota)</span><div class="grupo"><button type="button" class="menu-mini" id="menu-shishi" aria-pressed="true">Visible</button></div></div>' +
      '<div class="menu-ajustes"><span>Compartir esta página</span><div class="grupo"><button type="button" class="menu-mini" id="menu-compartir">Compartir</button></div></div>' +
      '</div></aside>'
    );
  }

  function textoPlano(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  var ICONO_POR_TIPO = { estadisticas: 'estrella', pilares: 'contemplacion', destacado: 'chispa', lista_precios: 'gankyil', productos: 'ceramica', galeria: 'camara', media: 'vr', blog: 'libro', personajes: 'personas', texto_destacado: 'llama', carrusel: 'camara', evento_proximo: 'calendario', calendario: 'calendario', eventos_pasados: 'reloj' };

  function seccionesDeLaPagina() {
    var out = [];
    document.querySelectorAll('section').forEach(function (sec) {
      if (sec.closest('nav') || sec.closest('.menu-panel') || sec.style.display === 'none') return;
      var h = sec.querySelector('h2');
      if (!h) return;
      var t = textoPlano(h);
      if (!t) return;
      var ico = sec.querySelector('.sec-icono, .h-ico');
      var svg = ico && ico.innerHTML.trim() ? ico.innerHTML : iconoSVG(ICONO_POR_TIPO[sec.getAttribute('data-tipo')] || (sec.id === 'contacto' ? 'correo' : 'chispa'));
      out.push({ el: sec, titulo: t, ico: svg });
    });
    return out;
  }

  function irA(el) {
    var det = el.closest ? el.closest('details') : null;
    if (det) det.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('menu-resaltado');
    setTimeout(function () { el.classList.remove('menu-resaltado'); }, 1700);
  }

  function menuAbrir(abrir) {
    var panel = document.getElementById('menu-panel');
    if (!panel) return;
    if (abrir) {
      var lista = document.getElementById('menu-secciones');
      var secs = seccionesDeLaPagina();
      lista.innerHTML = '';
      secs.forEach(function (sc, i) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'menu-item'; b.setAttribute('data-sec', i);
        b.innerHTML = '<span class="mi-ico">' + sc.ico + '</span><span></span>';
        b.lastChild.textContent = sc.titulo;
        li.appendChild(b); lista.appendChild(li);
      });
      menuAbrir.secs = secs;
      document.getElementById('menu-bloque-secciones').style.display = secs.length ? '' : 'none';
      var wa = document.getElementById('whatsapp-flotante');
      var mw = document.getElementById('menu-wa');
      if (mw) { if (wa) mw.href = wa.href; else mw.style.display = 'none'; }
      var contacto = document.getElementById('contacto');
      var mc = document.getElementById('menu-contacto');
      if (mc && contacto) { mc.setAttribute('href', '#contacto'); mc.setAttribute('data-ancla', 'contacto'); }
      var noche = document.body.classList.contains('modo-noche');
      var bn = document.getElementById('menu-noche');
      if (bn) { bn.setAttribute('aria-pressed', noche ? 'true' : 'false'); bn.textContent = noche ? 'Activado' : 'Activar'; }
      var fs2 = document.getElementById('menu-fila-shishi');
      if (fs2 && window.Shishi) { fs2.style.display = ''; var vv = window.Shishi.visible(); var b3 = document.getElementById('menu-shishi'); b3.textContent = vv ? 'Visible' : 'Oculto'; b3.setAttribute('aria-pressed', vv ? 'true' : 'false'); }
      var d = deltaTexto();
      panel.querySelectorAll('[data-fs]').forEach(function (b) { b.setAttribute('aria-pressed', String(parseInt(b.getAttribute('data-fs'), 10) === d)); });
    }
    document.body.classList.toggle('menu-abierto', !!abrir);
    panel.setAttribute('aria-hidden', abrir ? 'false' : 'true');
    document.querySelectorAll('[data-menu-abrir]').forEach(function (b) { b.setAttribute('aria-expanded', abrir ? 'true' : 'false'); });
    if (abrir) setTimeout(function () { var i = document.getElementById('menu-buscar'); if (i && window.innerWidth > 780) i.focus(); }, 300);
  }

  function menuBuscar(q) {
    var res = document.getElementById('menu-resultados');
    var bloque = document.getElementById('menu-bloque-secciones');
    q = (q || '').trim().toLowerCase();
    if (q.length < 2) { res.innerHTML = ''; bloque.style.display = (menuAbrir.secs || []).length ? '' : 'none'; return; }
    bloque.style.display = 'none';
    var hallazgos = [];
    (menuAbrir.secs || seccionesDeLaPagina()).forEach(function (sc) {
      // busca por tarjeta/elemento dentro de la sección y también en el título
      var candidatos = sc.el.querySelectorAll('details.pilar, .plan-item, .producto, .evento-pasado-card, .blog-card, .personaje-card, .topic, .agenda-fila, li, .stat');
      var vistos = 0;
      candidatos.forEach(function (c) {
        if (vistos >= 3) return;
        var t = textoPlano(c);
        var idx = t.toLowerCase().indexOf(q);
        if (idx === -1) return;
        vistos++;
        var ini = Math.max(0, idx - 30);
        hallazgos.push({ el: c, titulo: sc.titulo, snip: (ini > 0 ? '…' : '') + t.slice(ini, ini + 90) + '…' });
      });
      if (!vistos) {
        var t2 = textoPlano(sc.el), i2 = t2.toLowerCase().indexOf(q);
        if (i2 !== -1 || sc.titulo.toLowerCase().indexOf(q) !== -1) {
          var ini2 = Math.max(0, i2 - 30);
          hallazgos.push({ el: sc.el, titulo: sc.titulo, snip: i2 === -1 ? '' : (ini2 > 0 ? '…' : '') + t2.slice(ini2, ini2 + 90) + '…' });
        }
      }
    });
    menuBuscar.hallazgos = hallazgos.slice(0, 12);
    res.innerHTML = '';
    if (!hallazgos.length) { res.innerHTML = '<li class="menu-vacio">Sin resultados para “' + esc(q) + '”.</li>'; return; }
    menuBuscar.hallazgos.forEach(function (h, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'menu-item'; b.setAttribute('data-res', i);
      b.innerHTML = '<span><strong>' + esc(h.titulo) + '</strong><small>' + esc(h.snip) + '</small></span>';
      li.appendChild(b); res.appendChild(li);
    });
  }

  function bindMenu() {
    if (bindMenu.hecho) return;
    bindMenu.hecho = true;
    function navAlto() { var n = document.querySelector('nav'); if (n) document.documentElement.style.setProperty('--nav-h', n.offsetHeight + 'px'); }
    navAlto(); window.addEventListener('resize', navAlto); window.addEventListener('load', navAlto); setTimeout(navAlto, 800);
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest) return;
      if (t.closest('[data-menu-abrir]')) { menuAbrir(true); return; }
      if (t.closest('[data-menu-cerrar]')) { menuAbrir(false); return; }
      var sec = t.closest('[data-sec]');
      if (sec) { var s = menuAbrir.secs[parseInt(sec.getAttribute('data-sec'), 10)]; menuAbrir(false); if (s) setTimeout(function () { irA(s.el); }, 120); return; }
      var rs = t.closest('[data-res]');
      if (rs) { var h = menuBuscar.hallazgos[parseInt(rs.getAttribute('data-res'), 10)]; menuAbrir(false); if (h) setTimeout(function () { irA(h.el); }, 120); return; }
      var fs = t.closest('[data-fs]');
      if (fs) {
        var v = parseInt(fs.getAttribute('data-fs'), 10);
        try { localStorage.setItem('tratak-fs-delta', String(v)); } catch (er) {}
        document.documentElement.style.setProperty('--fs-extra', ((applyTheme.base || 0) + v) + 'px');
        document.querySelectorAll('#menu-panel [data-fs]').forEach(function (b) { b.setAttribute('aria-pressed', String(parseInt(b.getAttribute('data-fs'), 10) === v)); });
        return;
      }
      if (t.closest('#menu-noche')) {
        var tg = document.getElementById('modo-noche-toggle');
        if (tg) tg.click();
        var on = document.body.classList.contains('modo-noche');
        var bn = document.getElementById('menu-noche');
        bn.setAttribute('aria-pressed', on ? 'true' : 'false'); bn.textContent = on ? 'Activado' : 'Activar';
        return;
      }
      if (t.closest('#menu-shishi')) {
        if (window.Shishi) { var vis = window.Shishi.toggle(); var bs = document.getElementById('menu-shishi'); bs.textContent = vis ? 'Visible' : 'Oculto'; bs.setAttribute('aria-pressed', vis ? 'true' : 'false'); }
        return;
      }
      if (t.closest('#menu-compartir')) {
        var url = location.href.split('#')[0];
        if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); }
        else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { var b = document.getElementById('menu-compartir'); b.textContent = '¡Copiado!'; setTimeout(function () { b.textContent = 'Compartir'; }, 1800); }); }
        return;
      }
      if (t.closest('#menu-panel a.menu-item')) { menuAbrir(false); }
    });
    document.addEventListener('input', function (e) { if (e.target && e.target.id === 'menu-buscar') menuBuscar(e.target.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menuAbrir(false); });
  }

  function renderNav(theme, opts) {
    opts = opts || {};
    var brandInner;
    if (theme && (theme.logo_tratak || theme.logo_cat)) {
      brandInner =
        (theme.logo_tratak ? '<img src="' + esc(theme.logo_tratak) + '" data-logo-oscuro="' + esc(theme.logo_tratak_oscuro || '') + '" class="logo-tema" alt="TRATAK" style="height:26px;margin-right:10px;vertical-align:middle;">' : '') +
        (theme.logo_cat ? '<img src="' + esc(theme.logo_cat) + '" data-logo-oscuro="' + esc(theme.logo_cat_oscuro || '') + '" class="logo-tema" alt="CAT" style="height:26px;margin-right:10px;vertical-align:middle;">' : '');
    } else {
      brandInner = '<span>tratak·cat</span>';
    }
    var homeHref = opts.homeHref || 'index.html';
    return (
      '<nav><div class="wrap bar">' +
      '<a href="' + homeHref + '" class="brand" style="text-decoration:none;color:inherit;">' + brandInner + '</a>' +
      '<ul>' +
      '<li><a data-ancla="pilares" href="' + homeHref + '#pilares">Pilares</a></li>' +
      '<li><a data-ancla="taller" href="' + homeHref + '#taller">Taller</a></li>' +
      '<li><a data-ancla="plan" href="' + homeHref + '#plan"><span class="nav-gk">' + iconoSVG('gankyil') + '</span>Plan</a></li>' +
      '<li><a data-ancla="tienda" href="' + homeHref + '#tienda">Tienda</a></li>' +
      '<li><a data-ancla="galeria" href="' + homeHref + '#galeria">Galería</a></li>' +
      '<li><a data-ancla="multimedia" href="' + homeHref + '#multimedia">Video</a></li>' +
      '<li><a href="landing.html">Eventos</a></li>' +
      '</ul>' +
      '<a class="cta" data-ancla="plan" href="' + homeHref + '#plan">Inscríbete →</a>' +
      '<button type="button" class="menu-burger" data-menu-abrir aria-label="Abrir menú" aria-expanded="false"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      '</div></nav>' + renderMenu(homeHref, theme)
    );
  }

  // ---------- hero ----------
  function renderHero(hero) {
    if (!hero) return '';
    var estiloInline = '';
    if (hero.color_acento) estiloInline += '--clay:' + hero.color_acento + ';';
    if (hero.estilo_fuente && FONT_PAIRS[hero.estilo_fuente]) {
      var fph = FONT_PAIRS[hero.estilo_fuente];
      estiloInline += '--font-heading:' + fph.heading + ';--font-body:' + fph.body + ';';
    }
    var ctas =
      '<div class="cta-row">' +
      '<a class="btn primary" href="' + esc(hero.cta1_link) + '">' + esc(hero.cta1_label) + '</a>' +
      '<a class="btn ghost" href="' + esc(hero.cta2_link) + '">' + esc(hero.cta2_label) + '</a>' +
      '<a class="btn ghost" href="' + esc(hero.cta3_link) + '">' + esc(hero.cta3_label) + '</a>' +
      '</div>';
    var bloques = {
      kicker: '<p class="kicker">' + esc(hero.kicker) + '</p>',
      titulo: '<h1>' + esc(hero.title_line1) + '<br>' + esc(hero.title_pre) + '<em>' + esc(hero.title_em) + '</em><br>' + esc(hero.title_line3) + '</h1>',
      texto: '<p class="lede">' + esc(hero.lede) + '</p>',
      botones: ctas
    };
    var orden = (hero.orden || []).map(function (o) { return typeof o === 'string' ? o : (o && o.bloque) || ''; }).filter(function (k) { return bloques[k]; });
    ['kicker', 'titulo', 'texto', 'botones'].forEach(function (k) { if (orden.indexOf(k) === -1) orden.push(k); });
    var textoHTML = orden.map(function (k) { return bloques[k]; }).join('');

    if (hero.estilo === 'fondo') {
      return (
        '<header class="hero hero-fondo" style="' + estiloInline + '"><div class="hero-fondo-media"><img src="' + esc(hero.image) + '" alt=""></div>' +
        '<div class="hero-fondo-overlay"></div>' +
        '<div class="wrap hero-fondo-contenido">' + textoHTML + '</div></header>'
      );
    }
    return (
      '<header class="hero wrap" style="' + estiloInline + '"><div class="hero-grid"><div>' + textoHTML + '</div>' +
      '<img class="hero-image" src="' + esc(hero.image) + '" alt="Pieza destacada"></div></header>'
    );
  }

  // ---------- bloques (secciones) ----------
  var ICONOS = {
    hoja: '<path d="M5 19c0-9 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l8-8"/>',
    semilla: '<path d="M12 21v-9"/><path d="M12 12c-4 0-6-3-6-7 4 0 6 3 6 7z"/><path d="M12 14c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
    atomo: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    ojo: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    contemplacion: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
    llama: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2 2 3-3z"/>',
    chispa: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    engranaje: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    cubo: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>',
    laboratorio: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
    libro: '<path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    ondas: '<path d="M2 8c3-3 5 3 8 0s5 3 8 0 3 0 4-1"/><path d="M2 16c3-3 5 3 8 0s5 3 8 0 3 0 4-1"/>',
    corazon: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
    ubicacion: '<path d="M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    camara: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
    codigo: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    montana: '<path d="M2 20l7-12 4 7 3-4 6 9z"/>',
    infinito: '<path d="M12 12c-2-3-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1 6-4s4-4 6-4a4 4 0 0 1 0 8c-2 0-4-1-6-4z"/>',
    gota: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    personas: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2 5 5"/>',
    impresora: '<path d="M5 3h14v4H5zM3 7h18v8H3zM7 15v6h10v-6"/>',
    vr: '<path d="M2 8h20v8h-6l-2-3h-4l-2 3H2z"/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    ceramica: '<path d="M9 3h6M10 3c0 3-4 4-4 9a6 6 0 0 0 12 0c0-5-4-6-4-9"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
    casa: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12z"/>',
    gankyil: '<circle cx="12" cy="12" r="9"/><g transform=\"rotate(0 12 12)\"><path d=\"M12 12c-3.2 0-4.6-3.4-3-6.2\"/></g><g transform=\"rotate(120 12 12)\"><path d=\"M12 12c-3.2 0-4.6-3.4-3-6.2\"/></g><g transform=\"rotate(240 12 12)\"><path d=\"M12 12c-3.2 0-4.6-3.4-3-6.2\"/></g>'
  };
  function iconoSVG(nombre) {
    var p = ICONOS[nombre];
    if (!p) return '';
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  function luminanciaHex(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    var v = [0, 2, 4].map(function (i) {
      var c = parseInt(m[1].substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }

  // Variables de color de botón (fondo + texto con contraste automático)
  function botonVars(o) {
    var st = '';
    if (!o || !o.color_boton) { if (o && o.color_boton_texto) st += '--u-btn-fg:' + o.color_boton_texto + ';'; return st; }
    st += '--u-btn-bg:' + o.color_boton + ';';
    var fg = o.color_boton_texto;
    if (!fg) { var L = luminanciaHex(o.color_boton); fg = (L !== null && L < 0.4) ? '#fbf6ee' : '#241f18'; }
    return st + '--u-btn-fg:' + fg + ';';
  }

  // Texto del botón principal: siempre contrasta con el color de tinta del tema (día o noche)
  function sincronizarBoton() {
    try {
      var root = document.documentElement;
      var ink = getComputedStyle(root).getPropertyValue('--ink').trim();
      var L = luminanciaHex(ink);
      if (L === null) return;
      var fg = L < 0.4 ? '#fbf6ee' : '#241f18';
      if (root.style.getPropertyValue('--btn-fg-t') !== fg) root.style.setProperty('--btn-fg-t', fg);
    } catch (e) {}
  }
  if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    var _ob = new MutationObserver(sincronizarBoton);
    _ob.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    document.addEventListener('DOMContentLoaded', function () { sincronizarBoton(); if (document.body) _ob.observe(document.body, { attributes: true, attributeFilter: ['class'] }); });
  }

  function wrapAbre(s) {
    var style = '';
    var hayMedia = (s.fondo === 'imagen' && s.imagen_fondo) || (s.fondo === 'video' && s.video_fondo);
    var usaColor = !!(s.color_fondo && !hayMedia);
    if (usaColor) style += 'background:' + s.color_fondo + ';';
    if (s.color_acento) style += '--clay:' + s.color_acento + ';';
    style += botonVars(s);
    if (s.estilo_fuente && FONT_PAIRS[s.estilo_fuente]) {
      var fp2 = FONT_PAIRS[s.estilo_fuente];
      style += '--font-heading:' + fp2.heading + ';--font-body:' + fp2.body + ';';
    }
    var claseTexto = s.color_texto === 'claro' ? 'bloque-claro' : 'bloque-oscuro';
    if (usaColor) {
      // Contraste automático: si el fondo es oscuro el texto pasa a claro (y viceversa)
      var L = luminanciaHex(s.color_fondo);
      if (L !== null) claseTexto = (1.05 / (L + 0.05)) > ((L + 0.05) / 0.06) ? 'bloque-claro' : 'bloque-oscuro';
    }
    var clasePosicion = (s.fondo === 'imagen' || s.fondo === 'video') ? 'bloque-media-bg' : '';
    if (s.color_titulo) { style += '--c-titulo:' + s.color_titulo + ';'; clasePosicion += ' c-titulo'; }
    if (s.color_etiqueta) { style += '--c-etiqueta:' + s.color_etiqueta + ';'; clasePosicion += ' c-etiqueta'; }
    if (s.color_cuerpo) { style += '--c-cuerpo:' + s.color_cuerpo + ';'; clasePosicion += ' c-cuerpo'; }
    return '<section class="wrap seccion-bloque ' + claseTexto + ' ' + clasePosicion + '" id="' + esc(s.id) + '" data-tipo="' + esc(s.type) + '" style="' + style + '">';
  }

  function mediaFondoHTML(s) {
    if (s.fondo === 'video' && s.video_fondo) {
      return '<video class="bloque-media-el" autoplay muted loop playsinline src="' + esc(s.video_fondo) + '"></video><div class="bloque-media-overlay"></div>';
    }
    if (s.fondo === 'imagen' && s.imagen_fondo) {
      return '<img class="bloque-media-el" src="' + esc(s.imagen_fondo) + '" alt="">' + '<div class="bloque-media-overlay"></div>';
    }
    return '';
  }

  function verTodoLink(id, label) {
    return '<a class="ver-todo-link" href="pagina-seccion.html?id=' + esc(id) + '">' + (label || 'Ver todo') + ' →</a>';
  }

  function renderEstadisticas(s) {
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p>' +
      '<div class="stats">' + (s.stats || []).map(function (st) {
        return '<div class="stat"><div class="n editable">' + esc(st.number) + '</div><div class="l">' + esc(st.label) + '</div></div>';
      }).join('') + '</div></div></section>';
  }

  function renderPilares(s) {
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="pilares-acordeon">' + (s.items || []).map(function (p) {
        return '<details class="pilar"><summary>' + (ICONOS[p.icono] ? '<span class="pilar-ico">' + iconoSVG(p.icono) + '</span>' : '') + '<span class="num">' + esc(p.num) + '</span><span class="pilar-titulo">' + esc(p.title) + '</span><span class="pilar-mas" aria-hidden="true"></span></summary>' +
          '<div class="pilar-cuerpo' + (p.imagen ? ' con-imagen' : '') + '">' +
          (p.imagen ? '<img class="pilar-img" loading="lazy" src="' + esc(p.imagen) + '" alt="' + esc(p.title) + '">' : '') +
          '<p>' + esc(p.text) + '</p></div></details>';
      }).join('') + '</div></div></section>';
  }

  function renderDestacado(s) {
    var textoHTML =
      '<p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<p>' + esc(s.texto1) + '</p>' + (s.texto2 ? '<p>' + esc(s.texto2) + '</p>' : '') +
      (s.boton_texto ? '<a class="btn primary" href="' + esc(s.boton_link) + '">' + esc(s.boton_texto) + '</a>' : '');

    if (s.estilo === 'lado') {
      var img = s.imagen_fondo ? '<img src="' + esc(s.imagen_fondo) + '" alt="">' : '<div class="ph">Foto</div>';
      return wrapAbre(s) +
        '<div class="bloque-contenido destacado-lado-grid"><div>' + textoHTML + '</div>' +
        '<div class="destacado-lado-img">' + img + '</div></div></section>';
    }
    return wrapAbre(s) + mediaFondoHTML(s) + '<div class="bloque-contenido">' + textoHTML + '</div></section>';
  }


  // ---------- gankyil (la espiral triple de Shishi) ----------
  var SHISHI_CFG = {};
  var GK_BRAZOS = [
    { id: 'contemplacion', color: '#c0a2ec', claro: '#d9c8f6', nombre: 'Diseño en Realidad Virtual', pilar: 'Contemplación', desc: 'percepción · mente', re: /\bVR\b|realidad virtual/i },
    { id: 'tecnologia', color: '#9fcbec', claro: '#c4e0f5', nombre: 'Impresión 3D LDM', pilar: 'Tecnología', desc: 'técnica · palabra', re: /\bLDM\b|impresi[oó]n 3d/i },
    { id: 'materialidad', color: '#b9edb2', claro: '#d6f5d1', nombre: 'Cultura Biomaterial', pilar: 'Materialidad', desc: 'materia · cuerpo', re: /biomaterial/i }
  ];
  var GK_TEXTOS = {
    clases: '6',
    mentorias: '9',
    exposicion_titulo: '1 exposición',
    exposicion_texto: 'Cada persona presenta su proyecto. Es el fruto de los tres tópicos, por eso tiene un color propio y está hecha solo de sus 9 gajos, sin centro.',
    lead: 'Shishi guarda entre sus garras el gankyil, la triple espiral que gira sin un centro fijo. Cada espiral es un tópico del plan; juntas forman el recorrido completo.',
    steam: 'Ciencia, tecnología, ingeniería, arte y matemáticas no se estudian por separado: se entrelazan en tres tópicos que giran juntos. Cultura Biomaterial (verde) trabaja la materia: ciencia, ingeniería y los ciclos de los residuos. Impresión 3D LDM (azul) es la técnica: tecnología, matemáticas y fabricación digital. Diseño en Realidad Virtual (morado) es la percepción: arte, forma y atención. Cada tópico se puede tomar solo; los programas P.E.S. recorren los tres.',
    dzogchen: 'El gankyil (tibetano: dga’ ’khyil, «giro del gozo») es una espiral triple que gira sin centro fijo y sin oposición entre sus partes. En la tradición Dzogchen se lee como tres cualidades de una sola base: esencia, naturaleza y energía. Aquí cada espiral es un pilar: Materialidad (cuerpo), Tecnología (palabra, energía) y Contemplación (mente). Ninguno gobierna a los otros: se sostienen girando. Tratak, mirar con atención sostenida, es la práctica que los une.'
  };
  function gkTexto(k) { return (SHISHI_CFG && SHISHI_CFG[k]) || GK_TEXTOS[k]; }

  var GK_DATA = {"contemplacion":{"d":"M-46.3 -79.4 -47.7 -78.4 -48.9 -78.0 -53.4 -74.9 -54.5 -74.0 -56.5 -72.7 -57.9 -71.4 -58.3 -71.2 -60.1 -69.5 -60.6 -69.3 -69.3 -60.6 -69.5 -60.1 -71.2 -58.3 -71.4 -57.9 -72.7 -56.5 -72.9 -56.0 -74.9 -53.4 -78.0 -48.9 -79.7 -45.8 -80.2 -45.2 -84.4 -36.9 -84.6 -36.0 -86.6 -31.2 -87.9 -27.5 -87.9 -26.9 -88.6 -24.9 -88.6 -24.2 -89.4 -22.2 -89.4 -21.2 -90.1 -18.9 -90.1 -17.8 -90.5 -17.0 -90.5 -15.9 -90.9 -15.1 -90.9 -13.3 -91.2 -12.4 -91.2 -10.3 -91.6 -9.4 -91.6 -5.8 -92.0 -4.9 -92.0 5.2 -91.6 6.0 -91.6 9.3 -91.2 10.2 -91.2 12.3 -90.9 13.2 -90.9 15.0 -90.5 15.8 -90.5 16.9 -90.1 17.7 -90.1 18.8 -89.7 19.6 -89.7 20.6 -89.4 21.5 -89.0 23.7 -88.2 25.6 -88.2 26.3 -86.2 32.2 -85.7 33.3 -84.7 36.0 -83.4 38.6 -83.2 39.4 -81.3 43.2 -80.8 43.8 -79.5 46.6 -78.9 47.2 -78.3 48.5 -74.6 54.1 -73.6 55.1 -72.3 57.1 -71.0 58.5 -70.8 59.0 -68.3 61.6 -68.2 62.0 -62.5 67.8 -61.7 68.4 -61.3 68.6 -59.5 70.4 -57.2 72.2 -50.4 76.7 -48.5 77.7 -47.8 78.2 -41.8 81.3 -40.9 81.4 -39.1 82.4 -37.1 83.0 -36.1 83.5 -32.4 84.7 -31.8 84.7 -30.9 85.1 -30.3 85.1 -29.4 85.5 -28.7 85.5 -26.4 86.2 -25.0 86.2 -24.1 86.6 -22.7 86.6 -21.9 87.0 -20.1 87.0 -19.2 87.4 -15.2 87.4 -14.3 87.8 -8.0 87.8 -7.2 87.4 -3.1 87.4 -2.3 87.0 -0.5 87.0 0.4 86.6 1.8 86.6 2.6 86.2 3.7 86.2 4.5 85.9 5.6 85.9 6.4 85.5 8.6 85.1 10.6 84.4 11.2 84.4 13.8 83.5 14.8 83.0 16.8 82.4 17.8 81.8 18.7 81.6 26.2 77.9 26.9 77.3 30.0 75.6 32.2 74.1 33.3 73.1 33.7 73.0 34.8 72.0 36.8 70.7 38.6 69.0 39.0 68.8 45.4 62.4 45.6 61.9 47.7 59.8 47.9 59.3 49.2 57.9 50.1 56.3 51.1 55.2 53.4 51.8 53.9 50.6 54.5 50.0 58.6 41.7 58.8 40.8 60.1 37.9 61.4 34.2 61.4 33.6 62.1 31.6 62.1 30.9 62.9 28.6 62.9 27.5 63.2 26.7 63.2 25.3 63.6 24.4 63.6 23.0 64.0 22.2 64.0 20.0 64.4 19.1 64.4 5.7 64.0 4.8 64.0 2.3 63.6 1.4 63.6 0.8 62.8 -1.8 62.0 -3.3 61.5 -4.0 60.5 -5.9 58.4 -8.1 57.9 -10.1 56.4 -13.1 54.9 -15.4 52.2 -18.0 50.0 -19.5 48.5 -20.3 44.8 -21.5 42.6 -21.5 40.5 -22.9 38.9 -23.5 37.1 -24.4 35.7 -24.9 34.3 -24.9 33.5 -25.3 29.8 -25.3 28.9 -24.9 27.9 -24.9 23.5 -23.3 20.9 -21.6 18.2 -21.4 15.9 -20.3 13.0 -18.2 10.3 -17.2 8.4 -15.4 8.2 -14.1 6.1 -11.6 5.4 -10.1 4.8 -8.1 3.1 -6.3 1.6 -4.1 0.5 -1.8 0.1 -0.7 0.2 -0.2 1.5 0.8 2.9 2.7 4.6 6.2 5.2 6.9 6.1 8.9 6.7 9.5 6.9 10.4 7.4 11.0 8.2 12.5 8.8 14.4 9.7 15.2 10.2 16.6 10.2 18.8 9.8 19.6 9.8 20.6 10.2 21.5 10.2 25.5 9.4 27.9 9.4 29.7 8.7 32.0 8.7 34.2 7.5 37.7 7.4 38.6 6.7 40.2 5.3 42.0 2.1 45.2 1.6 45.3 0.2 46.7 -0.3 46.8 -2.5 48.9 -2.9 49.1 -5.5 51.6 -5.9 51.8 -7.0 52.7 -10.4 54.6 -11.8 55.0 -12.4 55.0 -13.3 55.4 -30.5 55.4 -31.9 54.8 -33.2 54.7 -34.5 54.0 -35.3 53.8 -41.4 50.8 -42.0 50.2 -44.0 49.3 -48.5 46.3 -51.5 43.8 -51.9 43.6 -53.7 41.9 -54.2 41.8 -56.4 39.7 -56.8 39.5 -59.6 36.8 -59.8 36.3 -62.6 33.4 -62.8 32.9 -64.1 31.5 -64.3 31.0 -66.4 28.5 -69.4 23.9 -69.9 22.7 -70.5 22.1 -74.3 14.5 -74.5 13.7 -75.8 10.7 -77.8 4.8 -77.8 4.1 -78.1 3.3 -78.1 2.6 -78.9 0.3 -78.9 -0.8 -79.3 -1.6 -79.3 -3.0 -79.7 -3.9 -79.7 -5.7 -80.0 -6.5 -80.0 -9.0 -80.4 -9.9 -80.4 -20.4 -80.0 -21.2 -80.0 -24.9 -79.7 -25.7 -79.7 -27.5 -79.3 -28.4 -79.3 -29.8 -78.9 -30.6 -78.9 -31.7 -78.5 -32.5 -78.1 -34.7 -77.4 -36.7 -77.4 -37.3 -75.8 -42.1 -75.2 -43.2 -74.3 -45.9 -70.9 -52.7 -70.3 -53.4 -69.4 -55.3 -66.4 -59.9 -61.2 -66.3 -54.2 -73.1 -53.7 -73.3 -52.3 -74.7 -51.8 -74.8 -51.2 -75.5 -48.8 -77.1 -47.8 -78.1 -46.1 -79.3ZM31.7 -2.4 32.3 -2.4 33.2 -2.0 33.8 -2.0 35.3 -1.5 36.8 -0.8 38.7 0.8 38.9 1.3 39.9 2.4 41.1 5.3 41.1 9.3 40.6 10.7 39.5 13.0 37.5 15.0 36.4 15.7 34.6 16.6 33.9 16.6 33.1 17.0 30.2 17.0 26.9 15.7 25.0 14.3 23.8 13.0 22.6 10.7 22.2 9.3 22.2 5.3 22.8 4.0 23.0 3.1 24.4 1.0 26.5 -0.8 29.4 -2.0 30.8 -2.0Z","arcs":["M-15.36 59.78 -14.66 58.49 -13.85 57.25 -12.95 56.08 -11.97 54.98 -10.90 53.96 -9.75 53.04 -8.53 52.20 -7.25 51.46 -5.92 50.83 -4.54 50.30 -3.13 49.88 -1.68 49.57 -0.22 49.38 1.25 49.30 2.73 49.34 4.20 49.49 5.65 49.76 7.08 50.15 8.47 50.64 9.82 51.24 11.11 51.94 12.35 52.75 13.52 53.65 14.62 54.63 15.64 55.70 16.56 56.85 17.40 58.07 18.14 59.35 18.77 60.68 19.30 62.06 19.72 63.47 20.03 64.92 20.22 66.38 20.30 67.85 20.26 69.33 20.11 70.80 19.84 72.25 19.45 73.68 18.96 75.07 18.36 76.42","M-33.94 51.80 -32.60 51.83 -31.28 51.96 -29.96 52.19 -28.67 52.53 -27.41 52.97 -26.19 53.50 -25.01 54.13 -23.88 54.85 -22.82 55.66 -21.82 56.54 -20.90 57.50 -20.05 58.54 -19.29 59.63 -18.61 60.78 -18.03 61.98 -17.54 63.23 -17.15 64.50 -16.87 65.81 -16.68 67.13 -16.60 68.46 -16.63 69.80 -16.76 71.12 -16.99 72.44 -17.33 73.73 -17.77 74.99 -18.30 76.21 -18.93 77.39 -19.65 78.52 -20.46 79.58 -21.34 80.58 -22.30 81.50 -23.34 82.35 -24.43 83.11 -25.58 83.79 -26.78 84.37 -28.03 84.86 -29.30 85.25 -30.61 85.53 -31.93 85.72 -33.26 85.80","M-57.25 37.55 -56.40 38.15 -55.59 38.82 -54.85 39.55 -54.16 40.34 -53.53 41.18 -52.98 42.06 -52.49 42.98 -52.08 43.94 -51.74 44.93 -51.49 45.94 -51.31 46.97 -51.22 48.01 -51.20 49.06 -51.27 50.10 -51.42 51.13 -51.66 52.15 -51.97 53.15 -52.35 54.12 -52.82 55.06 -53.35 55.95 -53.95 56.80 -54.62 57.61 -55.35 58.35 -56.14 59.04 -56.98 59.67 -57.86 60.22 -58.78 60.71 -59.74 61.12 -60.73 61.46 -61.74 61.71 -62.77 61.89 -63.81 61.98 -64.86 62.00 -65.90 61.93 -66.93 61.78 -67.95 61.54 -68.95 61.23 -69.92 60.85 -70.86 60.38 -71.75 59.85","M-74.71 12.32 -74.44 12.88 -74.22 13.46 -74.04 14.06 -73.91 14.66 -73.83 15.28 -73.80 15.90 -73.82 16.52 -73.88 17.13 -73.99 17.74 -74.16 18.34 -74.36 18.93 -74.62 19.49 -74.91 20.04 -75.25 20.56 -75.63 21.05 -76.04 21.51 -76.49 21.94 -76.97 22.33 -77.49 22.68 -78.02 22.99 -78.58 23.26 -79.16 23.48 -79.76 23.66 -80.36 23.79 -80.98 23.87 -81.60 23.90 -82.22 23.88 -82.83 23.82 -83.44 23.71 -84.04 23.54 -84.63 23.34 -85.19 23.08 -85.74 22.79 -86.26 22.45 -86.75 22.07 -87.21 21.66 -87.64 21.21 -88.03 20.73 -88.38 20.21 -88.69 19.68","M-80.31 -21.74 -80.30 -21.44 -80.32 -21.15 -80.36 -20.85 -80.42 -20.56 -80.50 -20.27 -80.61 -19.99 -80.74 -19.73 -80.89 -19.47 -81.06 -19.22 -81.25 -18.99 -81.45 -18.77 -81.67 -18.57 -81.91 -18.39 -82.16 -18.23 -82.42 -18.09 -82.70 -17.97 -82.98 -17.87 -83.27 -17.79 -83.56 -17.74 -83.86 -17.71 -84.16 -17.70 -84.45 -17.72 -84.75 -17.76 -85.04 -17.82 -85.33 -17.90 -85.61 -18.01 -85.87 -18.14 -86.13 -18.29 -86.38 -18.46 -86.61 -18.65 -86.83 -18.85 -87.03 -19.07 -87.21 -19.31 -87.37 -19.56 -87.51 -19.82 -87.63 -20.10 -87.73 -20.38 -87.81 -20.67 -87.86 -20.96 -87.89 -21.26"],"head":[31.5,7.3],"stroke":"#a37cf0","ros":null},"tecnologia":{"d":"M40.9 -67.8 39.5 -68.2 38.8 -68.2 36.9 -69.0 36.2 -69.0 34.2 -69.8 33.6 -69.8 32.7 -70.1 31.7 -70.1 30.8 -70.5 29.4 -70.5 28.6 -70.9 27.5 -70.9 26.7 -71.3 23.8 -71.3 22.9 -71.6 19.2 -71.6 18.4 -72.0 14.0 -72.0 13.1 -71.6 8.3 -71.6 7.4 -71.3 5.3 -71.3 4.4 -70.9 3.0 -70.9 2.2 -70.5 1.1 -70.5 -1.2 -69.8 -2.3 -69.8 -4.2 -69.0 -4.9 -69.0 -7.4 -68.2 -10.4 -66.8 -11.8 -66.4 -12.4 -66.4 -13.8 -65.7 -14.6 -65.5 -20.6 -62.5 -21.3 -61.9 -24.4 -60.2 -27.8 -58.0 -28.8 -57.0 -29.3 -56.8 -32.3 -53.8 -32.5 -53.4 -33.5 -52.3 -34.8 -49.6 -35.3 -48.9 -35.8 -47.5 -35.9 -46.6 -37.6 -44.8 -39.1 -42.5 -40.6 -39.5 -41.1 -38.1 -41.1 -37.4 -41.5 -36.6 -41.5 -31.0 -41.1 -30.2 -41.1 -28.7 -40.0 -26.0 -40.0 -22.7 -39.6 -21.9 -39.6 -20.1 -39.2 -19.2 -38.8 -17.1 -38.4 -15.6 -37.8 -15.0 -37.3 -14.0 -36.7 -13.4 -36.5 -12.7 -35.5 -12.0 -35.3 -11.5 -34.2 -10.4 -33.7 -10.2 -31.2 -8.1 -29.2 -7.2 -27.9 -5.5 -26.3 -4.0 -25.2 -3.2 -21.7 -1.5 -20.3 -0.2 -19.5 0.2 -18.6 0.3 -17.7 0.7 -16.6 0.3 -15.2 0.3 -14.3 0.7 -11.0 0.7 -10.2 0.3 -8.4 0.3 -7.5 0.7 -0.8 0.7 0.0 0.3 0.3 -0.1 0.4 -1.8 1.9 -4.8 3.2 -6.6 4.5 -9.3 5.1 -10.0 5.7 -11.2 6.4 -12.3 8.1 -14.1 8.3 -15.4 10.7 -17.7 12.1 -18.2 12.9 -18.3 13.5 -18.9 17.1 -21.1 17.9 -21.3 20.8 -22.6 21.8 -22.7 23.2 -23.2 25.0 -24.1 27.5 -25.0 28.2 -25.0 29.0 -25.4 33.8 -25.4 34.7 -25.0 35.7 -25.0 37.1 -24.5 40.1 -23.2 48.5 -20.4 50.7 -19.2 51.8 -18.5 53.3 -17.2 53.7 -17.0 56.5 -13.5 58.2 -10.0 59.5 -8.2 60.8 -5.5 62.1 -3.7 63.2 -1.4 63.3 -0.5 64.1 1.5 64.1 3.3 64.5 4.1 64.5 8.6 64.9 9.4 64.9 14.2 64.5 15.1 64.5 19.5 64.1 20.4 64.1 22.5 63.7 23.4 63.7 24.8 63.3 25.6 63.3 26.7 63.0 27.5 63.0 28.6 62.6 29.4 62.6 30.1 62.2 30.9 61.8 33.1 60.2 37.9 59.7 38.9 58.7 41.7 57.8 43.5 57.6 44.3 54.2 50.7 53.6 51.4 53.1 52.6 50.8 56.0 49.9 57.0 48.5 59.0 46.8 60.8 46.7 61.3 43.8 64.2 43.6 64.7 41.3 67.0 40.8 67.2 37.9 70.0 37.4 70.2 34.1 73.1 27.3 77.6 23.1 79.7 21.7 80.6 20.8 80.8 18.3 82.1 17.4 82.3 16.4 82.9 9.3 85.2 8.7 85.2 6.3 86.0 5.3 86.0 2.9 86.7 1.5 86.7 0.7 87.1 -1.5 87.1 -2.4 87.5 -5.3 87.5 -6.1 87.9 -15.8 87.9 -16.7 87.5 -19.6 87.5 -20.5 87.1 -22.2 87.1 -23.1 86.7 -24.5 86.7 -25.4 86.3 -26.4 86.3 -27.2 86.0 -27.9 86.0 -28.7 85.6 -29.4 85.6 -30.3 85.2 -32.4 84.8 -37.2 83.2 -38.3 82.7 -41.0 81.7 -46.0 79.2 -48.3 78.2 -48.0 78.6 -46.9 79.1 -46.3 79.7 -38.4 83.9 -37.5 84.1 -35.7 85.0 -34.9 85.2 -32.0 86.5 -26.0 88.5 -25.4 88.5 -23.4 89.3 -22.7 89.3 -20.4 90.0 -19.3 90.0 -18.5 90.4 -17.4 90.4 -16.6 90.8 -15.6 90.8 -14.7 91.2 -12.9 91.2 -12.1 91.5 -9.9 91.5 -9.0 91.9 -5.0 91.9 -4.1 92.3 4.4 92.3 5.3 91.9 9.3 91.9 10.2 91.5 12.3 91.5 13.2 91.2 15.0 91.2 15.8 90.8 16.9 90.8 17.7 90.4 18.8 90.4 19.6 90.0 20.6 90.0 21.5 89.6 23.7 89.3 25.6 88.5 26.3 88.5 32.2 86.5 33.3 86.0 36.0 85.0 38.6 83.7 39.4 83.5 43.2 81.6 43.8 81.1 46.6 79.7 47.2 79.2 48.5 78.6 54.1 74.8 55.1 73.9 57.1 72.6 58.5 71.3 59.0 71.1 61.2 69.0 61.6 68.8 69.2 61.3 69.4 60.8 71.1 59.0 71.3 58.5 73.0 56.7 73.1 56.3 74.1 55.2 75.0 53.6 76.0 52.6 78.2 49.2 78.8 48.0 80.5 45.4 84.6 37.1 84.8 36.3 86.9 31.5 88.1 27.8 88.1 27.1 89.3 24.0 89.3 23.4 90.0 21.0 90.0 20.0 90.4 19.1 90.4 18.1 90.8 17.2 90.8 16.2 91.2 15.4 91.2 13.6 91.5 12.7 91.5 8.7 91.8 8.1 91.5 6.4 91.9 5.6 91.9 1.9 91.5 1.0 91.5 -3.4 91.2 -4.2 91.2 -6.4 90.8 -7.3 90.8 -9.8 90.4 -10.7 90.4 -11.7 90.0 -12.5 90.0 -13.2 89.6 -14.0 89.3 -16.2 88.5 -18.2 88.5 -18.9 87.7 -21.4 87.1 -22.4 85.8 -26.3 82.4 -33.1 81.8 -33.7 80.9 -35.7 77.9 -40.2 73.1 -46.3 66.5 -52.8 60.5 -57.6 56.0 -60.6 54.8 -61.2 54.1 -61.7 51.4 -63.1 50.0 -64.0 49.1 -64.2 45.8 -65.9 41.9 -67.2ZM-10.6 -40.4 -8.0 -40.4 -7.2 -40.1 -6.2 -40.0 -4.0 -38.8 -2.9 -37.9 -2.5 -37.7 -0.8 -35.7 -0.7 -34.9 -0.1 -33.8 0.0 -32.9 0.4 -32.0 0.4 -29.5 0.0 -28.7 -0.1 -27.7 -1.2 -25.5 -2.8 -23.8 -4.7 -22.3 -6.9 -21.5 -7.9 -21.5 -8.8 -21.1 -9.4 -21.1 -10.3 -21.5 -11.7 -21.5 -13.1 -22.0 -15.0 -23.1 -17.0 -25.1 -18.1 -27.0 -18.6 -28.4 -18.6 -29.4 -18.9 -30.3 -18.9 -31.3 -18.6 -32.1 -18.6 -33.2 -18.1 -34.6 -17.0 -36.5 -14.6 -38.8 -12.3 -40.0 -11.4 -40.1Z","arcs":["M59.42 -16.54 57.94 -16.50 56.47 -16.58 55.00 -16.77 53.56 -17.08 52.14 -17.50 50.77 -18.03 49.43 -18.67 48.16 -19.41 46.94 -20.24 45.79 -21.17 44.72 -22.19 43.74 -23.29 42.84 -24.46 42.04 -25.70 41.33 -27.00 40.73 -28.35 40.24 -29.74 39.86 -31.16 39.59 -32.62 39.44 -34.08 39.40 -35.56 39.48 -37.03 39.67 -38.50 39.98 -39.94 40.40 -41.36 40.93 -42.73 41.57 -44.07 42.31 -45.34 43.14 -46.56 44.07 -47.71 45.09 -48.78 46.19 -49.76 47.36 -50.66 48.60 -51.46 49.90 -52.17 51.25 -52.77 52.64 -53.26 54.06 -53.64 55.52 -53.91 56.98 -54.06","M61.87 3.52 61.22 2.35 60.67 1.14 60.21 -0.12 59.85 -1.41 59.60 -2.72 59.45 -4.04 59.40 -5.38 59.46 -6.71 59.62 -8.03 59.89 -9.34 60.26 -10.63 60.72 -11.88 61.29 -13.09 61.94 -14.25 62.69 -15.35 63.52 -16.40 64.43 -17.37 65.42 -18.28 66.47 -19.10 67.58 -19.83 68.75 -20.48 69.96 -21.03 71.22 -21.49 72.51 -21.85 73.82 -22.10 75.14 -22.25 76.48 -22.30 77.81 -22.24 79.13 -22.08 80.44 -21.81 81.73 -21.44 82.98 -20.98 84.19 -20.41 85.35 -19.76 86.45 -19.01 87.50 -18.18 88.47 -17.27 89.38 -16.28 90.20 -15.23 90.93 -14.12","M61.12 30.78 61.22 29.74 61.40 28.71 61.66 27.70 61.99 26.71 62.41 25.75 62.89 24.83 63.45 23.95 64.08 23.11 64.77 22.33 65.52 21.60 66.32 20.93 67.18 20.33 68.08 19.80 69.01 19.34 69.98 18.95 70.98 18.65 72.00 18.42 73.04 18.27 74.08 18.20 75.12 18.22 76.16 18.32 77.19 18.50 78.20 18.76 79.19 19.09 80.15 19.51 81.07 19.99 81.95 20.55 82.79 21.18 83.57 21.87 84.30 22.62 84.97 23.42 85.57 24.28 86.10 25.18 86.56 26.11 86.95 27.08 87.25 28.08 87.48 29.10 87.63 30.14 87.70 31.18 87.68 32.22","M48.01 58.59 48.36 58.08 48.75 57.60 49.18 57.15 49.64 56.73 50.13 56.35 50.65 56.02 51.20 55.72 51.76 55.47 52.35 55.26 52.95 55.10 53.56 54.98 54.17 54.92 54.79 54.90 55.41 54.93 56.03 55.01 56.64 55.14 57.23 55.32 57.81 55.54 58.37 55.80 58.91 56.11 59.42 56.46 59.90 56.85 60.35 57.28 60.77 57.74 61.15 58.23 61.48 58.75 61.78 59.30 62.03 59.86 62.24 60.45 62.40 61.05 62.52 61.66 62.58 62.27 62.60 62.89 62.57 63.51 62.49 64.13 62.36 64.74 62.18 65.33 61.96 65.91 61.70 66.47 61.39 67.01","M21.30 80.44 21.55 80.28 21.82 80.15 22.09 80.03 22.38 79.94 22.67 79.87 22.96 79.83 23.26 79.80 23.56 79.80 23.86 79.83 24.15 79.87 24.44 79.95 24.72 80.04 25.00 80.15 25.27 80.29 25.52 80.45 25.76 80.62 25.99 80.82 26.20 81.03 26.39 81.25 26.56 81.50 26.72 81.75 26.85 82.02 26.97 82.29 27.06 82.58 27.13 82.87 27.17 83.16 27.20 83.46 27.20 83.76 27.17 84.06 27.13 84.35 27.05 84.64 26.96 84.92 26.85 85.20 26.71 85.47 26.55 85.72 26.38 85.96 26.18 86.19 25.97 86.40 25.75 86.59 25.50 86.76"],"head":[-9.4,-30.9],"stroke":"#6fb1ee","ros":null},"materialidad":{"d":"M42.8 -81.7 39.8 -83.2 38.9 -83.4 36.4 -84.7 35.5 -84.9 32.6 -86.2 25.5 -88.6 24.9 -88.6 24.0 -89.0 23.4 -89.0 22.5 -89.4 21.9 -89.4 19.5 -90.1 18.5 -90.1 17.6 -90.5 16.6 -90.5 15.7 -90.9 14.3 -90.9 13.5 -91.2 11.3 -91.2 10.5 -91.6 7.5 -91.6 6.7 -92.0 -6.4 -92.0 -7.3 -91.6 -10.2 -91.6 -11.0 -91.2 -12.8 -91.2 -13.7 -90.9 -15.1 -90.9 -15.9 -90.5 -17.3 -90.5 -18.2 -90.1 -19.2 -90.1 -20.1 -89.7 -20.7 -89.7 -21.6 -89.4 -23.8 -89.0 -25.7 -88.2 -26.4 -88.2 -31.2 -86.6 -32.2 -86.1 -35.0 -85.1 -37.2 -84.0 -37.9 -83.4 -41.4 -81.7 -42.0 -81.2 -45.2 -79.5 -48.5 -77.2 -51.1 -75.1 -51.6 -74.9 -53.4 -73.2 -53.8 -73.1 -56.7 -70.1 -57.5 -69.5 -58.0 -69.3 -59.1 -68.2 -59.3 -67.7 -62.5 -64.4 -62.7 -63.9 -64.0 -62.5 -64.2 -62.0 -66.3 -59.5 -69.3 -55.0 -69.8 -53.7 -70.4 -53.1 -73.8 -46.3 -74.0 -45.4 -74.9 -43.6 -75.5 -41.7 -76.1 -40.6 -76.9 -38.1 -76.9 -37.4 -77.7 -35.4 -77.7 -34.8 -78.0 -33.9 -78.0 -33.3 -78.8 -30.9 -78.8 -29.5 -79.2 -28.7 -79.2 -27.2 -79.6 -26.4 -79.6 -24.2 -79.9 -23.4 -79.9 -19.3 -80.3 -18.5 -80.3 -12.9 -79.9 -12.1 -79.9 -8.0 -79.6 -7.2 -79.6 -5.0 -79.2 -4.1 -79.2 -2.7 -78.8 -1.9 -78.8 -0.8 -78.4 0.0 -78.4 1.0 -78.0 1.9 -78.0 2.5 -77.3 4.5 -77.3 5.2 -75.3 11.1 -74.8 12.2 -73.8 14.9 -70.8 20.9 -70.2 21.6 -69.3 23.6 -64.4 30.7 -63.1 32.1 -62.9 32.6 -60.4 35.2 -60.2 35.6 -56.5 39.5 -55.7 40.2 -55.2 40.3 -52.7 42.8 -52.2 43.0 -50.8 44.3 -47.7 46.4 -46.7 47.3 -45.4 47.9 -43.6 49.2 -41.7 50.1 -41.0 50.7 -35.0 53.7 -34.1 53.9 -33.1 54.5 -32.1 54.6 -31.3 55.0 -30.3 55.0 -29.4 55.3 -24.2 55.3 -22.0 54.6 -19.6 55.3 -14.4 55.3 -13.6 55.0 -12.5 55.0 -10.0 54.1 -8.5 53.4 -6.2 51.8 -3.2 49.2 -2.3 47.6 -1.8 47.1 -0.9 46.9 0.4 46.3 1.0 45.5 3.6 43.6 5.8 40.9 7.4 38.3 8.2 35.7 8.2 34.7 8.6 33.8 8.6 29.0 9.7 26.7 9.7 19.2 10.1 18.4 10.1 17.0 9.3 15.0 8.3 14.1 7.7 12.2 6.6 9.9 4.9 8.1 4.3 6.1 2.8 3.1 0.8 0.3 0.3 0.3 -0.5 0.8 -1.9 0.8 -2.7 1.1 -4.5 1.1 -5.4 0.8 -8.3 0.8 -9.4 1.1 -10.3 0.8 -14.7 0.8 -15.6 0.4 -16.2 0.4 -17.1 0.8 -18.1 0.8 -20.3 -0.1 -21.7 -1.4 -25.9 -3.5 -27.1 -4.2 -31.5 -8.2 -32.0 -8.4 -34.2 -10.2 -36.6 -12.6 -37.9 -15.0 -38.5 -15.6 -39.3 -18.2 -39.3 -18.9 -39.7 -19.7 -39.7 -21.1 -40.1 -22.0 -40.1 -23.4 -40.4 -24.2 -40.4 -25.3 -40.8 -26.1 -40.8 -27.9 -41.6 -30.3 -41.6 -32.0 -41.9 -32.9 -41.9 -34.3 -41.6 -35.2 -41.6 -36.6 -41.2 -37.4 -41.2 -38.1 -40.3 -40.6 -38.6 -43.2 -37.7 -45.2 -37.1 -45.8 -36.2 -47.8 -35.6 -48.5 -34.3 -51.2 -32.1 -54.2 -29.3 -56.9 -23.3 -61.1 -21.3 -62.0 -20.6 -62.6 -14.6 -65.6 -13.8 -65.8 -10.8 -67.1 -8.9 -67.7 -7.8 -68.2 -6.9 -68.3 -3.8 -69.5 -3.1 -69.5 -2.3 -69.8 -1.6 -69.8 0.8 -70.6 1.8 -70.6 2.6 -71.0 4.1 -71.0 4.9 -71.4 7.1 -71.4 7.9 -71.7 11.2 -71.7 12.1 -72.1 13.2 -71.9 14.0 -72.1 20.3 -72.1 21.1 -71.7 23.7 -71.7 24.5 -71.4 27.4 -71.4 28.3 -71.0 29.7 -71.0 30.5 -70.6 31.6 -70.6 32.4 -70.2 33.1 -70.2 33.9 -69.8 34.6 -69.8 35.4 -69.5 37.6 -69.1 38.6 -68.4 39.9 -68.3 41.3 -67.9 42.3 -67.3 44.3 -66.7 45.3 -66.2 46.2 -66.0 53.7 -62.2 54.4 -61.6 55.6 -61.1 57.9 -59.6 60.0 -57.9 61.3 -57.3 62.7 -56.0 63.2 -55.8 64.9 -54.4 68.0 -51.5 68.4 -51.3 71.5 -48.2 71.7 -47.7 74.2 -45.2 74.4 -44.7 77.2 -41.4 81.0 -35.7 81.9 -33.7 82.5 -33.1 85.9 -26.3 86.1 -25.5 87.4 -22.5 89.0 -17.7 89.0 -17.1 90.1 -13.6 90.1 -12.5 90.5 -11.7 90.5 -10.7 90.9 -9.8 90.9 -8.4 91.2 -7.5 91.2 -5.4 91.6 -4.5 91.6 -1.2 91.7 -0.9 92.2 -0.7 92.3 -5.7 91.9 -6.5 91.9 -9.8 91.5 -10.7 91.5 -12.8 91.2 -13.7 91.2 -15.1 90.8 -15.9 90.8 -17.3 90.4 -18.2 90.4 -18.9 90.0 -19.7 90.0 -20.7 89.6 -21.6 89.3 -23.8 88.5 -25.7 88.5 -26.4 86.9 -31.2 86.3 -32.2 85.8 -34.2 84.8 -36.0 84.6 -36.9 80.5 -45.2 79.9 -45.8 78.2 -48.9 75.2 -53.4 74.3 -54.5 74.1 -55.0 73.1 -56.0 71.8 -58.0 70.1 -59.8 69.9 -60.2 60.5 -69.7 60.0 -69.8 56.4 -73.1 53.3 -75.1 52.2 -76.1 50.0 -77.6 48.7 -78.1 48.1 -78.7 46.8 -79.3 46.2 -79.8 43.5 -81.2ZM-25.3 14.6 -24.6 14.6 -23.8 14.2 -20.1 14.2 -16.8 15.5 -13.7 18.6 -12.4 21.5 -12.4 25.5 -12.8 26.4 -12.9 27.3 -13.5 28.0 -14.0 29.2 -16.4 31.6 -17.5 32.3 -18.4 32.5 -19.7 33.2 -23.8 33.2 -25.2 32.7 -27.4 31.6 -29.1 30.0 -30.5 28.1 -31.4 25.5 -31.4 21.9 -30.5 19.3 -29.8 18.2 -27.1 15.5Z","arcs":["M-44.06 -43.23 -43.29 -41.97 -42.62 -40.66 -42.06 -39.29 -41.60 -37.89 -41.26 -36.45 -41.03 -35.00 -40.91 -33.52 -40.92 -32.05 -41.03 -30.58 -41.26 -29.12 -41.61 -27.68 -42.07 -26.28 -42.63 -24.92 -43.30 -23.60 -44.08 -22.34 -44.95 -21.15 -45.90 -20.03 -46.95 -18.98 -48.07 -18.03 -49.27 -17.16 -50.53 -16.39 -51.84 -15.72 -53.21 -15.16 -54.61 -14.70 -56.05 -14.36 -57.50 -14.13 -58.98 -14.01 -60.45 -14.02 -61.92 -14.13 -63.38 -14.36 -64.82 -14.71 -66.22 -15.17 -67.58 -15.73 -68.90 -16.40 -70.16 -17.18 -71.35 -18.05 -72.47 -19.00 -73.52 -20.05 -74.47 -21.17 -75.34 -22.37","M-27.83 -55.26 -28.52 -54.12 -29.30 -53.04 -30.16 -52.02 -31.10 -51.07 -32.11 -50.20 -33.19 -49.41 -34.32 -48.71 -35.51 -48.10 -36.74 -47.58 -38.01 -47.16 -39.30 -46.84 -40.62 -46.63 -41.95 -46.52 -43.29 -46.51 -44.62 -46.61 -45.94 -46.81 -47.24 -47.12 -48.51 -47.52 -49.74 -48.03 -50.94 -48.63 -52.08 -49.32 -53.16 -50.10 -54.18 -50.96 -55.13 -51.90 -56.00 -52.91 -56.79 -53.99 -57.49 -55.12 -58.10 -56.31 -58.62 -57.54 -59.04 -58.81 -59.36 -60.10 -59.57 -61.42 -59.68 -62.75 -59.69 -64.09 -59.59 -65.42 -59.39 -66.74 -59.08 -68.04 -58.68 -69.31 -58.17 -70.54 -57.57 -71.74","M-3.87 -68.35 -4.81 -67.91 -5.79 -67.55 -6.80 -67.27 -7.82 -67.06 -8.86 -66.94 -9.90 -66.90 -10.95 -66.94 -11.98 -67.06 -13.01 -67.27 -14.01 -67.55 -14.99 -67.91 -15.94 -68.35 -16.85 -68.86 -17.72 -69.44 -18.54 -70.09 -19.31 -70.80 -20.02 -71.57 -20.66 -72.39 -21.24 -73.25 -21.75 -74.17 -22.19 -75.11 -22.55 -76.09 -22.83 -77.10 -23.04 -78.12 -23.16 -79.16 -23.20 -80.20 -23.16 -81.25 -23.04 -82.28 -22.83 -83.31 -22.55 -84.31 -22.19 -85.29 -21.75 -86.24 -21.24 -87.15 -20.66 -88.02 -20.01 -88.84 -19.30 -89.61 -18.53 -90.32 -17.71 -90.96 -16.85 -91.54 -15.93 -92.05","M26.68 -70.81 26.06 -70.86 25.45 -70.95 24.85 -71.10 24.26 -71.29 23.68 -71.53 23.13 -71.81 22.60 -72.14 22.10 -72.50 21.63 -72.91 21.19 -73.35 20.79 -73.82 20.43 -74.32 20.10 -74.85 19.82 -75.40 19.58 -75.98 19.39 -76.57 19.25 -77.17 19.15 -77.78 19.11 -78.40 19.11 -79.02 19.16 -79.64 19.25 -80.25 19.40 -80.85 19.59 -81.44 19.83 -82.02 20.11 -82.57 20.44 -83.10 20.80 -83.60 21.21 -84.07 21.65 -84.51 22.12 -84.91 22.62 -85.27 23.15 -85.60 23.70 -85.88 24.28 -86.12 24.87 -86.31 25.47 -86.45 26.08 -86.55 26.70 -86.59 27.32 -86.59","M59.02 -58.69 58.76 -58.83 58.51 -59.00 58.27 -59.18 58.05 -59.38 57.84 -59.59 57.66 -59.82 57.49 -60.07 57.34 -60.33 57.21 -60.60 57.10 -60.88 57.02 -61.16 56.96 -61.45 56.92 -61.75 56.90 -62.05 56.91 -62.35 56.94 -62.64 56.99 -62.94 57.07 -63.23 57.17 -63.51 57.29 -63.78 57.43 -64.04 57.60 -64.29 57.78 -64.53 57.98 -64.75 58.19 -64.96 58.42 -65.14 58.67 -65.31 58.93 -65.46 59.20 -65.59 59.48 -65.70 59.76 -65.78 60.05 -65.84 60.35 -65.88 60.65 -65.90 60.95 -65.89 61.24 -65.86 61.54 -65.81 61.83 -65.73 62.11 -65.63 62.38 -65.51"],"head":[-22.1,23.6],"stroke":"#8fe784","ros":null}};
  var GK_ROSETAS = { contemplacion: ['#a989d5', '#cdb4f2'], tecnologia: ['#7caacc', '#a9d0ee'], materialidad: ['#8cc987', '#c3f2bb'] };
  function gkMezcla(hex, t, a) {
    var r = [1, 3, 5].map(function (i) { return parseInt(hex.substr(i, 2), 16); });
    return '#' + r.map(function (x) { var v = Math.round(x + (t - x) * a); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  // 9 gajos curvos que se juntan en un punto (sin centro). tonos: 3 tonos que se alternan.
  function gkGajos(Rr, rc, rr, tonos, linea, grosor) {
    var P = function (i) { var a = i * 40 * Math.PI / 180; return [Rr * Math.sin(a), -Rr * Math.cos(a)]; };
    var o = '';
    for (var i = 0; i < 9; i++) {
      var p0 = P(i), p1 = P(i + 1);
      o += '<path d="M0 0A' + rc + ' ' + rc + ' 0 0 1 ' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'A' + rr + ' ' + rr + ' 0 0 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + 'A' + rc + ' ' + rc + ' 0 0 0 0 0Z" style="fill:' + tonos[i % 3] + ';stroke:' + linea + ';stroke-width:' + grosor + '" stroke-linejoin="round"/>';
    }
    return o;
  }
  function gankyilSVG(opts) {
    opts = opts || {};
    var id = opts.id || 'gk' + Math.floor(Math.random() * 1e6);
    var defs = '', regiones = '';
    GK_BRAZOS.forEach(function (b) {
      var g = GK_DATA[b.id], ro = GK_ROSETAS[b.id];
      defs += '<clipPath id="' + id + '-' + b.id + '"><path d="' + g.d + '" clip-rule="evenodd"/></clipPath>';
      regiones += '<g class="gk-brazo" data-brazo="' + b.id + '"' + (opts.interactivo ? ' tabindex="0" role="button" aria-label="' + esc(b.nombre) + '"' : '') + '>' +
        '<path d="' + g.d + '" fill="' + b.color + '" fill-rule="evenodd"/>' +
        '<g clip-path="url(#' + id + '-' + b.id + ')" fill="none" stroke="' + g.stroke + '" stroke-width="1.4">' + g.arcs.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>' +
        '<g transform="translate(' + g.head[0] + ' ' + g.head[1] + ')"><g class="gk-ros">' + gkGajos(32, 35, 20, [gkMezcla(ro[0], 255, .10), ro[0], gkMezcla(ro[0], 0, .10)], ro[1], .9) + '</g></g>' +
        '</g>';
    });
    return '<svg class="gk-svg-el" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="' + (opts.interactivo ? 'false' : 'true') + '"><defs>' + defs + '</defs>' +
      '<g transform="translate(100 100)"><g class="gk-rota">' + regiones + '</g></g></svg>';
  }

  // la flor de la exposición: 9 gajos amarillos, sin centro
  function gkFlorSVG() {
    return '<svg class="gk-flor-el" viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g class="gk-ros">' + gkGajos(46, 50, 29, ['#f7d86f', '#f2c94c', '#e8b933'], '#fbf6ee', 1.3) + '</g></svg>';
  }
  function gkRuta() {
    var hilos = GK_BRAZOS.map(function (b, i) {
      var x = [30, 150, 270][i], fin = [[132, 74], [150, 66], [168, 74]][i];
      var d = i === 1 ? 'M150 0L150 76' : 'M' + x + ' 0C' + x + ' 46 ' + (i === 0 ? 118 : 182) + ' 40 ' + fin[0] + ' ' + fin[1];
      return '<path d="' + d + '" fill="none" stroke="' + b.color + '" stroke-width="4" stroke-linecap="round"/>';
    }).join('');
    return '<div class="gk-ruta"><svg class="gk-hilos" viewBox="0 0 300 80" aria-hidden="true">' + hilos + '</svg>' +
      '<div class="gk-flor">' + gkFlorSVG() + '</div>' +
      '<h3>' + esc(gkTexto('exposicion_titulo')) + '</h3><p>' + esc(gkTexto('exposicion_texto')) + '</p></div>';
  }

  // 6 clases base (puntos llenos) y 9 mentorías (aros) por tópico
  function gkPuntosFilas(color) {
    function fila(n, hueco) { var o = ''; for (var i = 0; i < n; i++) o += '<i' + (hueco ? ' class="m"' : '') + '></i>'; return o; }
    var nc = parseInt(gkTexto('clases'), 10) || 6, nm = parseInt(gkTexto('mentorias'), 10) || 9;
    return '<span class="gk-filas" style="--c:' + color + '">' +
      '<span class="gk-fila"><b>' + nc + ' clases base</b><span class="gk-pts">' + fila(nc, false) + '</span></span>' +
      '<span class="gk-fila"><b>' + nm + ' mentorías especializadas</b><span class="gk-pts">' + fila(nm, true) + '</span></span></span>';
  }

  function gankyilBloque(s) {
    if (s.gankyil === false) return '';
    var leyenda = GK_BRAZOS.map(function (b) {
      return '<li class="gk-item" data-brazo="' + b.id + '" tabindex="0"><i style="background:' + b.color + '"></i><span><strong>' + esc(b.nombre) + '</strong><small>' + esc(b.pilar) + ' · ' + esc(b.desc) + '</small>' + gkPuntosFilas(b.color) + '</span></li>';
    }).join('');
    return '<div class="gk-wrap" data-gk>' +
      '<div class="gk-svg">' + gankyilSVG({ interactivo: true }) + '</div>' +
      '<div class="gk-info"><p class="gk-lead">' + esc(gkTexto('lead')) + '</p>' +
      '<ul class="gk-leyenda">' + leyenda + '</ul>' +
      '<button type="button" class="gk-saber" data-gk-abrir>☸ ¿Qué es el gankyil?</button></div>' +
      '</div>' +
      '<div class="gk-tarjeta" hidden role="dialog" aria-label="El gankyil">' +
      '<div class="gk-tabs"><button type="button" class="gk-tab on" data-tab="steam">Lectura STEAM</button><button type="button" class="gk-tab" data-tab="dzogchen">Lectura Dzogchen</button><button type="button" class="gk-x" data-gk-cerrar aria-label="Cerrar">✕</button></div>' +
      '<p class="gk-txt" data-txt="steam">' + esc(gkTexto('steam')) + '</p>' +
      '<p class="gk-txt" data-txt="dzogchen" hidden>' + esc(gkTexto('dzogchen')) + '</p>' +
      '</div>' + gkRuta();
  }

  function gkResaltar(brazo) {
    var lista = document.querySelectorAll('.plan-item');
    var gk = GK_BRAZOS.filter(function (b) { return b.id === brazo; })[0];
    // ya no se atenúa ni se bloquea la lista de programas: solo se ilumina el pez elegido
    lista.forEach(function (it) { it.classList.remove('gk-atenuado'); it.classList.remove('gk-activo'); });
    document.querySelectorAll('.gk-wrap').forEach(function (w) { w.classList.toggle('gk-hay-sel', !!brazo); });
    document.querySelectorAll('.gk-wrap .gk-brazo').forEach(function (g) { g.classList.toggle('gk-sel', !!brazo && g.getAttribute('data-brazo') === brazo); });
    document.querySelectorAll('.gk-wrap .gk-item').forEach(function (g) { g.classList.toggle('gk-sel', !!brazo && g.getAttribute('data-brazo') === brazo); });
  }

  function marcarProgramas() {
    document.querySelectorAll('.plan-item').forEach(function (it) {
      if (it.getAttribute('data-gk-marcado')) return;
      it.setAttribute('data-gk-marcado', '1');
      var t = it.textContent, pts = '';
      GK_BRAZOS.forEach(function (b) { if (b.re.test(t)) pts += '<i style="background:' + b.color + '" title="' + esc(b.nombre) + '"></i>'; });
      if (pts) { var main = it.querySelector('.plan-item-main'); if (main) main.insertAdjacentHTML('afterbegin', '<span class="gk-puntos">' + pts + '</span>'); }
    });
  }

  function bindGankyil() {
    if (bindGankyil.hecho) return;
    bindGankyil.hecho = true;
    var fijo = null;
    function sel(el) { var b = el.closest && el.closest('[data-brazo]'); return b ? b.getAttribute('data-brazo') : null; }
    var conHover = !window.matchMedia || window.matchMedia('(hover:hover)').matches;
    document.addEventListener('mouseover', function (e) { if (!conHover) return; var b = e.target.closest && e.target.closest('.gk-wrap [data-brazo]'); if (b && !fijo) gkResaltar(sel(b)); });
    document.addEventListener('mouseout', function (e) { if (!conHover) return; var b = e.target.closest && e.target.closest('.gk-wrap [data-brazo]'); if (b && !fijo) gkResaltar(null); });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.closest) return;
      var b = t.closest('.gk-wrap [data-brazo]');
      if (b) { var v = sel(b); fijo = (fijo === v) ? null : v; gkResaltar(fijo); return; }
      if (t.closest('[data-gk-abrir]')) { var c = document.querySelector('.gk-tarjeta'); if (c) { c.hidden = !c.hidden; if (!c.hidden) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
      if (t.closest('[data-gk-cerrar]')) { var c2 = document.querySelector('.gk-tarjeta'); if (c2) c2.hidden = true; return; }
      var tab = t.closest('.gk-tab');
      if (tab) {
        var k = tab.getAttribute('data-tab');
        document.querySelectorAll('.gk-tab').forEach(function (x) { x.classList.toggle('on', x === tab); });
        document.querySelectorAll('.gk-txt').forEach(function (x) { x.hidden = x.getAttribute('data-txt') !== k; });
      }
    });
    document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.gk-wrap [data-brazo]')) { e.preventDefault(); e.target.click(); } });
    marcarProgramas();
  }

  function abrirGankyil() {
    var wrap = document.querySelector('.gk-wrap');
    if (!wrap) return false;
    var c = document.querySelector('.gk-tarjeta');
    wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (c) c.hidden = false;
    return true;
  }

  function renderListaPrecios(s, contacto) {
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' + gankyilBloque(s) +
      '<div class="plan-list">' + (s.items || []).map(function (it) {
        var img = it.imagen ? '<div class="plan-item-img"><img src="' + esc(it.imagen) + '" alt=""></div>' : '';
        var link, esExterno;
        if (it.slug) {
          link = 'programa.html?slug=' + encodeURIComponent(it.slug);
        } else if (it.link) {
          link = it.link;
          esExterno = true;
        } else {
          var mensaje = 'Hola, me interesa el programa "' + it.title + '"' + (it.price ? ' (' + it.price + ')' : '') + ', ¿me pueden dar más información?';
          link = 'https://wa.me/' + esc(contacto ? contacto.whatsapp : '') + '?text=' + encodeURIComponent(mensaje);
          esExterno = true;
        }
        var atributos = esExterno ? ' target="_blank" rel="noopener"' : '';
        var precioHTML = '<a class="price price-link" href="' + esc(link) + '"' + atributos + '>' + esc(it.price) + '</a>';
        return '<div class="plan-item">' + img +
          '<div class="plan-item-main">' + (ICONOS[it.icono] ? '<span class="plan-ico">' + iconoSVG(it.icono) + '</span>' : '') + '<span class="code">' + esc(it.code) + '</span><h3>' + esc(it.title) + '</h3><div class="meta">' + esc(it.meta) + '</div></div>' +
          precioHTML + '</div>';
      }).join('') + '</div></div></section>';
  }

  function productoCard(p, whatsapp) {
    var msg = encodeURIComponent('Hola, me interesa la pieza "' + p.name + '" (' + p.price + ')');
    var img = p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" style="width:100%;height:100%;object-fit:cover;">' : ('Foto: ' + esc(p.name));
    return '<a class="producto" href="https://wa.me/' + esc(whatsapp) + '?text=' + msg + '">' +
      '<div class="ph">' + img + '</div><div class="cat">' + esc(p.cat) + '</div><h3>' + esc(p.name) + '</h3><div class="price">' + esc(p.price) + '</div></a>';
  }

  function renderProductos(s, contacto, opts) {
    opts = opts || {};
    var items = s.items || [];
    var mostrar = opts.todos ? items : items.slice(0, 8);
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="productos">' + mostrar.map(function (p) { return productoCard(p, contacto ? contacto.whatsapp : ''); }).join('') + '</div>' +
      (!opts.todos ? verTodoLink(s.id, 'Ver toda la tienda') : '') +
      '</div></section>';
  }

  function galeriaFigure(g) {
    var inner = g.image ? ('<img src="' + esc(g.image) + '" alt="' + esc(g.caption) + '">') : ('<div class="ph">Foto: ' + esc(g.caption) + '</div>');
    return '<figure onclick="TratakRender.openLightbox(this)">' + inner + '<figcaption>' + esc(g.caption) + '</figcaption></figure>';
  }

  function renderGaleria(s, _contacto, opts) {
    opts = opts || {};
    var items = s.items || [];
    var mostrar = opts.todos ? items : items.slice(0, 6);
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="galeria-grid">' + mostrar.map(galeriaFigure).join('') + '</div>' +
      (!opts.todos ? verTodoLink(s.id, 'Ver galería completa') : '') +
      '</div></section>';
  }

  function renderMedia(s) {
    var ytId = youtubeIdFromUrl(s.video_url);
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="media-grid">' +
      '<div class="media-item"><div class="media-frame"><iframe src="https://www.youtube.com/embed/' + ytId + '" title="video" frameborder="0" allowfullscreen></iframe></div><p class="media-caption">' + esc(s.video_caption) + '</p></div>' +
      '<div class="media-item"><div class="media-frame"><iframe src="' + esc(s.p5_url) + '" title="p5" frameborder="0"></iframe></div><p class="media-caption">' + esc(s.p5_caption) + '</p></div>' +
      '</div></div></section>';
  }

  function blogCard(b) {
    var img = b.imagen ? '<img src="' + esc(b.imagen) + '" alt="' + esc(b.titulo) + '">' : ('<div class="ph">Foto: ' + esc(b.titulo) + '</div>');
    return '<a class="blog-card" href="' + esc(b.link || '#') + '">' +
      '<div class="blog-card-img">' + img + '</div>' +
      '<div class="blog-card-fecha">' + esc(b.fecha) + '</div>' +
      '<h3>' + esc(b.titulo) + '</h3><p>' + esc(b.resumen) + '</p></a>';
  }

  function renderBlog(s, _contacto, opts) {
    opts = opts || {};
    var items = s.items || [];
    var mostrar = opts.todos ? items : items.slice(0, 3);
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="blog-grid">' + mostrar.map(blogCard).join('') + '</div>' +
      (!opts.todos ? verTodoLink(s.id, 'Ver todo el blog') : '') +
      '</div></section>';
  }

  function personajeCard(p) {
    var img = p.imagen ? '<img src="' + esc(p.imagen) + '" alt="' + esc(p.nombre) + '">' : ('<div class="ph">Foto: ' + esc(p.nombre) + '</div>');
    return '<div class="personaje-card">' +
      '<div class="personaje-img">' + img + '</div>' +
      '<h3>' + esc(p.nombre) + '</h3><div class="personaje-rol">' + esc(p.rol) + '</div><p>' + esc(p.bio) + '</p></div>';
  }

  function renderPersonajes(s, _contacto, opts) {
    opts = opts || {};
    var items = s.items || [];
    var mostrar = opts.todos ? items : items.slice(0, 3);
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="personajes-grid">' + mostrar.map(personajeCard).join('') + '</div>' +
      (!opts.todos ? verTodoLink(s.id, 'Ver todos') : '') +
      '</div></section>';
  }

  function renderTextoDestacado(s) {
    var img = s.fondo === 'imagen' && s.imagen_fondo ? '' : ''; // el fondo ya se maneja con mediaFondoHTML
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido manifiesto"><p class="eyebrow">' + esc(s.eyebrow) + '</p><p>' + esc(s.texto) + '</p></div></section>';
  }

  function resumenEvento(ev) {
    if (ev.resumen) return ev.resumen;
    var t = String(ev.descripcion || '').trim().split(/\n\s*\n|\n/)[0];
    if (t.length > 220) t = t.slice(0, 217).replace(/\s+\S*$/, '') + '…';
    return t;
  }

  function renderEventoProximo(s, _contacto, opts) {
    var eventos = (opts && opts.eventosProximos) || [];
    var inner;
    if (eventos.length) {
      inner = eventos.map(function (landing) {
        var fechaLinea = [landing.fecha, landing.horario].filter(Boolean).join(' · ');
        var tituloPlano = landing.titulo_evento_html ? landing.titulo_evento_html.replace(/<[^>]+>/g, ' ') : '';
        var link = 'landing.html' + (landing.slug ? ('?evento=' + encodeURIComponent(landing.slug)) : '');
        var estiloTarjeta = '';
        var claseTarjeta = 'evento-item';
        if (landing.color_acento) estiloTarjeta += 'background:' + landing.color_acento + ';';
        estiloTarjeta += botonVars(landing);
        if (landing.foto_hero) claseTarjeta += ' evento-item-con-foto';

        var contenido =
          '<div class="evento-item-contenido">' +
          '<h2>' + esc(tituloPlano) + '</h2><p>' + esc(fechaLinea) + '</p>' +
          '<p class="evento-bloque-desc">' + esc(resumenEvento(landing)) + '</p>' +
          '<a class="btn primary" href="' + link + '">Ver detalles e inscribirme →</a>' +
          '</div>';

        if (landing.foto_hero) {
          return '<div class="' + claseTarjeta + '" style="' + botonVars(landing) + '">' +
            '<img class="evento-item-media" src="' + esc(landing.foto_hero) + '" alt="">' +
            '<div class="evento-item-overlay"></div>' + contenido + '</div>';
        }
        return '<div class="' + claseTarjeta + '" style="' + estiloTarjeta + '">' + contenido + '</div>';
      }).join('');
    } else {
      inner = '<div class="evento-item"><h2>Próximo evento</h2><p class="evento-bloque-desc" style="opacity:.6;">(Aquí se mostrarán automáticamente tus eventos marcados como "próximo" en la colección Eventos)</p></div>';
    }
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido evento-card-bloque"><p class="eyebrow">' + esc(s.eyebrow || 'Próximo evento') + '</p>' + inner + '</div></section>';
  }

  function descripcionCorta(txt) {
    txt = txt || '';
    if (txt.length <= 150) return '<p>' + esc(txt) + '</p>';
    return '<p class="desc-corta">' + esc(txt) + '</p><button type="button" class="desc-toggle" onclick="TratakRender.toggleDesc(this)">Leer más</button>';
  }
  function toggleDesc(btn) {
    var p = btn.previousElementSibling;
    var abierta = p.classList.toggle('abierta');
    btn.textContent = abierta ? 'Leer menos' : 'Leer más';
  }

  function eventoPasadoCard(ev, whatsapp) {
    var img = ev.foto ? '<img src="' + esc(ev.foto) + '" alt="' + esc(ev.titulo) + '">' : ('<div class="ph">Foto: ' + esc(ev.titulo) + '</div>');
    var mensaje = ev.mensaje_whatsapp || ('Hola, me interesa que se repita el taller "' + ev.titulo + '"');
    var link = 'https://wa.me/' + esc(whatsapp) + '?text=' + encodeURIComponent(mensaje);
    return (
      '<div class="evento-pasado-card">' +
      '<div class="evento-pasado-img">' + img + '</div>' +
      '<div class="evento-pasado-fecha">' + esc(ev.fecha) + '</div>' +
      '<h3>' + esc(ev.titulo) + '</h3>' + descripcionCorta(ev.descripcion) +
      '<a class="btn ghost evento-pasado-btn" href="' + link + '" target="_blank" rel="noopener">Solicitar que se repita →</a>' +
      '</div>'
    );
  }

  function renderEventosPasados(s, contacto, opts) {
    opts = opts || {};
    var items = s.items || [];
    var mostrar = opts.todos ? items : items.slice(0, 3);
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="eventos-pasados-grid">' + mostrar.map(function (ev) { return eventoPasadoCard(ev, contacto ? contacto.whatsapp : ''); }).join('') + '</div>' +
      (!opts.todos ? verTodoLink(s.id, 'Ver todos los eventos pasados') : '') +
      '</div></section>';
  }

  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var DIAS_SEMANA = ['D','L','M','M','J','V','S'];

  function parseFechaISO(str) {
    if (!str) return null;
    var partes = str.split('-');
    if (partes.length !== 3) return null;
    return new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
  }

  function renderMesCalendario(fechaMes, eventosPorDia) {
    var year = fechaMes.getFullYear();
    var month = fechaMes.getMonth();
    var primerDiaSemana = new Date(year, month, 1).getDay();
    var diasEnMes = new Date(year, month + 1, 0).getDate();

    var celdas = '';
    for (var i = 0; i < primerDiaSemana; i++) {
      celdas += '<div class="cal-dia cal-dia-vacio"></div>';
    }
    for (var d = 1; d <= diasEnMes; d++) {
      var key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var tieneEvento = eventosPorDia[key] && eventosPorDia[key].length;
      var titulo = tieneEvento ? eventosPorDia[key].map(function (e) { return e.titulo; }).join(', ') : '';
      var link = tieneEvento ? eventosPorDia[key][0].link : '#';
      if (tieneEvento) {
        celdas += '<a href="' + link + '" class="cal-dia cal-dia-evento" title="' + esc(titulo) + '">' + d + '<span class="cal-dot"></span></a>';
      } else {
        celdas += '<div class="cal-dia">' + d + '</div>';
      }
    }

    return (
      '<div class="cal-mes">' +
      '<div class="cal-mes-titulo">' + MESES[month] + ' ' + year + '</div>' +
      '<div class="cal-semana">' + DIAS_SEMANA.map(function (dd) { return '<div class="cal-dia-header">' + dd + '</div>'; }).join('') + '</div>' +
      '<div class="cal-dias">' + celdas + '</div>' +
      '</div>'
    );
  }

  function renderCalendario(s, _contacto, opts) {
    var eventos = (opts && opts.eventos) || [];
    var eventosPorDia = {};
    eventos.forEach(function (ev) {
      if (!ev.fecha_iso) return;
      if (!eventosPorDia[ev.fecha_iso]) eventosPorDia[ev.fecha_iso] = [];
      var tituloPlano = ev.titulo_evento_html ? ev.titulo_evento_html.replace(/<[^>]+>/g, ' ') : (ev.slug || 'Evento');
      eventosPorDia[ev.fecha_iso].push({
        titulo: tituloPlano,
        link: 'landing.html' + (ev.slug ? ('?evento=' + encodeURIComponent(ev.slug)) : '')
      });
    });

    var hoy = new Date();
    var mesesHTML = '';
    var numMeses = (s.num_meses && parseInt(s.num_meses, 10)) || 2;
    for (var m = 0; m < numMeses; m++) {
      var fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() + m, 1);
      mesesHTML += renderMesCalendario(fechaMes, eventosPorDia);
    }

    var eventosFuturos = eventos
      .filter(function (ev) { return ev.fecha_iso && parseFechaISO(ev.fecha_iso) >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); })
      .sort(function (a, b) { return a.fecha_iso < b.fecha_iso ? -1 : 1; });

    var listaHTML = eventosFuturos.map(function (ev) {
      var tituloPlano = ev.titulo_evento_html ? ev.titulo_evento_html.replace(/<[^>]+>/g, ' ') : (ev.slug || 'Evento');
      var link = 'landing.html' + (ev.slug ? ('?evento=' + encodeURIComponent(ev.slug)) : '');
      return '<a class="cal-lista-item" href="' + link + '"><span class="cal-lista-fecha">' + esc(ev.fecha) + '</span><span>' + esc(tituloPlano) + '</span></a>';
    }).join('');

    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="cal-meses-grid">' + mesesHTML + '</div>' +
      (listaHTML ? '<div class="cal-lista">' + listaHTML + '</div>' : '') +
      '</div></section>';
  }

  function renderCarrusel(s) {
    var items = (s.items || []).filter(function (it) { return it && it.imagen; });
    var slides = items.map(function (it) {
      var cap = it.pie ? '<figcaption>' + esc(it.pie) + '</figcaption>' : '';
      return '<figure class="carrusel-slide"><img src="' + esc(it.imagen) + '" alt="' + esc(it.pie || '') + '">' + cap + '</figure>';
    }).join('');
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      (s.texto ? '<p class="carrusel-texto">' + esc(s.texto) + '</p>' : '') +
      '<div class="carrusel-wrap" data-auto="' + (items.length >= 2 ? '1' : '0') + '">' +
      '<button class="carrusel-btn carrusel-prev" onclick="TratakRender.carruselMover(this,-1)" aria-label="Anterior">‹</button>' +
      '<div class="carrusel-track">' + slides + '</div>' +
      '<button class="carrusel-btn carrusel-next" onclick="TratakRender.carruselMover(this,1)" aria-label="Siguiente">›</button>' +
      '</div></div></section>';
  }

  function carruselMover(btn, dir) {
    var wrap = btn.closest('.carrusel-wrap');
    var track = wrap.querySelector('.carrusel-track');
    track.scrollBy({ left: Math.max(260, track.clientWidth * 0.6) * dir, behavior: 'smooth' });
  }

  // Movimiento automático continuo. Con 2 o más fotos repite la tira las veces
  // necesarias para que nunca se vea un hueco. Se pausa al tocar/pasar el mouse.
  function initCarruseles() {
    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Array.prototype.forEach.call(document.querySelectorAll('.carrusel-wrap[data-auto="1"]'), function (wrap) {
      if (wrap.getAttribute('data-init')) return;
      wrap.setAttribute('data-init', '1');
      if (reducir) return;
      var track = wrap.querySelector('.carrusel-track');
      var originales = Array.prototype.slice.call(track.children);
      var copias = 0, L = 0;
      var pos = 0, last = null, pausa = false, reanudar = null, visible = true, VEL = 38;

      function medir() {
        var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 18;
        var ult = originales[originales.length - 1];
        L = ult.offsetLeft + ult.offsetWidth + gap - originales[0].offsetLeft;
        return L > 40;
      }
      function asegurar() {
        if (!medir()) return;
        while (copias < 10 && track.scrollWidth < track.clientWidth + L + 4) {
          originales.forEach(function (f) {
            var c = f.cloneNode(true);
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
          });
          copias++;
          medir();
        }
      }
      asegurar();
      Array.prototype.forEach.call(track.querySelectorAll('img'), function (im) {
        if (!im.complete) im.addEventListener('load', asegurar);
      });
      window.addEventListener('resize', asegurar);

      function pausar(ms) {
        pausa = true;
        clearTimeout(reanudar);
        if (ms) reanudar = setTimeout(function () { pausa = false; pos = track.scrollLeft; }, ms);
      }
      wrap.addEventListener('mouseenter', function () { pausar(0); });
      wrap.addEventListener('mouseleave', function () { clearTimeout(reanudar); pausa = false; pos = track.scrollLeft; });
      wrap.addEventListener('touchstart', function () { pausar(0); }, { passive: true });
      wrap.addEventListener('touchend', function () { pausar(2500); }, { passive: true });
      wrap.addEventListener('focusin', function () { pausar(0); });
      wrap.addEventListener('focusout', function () { pausar(1500); });
      wrap.addEventListener('wheel', function () { pausar(2500); }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(wrap);
      }

      function paso(t) {
        if (last === null) last = t;
        var dt = Math.min(t - last, 100) / 1000;
        last = t;
        if (!pausa && visible && !document.hidden && L > 40) {
          if (Math.abs(track.scrollLeft - pos) > 3) pos = track.scrollLeft;
          pos += VEL * dt;
          if (pos >= L) pos -= L;
          track.scrollLeft = pos;
        }
        requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    });
  }

  var RENDERERS = {
    estadisticas: renderEstadisticas,
    pilares: renderPilares,
    destacado: renderDestacado,
    lista_precios: renderListaPrecios,
    productos: renderProductos,
    galeria: renderGaleria,
    media: renderMedia,
    blog: renderBlog,
    personajes: renderPersonajes,
    texto_destacado: renderTextoDestacado,
    carrusel: renderCarrusel,
    evento_proximo: renderEventoProximo,
    eventos_pasados: renderEventosPasados,
    calendario: renderCalendario
  };

  // Tipos de bloque que soportan "página dedicada" (listado completo)
  var TIPOS_CON_PAGINA_DEDICADA = { galeria: true, blog: true, personajes: true, productos: true, eventos_pasados: true };

  function renderSecciones(secciones, contacto, opts) {
    opts = opts || {};
    return (secciones || []).map(function (s) {
      var fn = RENDERERS[s.type];
      if (!fn) return '';
      var out = fn(s, contacto, opts);
      if (s.icono && ICONOS[s.icono]) {
        var ic = '<div class="sec-icono">' + iconoSVG(s.icono) + '</div>';
        out = out.indexOf('<p class="eyebrow">') !== -1 ? out.replace('<p class="eyebrow">', ic + '<p class="eyebrow">') : out.replace('<h2', ic + '<h2');
      }
      return out;
    }).join('');
  }

  // ---------- evento destacado (home) ----------
  function renderEventoDestacado(landing) {
    if (!landing) return '';
    var fechaLinea = [landing.fecha, landing.horario].filter(Boolean).join(' · ');
    return (
      '<section class="wrap evento-destacado" id="evento-destacado"><p class="eyebrow">Próximo evento</p>' +
      '<div class="evento-card"><div>' +
      '<h2>' + esc(landing.titulo_evento_html ? landing.titulo_evento_html.replace(/<[^>]+>/g, ' ') : '') + '</h2>' +
      '<p>' + fechaLinea + '</p>' +
      '<p id="evento-desc">' + esc(landing.descripcion) + '</p>' +
      '<a class="btn primary" href="landing.html">Ver detalles e inscribirme →</a>' +
      '</div></div></section>'
    );
  }

  // ---------- contacto ----------
  function renderContacto(contacto) {
    if (!contacto) return '';
    var style = '';
    if (contacto.color_fondo) style += 'background:' + contacto.color_fondo + ';';
    if (contacto.color_acento) style += '--clay:' + contacto.color_acento + ';';
    style += botonVars(contacto);
    return (
      '<section class="wrap" id="contacto" style="' + style + '"><div class="contacto-grid"><div>' +
      (ICONOS[contacto.icono] ? '<div class="sec-icono">' + iconoSVG(contacto.icono) + '</div>' : '') + '<p class="eyebrow">Contacto</p><h2>' + esc(contacto.titulo) + '</h2><p>' + esc(contacto.texto) + '</p>' +
      '<div class="info-list">' +
      '<div><div class="k">WhatsApp</div><div class="v"><a href="https://wa.me/' + esc(contacto.whatsapp) + '">' + esc(contacto.whatsapp_display) + '</a></div></div>' +
      '<div><div class="k">Ubicación</div><div class="v">' + esc(contacto.ubicacion) + '</div></div>' +
      '<div><div class="k">Correo</div><div class="v"><a href="mailto:' + esc(contacto.email) + '">' + esc(contacto.email) + '</a></div></div>' +
      '<div><div class="k">Horario</div><div class="v">' + esc(contacto.horario) + '</div></div>' +
      '</div></div>' +
      '<form class="form-contacto" data-destino="' + esc(contacto.formulario_url || ('https://formsubmit.co/ajax/' + (contacto.email || ''))) + '" data-email="' + esc(contacto.email) + '" onsubmit="return TratakRender.enviarContacto(event)">' +
      '<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">' +
      '<div><label>Nombre *</label><input type="text" name="nombre" required></div>' +
      '<div><label>Correo electrónico *</label><input type="email" name="correo" required></div>' +
      '<div><label>Teléfono</label><input type="tel" name="telefono"></div>' +
      '<div><label>Comentario</label><textarea name="comentario"></textarea></div>' +
      '<button class="btn primary" type="submit">Enviar</button>' +
      '<p class="form-estado" role="status" aria-live="polite"></p>' +
      '</form></div></section>'
    );
  }

  function enviarContacto(ev) {
    ev.preventDefault();
    var f = ev.target;
    var estado = f.querySelector('.form-estado');
    var btn = f.querySelector('button[type=submit]');
    var d = new FormData(f);
    d.append('_subject', 'Nuevo mensaje desde tratakcat.com');
    d.append('_template', 'table');
    d.append('_captcha', 'false');
    var correo = d.get('correo');
    if (correo) d.append('_replyto', correo);
    estado.className = 'form-estado';
    estado.textContent = 'Enviando…';
    btn.disabled = true;
    fetch(f.getAttribute('data-destino'), { method: 'POST', body: d, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === 'false' || j.success === false) throw new Error(j.message || 'error'); }); })
      .then(function () {
        f.reset();
        estado.className = 'form-estado ok';
        estado.textContent = '¡Gracias! Recibimos tu mensaje y te responderemos pronto.';
      })
      .catch(function () {
        var mail = f.getAttribute('data-email');
        estado.className = 'form-estado error';
        estado.innerHTML = 'No pudimos enviarlo. Escríbenos directo a <a href="mailto:' + mail + '">' + mail + '</a> o por WhatsApp.';
      })
      .then(function () { btn.disabled = false; });
    return false;
  }

  function renderFooter() {
    return (
      '<footer class="wrap"><div class="foot-grid">' +
      '<div><span class="brand">tratak·cat</span></div>' +
      '<div><h4>Programas</h4><ul><li><a href="index.html#plan">Biomateria</a></li><li><a href="index.html#plan">Cerámica</a></li></ul></div>' +
      '<div><h4>Comunidad</h4><ul><li><a href="index.html#galeria">Galería</a></li><li><a href="index.html#tienda">Tienda</a></li></ul></div>' +
      '<div><h4>Tratak</h4><ul><li><a href="index.html#pilares">Pilares</a></li><li><a href="index.html#taller">Taller</a></li><li><a href="index.html#contacto">Contacto</a></li></ul></div>' +
      '</div><div class="foot-bottom"><span>© 2026 Tratak · CAT. Todos los derechos reservados.</span><span>Guadalajara, Jalisco, México</span></div></footer>'
    );
  }

  function renderLightbox() {
    return (
      '<div class="lightbox" id="lightbox" onclick="TratakRender.closeLightbox()">' +
      '<span class="lightbox-close">✕</span>' +
      '<div class="lightbox-inner"><img id="lightbox-img" src="" alt=""><p id="lightbox-caption"></p></div>' +
      '</div>'
    );
  }

  function renderFloatingButtons(contacto) {
    return (
      '<a href="https://wa.me/' + esc(contacto ? contacto.whatsapp : '') + '" id="whatsapp-flotante" class="whatsapp-flotante" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M17.6 6.32A8.86 8.86 0 0 0 12.02 4a8.94 8.94 0 0 0-7.75 13.4L3 21l3.72-1.24a8.9 8.9 0 0 0 4.28 1.1h.01c4.94 0 8.96-4.02 8.96-8.96a8.9 8.9 0 0 0-2.37-6.28ZM12.02 19.2h-.01a7.4 7.4 0 0 1-3.77-1.03l-.27-.16-2.8.93.94-2.73-.18-.28a7.42 7.42 0 0 1-1.14-3.96 7.46 7.46 0 0 1 12.72-5.29 7.4 7.4 0 0 1 2.18 5.29c0 4.12-3.35 7.47-7.47 7.47Zm4.08-5.6c-.22-.11-1.32-.65-1.53-.72-.2-.08-.35-.11-.5.11-.15.22-.58.72-.71.87-.13.15-.26.16-.48.05a6.06 6.06 0 0 1-3-2.63c-.23-.39.23-.36.65-1.2.07-.15.04-.28-.02-.4-.05-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43c-.15 0-.4.05-.6.28-.2.22-.8.78-.8 1.9s.82 2.2.94 2.36c.11.15 1.6 2.44 3.87 3.42.54.23.96.37 1.29.48.54.17 1.03.15 1.42.09.43-.07 1.32-.54 1.5-1.06.19-.52.19-.96.13-1.06-.05-.1-.2-.16-.42-.27Z"/></svg>' +
      '</a>' +
      '<button id="modo-noche-toggle" class="modo-noche-toggle" aria-label="Cambiar a modo noche" title="Modo noche">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>' +
      '</button>'
    );
  }

  // ---------- página completa del sitio ----------
  function renderFullPage(content, eventosProximos, todosLosEventos) {
    SHISHI_CFG = (content && content.shishi) || {};
    var html = '';
    html += themeStyleTag(content.theme);
    html += renderNav(content.theme);
    html += renderHero(content.hero);
    html += '<div id="main-sections">' + renderSecciones(content.secciones, content.contacto, { eventosProximos: eventosProximos || [], eventos: todosLosEventos || [] }) + '</div>';
    html += renderContacto(content.contacto);
    html += renderFooter();
    html += renderLightbox();
    html += renderFloatingButtons(content.contacto);
    return html;
  }

  // ---------- interacciones (lightbox, modo noche) ----------
  function openLightbox(figureEl) {
    var img = figureEl.querySelector('img');
    var caption = figureEl.querySelector('figcaption') ? figureEl.querySelector('figcaption').textContent : '';
    if (!img) return;
    document.getElementById('lightbox-img').src = img.src;
    document.getElementById('lightbox-img').alt = img.alt;
    document.getElementById('lightbox-caption').textContent = caption;
    document.getElementById('lightbox').classList.add('open');
  }
  function closeLightbox() {
    var el = document.getElementById('lightbox');
    if (el) el.classList.remove('open');
  }
  function aplicarLogosOscuros(activar) {
    var logos = document.querySelectorAll('.logo-tema');
    logos.forEach(function (img) {
      if (!img.dataset.logoClaro) img.dataset.logoClaro = img.src;
      var oscuro = img.getAttribute('data-logo-oscuro');
      if (activar && oscuro) {
        img.src = oscuro;
      } else {
        img.src = img.dataset.logoClaro;
      }
    });
  }

  var TIPO_POR_ANCLA = { pilares: 'pilares', taller: 'destacado', plan: 'lista_precios', tienda: 'productos', galeria: 'galeria', multimedia: 'media' };

  function buscarAncla(ancla) {
    if (!ancla) return null;
    var el = document.getElementById(ancla);
    if (!el && TIPO_POR_ANCLA[ancla]) el = document.querySelector('[data-tipo="' + TIPO_POR_ANCLA[ancla] + '"]');
    return el;
  }

  function bindAnclas() {
    if (bindAnclas.hecho) return;
    bindAnclas.hecho = true;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-ancla]');
      if (!a) return;
      var el = buscarAncla(a.getAttribute('data-ancla'));
      if (!el) return; // otra página: navega normal
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#' + a.getAttribute('data-ancla'));
    });
    var h = (location.hash || '').replace('#', '');
    if (h && !document.getElementById(h)) {
      var el = buscarAncla(h);
      if (el) setTimeout(function () { el.scrollIntoView({ block: 'start' }); }, 50);
    }
  }

  function bindGlobalInteractions(theme) {
    bindAnclas();
    bindMenu();
    bindGankyil();
    initCarruseles();
    var toggle = document.getElementById('modo-noche-toggle');
    if (!toggle) return;

    function aplicarColoresOscuros(activar) {
      var root = document.documentElement.style;
      if (activar && theme) {
        if (theme.color_paper_oscuro) root.setProperty('--paper', theme.color_paper_oscuro);
        if (theme.color_ink_oscuro) root.setProperty('--ink', theme.color_ink_oscuro);
        if (theme.color_dust_oscuro) root.setProperty('--dust', theme.color_dust_oscuro);
      } else if (!activar && theme) {
        // Regresa a los colores normales del tema (modo día)
        applyTheme(theme, root);
      }
      aplicarLogosOscuros(activar);
    }

    var saved = localStorage.getItem('tratak-modo-noche');
    if (saved === '1') {
      document.body.classList.add('modo-noche');
      aplicarColoresOscuros(true);
    }
    toggle.addEventListener('click', function () {
      var activo = document.body.classList.toggle('modo-noche');
      localStorage.setItem('tratak-modo-noche', activo ? '1' : '0');
      aplicarColoresOscuros(activo);
    });
  }

  global.TratakRender = {
    FONT_PAIRS: FONT_PAIRS,
    fetchConTiempoLimite: fetchConTiempoLimite,
    applyTheme: applyTheme,
    themeStyleTag: themeStyleTag,
    fetchEventosDesdeGitHub: fetchEventosDesdeGitHub,
    renderNav: renderNav,
    renderHero: renderHero,
    renderSecciones: renderSecciones,
    renderEventoDestacado: renderEventoDestacado,
    renderContacto: renderContacto,
    renderMenu: renderMenu,
    botonVars: botonVars,
    gankyilSVG: gankyilSVG,
    gkFlorSVG: gkFlorSVG,
    abrirGankyil: abrirGankyil,
    seccionesDeLaPagina: seccionesDeLaPagina,
    irA: irA,
    buscarAncla: buscarAncla,
    GK_BRAZOS: GK_BRAZOS,
    gkTexto: gkTexto,
    setShishiCfg: function (c) { SHISHI_CFG = c || {}; },
    bindMenu: bindMenu,
    toggleDesc: toggleDesc,
    iconoSVG: iconoSVG,
    enviarContacto: enviarContacto,
    renderFooter: renderFooter,
    renderLightbox: renderLightbox,
    renderFloatingButtons: renderFloatingButtons,
    renderFullPage: renderFullPage,
    RENDERERS: RENDERERS,
    TIPOS_CON_PAGINA_DEDICADA: TIPOS_CON_PAGINA_DEDICADA,
    youtubeIdFromUrl: youtubeIdFromUrl,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    carruselMover: carruselMover,
    initCarruseles: initCarruseles,
    bindGlobalInteractions: bindGlobalInteractions
  };

})(window);
