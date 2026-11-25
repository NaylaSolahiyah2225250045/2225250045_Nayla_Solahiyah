/**
 * Konten modul (docs/LEARNING-DESIGN.md). Satu item = satu layar (segmenting).
 * Tipe item: intro | concept | worked | faded | guided | practice | quiz
 * worked/faded: qtype to_scientific (value, focus?) | power_of_ten | to_standard (a, n) | operation (op, x, y, text?, unit?)
 * Langkah contoh terurai untuk soal bentuk baku dibuat otomatis (workedSteps) agar selalu benar.
 */

const TABLE_POSITIVE = {
  kind: 'table',
  head: ['Pangkat', 'Bentuk biasa', 'Banyak nol'],
  rows: [
    [{ pow: 1 }, '10', '1'],
    [{ pow: 2 }, '100', '2'],
    [{ pow: 3 }, '1.000', '3'],
    [{ pow: 6 }, '1.000.000', '6'],
  ],
};

const TABLE_NEGATIVE = {
  kind: 'table',
  head: ['Pangkat', 'Pembagian', 'Bentuk biasa'],
  rows: [
    [{ pow: -1 }, '1 : 10', '0,1'],
    [{ pow: -2 }, '1 : 100', '0,01'],
    [{ pow: -3 }, '1 : 1.000', '0,001'],
  ],
};

