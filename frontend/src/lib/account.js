import { useSyncExternalStore } from 'react';
import { ApiError, NetworkError, apiFetch, isServerMode } from './api.js';
import { getSettings, updateSettings } from './settings.js';

/** Kunci preferensi suara yang disimpan per akun (21 Nov 2026). */
const AUDIO_KEYS = ['music', 'sfx', 'volume'];
const audioPrefsOf = (st) => Object.fromEntries(AUDIO_KEYS.map((k) => [k, st[k]]));

/** Terapkan preferensi suara akun ke pengaturan perangkat (yang tidak tersimpan dibiarkan). */
function applyAudioPrefs(prefs) {
  if (!prefs) return;
  const patch = {};
  if (typeof prefs.music === 'boolean') patch.music = prefs.music;
  if (typeof prefs.sfx === 'boolean') patch.sfx = prefs.sfx;
  if (Number.isFinite(prefs.volume)) patch.volume = prefs.volume;
  if (Object.keys(patch).length) updateSettings(patch);
}

/**
 * Akun lokal versi Alpha (belum ada server login).
 * Akun disimpan HANYA di perangkat ini; kata sandi tidak disimpan, hanya hash PBKDF2-SHA256 + salt acak.
 * Data minimum sesuai CLAUDE.md §4: nama tampilan, username, kelas — tanpa email/telepon/alamat.
 * Kelas TIDAK dipilih siswa: NoBaku khusus kelas VIII, jadi selalu 'VIII' (akun lama ber-kelas lain ikut dibaca 'VIII').
 * Nanti diganti login server (JWT, docs/API-SPEC.md) dengan bentuk profil yang sama.
 *
 * Panduan awal (onboarding): akun yang baru mendaftar diberi `tourPending: true`; setelah panduan selesai
 * atau dilewati menjadi `false` + `tourDoneAt`. Status disimpan per akun, jadi panduan hanya muncul otomatis
 * sekali untuk setiap akun. Akun lama (sebelum fitur ini) tidak punya tanda → panduan tidak muncul otomatis.
 *
 * @typedef {{ name: string, username: string, kelas: 'VIII', avatar: string, tourPending: boolean }} Profile
 * @typedef {Profile & { salt: string, hash: string, algo: string, createdAt: string, tourDoneAt?: string }} StoredAccount
 */

const ACCOUNTS_KEY = 'nobaku.accounts.v1';
const SESSION_KEY = 'nobaku.session.v1';
/** Kelas tetap: seluruh materi & fitur NoBaku dirancang untuk kelas VIII. */
export const KELAS = 'VIII';
export const DEFAULT_AVATAR = 'toga';

/**
 * Peran akun (17 Nov 2026): 'student' (default, akun lama) atau 'teacher'.
 * Akun guru: `username` = email/username yang dipakai masuk, ditambah `school` & `status`
 * ('active' | 'pending' — menunggu verifikasi bila server mewajibkannya).
 * Bila server sekolah dipakai (lib/api.js), token akses disimpan di data akun (`token`).
 */
const toProfile = (acc) => {
  const base = {
    name: acc.name,
    username: acc.username,
    kelas: KELAS,
    avatar: acc.avatar ?? DEFAULT_AVATAR,
    tourPending: acc.tourPending === true,
  };
  if (acc.role === 'teacher') return { ...base, role: 'teacher', school: acc.school ?? '', status: acc.status ?? 'active', remote: !!acc.token };
  return { ...base, role: 'student', remote: !!acc.token };
};
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

/** Token akses server untuk akun yang sedang masuk (null di mode lokal). */
export function getToken() {
  if (!session) return null;
  return loadAccounts()[session.username]?.token ?? null;
}

/** Simpan/perbarui akun di perangkat (hash kata sandi untuk masuk offline) lalu jadikan sesi. */
async function storeAndEnter(key, fields, password, existing) {
  const salt = randomSalt();
  const algo = preferredAlgo();
  const hash = await hashPassword(password, salt, algo);
  const accounts = loadAccounts();
  const prev = existing ?? accounts[key];
  const stored = { avatar: DEFAULT_AVATAR, createdAt: new Date().toISOString(), ...prev, ...fields, username: key, kelas: KELAS, salt, hash, algo };
  // Preferensi suara: pakai yang tersimpan di akun; akun baru menyimpan pengaturan perangkat saat ini.
  stored.prefs = { ...audioPrefsOf(getSettings()), ...(prev?.prefs ?? {}), ...(fields.prefs ?? {}) };
  applyAudioPrefs(stored.prefs);
  write(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [key]: stored }));
  const profile = toProfile(stored);
  setSession(profile);
  return { ok: true, profile };
}

/** Galat server → pesan per kolom formulir. */
function serverErrors(err, fieldMap) {
  if (err instanceof NetworkError) return { form: err.message };
  if (err instanceof ApiError) {
    if (err.code === 'USERNAME_TAKEN' || err.code === 'LOGIN_TAKEN') return { [fieldMap.login]: err.message };
    const field = fieldMap[err.field] ?? null;
    return field ? { [field]: err.message } : { form: err.message };
  }
  return { form: 'Terjadi kesalahan. Coba lagi, ya.' };
}

