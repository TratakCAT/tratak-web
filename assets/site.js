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
    var fp = FONT_PAIRS[theme.font_pair] || FONT_PAIRS.fraunces_space;
    var vars = [];
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
      '<li><a href="' + homeHref + '#pilares">Pilares</a></li>' +
      '<li><a href="' + homeHref + '#taller">Taller</a></li>' +
      '<li><a href="' + homeHref + '#plan">Plan</a></li>' +
      '<li><a href="' + homeHref + '#tienda">Tienda</a></li>' +
      '<li><a href="' + homeHref + '#galeria">Galería</a></li>' +
      '<li><a href="' + homeHref + '#multimedia">Video</a></li>' +
      '<li><a href="landing.html">Eventos</a></li>' +
      '</ul>' +
      '<a class="cta" href="' + homeHref + '#contacto">Inscríbete →</a>' +
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
    var textoHTML =
      '<p class="kicker">' + esc(hero.kicker) + '</p>' +
      '<h1>' + esc(hero.title_line1) + '<br>' + esc(hero.title_pre) + '<em>' + esc(hero.title_em) + '</em><br>' + esc(hero.title_line3) + '</h1>' +
      '<p class="lede">' + esc(hero.lede) + '</p>' + ctas;

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
  function wrapAbre(s) {
    var style = '';
    if (s.fondo === 'color' && s.color_fondo) style += 'background:' + s.color_fondo + ';';
    if (s.color_acento) style += '--clay:' + s.color_acento + ';';
    if (s.estilo_fuente && FONT_PAIRS[s.estilo_fuente]) {
      var fp2 = FONT_PAIRS[s.estilo_fuente];
      style += '--font-heading:' + fp2.heading + ';--font-body:' + fp2.body + ';';
    }
    var claseTexto = s.color_texto === 'claro' ? 'bloque-claro' : 'bloque-oscuro';
    var clasePosicion = (s.fondo === 'imagen' || s.fondo === 'video') ? 'bloque-media-bg' : '';
    return '<section class="wrap seccion-bloque ' + claseTexto + ' ' + clasePosicion + '" id="sec-' + esc(s.id) + '" style="' + style + '">';
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
      '<div class="pilares">' + (s.items || []).map(function (p) {
        return '<div class="pilar"><div class="num">' + esc(p.num) + '</div><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div>';
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

  function renderListaPrecios(s) {
    return wrapAbre(s) + mediaFondoHTML(s) +
      '<div class="bloque-contenido"><p class="eyebrow">' + esc(s.eyebrow) + '</p><h2>' + esc(s.titulo) + '</h2>' +
      '<div class="plan-list">' + (s.items || []).map(function (it) {
        var img = it.imagen ? '<div class="plan-item-img"><img src="' + esc(it.imagen) + '" alt=""></div>' : '';
        return '<div class="plan-item">' + img +
          '<div class="plan-item-main"><span class="code">' + esc(it.code) + '</span><h3>' + esc(it.title) + '</h3><div class="meta">' + esc(it.meta) + '</div></div>' +
          '<div class="price">' + esc(it.price) + '</div></div>';
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
          '<p class="evento-bloque-desc">' + esc(landing.descripcion) + '</p>' +
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

  function eventoPasadoCard(ev, whatsapp) {
    var img = ev.foto ? '<img src="' + esc(ev.foto) + '" alt="' + esc(ev.titulo) + '">' : ('<div class="ph">Foto: ' + esc(ev.titulo) + '</div>');
    var mensaje = ev.mensaje_whatsapp || ('Hola, me interesa que se repita el taller "' + ev.titulo + '"');
    var link = 'https://wa.me/' + esc(whatsapp) + '?text=' + encodeURIComponent(mensaje);
    return (
      '<div class="evento-pasado-card">' +
      '<div class="evento-pasado-img">' + img + '</div>' +
      '<div class="evento-pasado-fecha">' + esc(ev.fecha) + '</div>' +
      '<h3>' + esc(ev.titulo) + '</h3><p>' + esc(ev.descripcion) + '</p>' +
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
      return fn(s, contacto, opts);
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
      '<p class="eyebrow">Contacto</p><h2>' + esc(contacto.titulo) + '</h2><p>' + esc(contacto.texto) + '</p>' +
      '<div class="info-list">' +
      '<div><div class="k">WhatsApp</div><div class="v"><a href="https://wa.me/' + esc(contacto.whatsapp) + '">' + esc(contacto.whatsapp_display) + '</a></div></div>' +
      '<div><div class="k">Ubicación</div><div class="v">' + esc(contacto.ubicacion) + '</div></div>' +
      '<div><div class="k">Correo</div><div class="v"><a href="mailto:' + esc(contacto.email) + '">' + esc(contacto.email) + '</a></div></div>' +
      '<div><div class="k">Horario</div><div class="v">' + esc(contacto.horario) + '</div></div>' +
      '</div></div>' +
      '<form action="https://formspree.io/f/TU-ID" method="POST">' +
      '<div><label>Nombre *</label><input type="text" name="nombre" required></div>' +
      '<div><label>Correo electrónico *</label><input type="email" name="correo" required></div>' +
      '<div><label>Teléfono</label><input type="tel" name="telefono"></div>' +
      '<div><label>Comentario</label><textarea name="comentario"></textarea></div>' +
      '<button class="btn primary" type="submit">Enviar</button>' +
      '</form></div></section>'
    );
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

  function bindGlobalInteractions(theme) {
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
    applyTheme: applyTheme,
    themeStyleTag: themeStyleTag,
    renderNav: renderNav,
    renderHero: renderHero,
    renderSecciones: renderSecciones,
    renderEventoDestacado: renderEventoDestacado,
    renderContacto: renderContacto,
    renderFooter: renderFooter,
    renderLightbox: renderLightbox,
    renderFloatingButtons: renderFloatingButtons,
    renderFullPage: renderFullPage,
    RENDERERS: RENDERERS,
    TIPOS_CON_PAGINA_DEDICADA: TIPOS_CON_PAGINA_DEDICADA,
    youtubeIdFromUrl: youtubeIdFromUrl,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox,
    bindGlobalInteractions: bindGlobalInteractions
  };

})(window);
