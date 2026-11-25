/**
 * Audio NoBaku: musik latar di SELURUH halaman (disetujui pengembang, 21 Nov 2026; dijalankan sekali oleh
 * components/GlobalMusic.jsx sehingga tidak mengulang saat pindah halaman) + efek suara singkat (17 Nov 2026).
 * Semua bunyi DISINTESIS dengan Web Audio API (oscillator + envelope) — tidak ada berkas audio
 * dari pihak lain, jadi bebas lisensi dan tidak menambah ukuran aplikasi.
 *
 * Aturan:
 *  - Browser (terutama HP) hanya mengizinkan suara setelah interaksi pertama → unlockAudio()
 *    dipanggil pada sentuhan/klik/tombol pertama.
 *  - Efek suara tidak bertumpuk: bunyi baru menghentikan bunyi sebelumnya dengan halus;
 *    bunyi `queue` (lencana) menunggu bunyi sebelumnya selesai.
 *  - Volume rendah (MASTER_VOLUME) agar tidak mengagetkan; volume musik diatur pengguna (0–100).
 *  - Saat efek suara berbunyi, musik dikecilkan sebentar (ducking) agar tidak bertabrakan.
 *  - Patuh pada pengaturan `music` & `sfx` (lib/settings.js).
 */
import { getSettings } from './settings.js';

export const MASTER_VOLUME = 0.5;
export const SFX_VOLUME = 0.32;

/** Frekuensi dari nomor nada MIDI (69 = A4 = 440 Hz). */
export const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

/**
 * Efek suara: daftar nada { m: MIDI, t: mulai (detik), d: lama (detik), type, v: volume 0–1 }.
 * Lembut: gelombang sinus/segitiga, serangan cepat, peluruhan eksponensial.
 */
export const SFX = {
  click: [{ m: 84, t: 0, d: 0.06, type: 'sine', v: 0.35 }],
  menu: [
    { m: 79, t: 0, d: 0.07, type: 'sine', v: 0.35 },
    { m: 84, t: 0.06, d: 0.1, type: 'sine', v: 0.35 },
  ],
  correct: [
    { m: 72, t: 0, d: 0.12, type: 'triangle', v: 0.6 },
    { m: 76, t: 0.09, d: 0.12, type: 'triangle', v: 0.6 },
    { m: 79, t: 0.18, d: 0.12, type: 'triangle', v: 0.6 },
    { m: 84, t: 0.27, d: 0.28, type: 'sine', v: 0.55 },
  ],
  wrong: [
    { m: 64, t: 0, d: 0.16, type: 'triangle', v: 0.45 },
    { m: 60, t: 0.15, d: 0.26, type: 'triangle', v: 0.4 },
  ],
  level: [
    { m: 72, t: 0, d: 0.12, type: 'triangle', v: 0.55 },
    { m: 76, t: 0.11, d: 0.12, type: 'triangle', v: 0.55 },
    { m: 79, t: 0.22, d: 0.12, type: 'triangle', v: 0.55 },
    { m: 84, t: 0.33, d: 0.18, type: 'triangle', v: 0.55 },
    { m: 79, t: 0.5, d: 0.1, type: 'sine', v: 0.45 },
    { m: 84, t: 0.6, d: 0.45, type: 'sine', v: 0.55 },
  ],
  quiz: [
    { m: 67, t: 0, d: 0.14, type: 'triangle', v: 0.5 },
    { m: 72, t: 0.13, d: 0.14, type: 'triangle', v: 0.5 },
    { m: 76, t: 0.26, d: 0.14, type: 'triangle', v: 0.5 },
    { m: 79, t: 0.39, d: 0.14, type: 'triangle', v: 0.5 },
    { m: 84, t: 0.55, d: 0.2, type: 'triangle', v: 0.55 },
    { m: 76, t: 0.55, d: 0.2, type: 'sine', v: 0.3 },
    { m: 88, t: 0.78, d: 0.6, type: 'sine', v: 0.5 },
    { m: 79, t: 0.78, d: 0.6, type: 'sine', v: 0.3 },
  ],
  badge: [
    { m: 88, t: 0, d: 0.09, type: 'sine', v: 0.4 },
    { m: 91, t: 0.07, d: 0.09, type: 'sine', v: 0.4 },
    { m: 96, t: 0.14, d: 0.12, type: 'sine', v: 0.4 },
    { m: 100, t: 0.24, d: 0.4, type: 'sine', v: 0.35 },
  ],
};