/**
 * Daftar akun siswa baru lalu langsung masuk. Bila server sekolah dipakai, akun juga dibuat di server
 * (agar guru bisa melihat progres setelah siswa bergabung ke kelas).
 * @returns {Promise<{ok: true, profile: Profile} | {ok: false, errors: Record<string,string>}>}
 */
export async function register(f) {
  const errors = validateRegister(f);
  if (Object.keys(errors).length) return { ok: false, errors };
  const username = normalizeUsername(f.username);
  const accounts = loadAccounts();
  if (accounts[username]) return { ok: false, errors: { username: 'Username ini sudah dipakai. Coba yang lain, ya.' } };
  const fields = { role: 'student', name: String(f.name).trim(), tourPending: true };
  if (isServerMode()) {
    try {
      const res = await apiFetch('/auth/register/student', { method: 'POST', body: { display_name: fields.name, username, password: f.password } });
      fields.token = res.access_token;
      fields.remoteId = res.user.id;
    } catch (err) {
      return { ok: false, errors: serverErrors(err, { display_name: 'name', username: 'username', password: 'password', login: 'username' }) };
    }
  }
  return storeAndEnter(username, fields, f.password, null);
}

/**
 * Validasi isian daftar guru.
 * @param {{name?:string, login?:string, password?:string, confirm?:string, school?:string}} f
 */
export function validateTeacherRegister(f) {
  const e = {};
  const name = String(f.name ?? '').trim();
  const login = normalizeUsername(f.login);
  const school = String(f.school ?? '').trim();
  if (name.length < 3) e.name = 'Tulis nama lengkap (minimal 3 huruf).';
  else if (name.length > 80) e.name = 'Nama terlalu panjang (maksimal 80 huruf).';
  if (login.includes('@')) {
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(login) || login.length > 120) e.login = 'Format email belum benar.';
  } else if (!/^[a-z0-9_.]{3,20}$/.test(login)) e.login = 'Isi email, atau username 3–20 karakter (huruf kecil, angka, titik, garis bawah).';
  if (String(f.password ?? '').length < 8) e.password = 'Kata sandi guru minimal 8 karakter.';
  else if (f.password !== f.confirm) e.confirm = 'Kata sandi belum sama. Coba ketik ulang.';
  if (school.length < 3) e.school = 'Tulis nama sekolah atau instansi.';
  else if (school.length > 120) e.school = 'Nama sekolah terlalu panjang.';
  return e;
}

/**
 * Daftar akun guru lalu langsung masuk (ke Dashboard Guru).
 * @returns {Promise<{ok: true, profile: Profile} | {ok: false, errors: Record<string,string>}>}
 */
export async function registerTeacher(f) {
  const errors = validateTeacherRegister(f);
  if (Object.keys(errors).length) return { ok: false, errors };
  const key = normalizeUsername(f.login);
  if (loadAccounts()[key]) return { ok: false, errors: { login: 'Email/username ini sudah terdaftar.' } };
  const fields = { role: 'teacher', name: String(f.name).trim(), school: String(f.school).trim(), status: 'active', tourPending: true };
  if (isServerMode()) {
    try {
      const res = await apiFetch('/auth/register/teacher', { method: 'POST', body: { display_name: fields.name, login: key, password: f.password, school: fields.school } });
      Object.assign(fields, { token: res.access_token, remoteId: res.user.id, status: res.user.status });
    } catch (err) {
      return { ok: false, errors: serverErrors(err, { display_name: 'name', login: 'login', password: 'password', school: 'school' }) };
    }
  }
  return storeAndEnter(key, fields, f.password, null);
}

/** Masuk memakai data di perangkat (mode lokal, atau cadangan saat server tidak bisa dihubungi). */
async function localLogin(key, password, offlineNote) {
  const acc = loadAccounts()[key];
  if (!acc) return { ok: false, errors: { username: offlineNote ?? 'Username belum terdaftar di perangkat ini. Daftar dulu, yuk!' } };
  const hash = await hashPassword(password, acc.salt, acc.algo);
  if (hash !== acc.hash) return { ok: false, errors: { password: 'Kata sandi belum tepat. Coba lagi.' } };
  applyAudioPrefs(acc.prefs);
  const profile = toProfile(acc);
  setSession(profile);
  return { ok: true, profile };
}

/**
 * Masuk dengan username (siswa) atau email/username (guru) & kata sandi.
 * Jenis akun dikenali otomatis dari data akun (server atau perangkat).
 * @returns {Promise<{ok: true, profile: Profile} | {ok: false, errors: Record<string,string>}>}
 */
