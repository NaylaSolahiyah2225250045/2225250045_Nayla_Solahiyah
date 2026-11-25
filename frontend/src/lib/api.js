/**
 * Klien NoBaku API (backend FastAPI, docs/API-SPEC.md).
 *
 * Alamat server diambil dari VITE_API_URL saat build (mis. https://api.sekolah.sch.id) atau dari
 * pengaturan "Server sekolah" di halaman Masuk (disimpan di perangkat). Tanpa alamat server,
 * NoBaku berjalan dalam **mode lokal**: akun & kelas hanya ada di browser ini (cocok untuk uji coba).
 */

const SERVER_KEY = 'nobaku.server.v1';

/** Hapus garis miring di akhir & pastikan berakhiran /api/v1. */
export function normalizeServer(url) {
  const u = String(url ?? '').trim().replace(/\/+$/, '');
  if (!u) return '';
  return u.endsWith('/api/v1') ? u : `${u}/api/v1`;
}

export function getServer() {
  try {
    const saved = localStorage.getItem(SERVER_KEY);
    if (saved !== null) return normalizeServer(saved);
  } catch {
    /* penyimpanan diblokir */
  }
  return normalizeServer('https://nobaku-backend.vercel.app');
}

export function setServer(url) {
  try {
    if (url === null) localStorage.removeItem(SERVER_KEY);
    else localStorage.setItem(SERVER_KEY, normalizeServer(url));
  } catch {
    /* diabaikan */
  }
}

export const isServerMode = () => !!getServer();

export class ApiError extends Error {
  /** @param {number} status @param {{code?: string, message?: string, field?: string}} detail */
  constructor(status, detail = {}) {
    super(detail.message ?? 'Terjadi kesalahan di server.');
    this.status = status;
    this.code = detail.code ?? 'ERROR';
    this.field = detail.field;
  }
}

/** Galat jaringan (server mati / offline) — beda dengan galat dari server. */
export class NetworkError extends Error {
  constructor() {
    super('Server sekolah tidak bisa dihubungi. Periksa koneksi internet.');
    this.code = 'NETWORK';
  }
}

/**
 * @param {string} path mis. '/classes'
 * @param {{method?: string, body?: any, token?: string}} [opts]
 */
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const base = getServer();
  if (!base) throw new NetworkError();
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new NetworkError();
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const detail = data?.detail;
    // Galat validasi bawaan FastAPI berbentuk daftar
    if (Array.isArray(detail)) throw new ApiError(res.status, { code: 'VALIDATION_ERROR', message: 'Isian belum sesuai. Periksa lagi, ya.', field: detail[0]?.loc?.at(-1) });
    throw new ApiError(res.status, typeof detail === 'object' && detail ? detail : { message: data?.message });
  }
  return data;
}