/** Lama satu efek suara (detik). */
export const sfxDuration = (name) => Math.max(...SFX[name].map((n) => n.t + n.d)) + 0.05;

/* ---------------------------------------------------------------- konteks audio */
let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;

function ensure() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_VOLUME;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
  } catch {
    ctx = null;
  }
  return ctx;
}

let unlocked = false;
/** Panggil dari interaksi pengguna (klik/sentuh/tombol). Aman dipanggil berkali-kali. */
export function unlockAudio() {
  const c = ensure();
  if (!c) return;
  unlocked = true;
  if (c.state === 'suspended') c.resume().catch(() => {});
}
export const isAudioUnlocked = () => unlocked;

/** Satu nada lembut ke `bus`. Mengembalikan node agar bisa dihentikan. */
function tone(bus, { m, t, d, type = 'sine', v = 0.5 }, at) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = midiToHz(m);
  const start = at + t;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(v, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + d + 0.08);
  osc.connect(g);
  g.connect(bus);
  osc.start(start);
  osc.stop(start + d + 0.1);
  return { osc, g };
}

/* ---------------------------------------------------------------- efek suara */
let current = null; // { voices, endAt }
let queued = null;

function stopCurrent() {
  if (!current || !ctx) return;
  const now = ctx.currentTime;
  for (const { osc, g } of current.voices) {
    try {
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(0.0001, now, 0.015);
      osc.stop(now + 0.08);
    } catch {
      /* sudah berhenti */
    }
  }
  current = null;
}

/**
 * Putar efek suara. `queue: true` → tunggu bunyi sebelumnya selesai (untuk lencana).
 * @param {keyof typeof SFX} name
 * @param {{ queue?: boolean }} [opts]
 */
export function playSfx(name, { queue = false } = {}) {
  if (!SFX[name] || !getSettings().sfx || !unlocked) return;
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const now = c.currentTime;
  if (queue && current && current.endAt > now) {
    clearTimeout(queued);
    queued = setTimeout(() => playSfx(name), (current.endAt - now) * 1000 + 60);
    return;
  }
  stopCurrent();
  const at = now + 0.01;
  current = { voices: SFX[name].map((n) => tone(sfxBus, n, at)), endAt: at + sfxDuration(name) };
  duckMusic(current.endAt);
}

/* ---------------------------------------------------------------- musik latar */
/*
 * Lagu "Langit Ceria" (21 Nov 2026): instrumental ceria & lembut, 112 bpm, C mayor.
 * Akor I–V–vi–IV, I–V–IV–V; melodi pentatonik C bernada lonceng (tanpa vokal), petikan halus di sela
 * melodi, bas lembut. Melodi berbunyi sejak ketukan pertama — tidak ada intro hening.
 */
const BPM = 112;
const STEP = 60 / BPM / 2; // seperdelapan
/** Volume musik maksimum (pengaturan volume 100). */
export const MUSIC_MAX = 0.26;
export const MUSIC = {
  chords: [
    [48, 60, 64, 67], // C
    [43, 59, 62, 67], // G
    [45, 57, 60, 64], // Am
    [41, 57, 60, 65], // F
    [48, 60, 64, 67], // C
    [43, 59, 62, 67], // G
    [41, 57, 60, 65], // F
    [43, 59, 62, 67], // G
  ],
  melody: [
    [72, 76, 79, null, 76, null, 79, 81],
    [79, null, 74, null, 76, 74, 72, null],
    [72, 76, 81, null, 79, null, 76, null],
    [72, null, 74, 76, 74, null, 72, null],
    [76, 79, 84, null, 81, 79, 76, null],
    [74, null, 79, null, 74, 76, 79, null],
    [81, null, 79, 76, 72, null, 74, null],
    [76, null, 74, null, 72, null, null, null],
  ],
};

