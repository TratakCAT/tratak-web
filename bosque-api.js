// API privada del Plan Maestro TRATAK Bosque.
// Los datos NO viven en este repositorio (es público): se guardan en un
// Durable Object de Cloudflare. El acceso se protege con una contraseña
// compartida guardada como secreto BOSQUE_PASSWORD en Cloudflare.

const MAX_TASKS = 400;
const MAX_LOG = 300;
const TOKEN_DAYS = 90;
const ESTADOS = ['done', 'active', 'next', 'wait'];

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = (s) => b64u(enc.encode(s));
const fromB64uStr = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode('tratak-bosque:' + secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function makeToken(nombre, secret) {
  const payload = b64uStr(JSON.stringify({ n: nombre, exp: Date.now() + TOKEN_DAYS * 864e5 }));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload));
  return payload + '.' + b64u(sig);
}
async function readToken(tok, secret) {
  if (!tok || tok.indexOf('.') < 0) return null;
  const [payload, sig] = tok.split('.');
  try {
    const raw = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), raw, enc.encode(payload));
    if (!ok) return null;
    const p = JSON.parse(fromB64uStr(payload));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch (e) { return null; }
}
function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v + 'T00:00:00Z'));

// Limpia una tarea que llega del navegador o del archivo de importación.
function cleanTask(t, phases) {
  const out = {};
  out.id = str(t.id, 40).replace(/[^A-Za-z0-9_-]/g, '') || ('t' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
  out.p = phases.some((p) => p.id === t.p) ? t.p : (phases[phases.length - 1] || {}).id || 'PX';
  out.n = str(t.n, 160) || 'Sin nombre';
  if (!isDate(t.a)) throw new Error('Fecha de inicio inválida en "' + out.n + '"');
  out.a = t.a;
  if (t.b && isDate(t.b) && t.b > t.a && !t.ms) out.b = t.b; else out.ms = 1;
  out.s = ESTADOS.includes(t.s) ? t.s : 'next';
  out.o = str(t.o, 80);
  out.d = str(t.d, 1500);
  if (t.crit) out.crit = 1;
  if (t.on) out.on = 1;
  if (Array.isArray(t.t)) out.t = t.t.slice(0, 20).map((x) => str(x, 600)).filter(Boolean);
  if (t.w) out.w = str(t.w, 600);
  return out;
}
function cleanPhases(ph) {
  if (!Array.isArray(ph) || !ph.length) throw new Error('El archivo no trae fases');
  return ph.slice(0, 20).map((p) => ({ id: str(p.id, 10).replace(/[^A-Za-z0-9]/g, ''), n: str(p.n, 60), c: /^--c[0-9x]$/.test(p.c) ? p.c : '--cx' }));
}
const FIELD_LABEL = { n: 'nombre', p: 'fase', a: 'inicio', b: 'fin', s: 'estado', o: 'responsable', d: 'nota', crit: 'ruta crítica' };

export class BosquePlan {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/bosque\/?/, '');
    const secret = this.env.BOSQUE_PASSWORD;
    if (!secret) return json({ error: 'Falta configurar la contraseña BOSQUE_PASSWORD en Cloudflare.' }, 503);

    if (path === 'login' && request.method === 'POST') return this.login(request, secret);

    const auth = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const who = await readToken(auth, secret);
    if (!who) return json({ error: 'Tu sesión expiró. Vuelve a entrar.' }, 401);

    if (path === 'estado' && request.method === 'GET') return json(await this.snapshot());
    if (path === 'op' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: 'Solicitud inválida.' }, 400); }
      try { return json(await this.apply(body, who.n)); }
      catch (e) { return json({ error: e.message || 'No se pudo guardar.' }, e.status || 400); }
    }
    return json({ error: 'No encontrado' }, 404);
  }

  async login(request, secret) {
    const now = Date.now();
    const lock = (await this.state.storage.get('lock')) || { fails: [], until: 0 };
    if (lock.until > now) return json({ error: 'Demasiados intentos. Espera unos minutos.' }, 429);
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const nombre = str(body.nombre, 40);
    if (!nombre) return json({ error: 'Escribe tu nombre.' }, 400);
    if (!safeEqual(body.clave || '', secret)) {
      lock.fails = lock.fails.filter((t) => t > now - 15 * 60e3).concat(now);
      if (lock.fails.length >= 10) { lock.until = now + 15 * 60e3; lock.fails = []; }
      await this.state.storage.put('lock', lock);
      return json({ error: 'Contraseña incorrecta.' }, 401);
    }
    await this.state.storage.put('lock', { fails: [], until: 0 });
    return json({ token: await makeToken(nombre, secret), nombre });
  }

  async snapshot() {
    const [plan, firmas, log] = await Promise.all([
      this.state.storage.get('plan'),
      this.state.storage.get('firmas'),
      this.state.storage.get('log'),
    ]);
    return { plan: plan || null, firmas: firmas || [], log: (log || []).slice(-80) };
  }

  async apply(body, nombre) {
    const st = this.state.storage;
    let plan = await st.get('plan');
    const log = (await st.get('log')) || [];
    const stamp = new Date().toISOString();
    const push = (txt) => { log.push({ quien: nombre, fecha: stamp, txt: str(txt, 300) }); };

    if (body.op === 'importar') {
      if (plan && plan.tasks && plan.tasks.length && !body.reemplazar) {
        const e = new Error('Ya hay un plan cargado.'); e.status = 409; throw e;
      }
      const src = body.datos || {};
      const phases = cleanPhases(src.phases);
      const tasks = (src.tasks || []).slice(0, MAX_TASKS).map((t) => cleanTask(t, phases));
      plan = { rev: (plan && plan.rev || 0) + 1, phases, tasks, actualizado: stamp, por: nombre };
      push('Cargó el plan (' + tasks.length + ' tareas)');
    } else {
      if (!plan) { const e = new Error('Todavía no hay un plan cargado.'); e.status = 409; throw e; }
      if (body.op === 'agregar') {
        if (plan.tasks.length >= MAX_TASKS) throw new Error('El plan ya tiene demasiadas tareas.');
        const t = cleanTask({ ...body.tarea, id: null }, plan.phases);
        plan.tasks.push(t);
        push('Agregó «' + t.n + '»');
      } else if (body.op === 'editar') {
        const i = plan.tasks.findIndex((t) => t.id === body.id);
        if (i < 0) { const e = new Error('Esa tarea ya no existe; recarga la página.'); e.status = 404; throw e; }
        const prev = plan.tasks[i];
        const merged = { ...prev, ...pick(body.cambios || {}) };
        if (body.cambios && 'b' in body.cambios && !body.cambios.b) { delete merged.b; merged.ms = 1; }
        if (body.cambios && body.cambios.b) delete merged.ms;
        if (body.cambios && 'crit' in body.cambios && !body.cambios.crit) delete merged.crit;
        const next = cleanTask(merged, plan.phases);
        const changed = Object.keys(FIELD_LABEL).filter((k) => String(prev[k] || '') !== String(next[k] || ''));
        if (!changed.length) return { ok: true, ...(await this.snapshot()) };
        plan.tasks[i] = next;
        if (changed.length === 1 && changed[0] === 's') push('Marcó «' + next.n + '» como ' + ({ done: 'hecho', active: 'en curso', next: 'siguiente', wait: 'depende de terceros' })[next.s]);
        else push('Editó «' + next.n + '»: ' + changed.map((k) => FIELD_LABEL[k]).join(', '));
      } else if (body.op === 'eliminar') {
        const i = plan.tasks.findIndex((t) => t.id === body.id);
        if (i < 0) return { ok: true, ...(await this.snapshot()) };
        push('Eliminó «' + plan.tasks[i].n + '»');
        plan.tasks.splice(i, 1);
      } else if (body.op === 'firmar') {
        const firmas = ((await st.get('firmas')) || []).filter((f) => f.nombre.toLowerCase() !== nombre.toLowerCase());
        firmas.push({ nombre, rev: plan.rev, fecha: stamp, nota: str(body.nota, 400) });
        await st.put('firmas', firmas);
        push('Firmó la revisión ' + plan.rev + (body.nota ? ' con una nota' : ''));
        await st.put('log', log.slice(-MAX_LOG));
        return { ok: true, ...(await this.snapshot()) };
      } else {
        throw new Error('Operación desconocida.');
      }
      plan.rev += 1;
      plan.actualizado = stamp;
      plan.por = nombre;
    }
    await st.put('plan', plan);
    await st.put('log', log.slice(-MAX_LOG));
    return { ok: true, ...(await this.snapshot()) };
  }
}

function pick(c) {
  const out = {};
  for (const k of ['n', 'p', 'a', 'b', 's', 'o', 'd', 'crit']) if (k in c) out[k] = c[k];
  return out;
}

export async function handleBosque(request, env) {
  if (!env.BOSQUE) return json({ error: 'Falta el Durable Object BOSQUE en la configuración.' }, 503);
  const stub = env.BOSQUE.get(env.BOSQUE.idFromName('plan-principal'));
  return stub.fetch(request);
}
