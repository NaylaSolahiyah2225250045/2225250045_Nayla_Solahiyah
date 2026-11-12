/**
 * Konten Lab Koma: contoh bilangan (dengan konteks nyata) & pesan umpan balik.
 * Bentuk baku tiap contoh dihitung oleh lib/sci (tidak diketik manual) — divalidasi di content.test.js.
 */

/** @type {{ value: string, label: string, group: 'besar'|'kecil' }[]} */
export const LAB_PRESETS = [
  { value: '4.500.000', label: 'Latihan', group: 'besar' },
  { value: '150.000.000', label: 'Jarak Bumi–Matahari (km)', group: 'besar' },
  { value: '300.000.000', label: 'Kecepatan cahaya (m/s)', group: 'besar' },
  { value: '8.000.000.000', label: 'Penduduk dunia (± orang)', group: 'besar' },
  { value: '0,00032', label: 'Latihan', group: 'kecil' },
  { value: '0,000001', label: 'Panjang bakteri (± m)', group: 'kecil' },
  { value: '0,0000075', label: 'Sel darah merah (± m)', group: 'kecil' },
  { value: '0,0000000001', label: 'Diameter atom (± m)', group: 'kecil' },
];

export const LAB_INPUT_ERRORS = {
  kosong: 'Tulis bilangannya dulu, ya.',
  format: 'Tulis seperti 4.500.000 atau 0,00032 (koma untuk desimal).',
  nol: 'Nol tidak punya bentuk baku. Coba bilangan lain.',
  negatif: 'Di Lab Koma pakai bilangan positif dulu, ya.',
  panjang: 'Maksimal 12 angka agar muat di layar.',
};

/** Pesan umpan balik — pendek (≤ 40 kata) sesuai prinsip beban kognitif. */
export const LAB_TEXT = {
  start: 'Seret koma oranye, ketuk celah di antara angka, atau pakai tombol Geser.',
  moveLeft: 'Koma ke kiri 1 langkah → bilangannya 10× lebih kecil, jadi pangkat 10 naik 1. Nilainya tetap sama.',
  moveRight: 'Koma ke kanan 1 langkah → bilangannya 10× lebih besar, jadi pangkat 10 turun 1. Nilainya tetap sama.',
  big: (a, m) => `a = ${a} masih 10 atau lebih. Geser koma ke kiri ${m} langkah lagi.`,
  small: (a, m) => `a = ${a} masih kurang dari 1. Geser koma ke kanan ${m} langkah lagi.`,
  normal: (a) => `Bentuk baku! a = ${a} sudah di antara 1 dan 10.`,
  alreadyNormal: 'Bilangan ini sudah berbentuk baku. Pangkatnya 0, karena 10⁰ = 1.',
  why: (steps, dir, k) => `Koma bergeser ${steps} langkah ${dir}, jadi pangkatnya ${k}.`,
  efficient: (moves) => `Hebat! Kamu sampai dengan ${moves} geseran — paling sedikit.`,
  detour: (moves, best) => `Kamu memakai ${moves} geseran. Jalan terpendek: ${best} geseran.`,
};

/** Kartu "Kenapa begitu?" (dibaca bila perlu, tidak wajib). */
export const LAB_RULES = [
  { title: 'Ke kiri = pangkat naik', text: 'Setiap koma melompat ke kiri, bilangan jadi 10× lebih kecil. Supaya nilainya tetap, kalikan 10 sekali lagi.', tone: 'pos' },
  { title: 'Ke kanan = pangkat turun', text: 'Setiap koma melompat ke kanan, bilangan jadi 10× lebih besar. Supaya nilainya tetap, pangkat 10 dikurangi 1.', tone: 'neg' },
  { title: 'Kapan berhenti?', text: 'Berhenti saat koma tepat setelah angka bukan nol pertama: 1 ≤ a < 10.', tone: 'ok' },
];
