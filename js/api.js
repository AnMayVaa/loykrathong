// Shared river backend (Supabase REST). The publishable key is meant to be public;
// the table only allows reading and inserting, protected by row-level security,
// a server-side trigger (trims text, forces server time) and a per-IP rate limit.

const SB_URL = 'https://ydhaqcjfcibdpfzycwzt.supabase.co';
const SB_KEY = 'sb_publishable_V0qdXNsxF4J6gpUwVKYUXA_UQuZ61fg';
const TABLE = `${SB_URL}/rest/v1/krathongs`;
const COLS = 'id,created_at,name,wish,style,color';

export class ApiError extends Error {
  constructor(message, { status = 0, code = '' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  get rateLimited() {
    return /rate_limited/.test(this.message) || this.status === 429;
  }
}

async function request(url, { method = 'GET', body, headers = {}, timeout = 9000 } = {}) {
  if (typeof fetch !== 'function') throw new ApiError('fetch unavailable');
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        apikey: SB_KEY,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl ? ctrl.signal : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    throw new ApiError(err && err.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (!res.ok) {
    let msg = `http_${res.status}`;
    let code = '';
    try {
      const j = await res.json();
      if (j && typeof j.message === 'string') msg = j.message;
      if (j && typeof j.code === 'string') code = j.code;
    } catch (_) { /* ignore non-JSON error bodies */ }
    throw new ApiError(msg, { status: res.status, code });
  }
  return res;
}

function clean(row) {
  if (!row || typeof row !== 'object') return null;
  const id = Number(row.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    name: typeof row.name === 'string' ? row.name.slice(0, 24) : '',
    wish: typeof row.wish === 'string' ? row.wish.slice(0, 140) : '',
    style: clampInt(row.style, 0, 4),
    color: clampInt(row.color, 0, 5),
  };
}

function clampInt(v, lo, hi) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

async function rows(res) {
  let data;
  try { data = await res.json(); } catch (_) { return []; }
  return Array.isArray(data) ? data.map(clean).filter(Boolean) : [];
}

export async function fetchRecent(limit = 160) {
  const res = await request(`${TABLE}?select=${COLS}&order=id.desc&limit=${limit}`);
  return rows(res);
}

export async function fetchSince(id, limit = 60) {
  const res = await request(`${TABLE}?select=${COLS}&id=gt.${Math.floor(id) || 0}&order=id.asc&limit=${limit}`);
  return rows(res);
}

export async function fetchCount() {
  const res = await request(`${TABLE}?select=id&limit=1`, { headers: { Prefer: 'count=exact' } });
  const range = res.headers.get('content-range') || '';
  const total = Number(range.split('/')[1]);
  try { await res.text(); } catch (_) { /* drain */ }
  return Number.isFinite(total) ? total : null;
}

export async function insertKrathong({ name, wish, style, color, lang }) {
  const res = await request(TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: {
      name: String(name || '').slice(0, 24),
      wish: String(wish || '').slice(0, 140),
      style: clampInt(style, 0, 4),
      color: clampInt(color, 0, 5),
      lang: lang === 'en' ? 'en' : 'th',
    },
  });
  const out = await rows(res);
  if (!out.length) throw new ApiError('empty_response');
  return out[0];
}
