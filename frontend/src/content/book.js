/**
 * Buku digital Materi — lima bab sesuai lima topik (disusun ulang 16 Nov 2026):
 *   Bab 1 Pangkat Sepuluh dan Nilai Tempat · Bab 2 Bilangan Besar dan Bilangan Kecil ·
 *   Bab 3 Mengubah Bentuk Biasa dan Bentuk Baku · Bab 4 Operasi Hitung Bentuk Baku · Bab 5 Penerapan Bentuk Baku.
 * Satu konsep per halaman, ±40 kata (CLAUDE.md §2). Semua hasil hitungan (pangkat, bentuk baku, bentuk biasa,
 * kali/bagi) dihitung saat tampil oleh lib/sci / BigInt dan divalidasi di content.test.js — tidak diketik manual.
 *
 * Jenis blok:
 *  h        : { t:'h', text }                       judul halaman
 *  p        : { t:'p', text }                       paragraf pendek
 *  list     : { t:'list', items, ordered? }         daftar poin / langkah bernomor
 *  power    : { t:'power', base, exp }              aⁿ = a × a × … = hasil
 *  anatomy  : { t:'anatomy' }                       aⁿ dengan label basis & pangkat
 *  tenTable : { t:'tenTable', from, to }            10ⁿ = bentuk biasa
 *  places   : { t:'places', value }                 setiap angka dengan nilai tempatnya (10ⁿ)
 *  expand   : { t:'expand', value }                 bilangan = jumlah (angka × 10ⁿ)
 *  formula  : { t:'formula' }                       a × 10ⁿ, 1 ≤ a < 10
 *  compare  : { t:'compare', items:[{a,n}] }        urutan bilangan bentuk baku dari terbesar
 *  convert  : { t:'convert', value, focus? }        bentuk biasa → bentuk baku + langkah (focus 'zero' = langkah nol di tengah)
 *  zeros    : { t:'zeros', value }                  peran angka nol (depan / tengah / belakang)
 *  back     : { t:'back', a, n }                    bentuk baku → bentuk biasa
 *  backWork : { t:'backWork', a, n }                bentuk baku → bentuk biasa: jalur koma + langkah
 *  rule     : { t:'rule', lines }                   rumus aturan pangkat
 *  op       : { t:'op', op, x:{a,n}, y:{a,n}, text?, unit? }  kali/bagi bentuk baku + langkah
 *  units    : { t:'units', rows:[{label, n, unit?}] }  satuan sebagai pangkat 10
 *  facts    : { t:'facts', items:[{label, value}] } konteks nyata → bentuk baku
 *  try      : { t:'try', items:[{value}|{a,n}|{op,x,y,text?,unit?}] }  latihan singkat + pembahasan yang bisa dibuka
 *  tip      : { t:'tip', text }                     catatan / awas
 *  links    : { t:'links' }                         tautan ke Latihan, Lab Koma, Catatan Pintar
 */

export const CHAPTERS = [
  { id: 'bab1', no: 1, title: 'Pangkat Sepuluh dan Nilai Tempat', short: 'Pangkat 10' },
  { id: 'bab2', no: 2, title: 'Bilangan Besar dan Bilangan Kecil', short: 'Besar & Kecil' },
  { id: 'bab3', no: 3, title: 'Mengubah Bentuk Biasa dan Bentuk Baku', short: 'Ubah Bentuk' },
  { id: 'bab4', no: 4, title: 'Operasi Hitung Bentuk Baku', short: 'Kali & Bagi' },
  { id: 'bab5', no: 5, title: 'Penerapan Bentuk Baku', short: 'Penerapan' },
];

