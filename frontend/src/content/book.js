/**
 * Buku digital Materi. Bab 1 = pengantar bilangan berpangkat (pengertian, bentuk umum, contoh),
 * Bab 2 = bentuk baku (notasi ilmiah), Bab 3 = nol di tengah (Modul 4), Bab 4 = kembali ke bentuk biasa (Modul 5). Satu konsep per halaman, ±40 kata (CLAUDE.md §2).
 * Semua hasil hitungan (pangkat, bentuk baku, bentuk biasa) dihitung saat tampil oleh lib/sci / BigInt
 * dan divalidasi di content.test.js — tidak diketik manual.
 *
 * Jenis blok:
 *  h        : { t:'h', text }                       judul halaman
 *  p        : { t:'p', text }                       paragraf pendek
 *  power    : { t:'power', base, exp }              aⁿ = a × a × … = hasil
 *  anatomy  : { t:'anatomy' }                       aⁿ dengan label basis & pangkat
 *  tenTable : { t:'tenTable', from, to }            10ⁿ = bentuk biasa
 *  formula  : { t:'formula' }                       a × 10ⁿ, 1 ≤ a < 10
 *  convert  : { t:'convert', value, focus? }        bentuk biasa → bentuk baku + langkah (focus 'zero' = langkah nol di tengah)
 *  list     : { t:'list', items, ordered? }         daftar poin / langkah bernomor
 *  zeros    : { t:'zeros', value }                  peran angka nol (depan / tengah / belakang)
 *  backWork : { t:'backWork', a, n }                bentuk baku → bentuk biasa: jalur koma + langkah
 *  try      : { t:'try', items:[{value}|{a,n}] }    latihan singkat + pembahasan yang bisa dibuka
 *  back     : { t:'back', a, n }                    bentuk baku → bentuk biasa
 *  facts    : { t:'facts', items:[{label, value}] } konteks nyata → bentuk baku
 *  tip      : { t:'tip', text }                     catatan / awas
 *  links    : { t:'links' }                         tautan ke Latihan, Lab Koma, Catatan Pintar
 */

export const CHAPTERS = [
  { id: 'bab1', no: 1, title: 'Bilangan Berpangkat', short: 'Berpangkat' },
  { id: 'bab2', no: 2, title: 'Bentuk Baku (Notasi Ilmiah)', short: 'Bentuk Baku' },
  { id: 'bab3', no: 3, title: 'Nol di Tengah', short: 'Nol di Tengah' },
  { id: 'bab4', no: 4, title: 'Kembali ke Bentuk Biasa', short: 'Bentuk Biasa' },
];

