import { useSyncExternalStore } from 'react';

/**
 * Akun lokal versi Alpha (belum ada server login).
 * Akun disimpan HANYA di perangkat ini; kata sandi tidak disimpan, hanya hash PBKDF2-SHA256 + salt acak.
 * Data minimum sesuai CLAUDE.md §4: nama tampilan, username, kelas — tanpa email/telepon/alamat.
 * Kelas TIDAK dipilih siswa: NoBaku khusus kelas VIII, jadi selalu 'VIII' (akun lama ber-kelas lain ikut dibaca 'VIII').
 * Nanti diganti login server (JWT, docs/API-SPEC.md) dengan bentuk profil yang sama.
 *
 * @typedef {{ name: string, username: string, kelas: 'VIII', avatar: string }} Profile
 * @typedef {Profile & { salt: string, hash: string, algo: string, createdAt: string }} StoredAccount
 */

const ACCOUNTS_KEY = 'nobaku.accounts.v1';
const SESSION_KEY = 'nobaku.session.v1';
/** Kelas tetap: seluruh materi & fitur NoBaku dirancang untuk kelas VIII. */
export const KELAS = 'VIII';
export const DEFAULT_AVATAR = 'toga';

const toProfile = (acc) => ({ name: acc.name, username: acc.username, kelas: KELAS, avatar: acc.avatar ?? DEFAULT_AVATAR });
const PBKDF2_ITER = 100_000;

const memory = new Map(); // cadangan bila localStorage diblokir
function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
  }
}

/** @returns {Record<string, StoredAccount>} */
function loadAccounts() {
  try {
    return JSON.parse(read(ACCOUNTS_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

export const normalizeUsername = (u) => String(u ?? '').trim().toLowerCase();

/**
 * Validasi isian daftar. Mengembalikan objek galat per kolom (kosong = valid).
 * @param {{name?:string, username?:string, password?:string, confirm?:string}} f
 */
export function validateRegister(f) {
  const e = {};
  const name = String(f.name ?? '').trim();
  const username = normalizeUsername(f.username);
  if (name.length < 2) e.name = 'Tulis nama panggilanmu (minimal 2 huruf).';
  else if (name.length > 30) e.name = 'Nama terlalu panjang (maksimal 30 huruf).';
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) e.username = 'Username 3–20 karakter: huruf kecil, angka, titik, atau garis bawah.';
  if (String(f.password ?? '').length < 6) e.password = 'Kata sandi minimal 6 karakter.';
  else if (f.password !== f.confirm) e.confirm = 'Kata sandi belum sama. Coba ketik ulang.';
  return e;
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return toHex(bytes);
}

/** Cadangan bila Web Crypto tidak tersedia (mis. dibuka lewat http biasa di jaringan lokal). */
function fallbackHash(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let r = 0; r < 2000; r++) {
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  }
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

async function hashPassword(password, salt, algo) {
  const subtle = globalThis.crypto?.subtle;
  if (algo === 'pbkdf2-sha256' && subtle) {
    const enc = new TextEncoder();
    const key = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: PBKDF2_ITER }, key, 256);
    return toHex(bits);
  }
  return fallbackHash(`${salt}:${password}`);
}

const preferredAlgo = () => (globalThis.crypto?.subtle ? 'pbkdf2-sha256' : 'local-fallback');

/* ---------- sesi ---------- */
const listeners = new Set();

/** @returns {Profile|null} */
function loadSession() {
  try {
    const username = JSON.parse(read(SESSION_KEY) ?? 'null')?.username;
    const acc = username ? loadAccounts()[username] : null;
    return acc ? toProfile(acc) : null;
  } catch {
    return null;
  }
}

let session = loadSession();

function setSession(profile) {
  write(SESSION_KEY, profile ? JSON.stringify({ username: profile.username, at: new Date().toISOString() }) : null);
  session = profile;
  listeners.forEach((l) => l());
}

export function getSession() {
  return session;
}

/**
 * Daftar akun baru lalu langsung masuk.
 * @returns {Promise<{ok: true, profile: Profile} | {ok: false, errors: Record<string,string>}>}
 */
export async function register(f) {
  const errors = validateRegister(f);
  if (Object.keys(errors).length) return { ok: false, errors };
  const username = normalizeUsername(f.username);
  const accounts = loadAccounts();
  if (accounts[username]) return { ok: false, errors: { username: 'Username ini sudah dipakai. Coba yang lain, ya.' } };
  const salt = randomSalt();
  const algo = preferredAlgo();
  const hash = await hashPassword(f.password, salt, algo);
  const profile = { name: String(f.name).trim(), username, kelas: KELAS, avatar: DEFAULT_AVATAR };
  write(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [username]: { ...profile, salt, hash, algo, createdAt: new Date().toISOString() } }));
  setSession(profile);
  return { ok: true, profile };
}

/**
 * Masuk dengan username & kata sandi.
 * @returns {Promise<{ok: true, profile: Profile} | {ok: false, errors: Record<string,string>}>}
 */
export async function login(usernameRaw, password) {
  const username = normalizeUsername(usernameRaw);
  if (!username) return { ok: false, errors: { username: 'Tulis username-mu.' } };
  if (!password) return { ok: false, errors: { password: 'Tulis kata sandimu.' } };
  const acc = loadAccounts()[username];
  if (!acc) return { ok: false, errors: { username: 'Username belum terdaftar di perangkat ini. Daftar dulu, yuk!' } };
  const hash = await hashPassword(password, acc.salt, acc.algo);
  if (hash !== acc.hash) return { ok: false, errors: { password: 'Kata sandi belum tepat. Coba lagi.' } };
  const profile = toProfile(acc);
  setSession(profile);
  return { ok: true, profile };
}

/**
 * Ubah data profil yang boleh diganti siswa (saat ini: avatar).
 * @param {{avatar?: string}} patch
 */
export function updateProfile(patch) {
  if (!session) return;
  const accounts = loadAccounts();
  const acc = accounts[session.username];
  if (!acc) return;
  const next = { ...acc, ...(typeof patch.avatar === 'string' ? { avatar: patch.avatar } : {}) };
  write(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [acc.username]: next }));
  session = toProfile(next);
  listeners.forEach((l) => l());
}

export function logout() {
  setSession(null);
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Hook React: profil yang sedang masuk, atau null. */
export function useSession() {
  return useSyncExternalStore(subscribe, () => session, () => session);
}