/** Modul lama (Alpha) — isinya dipakai ulang oleh lima topik di bawah. */
const OLD_MODULES = [
  {
    id: 'm1',
    no: 1,
    title: 'Pangkat 10 & Nilai Tempat',
    short: 'Prasyarat',
    objective: 'Menentukan nilai 10ⁿ dan 10⁻ⁿ serta hubungannya dengan nilai tempat.',
    items: [
      {
        type: 'intro',
        title: 'Bilangan raksasa dan bilangan mungil',
        text: 'Jarak Bumi ke Matahari sekitar 150.000.000 km. Tebal rambut sekitar 0,00008 m. Banyak sekali nolnya! Pangkat 10 membantu kita menulisnya lebih singkat.',
      },
      {
        type: 'concept',
        title: 'Arti pangkat',
        text: '10³ artinya 10 dikalikan sebanyak 3 kali: 10 × 10 × 10 = 1.000.',
        visual: TABLE_POSITIVE,
      },
      {
        type: 'concept',
        title: 'Pangkat = banyaknya nol',
        text: 'Untuk pangkat positif, pangkatnya sama dengan banyaknya angka nol di belakang angka 1.',
        callout: '10⁶ = 1.000.000 → ada 6 angka nol.',
        visual: { kind: 'comma', value: '1.000.000', autoPlay: true },
      },
      {
        type: 'concept',
        title: 'Pangkat negatif = membagi',
        text: '10⁻¹ artinya 1 dibagi 10, yaitu 0,1. Makin negatif pangkatnya, makin kecil bilangannya.',
        visual: TABLE_NEGATIVE,
      },
      {
        type: 'concept',
        title: 'Tabel nilai tempat',
        text: 'Setiap kolom nilai tempat punya pangkat 10 sendiri. Di kanan koma, pangkatnya negatif.',
        visual: { kind: 'placeValue' },
        callout: 'Angka 1 di posisi ke-3 setelah koma → 0,001 = 10⁻³.',
      },
      {
        type: 'worked',
        qtype: 'power_of_ten',
        value: '0,001',
        steps: ['Bilangan ini kurang dari 1, jadi pangkatnya negatif.', 'Angka 1 ada di posisi ke-3 setelah koma.', 'Jadi 0,001 = 10⁻³.'],
      },
      {
        type: 'worked',
        qtype: 'power_of_ten',
        value: '1.000.000',
        steps: ['Bilangan ini lebih dari 1, jadi pangkatnya positif.', 'Hitung angka nol di belakang angka 1: ada 6.', 'Jadi 1.000.000 = 10⁶.'],
      },
      {
        type: 'faded',
        qtype: 'power_of_ten',
        value: '10.000',
        steps: ['Bilangan ini lebih dari 1, jadi pangkatnya positif.', 'Hitung angka nol di belakang angka 1: ada 4.', 'Jadi 10.000 = 10⁴.'],
        shown: 2,
      },
      {
        type: 'faded',
        qtype: 'power_of_ten',
        value: '0,01',
        steps: ['Bilangan ini kurang dari 1, jadi pangkatnya negatif.', 'Angka 1 ada di posisi ke-2 setelah koma.', 'Jadi 0,01 = 10⁻².'],
        shown: 1,
      },
      { type: 'practice' },
      { type: 'quiz' },
    ],
  },
  {
    id: 'm2',
    no: 2,
    title: 'Bilangan Besar (Pangkat Positif)',
    short: 'Bilangan besar',
    objective: 'Mengubah bilangan besar ke bentuk baku a × 10ⁿ dengan n positif.',
    items: [
      {
        type: 'intro',
        title: 'Angka besar di sekitar kita',
        text: 'Anggaran pembangunan sebuah sekolah Rp2.500.000.000. Menulis dan membaca angka sepanjang itu mudah keliru. Bagaimana menulisnya lebih singkat?',
      },
      {
        type: 'concept',
        title: 'Apa itu bentuk baku?',
        text: 'Bentuk baku ditulis a × 10ⁿ. Nilai a harus 1 atau lebih, tetapi kurang dari 10.',
        callout: 'Benar: 2,5 × 10⁹. Belum baku: 25 × 10⁸ (karena 25 lebih dari 10).',
      },
      {
        type: 'concept',
        title: 'Empat langkah',
        list: [
          'Cari angka bukan nol pertama dari kiri.',
          'Taruh koma tepat setelah angka itu.',
          'Hitung berapa kali koma melompat ke kiri. Itu pangkatnya (positif).',
          'Tulis a × 10ⁿ. Buang nol di belakang.',
        ],
      },
      {
        type: 'concept',
        title: 'Lihat komanya melompat',
        text: 'Pada bilangan bulat, koma asal ada di ujung kanan. Tekan Putar dan hitung lompatannya.',
        visual: { kind: 'comma', value: '4.500.000', autoPlay: false },
      },
      { type: 'worked', qtype: 'to_scientific', value: '4.500.000' },
      { type: 'worked', qtype: 'to_scientific', value: '135.000.000' },
      { type: 'worked', qtype: 'to_scientific', value: '2.500.000.000' },
      {
        type: 'concept',
        title: 'Cara cepat',
        text: 'Pangkat = banyaknya angka sebelum koma asal, dikurangi 1.',
        callout: '135.000.000 punya 9 angka → pangkatnya 9 − 1 = 8.',
      },
      { type: 'faded', qtype: 'to_scientific', value: '36.000', shown: 3 },
      { type: 'faded', qtype: 'to_scientific', value: '720.000', shown: 2 },
      { type: 'guided', value: '48.000' },
      { type: 'guided', value: '1.250.000' },
      { type: 'practice' },
      { type: 'quiz' },
    ],
  },
  {
    id: 'm3',
    no: 3,
    title: 'Bilangan Kecil (Pangkat Negatif)',
    short: 'Bilangan kecil',
    objective: 'Mengubah bilangan antara 0 dan 1 ke bentuk baku a × 10⁻ⁿ.',
    items: [
      {
        type: 'intro',
        title: 'Benda yang sangat kecil',
        text: 'Tebal selembar rambut sekitar 0,00008 meter. Ukuran bakteri sekitar 0,000002 meter. Banyak nolnya, ya? Yuk, tulis lebih singkat.',
      },
      {
        type: 'concept',
        title: 'Kenapa pangkatnya negatif?',
        text: 'Bilangan kurang dari 1 didapat dengan membagi 10 berkali-kali. Itu sebabnya pangkatnya negatif.',
        visual: TABLE_NEGATIVE,
      },
      {
        type: 'concept',
        title: 'Koma bergeser ke kanan',
        text: 'Pada bilangan kecil, koma melompat ke kanan sampai tepat setelah angka bukan nol pertama.',
        visual: { kind: 'comma', value: '0,00032', autoPlay: false },
        callout: 'Ingat: ke kiri → bilangan besar (+). Ke kanan → bilangan kecil (−).',
      },
      {
        type: 'concept',
        title: 'Aturan posisi',
        text: 'Lihat angka bukan nol pertama. Jika letaknya di posisi ke-n setelah koma, pangkatnya −n.',
        visual: { kind: 'comma', value: '0,0000075', autoPlay: false, showPositions: true },
        callout: 'Angka 7 di posisi ke-6 → pangkatnya −6.',
      },
      { type: 'worked', qtype: 'to_scientific', value: '0,0405' },
      { type: 'worked', qtype: 'to_scientific', value: '0,00032' },
      { type: 'worked', qtype: 'to_scientific', value: '0,0000075' },
      {
        type: 'concept',
        title: 'Cek kewajaran',
        text: 'Sebelum menjawab, periksa: bilanganmu kurang dari 1? Pangkatnya harus negatif. Bilanganmu 10 atau lebih? Pangkatnya positif.',
      },
      { type: 'faded', qtype: 'to_scientific', value: '0,006', shown: 3 },
      { type: 'faded', qtype: 'to_scientific', value: '0,00047', shown: 2 },
      { type: 'guided', value: '0,0035' },
      { type: 'guided', value: '0,000081' },
      { type: 'practice' },
      { type: 'quiz' },
    ],
  },
  {
    id: 'm4',
    no: 4,
    title: 'Nol di Tengah',
    short: 'Nol di tengah',
    objective: 'Menulis bentuk baku dengan benar untuk bilangan yang memuat angka nol di antara angka bukan nol.',
    items: [
      {
        type: 'intro',
        title: 'Nol yang sering hilang',
        text: 'Penduduk sebuah kota 3.004.000 jiwa. Ada yang menulisnya 3,4 × 10⁶. Padahal 3,4 × 10⁶ = 3.400.000. Selisihnya hampir 400 ribu orang! Sekarang kamu belajar nol mana yang boleh dibuang.',
      },
      {
        type: 'concept',
        title: 'Tiga jenis nol',
        text: 'Lihat letak setiap nol terhadap angka bukan nol.',
        list: [
          'Nol depan: sebelum angka bukan nol pertama. Hanya menentukan pangkat, lalu dibuang.',
          'Nol tengah: diapit angka bukan nol. Tetap ditulis di a.',
          'Nol belakang: setelah angka bukan nol terakhir. Dibuang.',
        ],
      },
      {
        type: 'concept',
        title: 'Nol pada bilangan besar',
        text: 'Pada 70.080.000, nol di antara 7 dan 8 adalah nol tengah. Nol setelah angka 8 adalah nol belakang.',
        visual: { kind: 'zeros', value: '70.080.000' },
        callout: 'Nol tengah ditulis, nol belakang dibuang → a = 7,008.',
      },
      {
        type: 'concept',
        title: 'Nol pada bilangan kecil',
        text: 'Pada 0,000506, nol sebelum angka 5 adalah nol depan. Nol di antara 5 dan 6 adalah nol tengah.',
        visual: { kind: 'zeros', value: '0,000506' },
        callout: 'Nol depan menentukan pangkat, nol tengah tetap ditulis → a = 5,06.',
      },
      {
        type: 'concept',
        title: 'Aturan singkat',
        list: [
          'Cari angka bukan nol pertama dan angka bukan nol terakhir.',
          'Tulis semua angka di antara keduanya, termasuk nolnya.',
          'Taruh koma tepat setelah angka bukan nol pertama.',
          'Hitung lompatan koma untuk pangkatnya, seperti di Topik 2.',
        ],
        callout: 'Ingat: 7,05 tidak sama dengan 7,5. Membuang nol tengah mengubah nilai bilangan.',
      },
      { type: 'worked', qtype: 'to_scientific', focus: 'zero', value: '3.004.000' },
      { type: 'worked', qtype: 'to_scientific', focus: 'zero', value: '70.080.000' },
      { type: 'worked', qtype: 'to_scientific', focus: 'zero', value: '0,000506' },
      {
        type: 'concept',
        title: 'Cek dengan membalik',
        text: 'Ubah jawabanmu kembali ke bentuk biasa. Hasilnya harus sama persis dengan soal. Cara membaliknya sudah kamu pelajari tadi.',
        callout: '3,004 × 10⁶ = 3.004.000 ✓ sama dengan soal. 3,4 × 10⁶ = 3.400.000 ✗ berbeda.',
      },
      { type: 'faded', qtype: 'to_scientific', focus: 'zero', value: '5.008.000', shown: 3 },
      { type: 'faded', qtype: 'to_scientific', focus: 'zero', value: '0,0302', shown: 2 },
      { type: 'guided', value: '60.500' },
      { type: 'guided', value: '0,00907' },
      { type: 'practice' },
      { type: 'quiz' },
    ],
  },
  {
    id: 'm5',
    no: 5,
    title: 'Kembali ke Bentuk Biasa',
    short: 'Bentuk biasa',
    objective: 'Mengubah bilangan bentuk baku a × 10ⁿ menjadi bentuk biasa, untuk pangkat positif maupun negatif.',
    items: [
      {
        type: 'intro',
        title: 'Membaca bentuk baku',
        text: 'Di sebuah berita tertulis: jarak Bumi ke Matahari sekitar 1,5 × 10⁸ km. Berapa itu jika ditulis biasa? Sekarang kita membalik langkahnya: dari bentuk baku kembali ke bentuk biasa.',
      },
      {
        type: 'concept',
        title: 'Membalik arah lompatan',
        text: 'Dulu koma melompat untuk membentuk a. Sekarang kita mulai dari a, lalu koma melompat kembali ke tempat asalnya. Banyak lompatan = angka pada pangkat.',
        callout: 'Pangkat positif → koma ke kanan, bilangannya jadi besar. Pangkat negatif → koma ke kiri, bilangannya jadi kecil.',
      },
      {
        type: 'concept',
        title: 'Pangkat positif: geser ke kanan',
        text: 'Pada 2,5 × 10⁸, koma melompat 8 kali ke kanan. Setelah angka 5 dilewati, tempat yang kosong diisi nol. Tekan Putar.',
        visual: { kind: 'back', a: '2,5', n: 8 },
      },
      {
        type: 'concept',
        title: 'Pangkat negatif: geser ke kiri',
        text: 'Pada 6,02 × 10⁻³, koma melompat 3 kali ke kiri. Tempat kosong di depan diisi nol, lalu tulis 0 sebelum koma. Tekan Putar.',
        visual: { kind: 'back', a: '6,02', n: -3 },
      },
      {
        type: 'concept',
        title: 'Empat langkah',
        list: [
          'Lihat tanda pangkat: positif → ke kanan, negatif → ke kiri.',
          'Geser koma sebanyak angka pada pangkatnya.',
          'Isi tempat yang kosong dengan nol.',
          'Beri titik ribuan agar mudah dibaca, lalu cek kewajarannya.',
        ],
        callout: 'Pangkat 0 berarti koma tidak bergeser, karena 10⁰ = 1. Jadi 4,7 × 10⁰ = 4,7.',
      },
      { type: 'worked', qtype: 'to_standard', a: '1,2', n: 5 },
      { type: 'worked', qtype: 'to_standard', a: '3,456', n: 2 },
      { type: 'worked', qtype: 'to_standard', a: '6,02', n: -3 },
      { type: 'worked', qtype: 'to_standard', a: '7', n: -5 },
      {
        type: 'concept',
        title: 'Cek kewajaran',
        text: 'Pangkat positif n → hasilnya punya n + 1 angka sebelum koma. Pangkat negatif −n → angka bukan nol pertama ada di posisi ke-n setelah koma. Ini kebalikan cara cepat dan aturan posisi di Topik 2.',
        callout: '1,2 × 10⁵ = 120.000 → ada 6 angka, dan 6 = 5 + 1 ✓',
      },
      { type: 'faded', qtype: 'to_standard', a: '4,08', n: 6, shown: 2 },
      { type: 'faded', qtype: 'to_standard', a: '9,1', n: -4, shown: 1 },
      { type: 'practice' },
      { type: 'quiz' },
    ],
  },
];

