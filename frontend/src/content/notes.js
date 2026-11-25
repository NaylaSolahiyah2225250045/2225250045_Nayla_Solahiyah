/**
 * Catatan Pintar: rangkuman, rumus penting, contoh singkat, tips, kesalahan umum.
 * Contoh & "jawaban benar" pada kesalahan umum dihitung oleh lib/sci (content.test.js memeriksa
 * bahwa setiap "jawaban salah" memang didiagnosis dengan kode kesalahannya).
 */

export const NOTE_SECTIONS = [
  { id: 'ringkasan', label: 'Rangkuman', tone: 'learn' },
  { id: 'rumus', label: 'Rumus Penting', tone: 'lab' },
  { id: 'contoh', label: 'Contoh Singkat', tone: 'progress' },
  { id: 'tips', label: 'Tips', tone: 'install' },
  { id: 'kesalahan', label: 'Kesalahan Umum', tone: 'account' },
];

export const SUMMARY = [
  { title: 'Bilangan berpangkat', text: 'aⁿ berarti a dikalikan dengan dirinya sendiri sebanyak n kali. a = basis, n = pangkat.' },
  { title: 'Nilai tempat', text: 'Setiap tempat bernilai pangkat 10. Nilai angka = angka × nilai tempatnya, mis. 7 pada 3.725 bernilai 7 × 10² = 700.' },
  { title: 'Bentuk baku', text: 'Bilangan ditulis a × 10ⁿ dengan 1 ≤ a < 10 dan n bilangan bulat.' },
  { title: 'Bilangan besar', text: 'Koma bergeser ke kiri sampai tepat setelah angka bukan nol pertama. Pangkatnya positif.' },
  { title: 'Bilangan kecil', text: 'Koma bergeser ke kanan sampai tepat setelah angka bukan nol pertama. Pangkatnya negatif.' },
  { title: 'Kembali ke bentuk biasa', text: 'Pangkat positif: koma ke kanan. Pangkat negatif: koma ke kiri. Tempat kosong diisi nol; nol tengah tetap ditulis.' },
  { title: 'Kali & bagi', text: 'Kali: kalikan bilangan depan, jumlahkan pangkat. Bagi: bagi bilangan depan, kurangkan pangkat. Lalu pastikan hasilnya bentuk baku.' },
  { title: 'Penerapan', text: 'Tulis besaran dalam bentuk baku, samakan satuan, pilih model kali atau bagi, lalu hitung dan periksa satuannya.' },
];

/** Rumus penting (ditampilkan besar). */
export const FORMULAS = [
  { formula: 'aⁿ = a × a × … × a', note: 'sebanyak n faktor' },
  { formula: 'a × 10ⁿ', note: '1 ≤ a < 10, n bilangan bulat' },
  { formula: '10⁰ = 1', note: 'pangkat nol' },
  { formula: '10⁻ⁿ = 1 ÷ 10ⁿ', note: 'pangkat negatif = membagi' },
  { formula: 'koma ← k langkah ⇒ pangkat + k', note: 'geser kiri, pangkat bertambah' },
  { formula: '(a × 10ᵐ) × (b × 10ⁿ) = (a × b) × 10ᵐ⁺ⁿ', note: 'kali → pangkat dijumlah' },
  { formula: '(a × 10ᵐ) : (b × 10ⁿ) = (a : b) × 10ᵐ⁻ⁿ', note: 'bagi → pangkat dikurang' },
  { formula: '1 km = 10³ m · 1 mm = 10⁻³ m', note: 'satuan sebagai pangkat 10' },
];

/** Contoh singkat: bentuk biasa → bentuk baku (langkah dihitung lib/sci). */
export const QUICK_EXAMPLES = ['36.000', '0,0072', '5.008.000'];

export const TIPS = [
  'Cari dulu angka bukan nol pertama dari kiri. Koma selalu ditaruh tepat setelah angka itu.',
  'Hitung lompatan koma dengan jari atau beri titik kecil di setiap lompatan.',
  'Ke kiri = pangkat positif, ke kanan = pangkat negatif.',
  'Nol di depan dan nol di belakang dibuang, tetapi nol di tengah tetap ditulis.',
  'Setelah menjawab, cek: apakah a sudah di antara 1 dan 10?',
  'Hasil kali atau bagi belum tentu bentuk baku: 20 × 10³ = 2 × 10⁴.',
  'Soal cerita: tulis dulu modelnya, misalnya (6 × 10⁶) : (3 × 10²), baru hitung.',
];

/**
 * Kesalahan umum: contoh jawaban salah per kode diagnosis + jawaban benar (dihitung).
 * wrong = jawaban siswa {a, n} yang keliru.
 */
export const MISTAKES = [
  { code: 'E-KOMA', title: 'Koma di tempat yang salah', value: '4.500.000', wrong: { a: '45', n: '5' }, why: 'a harus di antara 1 dan 10, jadi koma ditaruh setelah angka 4.' },
  { code: 'E-TANDA', title: 'Tanda pangkat terbalik', value: '0,00032', wrong: { a: '3,2', n: '4' }, why: 'Bilangan kurang dari 1 → pangkatnya negatif.' },
  { code: 'E-PANGKAT', title: 'Salah menghitung lompatan', value: '4.500.000', wrong: { a: '4,5', n: '7' }, why: 'Hitung lompatan koma, bukan banyaknya angka.' },
  { code: 'E-NOL', title: 'Nol di tengah dibuang', value: '7.050.000', wrong: { a: '7,5', n: '6' }, why: 'Nol yang diapit angka bukan nol tetap ditulis.' },
];
