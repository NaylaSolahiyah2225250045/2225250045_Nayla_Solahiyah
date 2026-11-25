/**
 * Visual matematika Asisten Belajar (RMT: Mathematically Specific Psychological Tools) — docs/AI-TUTOR.md.
 *
 * Visual dibuat oleh APLIKASI (lib/assistantVisuals.js + lib/sci), bukan oleh AI, sehingga setiap angkanya
 * terverifikasi mesin. Visual memakai CONTOH SERUPA di bawah ini — bukan bilangan soal — agar jawaban akhir
 * tidak bocor. Bila sebuah contoh kebetulan sama dengan bilangan di soal, contoh berikutnya yang dipakai.
 */

export const VISUAL_LABELS = {
  'nilai-tempat': 'Tabel nilai tempat',
  'kelompok-nol': 'Susunan angka & kelompok nol',
  'garis-bilangan': 'Garis bilangan pangkat 10',
  'geser-koma': 'Pergeseran koma',
  'ubah-bentuk': 'Langkah mengubah bentuk',
  'kali-bagi': 'Diagram kali & bagi',
  'tambah-kurang': 'Diagram tambah & kurang',
  pmstp: 'Tabel PMSTP',
};

/** Contoh serupa (minimal dua per jenis, agar selalu ada yang berbeda dari soal). */
export const VISUAL_EXAMPLES = {
  placeBig: ['6.384', '2.917'],
  placeSmall: ['0,529', '0,836'],
  powBig: [5, 7],
  powSmall: [-4, -5],
  shiftBig: ['67.000', '830.000'],
  shiftSmall: ['0,0056', '0,00092'],
  shiftMiddleBig: ['40.600', '309.000'],
  shiftMiddleSmall: ['0,000507', '0,0803'],
  mul: [
    [{ a: '3', n: 2 }, { a: '4', n: 5 }],
    [{ a: '2', n: 6 }, { a: '3', n: 1 }],
  ],
  div: [
    [{ a: '8', n: 9 }, { a: '2', n: 3 }],
    [{ a: '9', n: 7 }, { a: '3', n: 2 }],
  ],
  add: [
    [{ a: '2,1', n: 5 }, { a: '3,4', n: 5 }],
    [{ a: '1,2', n: 3 }, { a: '6,3', n: 3 }],
  ],
  sub: [
    [{ a: '7', n: 6 }, { a: '2', n: 5 }],
    [{ a: '9', n: 4 }, { a: '4', n: 3 }],
  ],
};

/** Pertanyaan pembuka (sekali ketuk) — mewakili jenis bantuan: konsep, perhitungan, memahami soal. */
export const STARTERS = ['Aku belum paham konsepnya', 'Aku macet saat menghitung', 'Aku bingung maksud soalnya'];

/** Siklus PMSTP NoBaku sebagai tabel kerja (tanpa angka: siswa yang mengisi). */
export const PMSTP_ROWS = [
  { step: 'Pahami', ask: 'Apa yang diketahui? Apa yang ditanya? Satuannya apa?' },
  { step: 'Modelkan', ask: 'Samakan satuannya, lalu pilih operasinya: kali atau bagi?' },
  { step: 'Selesaikan', ask: 'Hitung angka depannya dulu, lalu pangkatnya.' },
  { step: 'Tafsirkan', ask: 'Tulis hasilnya dengan satuan dalam kalimat jawaban.' },
  { step: 'Periksa', ask: 'Apakah hasilnya masuk akal? Coba cek balik.' },
];