// =====================================================================================
// LIMA TOPIK (disusun 16 Nov 2026). Layar modul lama dipakai apa adanya dan digabung:
//   t1 = Modul 1 (+ nilai angka menurut posisi) · t2 = Modul 2 + 3 · t3 = Modul 5 + 4 ·
//   t4 Operasi Hitung (baru) · t5 Penerapan (baru).
// `MIGRATE` memetakan posisi layar modul lama → topik baru (dipakai lib/progress.js).
// =====================================================================================

const OLD = Object.fromEntries(OLD_MODULES.map((m) => [m.id, m]));
const body = (id) => OLD[id].items.filter((i) => i.type !== 'practice' && i.type !== 'quiz');
const asConcept = (it) => (it.type === 'intro' ? { ...it, type: 'concept' } : it);
const END = () => [{ type: 'practice' }, { type: 'quiz' }];

/**
 * Susun satu topik dari potongan layar. Potongan {from, start, items} berasal dari modul lama
 * (start = indeks layar pertamanya di modul lama), potongan lain berupa array layar baru.
 */
function topic(id, no, meta, parts) {
  const items = [];
  const segments = [];
  for (const p of parts) {
    if (Array.isArray(p)) items.push(...p);
    else {
      segments.push({ from: p.from, start: p.start ?? 0, offset: items.length, count: p.items.length });
      items.push(...p.items);
    }
  }
  items.push(...END());
  return { id, no, ...meta, items, segments };
}