/** @type {{ chapter: string|null, cover?: boolean, blocks: object[] }[]} */
export const BOOK_PAGES = [
  { chapter: null, cover: true, blocks: [] },

  // ---------- Bab 1: Bilangan berpangkat ----------
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Apa itu bilangan berpangkat?' },
      { t: 'p', text: 'Bilangan berpangkat adalah cara singkat menulis perkalian berulang dengan bilangan yang sama.' },
      { t: 'power', base: 2, exp: 3 },
      { t: 'p', text: 'Dibaca: "dua pangkat tiga". Angka 2 dikalikan sebanyak 3 kali.' },
    ],
  },
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Bentuk umum' },
      { t: 'anatomy' },
      { t: 'p', text: 'a disebut basis: bilangan yang dikalikan. n disebut pangkat: banyaknya faktor a.' },
      { t: 'tip', text: 'aⁿ = a × a × … × a, sebanyak n faktor.' },
    ],
  },
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Contoh sederhana' },
      { t: 'power', base: 3, exp: 2 },
      { t: 'power', base: 5, exp: 3 },
      { t: 'power', base: 2, exp: 5 },
      { t: 'tip', text: 'Awas tertukar: 2³ = 2 × 2 × 2 = 8, bukan 2 × 3 = 6.' },
    ],
  },
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Pangkat dari 10' },
      { t: 'p', text: 'Pangkat dari 10 paling sering dipakai. Perhatikan banyaknya angka nol.' },
      { t: 'tenTable', from: 1, to: 6 },
      { t: 'tip', text: 'Pangkat 10 = banyaknya angka nol di belakang angka 1.' },
    ],
  },
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Pangkat nol & pangkat negatif' },
      { t: 'p', text: 'Setiap pangkat turun satu, nilainya dibagi 10. Jadi 10⁰ = 1, lalu pangkat negatif menghasilkan bilangan kurang dari 1.' },
      { t: 'tenTable', from: 0, to: -4 },
      { t: 'tip', text: 'Pangkat negatif bukan berarti bilangannya negatif. 10⁻² = 0,01 (positif, tetapi kecil).' },
    ],
  },

  // ---------- Bab 2: Bentuk baku ----------
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Apa itu bentuk baku?' },
      { t: 'p', text: 'Bentuk baku (notasi ilmiah) menulis bilangan sebagai perkalian dua bagian:' },
      { t: 'formula' },
      { t: 'p', text: 'a adalah bilangan dari 1 sampai kurang dari 10. n adalah bilangan bulat (boleh positif, nol, atau negatif).' },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Kenapa perlu bentuk baku?' },
      { t: 'p', text: 'Bilangan sangat besar atau sangat kecil sulit dibaca karena nolnya banyak. Bentuk baku membuatnya ringkas.' },
      {
        t: 'facts',
        items: [
          { label: 'Jarak Bumi–Matahari (km)', value: '150.000.000' },
          { label: 'Ukuran sel darah merah (m)', value: '0,0000075' },
        ],
      },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Bilangan besar → pangkat positif' },
      { t: 'convert', value: '4.500.000' },
      { t: 'tip', text: 'Koma melompat ke kiri → pangkatnya positif.' },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Bilangan kecil → pangkat negatif' },
      { t: 'convert', value: '0,00032' },
      { t: 'tip', text: 'Koma melompat ke kanan → pangkatnya negatif.' },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Nol di tengah tetap ditulis' },
      { t: 'convert', value: '7.050.000' },
      { t: 'tip', text: 'Nol yang diapit angka bukan nol tidak boleh dibuang: 7,05, bukan 7,5.' },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Kembali ke bentuk biasa' },
      { t: 'p', text: 'Pangkat positif: geser koma ke kanan. Pangkat negatif: geser koma ke kiri. Tambahkan nol bila perlu.' },
      { t: 'back', a: '2,3', n: 4 },
      { t: 'back', a: '6', n: -3 },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Cek kewajaran jawabanmu' },
      { t: 'p', text: 'Bilangan lebih dari 10 → n positif. Bilangan antara 0 dan 1 → n negatif. Bilangan dari 1 sampai kurang dari 10 → n = 0.' },
      { t: 'tip', text: 'Selalu periksa: apakah a sudah di antara 1 dan 10?' },
    ],
  },
  // ---------- Bab 3: Nol di tengah (Modul 4) ----------
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Tiga jenis nol' },
      { t: 'p', text: 'Setiap angka nol punya peran berbeda, tergantung letaknya terhadap angka bukan nol.' },
      {
        t: 'list',
        items: [
          'Nol depan: sebelum angka bukan nol pertama. Menentukan pangkat, lalu dibuang.',
          'Nol tengah: diapit angka bukan nol. Tetap ditulis.',
          'Nol belakang: setelah angka bukan nol terakhir. Dibuang.',
        ],
      },
      { t: 'tip', text: 'Membuang nol tengah mengubah nilai: 7,05 tidak sama dengan 7,5.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Nol pada bilangan besar' },
      { t: 'p', text: 'Pada 70.080.000, nol di antara 7 dan 8 adalah nol tengah. Nol setelah angka 8 adalah nol belakang.' },
      { t: 'zeros', value: '70.080.000' },
      { t: 'tip', text: 'Nol tengah ditulis, nol belakang dibuang → a = 7,008.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Nol pada bilangan kecil' },
      { t: 'p', text: 'Pada 0,000506, nol sebelum angka 5 adalah nol depan. Nol di antara 5 dan 6 adalah nol tengah.' },
      { t: 'zeros', value: '0,000506' },
      { t: 'tip', text: 'Nol depan hanya menentukan pangkat → a = 5,06.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Aturan singkat' },
      {
        t: 'list',
        ordered: true,
        items: [
          'Cari angka bukan nol pertama dan angka bukan nol terakhir.',
          'Tulis semua angka di antara keduanya, termasuk nolnya.',
          'Taruh koma tepat setelah angka bukan nol pertama.',
          'Hitung lompatan koma untuk pangkatnya, seperti di Bab 2.',
        ],
      },
      { t: 'tip', text: 'Cek: ubah jawabanmu kembali ke bentuk biasa (Bab 4). Hasilnya harus sama persis dengan soal.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Contoh: bilangan besar' },
      { t: 'convert', value: '3.004.000', focus: 'zero' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Contoh: bilangan kecil' },
      { t: 'convert', value: '0,00907', focus: 'zero' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Coba sendiri' },
      { t: 'p', text: 'Tulis dalam bentuk baku. Kerjakan dulu, lalu buka pembahasannya.' },
      { t: 'try', items: [{ value: '5.008.000' }, { value: '0,0302' }, { value: '60.500' }] },
    ],
  },

  // ---------- Bab 4: Kembali ke bentuk biasa (Modul 5) ----------
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Membalik langkah' },
      { t: 'p', text: 'Bentuk baku bisa diubah kembali menjadi bentuk biasa. Mulai dari a, lalu koma melompat kembali ke tempat asalnya.' },
      {
        t: 'list',
        items: ['Pangkat positif → koma ke kanan, bilangannya besar.', 'Pangkat negatif → koma ke kiri, bilangannya kecil.', 'Banyak lompatan = angka pada pangkat.'],
      },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Pangkat positif: geser ke kanan' },
      { t: 'backWork', a: '2,5', n: 8 },
      { t: 'tip', text: 'Tempat kosong di belakang diisi nol.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Pangkat negatif: geser ke kiri' },
      { t: 'backWork', a: '6,02', n: -3 },
      { t: 'tip', text: 'Tempat kosong di depan diisi nol.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Empat langkah' },
      {
        t: 'list',
        ordered: true,
        items: [
          'Lihat tanda pangkat: positif → ke kanan, negatif → ke kiri.',
          'Geser koma sebanyak angka pada pangkatnya.',
          'Isi tempat yang kosong dengan nol.',
          'Beri titik ribuan, lalu cek kewajarannya.',
        ],
      },
      { t: 'tip', text: 'Pangkat 0: koma tidak bergeser, karena 10⁰ = 1. Jadi 4,7 × 10⁰ = 4,7.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Contoh: koma berhenti di tengah' },
      { t: 'backWork', a: '3,456', n: 2 },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Cek kewajaran' },
      { t: 'p', text: 'Pangkat n → hasilnya punya n + 1 angka sebelum koma. Pangkat −n → angka bukan nol pertama ada di posisi ke-n setelah koma.' },
      { t: 'back', a: '1,2', n: 5 },
      { t: 'back', a: '7', n: -5 },
      { t: 'tip', text: '120.000 punya 6 angka (5 + 1). Pada 0,00007, angka 7 ada di posisi ke-5.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Coba sendiri' },
      { t: 'p', text: 'Tulis dalam bentuk biasa. Kerjakan dulu, lalu buka pembahasannya.' },
      { t: 'try', items: [{ a: '4,08', n: 6 }, { a: '9,1', n: -4 }, { a: '7,08', n: 5 }] },
    ],
  },

  // ---------- Penutup buku ----------
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Saatnya mencoba!' },
      { t: 'p', text: 'Kamu sudah menyelesaikan buku ini. Latih pemahamanmu di jalur Latihan, atau bereksperimen menggeser koma di Lab Koma.' },
      { t: 'links' },
    ],
  },
];
