/**
 * Konten mediasi Rigorous Mathematical Thinking (RMT) — Tahap 1 (docs/RMT.md).
 *
 * Acuan: Kinard & Kozulin, "Rigorous Mathematical Thinking: Conceptual Formation in the Mathematics Classroom".
 * Tiga pilar RMT: Mathematically-Oriented Cognitive Functions (Fase Input, Elaborasi, Output),
 * Mathematically Specific Psychological Tools, dan Mediated Learning Experience (MLE: Intensionalitas &
 * Resiprositas, Transendensi, Pemberian Makna).
 *
 * PENTING: file ini TERPISAH dari bank soal (content/bank.js). Tidak ada soal, kunci, pembahasan, atau petunjuk
 * bank yang diubah; konten di sini hanya dibaca oleh tampilan berdasarkan jenis soal & topik (lib/rmt.js).
 * PMSTP adalah siklus pemodelan NoBaku, bukan tahapan resmi RMT.
 *
 * Batas kata (beban kognitif): tujuan & alasan ≤ 20 kata, pertanyaan pemandu ≤ 16 kata, aturan umum ≤ 28 kata.
 */

/**
 * Fase fungsi kognitif (Feuerstein). `label` untuk guru, `desc` penjelasan singkat.
 * @type {Record<'input'|'elaborasi'|'output', {label: string, desc: string}>}
 */
export const PHASES = {
  input: { label: 'Input', desc: 'mengumpulkan informasi: persepsi yang jelas, ketelitian dan ketepatan data' },
  elaborasi: { label: 'Elaborasi', desc: 'mengolah informasi: hubungan, aturan, perbandingan, dan penalaran' },
  output: { label: 'Output', desc: 'mengekspresikan hasil: ketepatan bahasa dan simbol, tanpa coba-coba' },
};

/**
 * Pemetaan kode kesalahan → fase fungsi kognitif yang MUNGKIN mengalami kesulitan.
 * Satu kesalahan dapat melibatkan lebih dari satu fase; urutan = yang paling sering didukung bukti diagnosis.
 * Bila bukti dari diagnosis mesin belum cukup, `phases` dibiarkan kosong (tidak dipaksakan).
 * `evidence` menjelaskan dasar pemetaan dari cara lib/sci mendiagnosis (lib/sci/diagnose.js, ops.js).
 * @type {Record<string, {phases: ('input'|'elaborasi'|'output')[], evidence: string}>}
 */
export const ERROR_PHASES = {
  'E-FORMAT': {
    phases: ['output'],
    evidence: 'Jawaban kosong atau tidak dapat dibaca sebagai a × 10ⁿ / bilangan: kesulitan menuliskan hasil dengan simbol yang tepat.',
  },
  'E-NORMAL': {
    phases: ['output'],
    evidence: 'Nilai hasil operasi sudah benar (pengolahan berhasil), tetapi belum ditulis dalam bentuk baku.',
  },
  'E-KOMA': {
    phases: ['output', 'elaborasi'],
    evidence:
      'Dipakai untuk dua keadaan: nilainya benar tetapi a di luar 1 ≤ a < 10 (Output), atau angka a benar tetapi koma salah tempat sehingga nilainya ikut salah (Elaborasi: letak koma belum dihubungkan dengan syarat 1 ≤ a < 10).',
  },
  'E-NOL': {
    phases: ['input', 'output'],
    evidence:
      'Angka bukan nolnya benar tetapi nol di tengah hilang atau bertambah: bisa karena kurang teliti mengamati angka (Input) atau saat menyalin a (Output).',
  },
  'E-PANGKAT': {
    phases: ['input', 'elaborasi'],
    evidence:
      'Angka & tanda benar, pangkat meleset 1–2: salah menghitung lompatan/posisi koma (Input). Pada soal membandingkan, kode ini menandai pilihan yang salah dibandingkan (Elaborasi).',
  },
  'E-TANDA': {
    phases: ['elaborasi', 'output'],
    evidence:
      'Pangkat tepat berlawanan tanda: belum menghubungkan besar-kecil bilangan (≥ 10 atau < 1) dengan tanda pangkat (Elaborasi), atau lupa menulis tanda minus (Output).',
  },
  'E-OPERASI': {
    phases: ['elaborasi'],
    evidence: 'Angka a benar tetapi pangkat hasil kali/bagi salah, atau cocok dengan jebakan aturan pangkat: aturan operasi belum diterapkan dengan tepat.',
  },
  'E-MODEL': {
    phases: ['elaborasi', 'input'],
    evidence:
      'Hasil cocok dengan model hitung yang keliru (mis. kali padahal bagi): hubungan antarbesaran belum diolah dengan tepat (Elaborasi); bisa juga karena salah menangkap yang ditanya (Input).',
  },
  'E-SATUAN': {
    phases: ['input', 'elaborasi'],
    evidence:
      'Hasil cocok dengan perhitungan tanpa menyamakan satuan: satuan yang diminta terlewat (Input) atau konversi satuan belum diolah (Elaborasi).',
  },
  'E-LAIN': {
    phases: [],
    evidence: 'Jawaban tidak cocok dengan pola kesalahan yang dikenal mesin; belum cukup bukti untuk menentukan fase.',
  },
};