const op = (kind, x, y, extra = {}) => ({ op: kind, x: { a: x[0], n: x[1] }, y: { a: y[0], n: y[1] }, ...extra });

const T1 = topic(
  't1',
  1,
  {
    title: 'Pangkat Sepuluh dan Nilai Tempat',
    short: 'Pangkat 10',
    objective: 'Mengenal pangkat sepuluh, hubungannya dengan nilai tempat, dan nilai angka berdasarkan posisinya.',
  },
  [
    { from: 'm1', start: 0, items: body('m1').slice(0, 5) },
    [
      {
        type: 'concept',
        title: 'Nilai angka menurut posisinya',
        text: 'Nilai sebuah angka bergantung pada tempatnya. Pada 4.836, angka 8 ada di tempat ratusan, jadi nilainya 8 × 10² = 800.',
        callout: '4.836 = 4 × 10³ + 8 × 10² + 3 × 10¹ + 6 × 10⁰',
      },
    ],
    { from: 'm1', start: 5, items: body('m1').slice(5) },
  ],
);

const T2 = topic(
  't2',
  2,
  {
    title: 'Bilangan Besar dan Bilangan Kecil',
    short: 'Besar & kecil',
    objective: 'Menulis bilangan besar (pangkat positif) dan bilangan kecil (pangkat negatif) dalam bentuk baku, serta membedakan keduanya.',
  },
  [
    { from: 'm2', items: body('m2') },
    { from: 'm3', items: body('m3').map(asConcept) },
    [
      {
        type: 'concept',
        title: 'Mana yang lebih besar?',
        text: 'Bandingkan pangkatnya dulu. Pangkat lebih besar berarti bilangan lebih besar, karena a selalu di antara 1 dan 10. Jika pangkatnya sama, bandingkan a.',
        callout: '2 × 10⁵ lebih besar dari 9 × 10⁴, sebab pangkat 5 > 4. Pada pangkat negatif: 10⁻³ lebih besar dari 10⁻⁵.',
      },
    ],
  ],
);

