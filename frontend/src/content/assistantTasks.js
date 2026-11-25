/**
 * "Maksud soal" untuk Asisten Belajar (25 Nov 2026): penjelasan sehari-hari tentang APA YANG DIMINTA soal,
 * tanpa mengerjakannya. Dikirim ke backend sebagai konteks (`task`) agar AI bisa menjawab "maksud soal ini apa?",
 * dan dipakai pesan cadangan bila AI gagal/ditolak. Teks ini tidak memuat angka jawaban — hanya cara memahami soal
 * (diuji assistantVisuals.test.js untuk seluruh bank).
 */

/** Per keterampilan (lib/rmt.js skillOf). `{digit}` diganti angka yang ditanya (sudah ada di kalimat soal). */
export const TASKS = {
  pangkat10: 'Soal ini soal pangkat 10: kamu diminta menuliskan bentuk 10 pangkat sekian sebagai bilangan biasa, atau sebaliknya mencari pangkat 10 yang sama nilainya dengan bilangan itu. Kuncinya: pangkat menunjukkan berapa kali angka 10 dikalikan (atau dibagi bila pangkatnya negatif).',
  nilaiTempat: 'Soal ini menanyakan NILAI angka {digit}, bukan sekadar angkanya. Nilai sebuah angka bergantung pada tempatnya: di satuan, puluhan, ratusan, atau di belakang koma (persepuluhan, perseratusan, …). Jadi kamu perlu melihat angka itu duduk di tempat mana.',
  keBaku: 'Soal ini minta kamu menulis ulang bilangan itu dalam bentuk baku, yaitu a × 10ⁿ. Angka depannya (a) harus 1 atau lebih tetapi kurang dari 10, dan pangkat n mencatat berapa kali koma digeser. Nilai bilangannya tidak berubah, hanya cara menulisnya yang lebih ringkas.',
  nolTengah: 'Soal ini minta bentuk baku dari bilangan yang punya angka nol. Yang diuji: nol mana yang harus ikut ditulis (nol di antara angka bukan nol) dan nol mana yang cukup dicatat lewat pangkat (nol di depan atau di belakang).',
  keBiasa: 'Ini kebalikan dari bentuk baku: kamu diminta menulis bilangan itu sebagai bilangan biasa, tanpa "× 10". Caranya dengan menggeser koma sesuai pangkatnya, lalu mengisi tempat yang kosong dengan nol.',
  banding: 'Soal ini minta kamu membandingkan bilangan-bilangan dalam bentuk baku: mana yang lebih besar atau lebih kecil. Yang dilihat dulu adalah pangkatnya, baru angka depannya.',
  normal: 'Bilangan di soal sudah memakai × 10, tetapi angka depannya belum di antara 1 dan 10, jadi belum bentuk baku. Soal minta kamu merapikannya menjadi bentuk baku tanpa mengubah nilainya: koma pada angka depan digeser, lalu pangkatnya disesuaikan.',
  kali: 'Soal ini minta kamu mengalikan dua bilangan bentuk baku. Angka depan dikalikan dengan angka depan, pangkat 10 diurus dengan aturan pangkat, lalu hasilnya diperiksa: sudah bentuk baku atau perlu dirapikan.',
  bagi: 'Soal ini minta kamu membagi dua bilangan bentuk baku. Angka depan dibagi dengan angka depan, pangkat 10 diurus dengan aturan pangkat, lalu hasilnya diperiksa: sudah bentuk baku atau perlu dirapikan.',
  cerita: 'Ini soal cerita. Kamu diminta memahami ceritanya dulu: apa yang diketahui, apa yang ditanya, dan apa satuannya. Setelah itu baru memilih operasi (kali atau bagi), menghitung, lalu menulis hasilnya dalam bentuk baku.',
};

/** Pilihan ganda konsep (tanpa keterampilan khusus): maksud umum + fokus topik. */
export const CHOICE_TASK = 'Ini soal pilihan ganda: ada beberapa pilihan, dan kamu memilih satu yang paling tepat. Baca dulu apa yang ditanyakan kalimat soalnya, lalu periksa pilihan satu per satu dengan aturan yang sedang dipelajari.';

/** Konsep yang diuji tiap topik, dalam bahasa siswa. */
export const TOPIC_FOCUS = {
  t1: 'pangkat 10 dan nilai tempat (setiap tempat pada bilangan bernilai pangkat 10)',
  t2: 'bilangan sangat besar dan sangat kecil dalam bentuk baku: membaca, membandingkan, dan mengurutkannya',
  t3: 'mengubah bentuk biasa ke bentuk baku dan sebaliknya',
  t4: 'operasi hitung bentuk baku: kali, bagi, tambah, dan kurang',
  t5: 'memakai bentuk baku di soal cerita dan kehidupan nyata (PMSTP)',
};
