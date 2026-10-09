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

  function applyTheme(theme, rootStyle) {
    if (!theme || !rootStyle) return;
    if (theme.color_paper) rootStyle.setProperty('--paper', theme.color_paper);
    if (theme.color_ink) rootStyle.setProperty('--ink', theme.color_ink);
    if (theme.color_clay) rootStyle.setProperty('--clay', theme.color_clay);
    if (theme.color_moss) rootStyle.setProperty('--moss', theme.color_moss);
    if (theme.color_dust) rootStyle.setProperty('--dust', theme.color_dust);
    var extra = { grande: '2px', muy_grande: '4px' }[theme.tamano_texto] || '0px';
    rootStyle.setProperty('--fs-extra', extra);
    var fp = FONT_PAIRS[theme.font_pair] || FONT_PAIRS.fraunces_space;
    rootStyle.setProperty('--font-heading', fp.heading);
    rootStyle.setProperty('--font-body', fp.body);
  }

  // ---------- nav ----------
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
      '<li><a data-ancla="plan" href="' + homeHref + '#plan">Plan</a></li>' +
      '<li><a data-ancla="tienda" href="' + homeHref + '#tienda">Tienda</a></li>' +
      '<li><a data-ancla="galeria" href="' + homeHref + '#galeria">Galería</a></li>' +
      '<li><a data-ancla="multimedia" href="' + homeHref + '#multimedia">Video</a></li>' +
      '<li><a href="landing.html">Eventos</a></li>' +
      '</ul>' +
      '<a class="cta" data-ancla="plan" href="' + homeHref + '#plan">Inscríbete →</a>' +
      '</div></nav>'
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
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'
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

  function renderListaPrecios(s, contacto) {
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
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