const T3 = topic(
  't3',
  3,
  {
    title: 'Mengubah Bentuk Biasa dan Bentuk Baku',
    short: 'Mengubah bentuk',
    objective: 'Mengubah bilangan biasa ke bentuk baku dan sebaliknya, serta menempatkan angka nol dengan benar.',
  },
  [
    [
      {
        type: 'intro',
        title: 'Bolak-balik bentuk bilangan',
        text: 'Di Topik 2 kamu mengubah bilangan biasa menjadi bentuk baku. Sekarang kamu belajar dua arah: biasa → baku dan baku → biasa, lalu menempatkan angka nol dengan tepat.',
      },
      {
        type: 'concept',
        title: 'Dua arah perubahan',
        list: [
          'Biasa → baku: koma melompat sampai tepat setelah angka bukan nol pertama. Banyak lompatan = pangkat.',
          'Baku → biasa: koma melompat kembali sebanyak pangkatnya. Tempat kosong diisi nol.',
        ],
        visual: { kind: 'comma', value: '5.432,1', autoPlay: false },
        callout: 'Koma asal tidak selalu di ujung kanan. Pada 5.432,1, koma asal ada setelah angka 2.',
      },
    ],
    { from: 'm5', items: body('m5').map(asConcept) },
    { from: 'm4', items: body('m4').map(asConcept) },
  ],
);

