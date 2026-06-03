const CATALOG_KEY = 'catalog';
const CATEGORY_KEYS = ['printing', 'souvenirs', 'framing', 'branding'];

function json(data, init) {
  return new Response(JSON.stringify(data), {
    status: init?.status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init?.headers || {}),
    },
  });
}

function unauthorized() {
  return json({ error: 'Unauthorized' }, { status: 401 });
}

function hasValidToken(request, env) {
  const expected = env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get('Authorization') || '';
  return header === 'Bearer ' + expected;
}

function isService(service) {
  return service
    && typeof service.id === 'string'
    && typeof service.name === 'string'
    && typeof service.price === 'number'
    && Number.isFinite(service.price);
}

function normalizeCatalogPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (!payload.services || typeof payload.services !== 'object') return null;

  const services = {};
  for (const key of CATEGORY_KEYS) {
    if (!Array.isArray(payload.services[key])) return null;
    services[key] = payload.services[key].filter(isService).map(service => ({
      id: service.id,
      name: service.name,
      price: service.price,
      unit: typeof service.unit === 'string' ? service.unit : '',
      desc: typeof service.desc === 'string' ? service.desc : '',
    }));
  }

  const presets = Array.isArray(payload.presets)
    ? payload.presets.map(preset => ({
      name: typeof preset.name === 'string' ? preset.name : 'Untitled Preset',
      items: Object.fromEntries(
        Object.entries(preset.items && typeof preset.items === 'object' ? preset.items : {})
          .filter(([id, qty]) => typeof id === 'string' && typeof qty === 'number' && Number.isFinite(qty))
      ),
    }))
    : [];

  return {
    services,
    presets,
    updatedAt: new Date().toISOString(),
  };
}

export async function onRequestGet({ env }) {
  if (!env.DAT_CATALOG) {
    return json({ error: 'Missing DAT_CATALOG KV binding' }, { status: 500 });
  }

  const catalog = await env.DAT_CATALOG.get(CATALOG_KEY, { type: 'json' });
  if (!catalog) {
    return json({ error: 'Catalog has not been published yet' }, { status: 404 });
  }

  return json(catalog);
}

export async function onRequestPost({ request, env }) {
  if (!env.DAT_CATALOG) {
    return json({ error: 'Missing DAT_CATALOG KV binding' }, { status: 500 });
  }

  if (!hasValidToken(request, env)) return unauthorized();

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const catalog = normalizeCatalogPayload(payload);
  if (!catalog) {
    return json({ error: 'Invalid catalog shape' }, { status: 400 });
  }

  await env.DAT_CATALOG.put(CATALOG_KEY, JSON.stringify(catalog));
  return json(catalog);
}

export function onRequestOptions() {
  return new Response(null, { status: 204 });
}
