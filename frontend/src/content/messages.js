/**
 * Pesan umpan balik per kode kesalahan (docs/LEARNING-DESIGN.md §6).
 * Bahasa: singkat, tidak menyalahkan, menunjuk langkah berikutnya.
 */
export const ERROR_MESSAGES = {
  'E-FORMAT': {
    title: 'Formatnya belum sesuai',
    text: 'Isi nilai a dan pangkat n. Contoh: 3,2 × 10⁴. Pakai koma untuk desimal.',
  },
  'E-KOMA': {
    title: 'Koma belum di tempat yang tepat',
    text: 'Nilai a harus di antara 1 dan 10. Taruh koma tepat setelah angka bukan nol pertama.',
  },
  'E-TANDA': {
    title: 'Periksa tanda pangkatnya',
    text: 'Bilangan kurang dari 1 → pangkat negatif. Bilangan 10 atau lebih → pangkat positif.',
  },
  'E-PANGKAT': {
    title: 'Hampir!',
    text: 'Hitung lagi lompatan komanya (atau banyaknya angka nol).',
  },
  'E-NOL': {
    title: 'Ada angka nol yang hilang',
    text: 'Nol yang berada di antara angka bukan nol tidak boleh dibuang.',
  },
  'E-LAIN': {
    title: 'Belum tepat',
    text: 'Coba buka petunjuk, lalu kerjakan langkah demi langkah.',
  },
};

export const errorLabel = {
  'E-FORMAT': 'Format jawaban',
  'E-KOMA': 'Letak koma',
  'E-TANDA': 'Tanda pangkat',
  'E-PANGKAT': 'Jumlah lompatan',
  'E-NOL': 'Nol di tengah',
  'E-LAIN': 'Lainnya',
};

export const PRAISE = ['Tepat!', 'Benar!', 'Bagus, tepat!'];

/**
 * Kalimat maskot (balon ucapan) — hanya di layar non-soal. Ketuk maskot untuk kalimat berikutnya.
 * Pendek (≤ 12 kata) agar tidak menambah beban membaca.
 */
export const MASCOT_LINES = {
  welcome: [
    'Hai! Ayo belajar bentuk baku bareng aku!',
    'Halo! Aku kapibara NoBaku, teman belajarmu.',
    'Ketuk aku lagi, ada bintangnya!',
    '4.500.000 = 4,5 × 10⁶. Keren, kan?',
    'Bilangan raksasa? Tenang, ada bentuk baku!',
    'Bilangan sangat kecil juga bisa diringkas, lho!',
    'Koma itu suka melompat. Mau lihat caranya?',
    'Siap jadi jago notasi ilmiah?',
    'Sedikit demi sedikit, pasti bisa!',
    'Yuk, mulai petualangan angka!',
  ],
  register: ['Daftar dulu, yuk! Cuma butuh nama panggilan dan username.', 'Tenang, tidak perlu email atau nomor HP.'],
  login: ['Selamat datang kembali!', 'Masukkan username dan kata sandimu, ya.'],
  authError: ['Hmm, ada yang belum pas. Cek lagi, ya.'],
  dashboard: [
    'Belajar sedikit setiap hari itu hebat!',
    'Ingat: koma ditaruh setelah angka bukan nol pertama.',
    'Bilangan kurang dari 1 → pangkatnya negatif.',
    'Salah itu biasa. Petunjuk siap membantumu!',
  ],
  sidebar: ['Semangat terus belajar!', 'Kamu pasti bisa!', 'Ayo lanjutkan!'],
  account: ['Ini profilmu. Atur animasi sesukamu!'],
  done: ['Hore! Kamu hebat!', 'Satu modul lagi selesai!'],
};
