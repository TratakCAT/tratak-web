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
    '.nav-gk{display:inline-block;width:15px;height:15px;margin-right:6px;vertical-align:-2px;color:var(--clay,#a3552b)}.nav-gk svg{width:100%;height:100%;display:block}a:hover .nav-gk svg,.menu-item:hover .nav-gk svg{animation:gkGiro 2s linear infinite}@keyframes gkGiro{to{transform:rotate(360deg)}}' +
    '.menu-logos{display:flex;align-items:center;gap:10px;min-width:0}.menu-logos img{height:28px;width:auto;max-width:42vw}' +
    '.menu-item .mi-ico{width:22px;height:22px;flex:none;color:var(--clay,#a3552b)}.menu-item .mi-ico svg{width:100%;height:100%;display:block}' +
    '.menu-buscar-wrap{position:relative}.menu-buscar-wrap .mi-ico{position:absolute;left:14px;top:50%;width:20px;height:20px;transform:translateY(-50%);opacity:.6;pointer-events:none}.menu-buscar-wrap .menu-buscar{padding-left:42px}' +
    'nav .bar{gap:10px}nav .bar ul{margin-left:auto;margin-right:14px}' +
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

  function wrapAbre(s) {
    var style = '';
    var hayMedia = (s.fondo === 'imagen' && s.imagen_fondo) || (s.fondo === 'video' && s.video_fondo);
    var usaColor = !!(s.color_fondo && !hayMedia);
    if (usaColor) style += 'background:' + s.color_fondo + ';';
    if (s.color_acento) style += '--clay:' + s.color_acento + ';';
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
    { id: 'contemplacion', color: '#b58cf2', claro: '#d3b8fa', nombre: 'Diseño en Realidad Virtual', pilar: 'Contemplación', desc: 'percepción · mente', re: /\bVR\b|realidad virtual/i },
    { id: 'tecnologia', color: '#6fb8f5', claro: '#a9d5fb', nombre: 'Impresión 3D LDM', pilar: 'Tecnología', desc: 'técnica · palabra', re: /\bLDM\b|impresi[oó]n 3d/i },
    { id: 'materialidad', color: '#82dba9', claro: '#b3ecce', nombre: 'Cultura Biomaterial', pilar: 'Materialidad', desc: 'materia · cuerpo', re: /biomaterial/i }
  ];
  var GK_TEXTOS = {
    lead: 'Shishi guarda entre sus garras el gankyil, la triple espiral que gira sin un centro fijo. Cada espiral es un tópico del plan; juntas forman el recorrido completo.',
    steam: 'Ciencia, tecnología, ingeniería, arte y matemáticas no se estudian por separado: se entrelazan en tres tópicos que giran juntos. Cultura Biomaterial (verde) trabaja la materia: ciencia, ingeniería y los ciclos de los residuos. Impresión 3D LDM (azul) es la técnica: tecnología, matemáticas y fabricación digital. Diseño en Realidad Virtual (morado) es la percepción: arte, forma y atención. Cada tópico se puede tomar solo; los programas P.E.S. recorren los tres, y la Asesoría Catalizadora es el punto desde el que arranca el giro.',
    dzogchen: 'El gankyil (tibetano: dga’ ’khyil, «giro del gozo») es una espiral triple que gira sin centro fijo y sin oposición entre sus partes. En la tradición Dzogchen se lee como tres cualidades de una sola base —esencia, naturaleza y energía— y también como base, camino y fruto. Aquí cada espiral es un pilar: Materialidad (cuerpo), Tecnología (palabra, energía) y Contemplación (mente). Ninguno gobierna a los otros: se sostienen girando. Tratak, mirar con atención sostenida, es la práctica que los une.'
  };
  function gkTexto(k) { return (SHISHI_CFG && SHISHI_CFG[k]) || GK_TEXTOS[k]; }

  var GK_PATHS = {
    contemplacion: "M-17.9 -85.9 -19.4 -84.9 -21.0 -84.7 -22.6 -83.8 -24.5 -83.4 -27.8 -81.4 -29.5 -80.9 -32.0 -79.2 -33.3 -78.7 -34.1 -77.8 -36.9 -76.4 -37.8 -75.6 -42.5 -72.9 -44.2 -71.0 -46.1 -69.7 -47.1 -68.6 -48.1 -68.1 -49.9 -66.1 -51.9 -64.6 -53.0 -62.9 -55.7 -59.9 -57.4 -57.2 -58.8 -55.6 -62.4 -50.4 -62.7 -49.1 -63.7 -47.7 -66.1 -42.0 -67.6 -37.2 -68.6 -34.8 -68.7 -33.7 -69.4 -31.6 -69.8 -29.3 -70.5 -27.3 -70.8 -24.1 -71.4 -22.2 -71.4 -21.0 -71.9 -18.9 -71.9 -13.5 -71.0 -9.2 -70.7 -4.1 -69.8 -3.0 -68.4 2.0 -67.6 3.8 -67.0 5.8 -64.7 10.1 -63.8 11.2 -63.4 12.3 -62.4 13.3 -61.1 15.8 -53.7 24.2 -52.5 24.7 -48.3 27.9 -47.1 28.1 -45.8 29.0 -44.8 29.2 -43.7 30.1 -41.0 30.4 -39.1 31.3 -37.0 31.5 -28.5 31.5 -27.8 31.3 -25.4 31.3 -24.2 31.0 -23.2 30.3 -21.9 30.0 -21.0 29.3 -19.5 29.0 -18.2 28.1 -17.1 27.9 -15.8 26.8 -14.4 26.4 -12.8 24.7 -11.7 24.2 -10.9 23.3 -9.7 22.6 -6.1 18.0 -5.0 17.0 -4.6 15.6 -3.9 14.8 -3.4 13.5 -2.5 12.1 -0.4 6.1 -0.1 2.9 -0.2 -1.0 -3.6 -3.3 -7.4 -6.9 -9.4 -9.3 -12.5 -13.8 -12.9 -15.8 -14.4 -18.9 -14.6 -20.8 -15.6 -24.1 -15.6 -26.9 -15.8 -27.6 -15.6 -33.5 -13.9 -40.5 -12.5 -42.6 -12.1 -43.9 -10.6 -46.3 -8.6 -49.1 -5.9 -52.3 -0.9 -56.1 5.4 -59.5 7.7 -60.0 9.0 -60.0 10.5 -60.7 11.7 -60.7 13.8 -61.1 15.7 -61.1 17.9 -61.8 25.4 -61.9 29.3 -61.1 31.6 -61.1 34.2 -60.7 35.6 -60.2 38.4 -59.6 39.8 -58.8 42.5 -58.2 46.8 -56.2 47.8 -55.4 50.4 -54.1 56.0 -49.5 56.9 -49.0 59.3 -47.0 65.5 -40.7 66.1 -39.6 69.0 -36.3 69.9 -34.6 71.3 -33.3 75.2 -26.6 78.7 -19.1 79.1 -17.4 79.7 -16.1 80.3 -13.9 81.2 -11.7 81.2 -10.5 82.2 -7.5 83.4 0.1 83.4 3.8 83.6 4.5 83.4 6.3 83.4 17.9 82.9 19.6 82.0 26.5 79.7 35.5 79.1 36.7 78.8 37.8 76.4 43.3 76.2 44.3 75.4 45.4 73.8 49.0 72.8 50.3 71.9 52.3 68.8 56.8 65.1 61.6 56.9 70.3 54.5 72.5 49.4 76.5 48.7 76.9 44.5 79.9 43.3 80.4 41.0 82.0 39.4 82.7 38.5 83.6 39.8 83.4 45.2 80.7 54.0 75.2 55.1 74.1 60.2 70.3 64.2 66.3 65.5 65.5 67.5 63.0 70.3 60.2 71.0 59.0 73.9 55.7 76.3 52.3 77.2 50.6 78.1 49.6 81.9 42.9 85.7 34.8 86.2 32.8 87.5 30.0 88.0 27.5 89.2 24.1 89.8 20.9 91.0 16.6 91.1 14.7 91.4 13.9 91.4 11.5 91.9 10.0 91.9 6.2 92.3 4.6 92.3 -4.8 91.9 -6.3 91.9 -9.6 91.4 -11.2 91.4 -14.0 91.1 -14.8 91.0 -16.3 90.7 -17.0 90.6 -18.5 89.8 -21.0 89.2 -24.2 87.6 -29.0 87.4 -30.3 84.0 -38.4 80.2 -46.1 74.3 -55.0 71.9 -57.8 71.2 -58.9 69.7 -60.5 69.0 -61.6 61.5 -69.1 60.4 -69.8 57.1 -72.6 49.2 -78.2 43.3 -81.6 38.4 -84.0 36.0 -84.9 35.2 -85.0 33.0 -86.2 30.4 -86.2 29.3 -87.1 27.6 -87.6 26.6 -87.6 25.0 -88.5 19.9 -88.5 18.4 -89.2 16.7 -89.6 -1.2 -89.6 -4.5 -89.1 -6.1 -88.5 -10.2 -88.1 -12.1 -87.2 -14.4 -86.9 -15.9 -86.0Z",
    tecnologia: "M23.9 -89.2 22.6 -89.2 21.3 -89.8 18.5 -90.2 15.3 -91.1 13.4 -91.2 12.6 -91.6 9.3 -91.6 7.7 -92.0 -7.0 -92.0 -8.5 -91.6 -12.3 -91.6 -13.0 -91.2 -14.9 -91.1 -19.7 -89.9 -23.3 -89.3 -28.1 -87.7 -30.5 -87.1 -33.0 -85.9 -34.8 -85.5 -43.0 -81.6 -48.9 -78.2 -56.7 -72.6 -60.5 -69.3 -61.6 -68.7 -67.8 -62.5 -68.4 -61.4 -70.9 -58.9 -71.5 -57.8 -72.6 -56.7 -77.3 -50.2 -80.7 -44.3 -84.6 -36.6 -85.5 -33.8 -86.2 -32.3 -88.5 -25.5 -90.7 -16.3 -90.7 -14.7 -91.1 -13.2 -91.2 -10.8 -91.6 -10.1 -91.6 -7.6 -92.0 -6.1 -92.0 5.1 -91.2 7.6 -91.1 10.4 -90.6 12.5 -90.1 13.2 -90.0 14.7 -88.9 17.6 -88.4 20.7 -87.7 21.9 -87.2 23.6 -86.6 24.8 -86.4 26.1 -85.5 27.6 -84.1 31.3 -79.0 40.9 -76.7 44.0 -69.8 52.4 -64.2 57.6 -60.4 60.9 -49.8 67.8 -48.5 68.2 -47.8 68.9 -45.2 70.2 -44.1 70.4 -40.0 72.5 -38.4 72.9 -37.2 73.6 -35.7 73.9 -34.2 74.9 -31.7 75.1 -29.6 76.1 -26.6 76.3 -23.8 77.3 -18.8 77.3 -18.0 77.5 -2.1 77.3 0.7 76.2 3.2 76.2 4.9 75.3 7.9 75.0 10.0 73.9 11.8 73.8 13.5 72.8 15.3 72.5 16.6 71.7 17.8 71.3 18.8 70.5 20.5 70.0 25.5 66.8 30.9 62.5 34.1 59.3 37.6 55.0 40.8 50.0 43.8 44.1 45.9 37.9 46.6 36.6 47.0 35.1 47.1 33.4 47.7 32.3 47.9 25.0 47.2 23.1 46.7 19.5 44.7 13.9 40.9 7.7 36.5 3.4 33.7 1.2 31.2 -0.2 30.5 -0.9 28.9 -1.3 27.6 -2.1 26.3 -2.3 24.4 -3.4 22.0 -3.6 19.9 -4.4 18.4 -4.6 12.2 -4.6 9.6 -3.6 6.5 -3.3 5.3 -2.5 3.1 -2.1 1.9 -1.2 0.2 -0.8 0.0 -0.3 0.0 2.9 -0.3 6.1 -2.4 12.1 -3.3 13.5 -3.8 14.8 -4.5 15.6 -4.9 17.0 -6.0 18.0 -9.6 22.6 -10.9 23.4 -11.7 24.3 -12.8 24.8 -14.4 26.5 -15.8 26.9 -16.7 27.8 -18.2 28.2 -19.5 29.1 -21.0 29.4 -21.9 30.1 -23.2 30.4 -24.2 31.1 -25.4 31.4 -27.8 31.4 -28.5 31.6 -37.0 31.6 -39.1 31.4 -41.0 30.5 -43.7 30.2 -44.8 29.3 -45.8 29.1 -47.1 28.2 -48.8 27.8 -50.8 26.0 -51.8 25.5 -52.5 24.8 -53.7 24.3 -56.4 21.6 -61.3 15.8 -62.5 13.3 -63.5 12.3 -67.1 5.8 -67.7 3.8 -68.6 2.0 -69.9 -3.0 -70.9 -4.4 -71.1 -9.2 -72.0 -13.5 -72.0 -18.9 -71.5 -21.0 -71.5 -22.2 -70.9 -24.1 -70.7 -27.3 -69.9 -29.3 -69.6 -31.6 -68.8 -33.7 -68.7 -34.8 -67.7 -37.2 -66.2 -42.0 -63.8 -47.7 -62.8 -49.1 -62.5 -50.4 -58.9 -55.6 -57.5 -57.2 -55.8 -59.9 -53.6 -62.3 -52.0 -64.6 -49.9 -66.2 -48.1 -68.2 -47.1 -68.7 -46.1 -69.8 -44.2 -71.1 -42.5 -73.0 -37.8 -75.7 -36.9 -76.5 -34.1 -78.0 -33.3 -78.8 -32.0 -79.3 -29.5 -81.1 -27.8 -81.5 -24.5 -83.5 -22.6 -83.9 -21.0 -84.8 -19.4 -85.0 -17.9 -86.0 -15.9 -86.1 -14.4 -87.0 -12.1 -87.4 -10.2 -88.2 -6.1 -88.6 -4.5 -89.2 -1.2 -89.7 16.7 -89.7 18.4 -89.3 19.9 -88.6 24.8 -88.6Z",
    materialidad: "M50.4 -54.0 44.2 -57.3 41.2 -58.5 39.8 -58.7 38.4 -59.5 33.6 -60.7 31.6 -61.0 29.3 -61.0 26.6 -61.7 17.9 -61.7 15.7 -61.0 13.8 -61.0 11.7 -60.6 10.5 -60.6 9.0 -59.9 7.7 -59.9 5.4 -59.4 2.3 -57.6 1.1 -57.2 -2.5 -54.8 -5.9 -52.2 -8.5 -49.1 -10.9 -45.7 -11.9 -43.9 -12.4 -42.6 -13.8 -40.5 -15.5 -33.5 -15.5 -31.2 -15.7 -30.4 -15.5 -24.1 -14.5 -20.8 -14.3 -18.9 -12.8 -15.8 -12.5 -14.0 -9.3 -9.3 -7.3 -6.9 -3.1 -3.0 -0.2 -1.1 0.4 -1.0 1.9 -1.3 3.1 -2.2 5.3 -2.7 6.5 -3.4 9.6 -3.8 12.2 -4.8 18.4 -4.8 19.9 -4.5 21.5 -3.9 24.4 -3.5 26.3 -2.4 27.6 -2.2 28.9 -1.4 30.5 -1.0 31.2 -0.3 33.7 1.1 36.5 3.3 41.0 7.7 44.6 13.5 46.8 19.5 47.3 23.1 48.0 25.0 47.8 32.3 47.2 33.4 47.1 35.1 46.7 36.6 46.0 37.9 44.8 41.9 41.6 48.8 37.7 55.0 34.2 59.3 29.3 64.0 25.5 66.9 20.5 70.1 18.8 70.7 17.8 71.4 16.6 71.8 15.3 72.6 13.5 72.9 11.8 73.9 10.0 74.0 7.9 75.1 4.9 75.4 3.2 76.3 0.7 76.3 -2.1 77.4 -18.0 77.6 -18.8 77.4 -23.8 77.4 -26.6 76.4 -29.6 76.2 -31.7 75.2 -34.2 75.0 -35.7 74.0 -37.2 73.8 -38.4 73.0 -40.0 72.6 -44.1 70.5 -45.2 70.3 -47.8 69.0 -48.5 68.3 -49.8 67.9 -52.1 66.2 -53.4 65.7 -60.4 61.0 -65.1 56.9 -69.9 52.4 -76.9 44.0 -79.1 40.9 -79.7 39.4 -82.6 34.6 -84.3 31.3 -85.6 27.6 -86.5 26.1 -86.7 24.8 -88.5 20.7 -89.0 17.6 -90.1 14.7 -90.2 13.2 -90.7 12.5 -90.9 12.6 -91.1 13.8 -90.7 14.8 -90.7 17.0 -88.5 26.0 -86.2 32.6 -84.5 37.0 -80.7 44.7 -77.7 49.6 -72.2 57.5 -66.9 63.7 -62.9 67.7 -61.8 68.3 -58.9 71.2 -53.6 75.2 -48.0 79.0 -44.3 81.1 -37.5 84.5 -36.0 84.9 -33.6 86.1 -29.0 87.6 -27.3 88.4 -24.5 88.9 -22.4 89.7 -18.9 90.6 -17.0 90.7 -16.3 91.0 -14.4 91.1 -10.9 91.9 -8.1 91.9 -6.5 92.3 6.9 92.3 7.6 92.0 11.3 91.9 12.1 91.6 19.2 90.6 24.9 88.9 27.6 88.4 35.9 85.1 36.9 84.3 38.6 83.4 39.4 82.6 41.0 81.9 43.3 80.3 44.5 79.8 52.6 74.0 56.9 70.2 63.1 63.8 67.7 58.2 71.8 52.3 72.6 50.3 73.6 49.0 75.3 45.4 76.1 44.3 76.3 43.3 79.6 35.5 81.9 26.5 82.8 19.6 83.3 17.9 83.3 6.3 83.5 5.5 83.3 0.1 82.0 -7.5 81.1 -10.5 81.1 -11.7 80.2 -13.9 79.6 -16.1 79.0 -17.4 78.6 -19.1 75.1 -26.6 71.2 -33.3 69.8 -34.6 68.9 -36.3 66.0 -39.6 65.4 -40.7 59.3 -46.9Z"
  };
  function gankyilSVG(opts) {
    opts = opts || {};
    var regiones = '';
    GK_BRAZOS.forEach(function (b) {
      regiones += '<g class="gk-brazo" data-brazo="' + b.id + '"' + (opts.interactivo ? ' tabindex="0" role="button" aria-label="' + esc(b.nombre) + '"' : '') + '>' +
        '<path d="' + GK_PATHS[b.id] + '" fill="' + b.color + '" fill-rule="evenodd" stroke="' + b.color + '" stroke-width=".6" stroke-linejoin="round"/></g>';
    });
    return '<svg class="gk-svg-el" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="' + (opts.interactivo ? 'false' : 'true') + '">' +
      '<g transform="translate(100 100)"><g class="gk-rota">' + regiones + '</g>' +
      '<circle r="92.5" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.6"/>' +
      (opts.interactivo ? '<circle class="gk-centro" data-brazo="centro" tabindex="0" role="button" aria-label="Asesoría Catalizadora" r="9" fill="#fff6dc" fill-opacity=".9" stroke="#d9b44a" stroke-width="2.5"/>' : '') +
      '</g></svg>';
  }

  function gankyilBloque(s) {
    if (s.gankyil === false) return '';
    var leyenda = GK_BRAZOS.map(function (b) {
      return '<li class="gk-item" data-brazo="' + b.id + '" tabindex="0"><i style="background:' + b.color + '"></i><span><strong>' + esc(b.nombre) + '</strong><small>' + esc(b.pilar) + ' · ' + esc(b.desc) + '</small></span></li>';
    }).join('') +
      '<li class="gk-item" data-brazo="centro" tabindex="0"><i style="background:#d9b44a"></i><span><strong>Asesoría Catalizadora</strong><small>el punto de partida del giro</small></span></li>';
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
      '</div>';
  }

  function gkResaltar(brazo) {
    var lista = document.querySelectorAll('.plan-item');
    var gk = GK_BRAZOS.filter(function (b) { return b.id === brazo; })[0];
    lista.forEach(function (it) {
      var t = it.textContent;
      var coincide = true;
      if (brazo) {
        if (brazo === 'centro') coincide = /asesor/i.test(t);
        else coincide = gk.re.test(t) || /a elegir/i.test(t);
      }
      it.classList.toggle('gk-atenuado', !!brazo && !coincide);
      it.classList.toggle('gk-activo', !!brazo && coincide);
    });
    document.querySelectorAll('.gk-wrap .gk-brazo').forEach(function (g) { g.classList.toggle('gk-sel', !!brazo && g.getAttribute('data-brazo') === brazo); });
    document.querySelectorAll('.gk-wrap .gk-item').forEach(function (g) { g.classList.toggle('gk-sel', !!brazo && g.getAttribute('data-brazo') === brazo); });
  }

  function marcarProgramas() {
    document.querySelectorAll('.plan-item').forEach(function (it) {
      if (it.getAttribute('data-gk-marcado')) return;
      it.setAttribute('data-gk-marcado', '1');
      var t = it.textContent, pts = '';
      GK_BRAZOS.forEach(function (b) { if (b.re.test(t)) pts += '<i style="background:' + b.color + '" title="' + esc(b.nombre) + '"></i>'; });
      if (/asesor/i.test(t)) pts += '<i style="background:#d9b44a" title="Asesoría Catalizadora"></i>';
      if (pts) { var main = it.querySelector('.plan-item-main'); if (main) main.insertAdjacentHTML('afterbegin', '<span class="gk-puntos">' + pts + '</span>'); }
    });
  }

  function bindGankyil() {
    if (bindGankyil.hecho) return;
    bindGankyil.hecho = true;
    var fijo = null;
    function sel(el) { var b = el.closest && el.closest('[data-brazo]'); return b ? b.getAttribute('data-brazo') : null; }
    document.addEventListener('mouseover', function (e) { var b = e.target.closest && e.target.closest('.gk-wrap [data-brazo]'); if (b && !fijo) gkResaltar(sel(b)); });
    document.addEventListener('mouseout', function (e) { var b = e.target.closest && e.target.closest('.gk-wrap [data-brazo]'); if (b && !fijo) gkResaltar(null); });
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
        if (landing.foto_hero) claseTarjeta += ' evento-item-con-foto';

        var contenido =
          '<div class="evento-item-contenido">' +
          '<h2>' + esc(tituloPlano) + '</h2><p>' + esc(fechaLinea) + '</p>' +
          '<p class="evento-bloque-desc">' + esc(resumenEvento(landing)) + '</p>' +
          '<a class="btn primary" href="' + link + '">Ver detalles e inscribirme →</a>' +
          '</div>';

        if (landing.foto_hero) {
          return '<div class="' + claseTarjeta + '">' +
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
    gankyilSVG: gankyilSVG,
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