/** Gain musik untuk volume 0–100. */
export const musicGainFor = (volume) => (MUSIC_MAX * Math.min(100, Math.max(0, volume ?? 60))) / 100;

let timer = null;
let step = 0;
let nextAt = 0;
let playing = false;
const target = () => musicGainFor(getSettings().volume);

function scheduleStep(i, at) {
  const bar = Math.floor(i / 8) % MUSIC.melody.length;
  const pos = i % 8;
  const [bass, ...pad] = MUSIC.chords[bar];
  if (pos === 0) tone(musicBus, { m: bass, t: 0, d: STEP * 3.4, type: 'triangle', v: 0.5 }, at);
  if (pos === 4) tone(musicBus, { m: bass + 7, t: 0, d: STEP * 2.6, type: 'triangle', v: 0.36 }, at);
  if (pos === 0) pad.forEach((m) => tone(musicBus, { m, t: 0, d: STEP * 7.6, type: 'sine', v: 0.09 }, at));
  const mel = MUSIC.melody[bar][pos];
  if (mel) {
    tone(musicBus, { m: mel, t: 0, d: STEP * 1.5, type: 'sine', v: 0.36 }, at); // lonceng
    tone(musicBus, { m: mel + 12, t: 0, d: STEP * 0.7, type: 'sine', v: 0.06 }, at); // kilau
  } else if (pos % 2 === 1) {
    tone(musicBus, { m: pad[(pos >> 1) % pad.length] + 12, t: 0, d: STEP * 0.8, type: 'triangle', v: 0.07 }, at); // petikan
  }
}

/** Mulai musik (fade-in singkat, langsung bermelodi). Hanya bila pengaturan musik aktif & audio sudah dibuka. */
export function startMusic() {
  if (!getSettings().music || !unlocked) return false;
  const c = ensure();
  if (!c) return false;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const now = c.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
  musicBus.gain.linearRampToValueAtTime(target(), now + 0.35);
  if (playing) return true;
  playing = true;
  // Lanjutkan dari posisi lagu terakhir (tidak mengulang dari awal saat dinyalakan lagi).
  nextAt = now + 0.02;
  timer = setInterval(() => {
    while (nextAt < c.currentTime + 0.15) {
      scheduleStep(step, nextAt);
      step = (step + 1) % (MUSIC.melody.length * 8);
      nextAt += STEP;
    }
  }, 40);
  return true;
}

/** Ubah volume musik yang sedang berjalan dengan halus. */
export function applyMusicVolume() {
  if (!ctx || !playing) return;
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
  musicBus.gain.linearRampToValueAtTime(target(), now + 0.15);
}

/** Kecilkan musik sebentar selama efek suara berbunyi (agar tidak bertabrakan). */
function duckMusic(until) {
  if (!ctx || !playing) return;
  const now = ctx.currentTime;
  const t = target();
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
  musicBus.gain.linearRampToValueAtTime(t * 0.4, now + 0.04);
  musicBus.gain.setValueAtTime(t * 0.4, until);
  musicBus.gain.linearRampToValueAtTime(t, until + 0.3);
}

/** Hentikan musik dengan fade-out halus. */
export function stopMusic(fade = 0.8) {
  if (!ctx || !playing) return;
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
  musicBus.gain.linearRampToValueAtTime(0.0001, now + fade);
  // Hentikan penjadwal sekarang juga (nada yang sudah terjadwal ±0,15 detik ikut memudar),
  // agar menyalakan lagi dengan cepat tidak membuat nada dobel.
  clearInterval(timer);
  timer = null;
  playing = false;
}

/**
 * Coba buka audio tanpa menunggu interaksi (berhasil bila browser mengizinkan autoplay,
 * mis. pengguna sering membuka situs ini). Bila diblokir, musik menunggu interaksi pertama.
 * @returns {Promise<boolean>}
 */
export async function tryAutoplay() {
  const c = ensure();
  if (!c) return false;
  try {
    if (c.state === 'suspended') await Promise.race([c.resume(), new Promise((r) => setTimeout(r, 300))]);
  } catch {
    return false;
  }
  if (c.state === 'running') unlocked = true;
  return unlocked;
}

export const isMusicPlaying = () => playing;