const T4 = topic(
  't4',
  4,
  {
    title: 'Operasi Hitung Bentuk Baku',
    short: 'Kali & bagi',
    objective: 'Mengalikan dan membagi bilangan bentuk baku, lalu menuliskan hasilnya kembali dalam bentuk baku.',
  },
  [
    [
      {
        type: 'intro',
        title: 'Menghitung tanpa banyak nol',
        text: 'Menghitung 300.000 × 4.000.000 dengan cara biasa melelahkan karena nolnya banyak. Dengan bentuk baku, cukup kalikan bilangan depannya dan atur pangkatnya.',
      },
      {
        type: 'concept',
        title: 'Mengalikan pangkat 10',
        text: '10³ × 10⁴ berarti tiga faktor 10 dikali empat faktor 10. Semuanya ada tujuh faktor 10, jadi hasilnya 10⁷. Banyak faktor dijumlah.',
        callout: '10ᵐ × 10ⁿ = 10ᵐ⁺ⁿ',
      },
      {
        type: 'concept',
        title: 'Aturan perkalian',
        text: 'Kalikan bilangan depannya, lalu jumlahkan pangkatnya.',
        callout: '(a × 10ᵐ) × (b × 10ⁿ) = (a × b) × 10ᵐ⁺ⁿ',
      },
      { type: 'worked', qtype: 'operation', ...op('kali', ['2', 5], ['4', 3]) },
      { type: 'worked', qtype: 'operation', ...op('kali', ['4', 5], ['5', -2]) },
      {
        type: 'concept',
        title: 'Aturan pembagian',
        text: 'Bagi bilangan depannya, lalu kurangkan pangkatnya: pangkat yang dibagi dikurangi pangkat pembagi.',
        callout: '(a × 10ᵐ) : (b × 10ⁿ) = (a : b) × 10ᵐ⁻ⁿ',
      },
      { type: 'worked', qtype: 'operation', ...op('bagi', ['9', 7], ['3', 2]) },
      { type: 'worked', qtype: 'operation', ...op('bagi', ['2', 4], ['8', -3]) },
      {
        type: 'concept',
        title: 'Jangan lupa menormalkan',
        text: 'Hasil kali atau bagi belum tentu bentuk baku. Jika bilangan depannya 10 atau lebih, atau kurang dari 1, geser komanya lalu sesuaikan pangkatnya.',
        callout: '20 × 10³ = 2 × 10⁴, dan 0,25 × 10⁷ = 2,5 × 10⁶.',
      },
      { type: 'faded', qtype: 'operation', ...op('kali', ['3', 6], ['3', -2]), shown: 2 },
      { type: 'faded', qtype: 'operation', ...op('bagi', ['1,8', 5], ['6', 2]), shown: 1 },
    ],
  ],
);