/** @type {{ chapter: string|null, cover?: boolean, blocks: object[] }[]} */
export const BOOK_PAGES = [
  { chapter: null, cover: true, blocks: [] },

  // ---------- Bab 1: Pangkat sepuluh & nilai tempat ----------
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Apa itu bilangan berpangkat?' },
      {
        t: 'p',
        text: 'Bilangan berpangkat adalah cara singkat menulis perkalian berulang dengan bilangan yang sama.',
      },
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
      {
        t: 'p',
        text: 'Setiap pangkat turun satu, nilainya dibagi 10. Jadi 10⁰ = 1, lalu pangkat negatif menghasilkan bilangan kurang dari 1.',
      },
      { t: 'tenTable', from: 0, to: -4 },
      {
        t: 'tip',
        text: 'Pangkat negatif bukan berarti bilangannya negatif. 10⁻² = 0,01 (positif, tetapi kecil).',
      },
    ],
  },
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Pangkat 10 dan nilai tempat' },
      {
        t: 'p',
        text: 'Setiap tempat pada bilangan punya nilai tempat berupa pangkat 10. Bergeser satu tempat ke kiri, pangkatnya naik satu.',
      },
      { t: 'places', value: '2.536,47' },
      { t: 'tip', text: 'Tempat pertama setelah koma bernilai 10⁻¹ = 0,1.' },
    ],
  },
  {
    chapter: 'bab1',
    blocks: [
      { t: 'h', text: 'Nilai angka menurut posisinya' },
      {
        t: 'p',
        text: 'Nilai sebuah angka = angka itu × nilai tempatnya. Jumlahkan semuanya, hasilnya bilangan semula.',
      },
      { t: 'expand', value: '4.836' },
      {
        t: 'tip',
        text: 'Angka yang sama bisa bernilai berbeda: 3 pada 30 bernilai 30, tetapi pada 0,3 bernilai 0,3.',
      },
    ],
  },

  // ---------- Bab 2: Bilangan besar & bilangan kecil ----------
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Apa itu bentuk baku?' },
      { t: 'p', text: 'Bentuk baku (notasi ilmiah) menulis bilangan sebagai perkalian dua bagian:' },
      { t: 'formula' },
      {
        t: 'p',
        text: 'a adalah bilangan dari 1 sampai kurang dari 10. n adalah bilangan bulat (boleh positif, nol, atau negatif).',
      },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Kenapa perlu bentuk baku?' },
      {
        t: 'p',
        text: 'Bilangan sangat besar atau sangat kecil sulit dibaca karena nolnya banyak. Bentuk baku membuatnya ringkas.',
      },
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
      { t: 'h', text: 'Cek kewajaran jawabanmu' },
      {
        t: 'p',
        text: 'Bilangan lebih dari 10 → n positif. Bilangan antara 0 dan 1 → n negatif. Bilangan dari 1 sampai kurang dari 10 → n = 0.',
      },
      { t: 'tip', text: 'Selalu periksa: apakah a sudah di antara 1 dan 10?' },
    ],
  },
  {
    chapter: 'bab2',
    blocks: [
      { t: 'h', text: 'Membandingkan bentuk baku' },
      {
        t: 'p',
        text: 'Bandingkan pangkatnya dulu. Pangkat lebih besar berarti bilangan lebih besar, karena a selalu di antara 1 dan 10.',
      },
      { t: 'compare', items: [{ a: '2', n: 5 }, { a: '9', n: 4 }, { a: '3', n: -2 }, { a: '8', n: -5 }] },
      { t: 'tip', text: 'Pada pangkat negatif, −2 lebih besar dari −5. Jadi 10⁻² lebih besar dari 10⁻⁵.' },
    ],
  },

  // ---------- Bab 3: Mengubah bentuk biasa & bentuk baku ----------
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Dua arah perubahan' },
      { t: 'p', text: 'Bentuk biasa dan bentuk baku bisa saling diubah.' },
      {
        t: 'list',
        items: [
          'Biasa → baku: koma melompat sampai tepat setelah angka bukan nol pertama. Banyak lompatan = pangkat.',
          'Baku → biasa: koma melompat kembali sebanyak pangkatnya. Tempat kosong diisi nol.',
        ],
      },
      { t: 'tip', text: 'Dua arah ini saling membalik, jadi bisa dipakai untuk memeriksa jawaban.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Bilangan yang sudah berkoma' },
      { t: 'convert', value: '5.432,1' },
      { t: 'tip', text: 'Koma asal tidak selalu di ujung kanan. Hitung lompatan dari koma asal.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Kembali ke bentuk biasa' },
      {
        t: 'p',
        text: 'Pangkat positif: geser koma ke kanan. Pangkat negatif: geser koma ke kiri. Tambahkan nol bila perlu.',
      },
      { t: 'back', a: '2,3', n: 4 },
      { t: 'back', a: '6', n: -3 },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Pangkat positif: geser ke kanan' },
      { t: 'backWork', a: '2,5', n: 8 },
      { t: 'tip', text: 'Tempat kosong di belakang diisi nol.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Pangkat negatif: geser ke kiri' },
      { t: 'backWork', a: '6,02', n: -3 },
      { t: 'tip', text: 'Tempat kosong di depan diisi nol.' },
    ],
  },
  {
    chapter: 'bab3',
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
    chapter: 'bab3',
    blocks: [{ t: 'h', text: 'Contoh: koma berhenti di tengah' }, { t: 'backWork', a: '3,456', n: 2 }],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Cek kewajaran' },
      {
        t: 'p',
        text: 'Pangkat n → hasilnya punya n + 1 angka sebelum koma. Pangkat −n → angka bukan nol pertama ada di posisi ke-n setelah koma.',
      },
      { t: 'back', a: '1,2', n: 5 },
      { t: 'back', a: '7', n: -5 },
      { t: 'tip', text: '120.000 punya 6 angka (5 + 1). Pada 0,00007, angka 7 ada di posisi ke-5.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Coba sendiri: bentuk biasa' },
      { t: 'p', text: 'Tulis dalam bentuk biasa. Kerjakan dulu, lalu buka pembahasannya.' },
      { t: 'try', items: [{ a: '4,08', n: 6 }, { a: '9,1', n: -4 }, { a: '7,08', n: 5 }] },
    ],
  },
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
      {
        t: 'p',
        text: 'Pada 70.080.000, nol di antara 7 dan 8 adalah nol tengah. Nol setelah angka 8 adalah nol belakang.',
      },
      { t: 'zeros', value: '70.080.000' },
      { t: 'tip', text: 'Nol tengah ditulis, nol belakang dibuang → a = 7,008.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Nol pada bilangan kecil' },
      {
        t: 'p',
        text: 'Pada 0,000506, nol sebelum angka 5 adalah nol depan. Nol di antara 5 dan 6 adalah nol tengah.',
      },
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
      {
        t: 'tip',
        text: 'Cek: ubah jawabanmu kembali ke bentuk biasa seperti di halaman sebelumnya. Hasilnya harus sama persis dengan soal.',
      },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [{ t: 'h', text: 'Contoh: bilangan besar' }, { t: 'convert', value: '3.004.000', focus: 'zero' }],
  },
  {
    chapter: 'bab3',
    blocks: [{ t: 'h', text: 'Contoh: bilangan kecil' }, { t: 'convert', value: '0,00907', focus: 'zero' }],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Nol di tengah tetap ditulis' },
      { t: 'convert', value: '7.050.000' },
      { t: 'tip', text: 'Nol yang diapit angka bukan nol tidak boleh dibuang: 7,05, bukan 7,5.' },
    ],
  },
  {
    chapter: 'bab3',
    blocks: [
      { t: 'h', text: 'Coba sendiri: nol di tengah' },
      { t: 'p', text: 'Tulis dalam bentuk baku. Kerjakan dulu, lalu buka pembahasannya.' },
      { t: 'try', items: [{ value: '5.008.000' }, { value: '0,0302' }, { value: '60.500' }] },
    ],
  },

  // ---------- Bab 4: Operasi hitung bentuk baku ----------
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Mengalikan & membagi pangkat 10' },
      {
        t: 'p',
        text: '10³ × 10⁴ berarti tiga faktor 10 dikali empat faktor 10. Semuanya ada tujuh faktor 10, jadi hasilnya 10⁷.',
      },
      { t: 'rule', lines: ['10ᵐ × 10ⁿ = 10ᵐ⁺ⁿ', '10ᵐ : 10ⁿ = 10ᵐ⁻ⁿ'] },
      { t: 'tip', text: 'Kali → pangkat dijumlah. Bagi → pangkat dikurang.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Aturan perkalian' },
      { t: 'rule', lines: ['(a × 10ᵐ) × (b × 10ⁿ) = (a × b) × 10ᵐ⁺ⁿ'] },
      { t: 'op', op: 'kali', x: { a: '2', n: 5 }, y: { a: '4', n: 3 } },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Contoh: hasil perlu dinormalkan' },
      { t: 'op', op: 'kali', x: { a: '4', n: 5 }, y: { a: '5', n: -2 } },
      { t: 'tip', text: 'Bilangan depan 10 atau lebih? Geser koma ke kiri, lalu tambah pangkatnya.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Aturan pembagian' },
      { t: 'rule', lines: ['(a × 10ᵐ) : (b × 10ⁿ) = (a : b) × 10ᵐ⁻ⁿ'] },
      { t: 'op', op: 'bagi', x: { a: '9', n: 7 }, y: { a: '3', n: 2 } },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Contoh: hasil kurang dari 1' },
      { t: 'op', op: 'bagi', x: { a: '2', n: 4 }, y: { a: '8', n: -3 } },
      { t: 'tip', text: 'Bilangan depan kurang dari 1? Geser koma ke kanan, lalu kurangi pangkatnya.' },
    ],
  },
  {
    chapter: 'bab4',
    blocks: [
      { t: 'h', text: 'Coba sendiri' },
      {
        t: 'p',
        text: 'Hitung dan tulis hasilnya dalam bentuk baku. Kerjakan dulu, lalu buka pembahasannya.',
      },
      {
        t: 'try',
        items: [
          { op: 'kali', x: { a: '3', n: 6 }, y: { a: '3', n: -2 } },
          { op: 'bagi', x: { a: '1,8', n: 5 }, y: { a: '6', n: 2 } },
          { op: 'kali', x: { a: '2,5', n: 3 }, y: { a: '4', n: 2 } },
        ],
      },
    ],
  },

  // ---------- Bab 5: Penerapan bentuk baku ----------
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Langkah soal cerita' },
      {
        t: 'list',
        ordered: true,
        items: [
          'Tulis besaran yang diketahui dalam bentuk baku.',
          'Samakan satuannya.',
          'Pilih model: kali atau bagi?',
          'Hitung, lalu periksa satuan jawabannya.',
        ],
      },
      { t: 'tip', text: 'Tulis modelnya dulu sebelum menghitung.' },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Satuan dan pangkat 10' },
      {
        t: 'p',
        text: 'Banyak satuan sehari-hari adalah pangkat 10. Untuk mengubah satuan, kalikan dengan pangkat 10 yang sesuai.',
      },
      {
        t: 'units',
        rows: [
          { label: '1 km', n: 3, unit: 'm' },
          { label: '1 cm', n: -2, unit: 'm' },
          { label: '1 mm', n: -3, unit: 'm' },
          { label: '1 µm', n: -6, unit: 'm' },
          { label: '1 juta', n: 6 },
          { label: '1 miliar', n: 9 },
        ],
      },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Contoh: mengubah satuan' },
      {
        t: 'op',
        op: 'kali',
        x: { a: '3,5', n: 0 },
        y: { a: '1', n: 3 },
        text: '1 km = 10³ m. Tulis 3,5 km dalam meter.',
        unit: 'm',
      },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Kali atau bagi?' },
      {
        t: 'list',
        items: [
          '"Setiap …, berapa seluruhnya?" → kali.',
          '"Dibagi rata", "berapa bagian", atau "berapa kali lipat" → bagi.',
        ],
      },
      { t: 'tip', text: 'Bacalah kalimat terakhir soal: di situ ada yang ditanyakan.' },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Contoh: jarak tempuh cahaya' },
      {
        t: 'op',
        op: 'kali',
        x: { a: '3', n: 8 },
        y: { a: '5', n: 2 },
        text: 'Cahaya menempuh 3 × 10⁸ m setiap detik. Berapa meter yang ditempuh dalam 5 × 10² detik?',
        unit: 'm',
      },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Contoh: membagi rata' },
      {
        t: 'op',
        op: 'bagi',
        x: { a: '2', n: 12 },
        y: { a: '4', n: 6 },
        text: 'Hard disk 2 × 10¹² byte diisi berkas berukuran 4 × 10⁶ byte. Berapa berkas yang muat?',
        unit: 'berkas',
      },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Pemodelan sederhana' },
      { t: 'p', text: 'Massa sebutir pasir 3 × 10⁻⁵ g. Berapa gram massa 2 × 10⁴ butir?' },
      {
        t: 'list',
        items: [
          'Diketahui: 3 × 10⁻⁵ g per butir dan 2 × 10⁴ butir.',
          'Model: massa seluruhnya = massa sebutir × banyak butir.',
        ],
      },
      { t: 'op', op: 'kali', x: { a: '3', n: -5 }, y: { a: '2', n: 4 }, unit: 'g' },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Coba sendiri' },
      { t: 'p', text: 'Susun modelnya, hitung, lalu buka pembahasannya.' },
      {
        t: 'try',
        items: [
          {
            op: 'kali',
            x: { a: '4', n: 2 },
            y: { a: '3', n: 2 },
            text: 'Satu halaman memuat 4 × 10² kata. Berapa kata dalam 3 × 10² halaman?',
            unit: 'kata',
          },
          {
            op: 'bagi',
            x: { a: '8', n: 6 },
            y: { a: '4', n: 2 },
            text: 'Rp8 × 10⁶ dibagi rata kepada 4 × 10² siswa. Berapa rupiah tiap siswa?',
            unit: 'rupiah',
          },
          {
            op: 'kali',
            x: { a: '2,5', n: 0 },
            y: { a: '1', n: -3 },
            text: '1 mm = 10⁻³ m. Tulis 2,5 mm dalam meter.',
            unit: 'm',
          },
        ],
      },
    ],
  },
  {
    chapter: 'bab5',
    blocks: [
      { t: 'h', text: 'Saatnya mencoba!' },
      {
        t: 'p',
        text: 'Kamu sudah menyelesaikan buku ini. Latih pemahamanmu di jalur Latihan, atau bereksperimen menggeser koma di Lab Koma.',
      },
      { t: 'links' },
    ],
  },
];