/**
 * Tujuan latihan topik (Intensionalitas) & alasan pentingnya (Pemberian Makna).
 * Sejak 23 Nov 2026 setiap topik punya satu latihan 10 soal (mudah → sedang → sulit), jadi satu tujuan per
 * topik yang mencakup seluruh jenjang kemampuannya. Kunci 1 = level latihan (bank.js levels[1]).
 * @type {Record<string, Record<number, {goal: string, why: string}>>}
 */
export const LEVEL_GOALS = {
  t1: {
    1: {
      goal: 'Mengenali pangkat 10 dan nilai tempat, lalu menguraikan bilangan menurut nilai tempatnya dan menalar pergeseran nilai tempat.',
      why: 'Pangkat 10 adalah dasar bentuk baku: setiap tempat pada bilangan bernilai pangkat 10.',
    },
  },
  t2: {
    1: {
      goal: 'Memahami bilangan sangat besar dan sangat kecil, lalu membandingkan, mengurutkan, dan menafsirkan skalanya.',
      why: 'Bentuk baku membuat jarak bintang dan ukuran debu mudah ditulis dan dibandingkan.',
    },
  },
  t3: {
    1: {
      goal: 'Mengubah bentuk biasa ke bentuk baku dan sebaliknya dengan teliti, memakai aturan penulisan bentuk baku, lalu memperbaiki kesalahan.',
      why: 'Satu angka nol atau satu lompatan koma yang salah sudah cukup mengubah nilai bilangan.',
    },
  },
  t4: {
    1: {
      goal: 'Mengalikan, membagi, menjumlah, dan mengurangkan bentuk baku, menormalkan hasilnya, lalu menalar operasi campuran dan soal cerita.',
      why: 'Dengan aturan pangkat, menghitung bilangan raksasa cukup dengan hitungan kecil.',
    },
  },
  t5: {
    1: {
      goal: 'Memodelkan situasi nyata dengan bentuk baku: memilih operasi, menyamakan satuan, menghitung, dan menafsirkan hasil.',
      why: 'Inilah literasi matematika: memakai matematika untuk memahami dan menilai kejadian nyata.',
    },
  },
};

/** Tujuan kuis topik (soal dari satu topik, tanpa petunjuk). */
export const QUIZ_GOAL = {
  goal: 'Menunjukkan pemahamanmu tentang topik ini secara mandiri, tanpa petunjuk.',
  why: 'Hasil kuis membantumu dan gurumu melihat bagian yang sudah kuat dan yang perlu diulang.',
};

/** Tujuan Level 5 · Kuis Akhir. */
export const FINAL_GOAL = {
  goal: 'Menunjukkan pemahaman seluruh topik bentuk baku, dari pangkat 10 sampai penerapannya.',
  why: 'Hasil per topik menunjukkan bagian yang sudah kuat dan yang masih perlu dilatih.',
};

/**
 * Pertanyaan pemandu (mediated questioning) & aturan umum (Transendensi) per keterampilan.
 * Kunci keterampilan ditentukan lib/rmt.js `skillOf(q)` dari jenis soal, tanpa mengubah soal.
 * Aturan umum hanya memuat rumus umum (tanpa angka soal) agar tidak membocorkan jawaban sebelum menjawab.
 * @type {Record<string, {guide: string, rule: string}>}
 */