const T5 = topic(
  't5',
  5,
  {
    title: 'Penerapan Bentuk Baku',
    short: 'Penerapan',
    objective: 'Memakai bentuk baku untuk soal cerita, satuan sehari-hari, dan pemodelan matematika sederhana.',
  },
  [
    [
      {
        type: 'intro',
        title: 'Bentuk baku di sekitar kita',
        text: 'Jarak antarplanet, ukuran virus, dan jumlah penduduk ditulis dengan bentuk baku. Di topik ini kamu memakainya untuk menyelesaikan soal cerita.',
      },
      {
        type: 'concept',
        title: 'Langkah soal cerita',
        list: [
          'Tulis besaran yang diketahui dalam bentuk baku.',
          'Samakan satuannya.',
          'Pilih model: kali atau bagi?',
          'Hitung, lalu periksa satuan jawabannya.',
        ],
      },
      {
        type: 'concept',
        title: 'Satuan dan pangkat 10',
        text: 'Banyak satuan sehari-hari adalah pangkat 10. Untuk mengubah satuan, kalikan dengan pangkat 10 yang sesuai.',
        visual: {
          kind: 'table',
          head: ['Satuan', 'Nilai'],
          rows: [
            ['1 km', { pow: 3, unit: 'm' }],
            ['1 cm', { pow: -2, unit: 'm' }],
            ['1 mm', { pow: -3, unit: 'm' }],
            ['1 µm', { pow: -6, unit: 'm' }],
            ['1 juta', { pow: 6 }],
            ['1 miliar', { pow: 9 }],
          ],
        },
      },
      {
        type: 'worked',
        qtype: 'operation',
        ...op('kali', ['3,5', 0], ['1', 3], { text: '1 km = 10³ m. Tulis 3,5 km dalam meter (bentuk baku).', unit: 'm' }),
      },
      {
        type: 'concept',
        title: 'Kali atau bagi?',
        list: ['"Setiap …, berapa seluruhnya?" → kali.', '"Dibagi rata", "berapa bagian", atau "berapa kali lipat" → bagi.'],
        callout: 'Tulis dulu modelnya, misalnya (8 × 10⁶) : (4 × 10²), baru hitung.',
      },
      {
        type: 'worked',
        qtype: 'operation',
        ...op('kali', ['3', 8], ['5', 2], { text: 'Cahaya menempuh 3 × 10⁸ m setiap detik. Berapa meter yang ditempuh dalam 5 × 10² detik?', unit: 'm' }),
      },
      {
        type: 'worked',
        qtype: 'operation',
        ...op('bagi', ['2', 12], ['4', 6], { text: 'Hard disk berkapasitas 2 × 10¹² byte diisi berkas berukuran 4 × 10⁶ byte. Berapa berkas yang muat?', unit: 'berkas' }),
      },
      {
        type: 'faded',
        qtype: 'operation',
        ...op('kali', ['4', 2], ['3', 2], { text: 'Satu halaman buku memuat 4 × 10² kata. Berapa kata dalam 3 × 10² halaman?', unit: 'kata' }),
        shown: 2,
      },
    ],
  ],
);

/** Lima topik materi (urutan = urutan belajar). */
export const MODULES = [T1, T2, T3, T4, T5];

/** Cari topik; id modul lama (m1–m5, mis. dari tautan lama) diarahkan ke topik barunya. */
export const getModule = (id) => MODULES.find((m) => m.id === id) ?? MODULES.find((m) => m.id === MIGRATE[id]?.to);

/**
 * Peta modul lama (m1–m5) → topik baru: { to, map(indexLama) → indexBaru }.
 * Layar latihan/kuis lama dipetakan ke layar latihan/kuis topik.
 */
export const MIGRATE = Object.fromEntries(
  Object.keys(OLD)
    .filter((id) => !OLD[id].comingSoon)
    .map((oldId) => {
      const t = MODULES.find((m) => m.segments.some((s) => s.from === oldId));
      const segs = t.segments.filter((s) => s.from === oldId);
      const oldLen = OLD[oldId].items.length;
      const map = (i) => {
        const s = segs.find((g) => i >= g.start && i < g.start + g.count);
        if (s) return s.offset + (i - s.start);
        return Math.min(t.items.length - 1, t.items.length - 2 + Math.max(0, i - (oldLen - 2)));
      };
      return [oldId, { to: t.id, map }];
    }),
);