export async function login(usernameRaw, password) {
  const key = normalizeUsername(usernameRaw);
  if (!key) return { ok: false, errors: { username: 'Tulis username atau email.' } };
  if (!password) return { ok: false, errors: { password: 'Tulis kata sandimu.' } };
  if (!isServerMode()) return localLogin(key, password);
  try {
    const res = await apiFetch('/auth/login', { method: 'POST', body: { login: key, password } });
    const u = res.user;
    const prefs = u.preferences ?? {};
    const prev = loadAccounts()[key];
    const fields =
      u.role === 'teacher'
        ? // Panduan guru muncul sekali per akun: status "sudah" disimpan di server (preferences.tourDone).
          { role: 'teacher', name: u.display_name, school: u.school ?? '', status: u.status, tourPending: prefs.tourDone !== true && !prev?.tourDoneAt }
        : { role: 'student', name: u.display_name };
    const audio = Object.fromEntries(AUDIO_KEYS.filter((k) => prefs[k] !== undefined).map((k) => [k, prefs[k]]));
    return storeAndEnter(key, { ...fields, prefs: audio, token: res.access_token, remoteId: u.id }, password, null);
  } catch (err) {
    if (err instanceof NetworkError) return localLogin(key, password, 'Server sekolah tidak bisa dihubungi dan akun ini belum pernah masuk di perangkat ini.');
    if (err instanceof ApiError && err.status === 401) return { ok: false, errors: { password: 'Username/email atau kata sandi belum tepat.' } };
    return { ok: false, errors: { form: err.message } };
  }
}

/**
 * Ubah profil guru (nama & sekolah). Di server juga diperbarui bila memakai server sekolah.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function updateTeacherProfile({ name, school }) {
  if (!session || session.role !== 'teacher') return { ok: false, error: 'Bukan akun guru.' };
  const n = String(name ?? '').trim();
  const s = String(school ?? '').trim();
  if (n.length < 3 || n.length > 80) return { ok: false, error: 'Nama lengkap 3–80 huruf.' };
  if (s.length < 3 || s.length > 120) return { ok: false, error: 'Tulis nama sekolah atau instansi.' };
  const token = getToken();
  if (token) {
    try {
      await apiFetch('/me', { method: 'PATCH', token, body: { display_name: n, school: s } });
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  patchAccount({ name: n, school: s });
  return { ok: true };
}

/** Perbarui status akun dari server (mis. guru yang baru diverifikasi). */
export async function refreshProfile() {
  const token = getToken();
  if (!token) return;
  try {
    const u = await apiFetch('/me', { token });
    patchAccount(u.role === 'teacher' ? { name: u.display_name, school: u.school ?? '', status: u.status } : { name: u.display_name });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) patchAccount({ token: null });
  }
}

function patchAccount(patch) {
  if (!session) return;
  const accounts = loadAccounts();
  const acc = accounts[session.username];
  if (!acc) return;
  const next = { ...acc, ...patch };
  write(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [acc.username]: next }));
  session = toProfile(next);
  listeners.forEach((l) => l());
}

/** Nama & sekolah sebuah akun di perangkat ini (mode lokal kelas: nama guru untuk siswa). */
export function accountSummary(key) {
  const a = loadAccounts()[key];
  return a ? { name: a.name, school: a.school ?? null } : null;
}

/** Akun siswa yang tersimpan di perangkat ini (dipakai mode lokal kelas). */
export function localStudentNames() {
  return Object.fromEntries(
    Object.values(loadAccounts())
      .filter((a) => a.role !== 'teacher')
      .map((a) => [a.username, a.name]),
  );
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

/**
 * Tandai panduan awal sudah selesai/dilewati untuk akun yang sedang masuk (tidak muncul otomatis lagi).
 * Aman dipanggil berkali-kali.
 */
export function completeTour() {
  if (!session) return;
  const accounts = loadAccounts();
  const acc = accounts[session.username];
  if (!acc) return;
  if (acc.tourPending === true || !acc.tourDoneAt) {
    const next = { ...acc, tourPending: false, tourDoneAt: acc.tourDoneAt ?? new Date().toISOString() };
    write(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [acc.username]: next }));
    session = toProfile(next);
    listeners.forEach((l) => l());
    if (acc.token) apiFetch('/me', { method: 'PATCH', token: acc.token, body: { preferences: { tourDone: true } } }).catch(() => {});
  }
}

/**
 * Simpan preferensi suara (Musik, volume, Efek suara) ke akun yang sedang masuk — di perangkat dan,
 * bila memakai server sekolah, di server — agar berlaku lagi saat masuk kembali.
 * @returns {boolean} true bila ada perubahan yang disimpan
 */
export function saveAudioPrefs(settings = getSettings()) {
  if (!session) return false;
  const accounts = loadAccounts();
  const acc = accounts[session.username];
  if (!acc) return false;
  const audio = audioPrefsOf(settings);
  if (AUDIO_KEYS.every((k) => acc.prefs?.[k] === audio[k])) return false;
  write(ACCOUNTS_KEY, JSON.stringify({ ...accounts, [acc.username]: { ...acc, prefs: { ...(acc.prefs ?? {}), ...audio } } }));
  if (acc.token) apiFetch('/me', { method: 'PATCH', token: acc.token, body: { preferences: audio } }).catch(() => {});
  return true;
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
