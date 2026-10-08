// Pone título, descripción y foto correctos en la vista previa al compartir
// el link de un evento (WhatsApp, Facebook, etc.). Si algo falla, sirve la
// página normal sin tocarla.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function limpio(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    try {
      const ct = res.headers.get('content-type') || '';
      if (res.status !== 200 || ct.indexOf('text/html') === -1) return res;

      const url = new URL(request.url);
      const slug = url.searchParams.get('evento');
      if (!slug || !/^[A-Za-z0-9_-]+$/.test(slug)) return res;

      const r = await env.ASSETS.fetch(new Request(url.origin + '/events/' + slug + '.json'));
      if (!r.ok) return res;
      const ev = await r.json();

      const titulo = limpio(ev.titulo_evento_html) || 'Evento CAT';
      const sedeTxt = String(ev.sede || '').replace(/https?:\/\/\S+/g, '').replace(/[\s:,\-–—]+$/, '').replace(/^[^A-Za-z0-9\u00C0-\u024F]+/, '').trim();
      const partes = [ev.fecha, sedeTxt].filter(Boolean).join(' · ');
      let desc = limpio(ev.descripcion);
      if (desc.length > 160) desc = desc.slice(0, 157).trim() + '…';
      desc = [partes, desc].filter(Boolean).join(' — ');
      let img = '';
      if (ev.foto_hero) img = ev.foto_hero.indexOf('http') === 0 ? ev.foto_hero : url.origin + (ev.foto_hero[0] === '/' ? '' : '/') + ev.foto_hero;

      const tags =
        '<meta property="og:type" content="website">' +
        '<meta property="og:site_name" content="TRATAK · CAT">' +
        '<meta property="og:title" content="' + esc(titulo) + '">' +
        '<meta property="og:description" content="' + esc(desc) + '">' +
        '<meta property="og:url" content="' + esc(url.origin + url.pathname + '?evento=' + slug) + '">' +
        (img ? '<meta property="og:image" content="' + esc(img) + '">' +
               '<meta name="twitter:card" content="summary_large_image">' : '') +
        '<meta name="description" content="' + esc(desc) + '">';

      return new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(titulo + ' — CAT'); } })
        .on('meta[property^="og:"], meta[name="description"], meta[name^="twitter:"]', { element(e) { e.remove(); } })
        .on('head', { element(e) { e.append(tags, { html: true }); } })
        .transform(res);
    } catch (err) {
      return res;
    }
  }
};
