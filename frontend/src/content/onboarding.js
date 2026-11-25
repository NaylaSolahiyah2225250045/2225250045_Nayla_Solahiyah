/**
 * Panduan awal (onboarding) untuk siswa yang baru mendaftar — 7 tahap, dipandu maskot kapibara.
 * pose  : pose maskot (lihat POSE_MOTION di MascotLive)
 * focus : menu yang disorot (atribut data-tour di SideNav/BottomNav). 'lainnya' = tombol "Lainnya"
 *         di navigasi bawah HP, tempat Catatan Pintar, Riwayat, dan Kalender berada.
 * Kalimat pendek & ramah (CLAUDE.md §3). Penutup menyebut cara membuka panduan lagi.
 */
export const TOUR_STEPS = [
  {
    id: 'sambutan',
    title: 'Selamat datang di NoBaku!',
    text: 'Hai! Aku akan menemanimu belajar bentuk baku dengan cara yang seru dan menyenangkan. Yuk, kenalan dulu dengan fitur-fitur yang ada di sini!',
    pose: 'wave',
    focus: [],
  },
  {
    id: 'beranda',
    title: 'Beranda',
    text: 'Beranda adalah halaman utamamu. Di sini ada sapaan, ringkasan belajar, XP, dan langkah belajar berikutnya yang bisa langsung kamu buka.',
    pose: 'point',
    focus: ['beranda'],
  },
  {
    id: 'materi',
    title: 'Materi',
    text: 'Di Materi, kamu membaca buku digital lima bab. Di bawahnya ada pembelajaran bertahap per modul: contoh soal, langkah terpandu, dan kuis.',
    pose: 'book',
    focus: ['materi'],
  },
  {
    id: 'latihan',
    title: 'Latihan',
    text: 'Uji pemahamanmu di Jalur Latihan. Setiap topik punya 10 soal dari mudah ke sulit, lalu Kuis Akhir. Jawaban yang salah langsung dibahas.',
    pose: 'think',
    focus: ['latihan'],
  },
  {
    id: 'catatan-riwayat',
    title: 'Catatan Pintar & Riwayat Latihan',
    text: 'Catatan Pintar berisi rangkuman, rumus, dan tips penting. Riwayat Latihan menampilkan hasil latihanmu, lengkap dengan pembahasan soal yang salah.',
    pose: 'idea',
    focus: ['catatan', 'riwayat', 'lainnya'],
  },
  {
    id: 'kalender-profil',
    title: 'Kalender Belajar & Profil Siswa',
    text: 'Kalender Belajar menandai hari-hari kamu belajar. Profil Siswa menampilkan akunmu, progres belajar, dan koleksi lencana.',
    pose: 'thumb',
    focus: ['kalender', 'profil', 'lainnya'],
  },
  {
    id: 'mulai',
    title: 'Siap mulai belajar?',
    text: 'Nah, sekarang kamu sudah mengenal fitur-fitur NoBaku! Mulailah dari materi, kerjakan latihan, dan kumpulkan lencana. Yuk, mulai petualangan matematika kita!',
    pose: 'cheer',
    focus: [],
    note: 'Panduan ini bisa dibuka lagi dari Profil Siswa → Pengaturan.',
  },
];

/**
 * Panduan guru (21 Nov 2026) — muncul sekali setelah guru pertama kali mendaftar/masuk.
 * Menjelaskan lima menu utama Dashboard Guru. `focus` = atribut data-tour di navigasi guru.
 */
export const TEACHER_TOUR_STEPS = [
  {
    id: 'g-sambutan',
    title: 'Selamat datang, Bapak/Ibu Guru!',
    text: 'Di Dashboard Guru, Anda bisa membuat kelas, membagikan kode kelas, dan memantau belajar siswa. Mari kenali lima menu utamanya.',
    pose: 'wave',
    focus: [],
  },
  {
    id: 'g-beranda',
    title: '1. Beranda',
    text: 'Ringkasan jumlah kelas, jumlah siswa, siswa yang aktif minggu ini, aktivitas belajar terbaru, dan perkembangan tiap topik.',
    pose: 'point',
    focus: ['guru'],
  },
  {
    id: 'g-kelas',
    title: '2. Kelas',
    text: 'Buat kelas VIII-A sampai VIII-E, ubah tahun ajaran, salin atau ganti kode kelas, buka/tutup pendaftaran, keluarkan siswa, dan hapus kelas.',
    pose: 'book',
    focus: ['guru-kelas'],
  },
  {
    id: 'g-siswa',
    title: '3. Siswa',
    text: 'Lihat daftar siswa dan kelasnya. Buka nama siswa untuk melihat detail aktivitas, progres per topik, lencana, dan riwayat soal.',
    pose: 'think',
    focus: ['guru-siswa'],
  },
  {
    id: 'g-progres',
    title: '4. Progres',
    text: 'Pantau perkembangan belajar: penyelesaian materi per topik, level latihan yang sudah selesai, dan lencana yang diraih siswa.',
    pose: 'idea',
    focus: ['guru-progres'],
  },
  {
    id: 'g-hasil',
    title: '5. Hasil',
    text: 'Lihat nilai latihan, kuis, dan Kuis Akhir, riwayat pengerjaan beserta jawaban siswa, serta kesalahan yang paling sering terjadi.',
    pose: 'thumb',
    focus: ['guru-hasil'],
  },
  {
    id: 'g-selesai',
    title: 'Siap memulai!',
    text: 'Langkah pertama: buat kelas di menu Kelas, lalu bagikan kodenya. Siswa memasukkan kode di Profil Siswa → Kelas Saya.',
    pose: 'cheer',
    focus: ['guru-kelas'],
    note: 'Panduan ini bisa dibuka lagi dari Profil Guru → Buka panduan guru.',
  },
];