export const SKILLS = {
  pangkat10: {
    guide: 'Bagaimana tanda pangkat berhubungan dengan bilangan yang lebih dari 1 atau kurang dari 1?',
    rule: '10ⁿ dengan n positif ditulis angka 1 diikuti n angka nol. 10⁻ⁿ ditulis dengan angka 1 di posisi ke-n setelah koma.',
  },
  nilaiTempat: {
    guide: 'Angka itu berada di tempat apa? Berapa nilai tempatnya jika ditulis sebagai pangkat 10?',
    rule: 'Nilai sebuah angka = angka itu × nilai tempatnya. Bergeser satu tempat ke kiri, nilainya menjadi 10 kali lipat.',
  },
  keBaku: {
    guide: 'Di mana angka bukan nol pertamanya? Bilangan ini 10 atau lebih, atau kurang dari 1?',
    rule: 'Setiap bilangan positif dapat ditulis a × 10ⁿ dengan 1 ≤ a < 10. Bilangan 10 atau lebih berpangkat positif; bilangan kurang dari 1 berpangkat negatif.',
  },
  nolTengah: {
    guide: 'Nol mana yang hanya penanda tempat, dan nol mana yang terletak di antara angka bukan nol?',
    rule: 'Nol di antara angka bukan nol selalu ikut ditulis pada a. Nol di depan atau di belakang hanya penanda tempat; banyaknya tercatat pada pangkat.',
  },
  keBiasa: {
    guide: 'Pangkatnya positif atau negatif? Jadi, koma bergeser ke kanan atau ke kiri, dan berapa tempat?',
    rule: 'Pangkat positif n: koma bergeser n tempat ke kanan. Pangkat negatif −n: koma bergeser n tempat ke kiri. Tempat yang kosong diisi nol.',
  },
  banding: {
    guide: 'Sudahkah kamu membandingkan pangkatnya lebih dulu, sebelum membandingkan bilangan depannya?',
    rule: 'Untuk bilangan positif dalam bentuk baku, pangkat yang lebih besar berarti bilangan yang lebih besar. Jika pangkatnya sama, bandingkan nilai a.',
  },
  normal: {
    guide: 'Apakah a sudah 1 atau lebih dan kurang dari 10? Ke mana komanya harus bergeser?',
    rule: 'Jika koma pada a bergeser k tempat ke kiri, pangkat bertambah k; jika ke kanan, pangkat berkurang k. Nilai bilangannya tetap sama.',
  },
  kali: {
    guide: 'Bagian mana yang dikalikan, dan apa yang terjadi pada pangkat-pangkatnya?',
    rule: '(a × 10ᵐ) × (b × 10ⁿ) = (a × b) × 10ᵐ⁺ⁿ. Setelah itu, periksa apakah hasilnya sudah bentuk baku.',
  },
  bagi: {
    guide: 'Bagian mana yang dibagi, dan apa yang terjadi pada pangkat-pangkatnya?',
    rule: '(a × 10ᵐ) : (b × 10ⁿ) = (a : b) × 10ᵐ⁻ⁿ. Setelah itu, periksa apakah hasilnya sudah bentuk baku.',
  },
  cerita: {
    guide: 'Apa yang diketahui, apa yang ditanya, dan apakah satuannya sudah sama?',
    rule: 'Soal cerita: pahami yang diketahui dan ditanya, samakan satuan, pilih kali atau bagi, hitung, lalu periksa kewajaran hasil dan satuannya.',
  },
};

/**
 * Pertanyaan pemandu & aturan umum per topik — dipakai untuk soal pilihan ganda konsep yang
 * keterampilannya tidak dapat ditentukan dari jenis soal.
 * @type {Record<string, {guide: string, rule: string}>}
 */
export const TOPIC_RULES = {
  t1: {
    guide: 'Apa arti pangkat pada 10ⁿ, dan bagaimana hubungannya dengan nilai tempat?',
    rule: 'Pangkat 10 menunjukkan nilai tempat. Naik satu pangkat berarti 10 kali lebih besar; turun satu pangkat berarti 10 kali lebih kecil.',
  },
  t2: {
    guide: 'Apakah syarat 1 ≤ a < 10 sudah terpenuhi? Bilangannya besar atau kecil?',
    rule: 'Bentuk baku a × 10ⁿ selalu memakai 1 ≤ a < 10. Pangkat n menunjukkan seberapa besar atau seberapa kecil bilangannya.',
  },
  t3: {
    guide: 'Apakah arah geser koma dan banyak lompatannya sudah sesuai dengan pangkatnya?',
    rule: 'Mengubah bentuk biasa ke bentuk baku dan sebaliknya saling membalik: nilai bilangan tidak berubah, hanya cara menuliskannya.',
  },
  t4: {
    guide: 'Apa yang terjadi pada bilangan depan dan pada pangkat saat dikali atau dibagi?',
    rule: 'Kali: bilangan depan dikali, pangkat dijumlah. Bagi: bilangan depan dibagi, pangkat dikurang. Hasil akhirnya ditulis dalam bentuk baku.',
  },
  t5: {
    guide: 'Apa yang diketahui, apa yang ditanya, dan apa satuannya?',
    rule: 'Besaran nyata ditulis dalam bentuk baku beserta satuannya. Samakan satuan sebelum menghitung, lalu periksa apakah hasilnya masuk akal.',
  },
};
