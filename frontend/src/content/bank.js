/**
 * Bank soal per topik (docs/CONTENT-GUIDE.md). Lima topik:
 *   t1 Pangkat Sepuluh & Nilai Tempat · t2 Bilangan Besar & Kecil · t3 Mengubah Bentuk Biasa & Baku ·
 *   t4 Operasi Hitung · t5 Penerapan & Pemodelan.
 *
 * Struktur latihan (disetujui pengembang, 23 Nov 2026 — menggantikan Level 1–4 berisi 4–5 soal):
 *   setiap topik punya SATU level latihan berisi 10 soal (total 50), dikerjakan BERURUTAN dari mudah ke sulit:
 *     soal 1–3  `tier: 'mudah'`  — mengenali (istilah, konversi sederhana, nilai tempat)
 *     soal 4–7  `tier: 'sedang'` — alasan, hubungan, menghitung, menemukan kesalahan sederhana
 *     soal 8–10 `tier: 'sulit'`  — penalaran bertahap, gabungan konsep, konteks (literasi, PMSTP)
 *   `quiz` = kuis tiap topik di modul interaktif (tidak berubah). Kuis Akhir (FINAL_QUIZ) = evaluasi gabungan.
 *
 * Setiap soal punya POLA (keterampilan + bentuk pertanyaan + cara penyelesaian). Pilihan ganda konsep diberi
 * `form`. Aturan (content.test.js memeriksanya):
 *  - Kunci jawaban dihitung oleh lib/sci; pilihan ganda numerik diperiksa ulang dengan mesin.
 *  - Tidak ada soal kembar di seluruh bank (latihan, kuis topik, Kuis Akhir), dan tidak memakai bilangan
 *    contoh terurai di materi.
 *  - Satu pola hanya sekali dalam latihan sebuah topik (tidak sekadar ganti angka/konteks) dan tidak berulang
 *    di dalam satu kuis. Kalimat soal & susunan pilihan tidak dipakai dua kali.
 *  - Pilihan ganda konsep selalu punya 3 petunjuk (`hints`) dan pembahasan (`explain`).
 *  - Soal berkonteks memakai `text` + label `literacy` (process, context, model_type).
 */
import { compareQuestion } from '../lib/sci/index.js';

const sci = (value, extra) => ({ type: 'to_scientific', value, ...extra });
const pow = (value, extra) => ({ type: 'power_of_ten', value, ...extra });
const ten = (n) => ({ type: 'ten_to_standard', n });
const pv = (value, pos) => ({ type: 'place_value', value, pos });
// Topik 3: petunjuk & pembahasan khusus (lib/sci/steps.js) lewat `focus`.
const zero = (value) => ({ type: 'to_scientific', value, focus: 'zero' });
const back = (a, n) => ({ type: 'to_standard', a, n, focus: 'back' });
// Topik 4–5
const norm = (a, n, extra) => ({ type: 'normalize', a, n, ...extra });
const P = (a, n) => ({ a, n });
const mul = (x, y, extra) => ({ type: 'operation', op: 'kali', x, y, ...extra });
const div = (x, y, extra) => ({ type: 'operation', op: 'bagi', x, y, ...extra });
const cmp = (items, want, extra) => compareQuestion(items, want, extra);
const lit = (process, context, model_type) => ({ literacy: { process, context, model_type } });

/** Tingkat kesulitan menurut urutan: 3 mudah, 4 sedang, 3 sulit. */
export const TIERS = ['mudah', 'mudah', 'mudah', 'sedang', 'sedang', 'sedang', 'sedang', 'sulit', 'sulit', 'sulit'];
const graded = (qs) => qs.map((q, i) => ({ ...q, tier: TIERS[i] }));

/**
 * Pilihan ganda konsep. `options` = [[teks, kodeKesalahan?], …]; pilihan tanpa kode = jawaban benar.
 * Letak jawaban benar sengaja berpindah-pindah.
 */
function mc(form, text, options, explain, hints, extra = {}) {
  const keys = 'abcd';
  return {
    type: 'choose_correct',
    form,
    text,
    options: options.map(([t, code], i) => ({ key: keys[i], text: t, ...(code ? { errorCode: code } : {}) })),
    answer: keys[options.findIndex(([, code]) => !code)],
    explain,
    hints,
    ...extra,
  };
}

export const BANK = {
  // ------------------------------------------------------------------ Topik 1
  t1: {
    levels: {
      1: graded([
        // mudah — mengenali arti pangkat 10, istilah, nilai tempat
        ten(3),
        mc(
          'istilah',
          'Pada 10⁵, angka 5 disebut …',
          [['basis', 'E-LAIN'], ['pangkat'], ['hasil', 'E-LAIN'], ['nilai tempat', 'E-LAIN']],
          ['Pada aⁿ, a disebut basis dan n disebut pangkat.', 'Pada 10⁵, basisnya 10 dan pangkatnya 5.', 'Jadi angka 5 disebut pangkat.'],
          ['Bilangan berpangkat ditulis aⁿ.', 'Angka besar di bawah (a) dan angka kecil di atas (n) punya nama berbeda.', 'Angka kecil di atas menunjukkan berapa kali 10 dikalikan. Namanya …'],
        ),
        pv('3.725', 2),
        // sedang — pangkat negatif, alasan, nilai tempat desimal, pola
        pow('0,00001'),
        mc(
          'alasan-pangkat-negatif',
          'Mengapa 10⁻² kurang dari 1?',
          [['Karena hasilnya bilangan negatif', 'E-TANDA'], ['Karena 10⁻² = 1 : 10² = 1 : 100'], ['Karena 10⁻² = 10 − 2', 'E-OPERASI'], ['Karena 10⁻² = −20', 'E-TANDA']],
          ['Pangkat negatif berarti membagi: 10⁻² = 1 : 10².', '1 : 100 = 0,01.', '0,01 kurang dari 1, tetapi tetap positif.'],
          ['Pangkat negatif tidak membuat bilangannya negatif.', 'Pangkat negatif berarti 1 dibagi 10 pangkat positifnya.', '10⁻² = 1 : 10² = 1 : … Hasilnya lebih atau kurang dari 1?'],
        ),
        pv('0,486', -2),
        mc(
          'pola-pangkat',
          'Dari 10⁴ ke 10³, lalu ke 10², nilainya selalu …',
          [['dibagi 10'], ['dikali 10', 'E-TANDA'], ['dikurangi 10', 'E-LAIN'], ['dikurangi 1', 'E-LAIN']],
          ['10⁴ = 10.000, 10³ = 1.000, 10² = 100.', 'Setiap pangkat turun satu, satu angka nol hilang.', 'Jadi nilainya selalu dibagi 10.'],
          ['Tulis dulu nilainya: 10⁴ = 10.000, 10³ = 1.000.', 'Bandingkan 10.000 dengan 1.000. Apa yang terjadi?', 'Satu angka nol hilang setiap pangkat turun 1. Itu sama dengan dibagi …'],
        ),
        // sulit — dekomposisi nilai tempat, menganalisis kesalahan, pergeseran nilai tempat
        mc(
          'dekomposisi',
          'Bilangan 4.506 jika diuraikan menurut nilai tempatnya adalah …',
          [['(4 × 10³) + (5 × 10²) + (6 × 10¹)', 'E-NOL'], ['(4 × 10⁴) + (5 × 10³) + (6 × 10⁰)', 'E-PANGKAT'], ['(4 × 10³) + (5 × 10²) + (6 × 10⁰)'], ['4 × 10³ × 5 × 10² × 6', 'E-OPERASI']],
          ['4.506 = 4.000 + 500 + 0 + 6.', '4.000 = 4 × 10³ dan 500 = 5 × 10². Angka 0 di tempat puluhan bernilai nol, dan 6 = 6 × 10⁰.', 'Jadi 4.506 = (4 × 10³) + (5 × 10²) + (6 × 10⁰).'],
          ['Pisahkan 4.506 menurut tempatnya: ribuan, ratusan, puluhan, satuan.', 'Angka 0 ada di tempat puluhan, jadi nilainya nol. Angka 6 ada di tempat satuan.', 'Satuan = 10⁰, ratusan = 10², ribuan = 10³. Pasangkan setiap angka dengan tempatnya.'],
        ),
        pow('0,000001', {
          form: 'kesalahan-posisi',
          text: 'Dika menulis 0,000001 = 10⁻⁵ karena ada lima angka nol setelah koma. Tulis pangkat yang benar:',
          hints: ['Yang menentukan pangkat bukan banyaknya nol, tetapi posisi angka 1.', 'Hitung posisi angka 1 setelah koma: 0,000001.', 'Angka 1 ada di posisi ke-6 setelah koma. Pangkatnya negatif, jadi −…'],
          explain: ['Ada 5 angka nol setelah koma, tetapi pangkat ditentukan oleh posisi angka 1.', 'Angka 1 ada di posisi ke-6 setelah koma.', 'Jadi 0,000001 = 10⁻⁶, bukan 10⁻⁵.'],
          ...lit(['NALAR'], 'PERSONAL', 'PANGKAT10'),
        }),
        mc(
          'geser-nilai-tempat',
          'Pada 0,03, angka 3 bernilai 3 × 10⁻². Jika 0,03 dikali 10³, angka 3 bernilai …',
          [['3 × 10⁻⁵', 'E-TANDA'], ['3 × 10³', 'E-PANGKAT'], ['3 × 10⁻⁶', 'E-OPERASI'], ['3 × 10¹']],
          ['Dikali 10³ berarti setiap angka bergeser 3 tempat ke kiri, nilainya 1.000 kali lebih besar.', 'Pangkat nilai tempatnya bertambah 3: −2 + 3 = 1.', '0,03 × 1.000 = 30, jadi angka 3 kini bernilai 3 × 10¹ (tiga puluhan).'],
          ['Dikali 10³ membuat bilangan 1.000 kali lebih besar.', 'Nilai tempat angka 3 naik 3 tingkat: pangkatnya −2 + 3.', 'Cek: 0,03 × 1.000 = 30. Angka 3 kini ada di tempat …'],
        ),
      ]),
    },
    quiz: [
      ten(-7),
      pow('100.000.000.000'),
      pv('8.160', 3),
      pv('0,739', -3),
      mc(
        'pangkat-nol',
        '10⁰ sama dengan …',
        [['0', 'E-LAIN'], ['1'], ['10', 'E-PANGKAT'], ['tidak ada nilainya', 'E-LAIN']],
        ['Perhatikan polanya: 10² = 100, 10¹ = 10.', 'Setiap pangkat turun satu, nilainya dibagi 10.', '10⁰ = 10 : 10 = 1.'],
        ['Tulis pola 10², 10¹, lalu 10⁰.', '10² = 100 dan 10¹ = 10. Setiap turun, nilainya dibagi 10.', '10⁰ = 10 : 10 = …'],
      ),
    ],
  },

  // ------------------------------------------------------------------ Topik 2
  t2: {
    levels: {
      1: graded([
        // mudah — mengenali bilangan sangat besar & sangat kecil, membandingkan dua bilangan
        mc(
          'nama-bilangan-besar',
          'Bilangan 10⁹ dibaca …',
          [['satu juta', 'E-PANGKAT'], ['sembilan puluh', 'E-OPERASI'], ['satu triliun', 'E-PANGKAT'], ['satu miliar']],
          ['10⁹ = 1.000.000.000, yaitu angka 1 diikuti 9 angka nol.', '1.000.000 (6 nol) = satu juta; 1.000.000.000 (9 nol) = satu miliar.', 'Jadi 10⁹ dibaca satu miliar.'],
          ['Tulis 10⁹ sebagai angka 1 diikuti angka nol.', 'Ada berapa angka nol? Kelompokkan tiga-tiga dari kanan.', '6 nol = juta, 9 nol = …'],
        ),
        mc(
          'tanda-pangkat',
          'Bilangan 0,004 jika ditulis dalam bentuk baku memiliki pangkat …',
          [['positif', 'E-TANDA'], ['nol', 'E-PANGKAT'], ['negatif'], ['tidak bisa ditulis', 'E-LAIN']],
          ['0,004 kurang dari 1.', 'Bilangan antara 0 dan 1 selalu berpangkat negatif.', 'Bentuk bakunya 4 × 10⁻³.'],
          ['Apakah 0,004 lebih dari 1 atau kurang dari 1?', 'Bilangan besar (≥ 10) berpangkat positif.', 'Bilangan antara 0 dan 1 berpangkat …'],
        ),
        cmp([P('3,2', 4), P('9,8', 3)], 'besar'),
        // sedang — menafsirkan letak, menemukan kesalahan tanda, memahami skala, membandingkan pangkat sama
        mc(
          'kesalahan-tanda',
          'Tono menulis 0,0012 = 1,2 × 10³. Bagian mana yang salah?',
          [['Letak koma pada 1,2', 'E-KOMA'], ['Tanda pangkatnya; seharusnya 1,2 × 10⁻³'], ['Seharusnya ditulis 12 × 10⁻⁴', 'E-NORMAL'], ['Tidak ada yang salah', 'E-TANDA']],
          ['a = 1,2 sudah benar (1 ≤ 1,2 < 10).', '0,0012 kurang dari 1, jadi pangkatnya harus negatif.', 'Bentuk baku yang benar: 1,2 × 10⁻³.'],
          ['Periksa nilai a dulu: apakah 1,2 di antara 1 dan 10?', 'Lalu periksa pangkatnya. Apakah 0,0012 lebih dari 1?', 'Bilangan kurang dari 1 berpangkat negatif. Bagian mana yang perlu diubah?'],
        ),
        mc(
          'tafsir-letak',
          'Bilangan 2,3 × 10⁻⁴ terletak di antara …',
          [['0,001 dan 0,01', 'E-PANGKAT'], ['0,0001 dan 0,001'], ['1.000 dan 10.000', 'E-TANDA'], ['0 dan 0,0001', 'E-PANGKAT']],
          ['2,3 × 10⁻⁴ = 0,00023.', '0,0001 = 1 × 10⁻⁴ dan 0,001 = 1 × 10⁻³.', '0,0001 < 0,00023 < 0,001, jadi letaknya di antara 0,0001 dan 0,001.'],
          ['Ubah 2,3 × 10⁻⁴ ke bentuk biasa dulu.', 'Pangkat −4: angka 2 ada di posisi ke-4 setelah koma → 0,00023.', 'Bandingkan 0,00023 dengan batas-batas pada setiap pilihan.'],
        ),
        mc(
          'pilih-skala',
          'Besaran manakah yang paling cocok bernilai sekitar 1,5 × 10⁸ km?',
          [['Tinggi badan seorang siswa', 'E-PANGKAT'], ['Jarak Bumi ke Matahari'], ['Panjang seekor semut', 'E-TANDA'], ['Jarak rumah ke sekolah', 'E-PANGKAT']],
          ['1,5 × 10⁸ km = 150.000.000 km, yaitu seratus lima puluh juta kilometer.', 'Tinggi badan dan panjang semut jauh lebih kecil dari 1 km; jarak rumah ke sekolah biasanya hanya beberapa km.', 'Besaran sejauh ratusan juta km adalah jarak benda langit: jarak Bumi ke Matahari.'],
          ['Ubah dulu 1,5 × 10⁸ km ke bentuk biasa.', 'Pangkat 8 berarti ratusan juta kilometer. Itu sangat jauh!', 'Besaran mana yang jaraknya ratusan juta kilometer?'],
          lit(['TAFSIR'], 'SAINTIFIK', 'BANDING'),
        ),
        cmp([P('4,7', -3), P('7,4', -3), P('4,07', -3)], 'kecil'),
        // sulit — mengurutkan banyak bilangan, menalar banyak angka, membandingkan skala dalam konteks
        mc(
          'urut-baku',
          'Urutan dari yang terkecil: 5 × 10⁻², 3 × 10¹, 8 × 10⁻³, 1 × 10⁰ adalah …',
          [['8 × 10⁻³, 5 × 10⁻², 1 × 10⁰, 3 × 10¹'], ['5 × 10⁻², 8 × 10⁻³, 1 × 10⁰, 3 × 10¹', 'E-TANDA'], ['1 × 10⁰, 3 × 10¹, 5 × 10⁻², 8 × 10⁻³', 'E-LAIN'], ['8 × 10⁻³, 5 × 10⁻², 3 × 10¹, 1 × 10⁰', 'E-PANGKAT']],
          ['Urutkan berdasarkan pangkatnya: −3 < −2 < 0 < 1.', 'Bila pangkatnya berbeda, pangkat yang lebih kecil berarti bilangan yang lebih kecil.', 'Urutannya 8 × 10⁻³ (0,008), 5 × 10⁻² (0,05), 1 × 10⁰ (1), 3 × 10¹ (30).'],
          ['Lihat pangkat setiap bilangan.', 'Jika pangkatnya berbeda, pangkat yang lebih kecil = bilangan yang lebih kecil.', 'Urutkan pangkatnya: −3, −2, 0, 1.'],
        ),
        mc(
          'nalar-banyak-angka',
          'Sebuah bilangan ditulis a × 10⁵ dalam bentuk baku. Bilangan itu memiliki berapa angka sebelum koma?',
          [['5 angka', 'E-PANGKAT'], ['6 angka'], ['7 angka', 'E-PANGKAT'], ['Bisa berapa saja, bergantung pada a', 'E-LAIN']],
          ['Karena 1 ≤ a < 10, nilai a × 10⁵ paling kecil 1 × 10⁵ = 100.000.', 'Nilainya selalu kurang dari 10 × 10⁵ = 1.000.000.', 'Semua bilangan dari 100.000 sampai kurang dari 1.000.000 punya 6 angka sebelum koma.'],
          ['Coba nilai a paling kecil: a = 1.', '1 × 10⁵ = 100.000. Ada berapa angka?', 'Coba juga a = 9,9: 9,9 × 10⁵ = 990.000. Banyak angkanya tetap …'],
        ),
        mc(
          'berapa-kali',
          'Diameter sel darah merah sekitar 8 × 10⁻⁶ m, sedangkan diameter sebutir pasir sekitar 8 × 10⁻⁴ m. Butir pasir itu berapa kali lebih besar?',
          [['2 kali', 'E-PANGKAT'], ['10⁻² kali', 'E-TANDA'], ['10² kali, yaitu 100 kali'], ['10¹⁰ kali', 'E-OPERASI']],
          ['Angka depannya sama (8), jadi cukup bandingkan pangkatnya.', 'Dari 10⁻⁶ ke 10⁻⁴, pangkatnya naik 2: −4 − (−6) = 2.', 'Jadi butir pasir 10² = 100 kali lebih besar dari sel darah merah.'],
          ['Angka depan kedua bilangan sama. Bagian mana yang berbeda?', 'Setiap pangkat naik 1, bilangannya 10 kali lebih besar.', 'Dari −6 ke −4 pangkatnya naik … Jadi 10 pangkat itu kali lebih besar.'],
          lit(['NALAR', 'TAFSIR'], 'SAINTIFIK', 'BANDING'),
        ),
      ]),
    },
    quiz: [
      sci('62.000'),
      sci('0,00045'),
      cmp([P('6', 5), P('1,2', 6)], 'besar'),
      sci('0,09'),
      mc(
        'pilih-hasil-baku',
        'Bentuk baku dari 48.200.000 adalah …',
        [['4,82 × 10⁷'], ['48,2 × 10⁶', 'E-KOMA'], ['4,82 × 10⁶', 'E-PANGKAT'], ['4,82 × 10⁻⁷', 'E-TANDA']],
        ['Angka bukan nol pertama adalah 4; taruh koma setelahnya: 4,82.', 'Koma melompat 7 kali ke kiri, jadi pangkatnya positif 7.', '48.200.000 = 4,82 × 10⁷.'],
        ['Cari angka bukan nol pertama dan taruh koma setelahnya.', 'Hitung lompatan koma dari ujung bilangan sampai setelah angka 4.', 'Bilangannya besar, jadi pangkatnya positif. Ada 7 lompatan.'],
      ),
    ],
  },

  // ------------------------------------------------------------------ Topik 3
  t3: {
    levels: {
      1: graded([
        // mudah — aturan penulisan bentuk baku, mengubah dua arah yang sederhana
        mc(
          'pilih-baku',
          'Manakah yang sudah ditulis dalam bentuk baku?',
          [['25 × 10⁸', 'E-KOMA'], ['2,5 × 10⁹'], ['0,25 × 10¹⁰', 'E-KOMA'], ['2,5 + 10⁹', 'E-FORMAT']],
          ['Bentuk baku: a × 10ⁿ dengan 1 ≤ a < 10.', '25 lebih dari 10, dan 0,25 kurang dari 1. Pada pilihan d tandanya tambah, bukan kali.', 'Hanya 2,5 × 10⁹ yang memenuhi.'],
          ['Ingat syarat bentuk baku: a × 10ⁿ dengan 1 ≤ a < 10.', 'Periksa nilai a di setiap pilihan. Apakah di antara 1 dan 10?', 'Periksa juga tandanya: harus "×", bukan "+".'],
        ),
        sci('3.000'),
        back('4,5', 3),
        // sedang — bilangan kecil ke bentuk baku & sebaliknya, nol di tengah, alasan geser koma
        sci('0,05'),
        back('2,5', -3),
        zero('4.050'),
        mc(
          'alasan-tambah-nol',
          'Mengapa 4,7 × 10³ = 4.700, bukan 47.000?',
          [['Karena pangkat 3 berarti menambah 3 angka nol', 'E-PANGKAT'], ['Koma bergeser 3 kali: 4,7 → 47 → 470 → 4.700'], ['Karena nol di belakang harus dibuang', 'E-NOL'], ['Karena 4,7 dikali 3', 'E-OPERASI']],
          ['Pangkat 3 berarti koma bergeser 3 kali ke kanan, bukan menambah 3 nol.', 'Geseran pertama melewati angka 7 (47), lalu dua geseran berikutnya menambah nol: 470, 4.700.', 'Jadi hanya 2 nol yang ditambahkan: 4,7 × 10³ = 4.700.'],
          ['Pangkat menunjukkan banyak geseran koma, bukan banyak nol.', 'Geser koma satu per satu: 4,7 → 47 → …', 'Angka 7 sudah memakai satu geseran. Sisa geserannya diisi nol.'],
        ),
        // sulit — menemukan kesalahan geser, memperbaiki bentuk yang belum baku, konteks
        {
          ...mc(
            'kesalahan-geser',
            'Andi mengubah 3,07 × 10⁻⁵ menjadi 0,000307. Apa yang benar?',
            [['Nol tengah seharusnya dibuang: 0,000037', 'E-NOL'], ['Pangkatnya seharusnya positif', 'E-TANDA'], ['Koma baru bergeser 4 kali; seharusnya 5 kali: 0,0000307'], ['Andi sudah benar', 'E-PANGKAT']],
            ['Pangkat −5 → koma bergeser 5 kali ke kiri.', 'Angka 3 harus ada di posisi ke-5 setelah koma.', 'Jadi 3,07 × 10⁻⁵ = 0,0000307. Andi baru menggeser 4 kali.'],
            ['Pangkat −5 berarti koma bergeser 5 kali ke kiri.', 'Pada hasil Andi, angka 3 ada di posisi ke berapa setelah koma?', 'Angka 3 seharusnya di posisi ke-5. Nol tengah pada 3,07 tetap ditulis.'],
          ),
          focus: 'back',
          a: '3,07',
          n: -5,
        },
        mc(
          'perbaiki-bentuk-baku',
          'Massa sebutir debu 0,00000075 kg. Rudi menulis massa itu sebagai 75 × 10⁻⁸ kg. Mengapa belum bentuk baku, dan bagaimana bentuk bakunya?',
          [['Pangkatnya harus positif: 7,5 × 10⁷ kg', 'E-TANDA'], ['Nilainya salah; bentuk bakunya 7,5 × 10⁻⁸ kg', 'E-PANGKAT'], ['75 tidak di antara 1 dan 10; bentuk bakunya 7,5 × 10⁻⁷ kg'], ['Sudah bentuk baku', 'E-NORMAL']],
          ['75 × 10⁻⁸ bernilai benar (= 0,00000075), tetapi 75 tidak di antara 1 dan 10.', '75 = 7,5 × 10¹, jadi 75 × 10⁻⁸ = 7,5 × 10¹⁺⁽⁻⁸⁾ = 7,5 × 10⁻⁷.', 'Cek: angka 7 ada di posisi ke-7 setelah koma pada 0,00000075 ✓'],
          ['Periksa syarat a: apakah 75 di antara 1 dan 10?', 'Ubah 75 menjadi 7,5 × 10¹, lalu gabungkan dengan 10⁻⁸.', 'Pangkatnya 1 + (−8) = … Pangkat tetap negatif karena bilangannya kurang dari 1.'],
          lit(['NALAR'], 'SAINTIFIK', 'BENTUK_BAKU'),
        ),
        {
          type: 'choose_correct',
          focus: 'zero',
          value: '0,000000105',
          text: 'Diameter sebuah virus sekitar 0,000000105 m. Dalam bentuk baku, diameternya …',
          options: [
            { key: 'a', text: '1,5 × 10⁻⁷ m', errorCode: 'E-NOL' },
            { key: 'b', text: '1,05 × 10⁷ m', errorCode: 'E-TANDA' },
            { key: 'c', text: '1,05 × 10⁻⁷ m' },
            { key: 'd', text: '10,5 × 10⁻⁸ m', errorCode: 'E-KOMA' },
          ],
          answer: 'c',
          ...lit(['RUMUS'], 'SAINTIFIK', 'BENTUK_BAKU'),
        },
      ]),
    },
    quiz: [
      back('2,7', 6),
      back('5,4', -2),
      zero('8.006.000'),
      zero('0,000703'),
      {
        type: 'choose_correct',
        focus: 'back',
        a: '4,05',
        n: -3,
        text: 'Bentuk biasa dari 4,05 × 10⁻³ adalah …',
        options: [
          { key: 'a', text: '0,0405', errorCode: 'E-PANGKAT' },
          { key: 'b', text: '0,00405' },
          { key: 'c', text: '0,0045', errorCode: 'E-NOL' },
          { key: 'd', text: '4.050', errorCode: 'E-TANDA' },
        ],
        answer: 'b',
      },
    ],
  },

  // ------------------------------------------------------------------ Topik 4
  t4: {
    levels: {
      1: graded([
        // mudah — aturan pangkat, kali & bagi sederhana
        mc(
          'aturan-kali',
          '(a × 10ᵐ) × (b × 10ⁿ) = (a × b) × 10 pangkat …',
          [['m + n'], ['m × n', 'E-OPERASI'], ['m − n', 'E-OPERASI'], ['m : n', 'E-OPERASI']],
          ['10ᵐ × 10ⁿ berarti 10 dikalikan sebanyak m kali, lalu n kali lagi.', 'Banyak faktornya m + n.', 'Jadi saat mengalikan, pangkatnya dijumlah.'],
          ['Coba dengan contoh kecil: 10² × 10³.', '10² × 10³ = (10 × 10) × (10 × 10 × 10). Ada berapa angka 10?', 'Ada 5 = 2 + 3 angka 10. Jadi pangkatnya di…'],
        ),
        mul(P('2', 3), P('3', 4)),
        div(P('8', 6), P('2', 2)),
        // sedang — menormalkan, menjumlah berpangkat sama, menemukan kesalahan aturan, hasil yang perlu dinormalkan
        norm('45', 5),
        mc(
          'tambah-pangkat-sama',
          '(3,2 × 10⁴) + (1,5 × 10⁴) = …',
          [['4,7 × 10⁸', 'E-OPERASI'], ['4,7 × 10⁴'], ['1,7 × 10⁴', 'E-OPERASI'], ['4,7 × 10¹⁶', 'E-OPERASI']],
          ['Pangkat kedua bilangan sama, yaitu 10⁴.', 'Jumlahkan angka depannya saja: 3,2 + 1,5 = 4,7. Pangkatnya tetap 10⁴.', 'Jadi hasilnya 4,7 × 10⁴ (sudah bentuk baku).'],
          ['Pada penjumlahan, pangkatnya tidak ikut dijumlah.', 'Mirip 3,2 kg + 1,5 kg: "satuannya" (10⁴) tetap, angkanya dijumlah.', 'Hitung 3,2 + 1,5, lalu tulis dengan 10⁴.'],
        ),
        mc(
          'kesalahan-aturan-bagi',
          'Ana menghitung (6 × 10⁴) : (2 × 10¹) = 3 × 10⁵. Apa yang benar?',
          [['Seharusnya 4 × 10³', 'E-OPERASI'], ['Seharusnya 3 × 10⁴', 'E-PANGKAT'], ['Ana sudah benar', 'E-OPERASI'], ['Pangkatnya dijumlah; seharusnya dikurang, jadi 3 × 10³']],
          ['6 : 2 = 3. Bagian ini sudah benar.', 'Saat membagi, pangkatnya dikurang: 4 − 1 = 3.', 'Hasil yang benar: 3 × 10³. Ana menjumlahkan pangkat (4 + 1 = 5).'],
          ['Periksa angka depannya dulu: 6 : 2 = ?', 'Lalu periksa pangkatnya. Pada pembagian, pangkat dijumlah atau dikurang?', 'Pangkatnya 4 − 1 = … Bandingkan dengan jawaban Ana.'],
        ),
        mul(P('5', 3), P('4', 2)),
        // sulit — mengurangkan berpangkat beda, operasi campuran, soal cerita (PMSTP)
        mc(
          'kurang-samakan-pangkat',
          '(5 × 10⁵) − (3 × 10⁴) = …',
          [['2 × 10¹', 'E-OPERASI'], ['2 × 10⁵', 'E-PANGKAT'], ['4,7 × 10⁵'], ['47 × 10⁴', 'E-NORMAL']],
          ['Pangkatnya berbeda, jadi samakan dulu: 5 × 10⁵ = 50 × 10⁴.', 'Kurangkan angka depannya: (50 − 3) × 10⁴ = 47 × 10⁴.', 'Normalkan: 47 × 10⁴ = 4,7 × 10⁵. Cek: 500.000 − 30.000 = 470.000 ✓'],
          ['Penjumlahan dan pengurangan hanya boleh langsung bila pangkatnya sama.', 'Ubah 5 × 10⁵ menjadi … × 10⁴ (koma bergeser 1 kali ke kanan).', '(50 − 3) × 10⁴ = 47 × 10⁴. Jangan lupa menormalkan hasilnya.'],
        ),
        mc(
          'operasi-campuran',
          '(6 × 10⁵) × (2 × 10³) : (4 × 10²) = …',
          [['3 × 10¹⁰', 'E-OPERASI'], ['3 × 10⁵', 'E-PANGKAT'], ['0,3 × 10⁷', 'E-NORMAL'], ['3 × 10⁶']],
          ['Kerjakan dari kiri: (6 × 2) × 10⁵⁺³ = 12 × 10⁸.', 'Lalu bagi: (12 : 4) × 10⁸⁻² = 3 × 10⁶.', '3 sudah di antara 1 dan 10, jadi hasilnya 3 × 10⁶.'],
          ['Kerjakan berurutan dari kiri: kalikan dulu, lalu bagi.', '(6 × 10⁵) × (2 × 10³) = 12 × 10⁸.', 'Bagi 12 × 10⁸ dengan 4 × 10²: angka depan dibagi, pangkat dikurang.'],
        ),
        div(P('6', 3), P('1,5', -1), {
          text: 'Seutas kabel sepanjang 6 × 10³ m dipotong-potong, masing-masing 1,5 × 10⁻¹ m. Berapa potongan yang didapat?',
          ...lit(['RUMUS', 'TERAP'], 'PERSONAL', 'BAGI'),
        }),
      ]),
    },
    quiz: [mul(P('3', 2), P('3', 3)), div(P('6', 8), P('3', -2)), norm('0,25', -3), mul(P('8', -4), P('5', -3)), div(P('4,8', 6), P('1,6', -2))],
  },

  // ------------------------------------------------------------------ Topik 5
  t5: {
    levels: {
      1: graded([
        // mudah — satuan sebagai pangkat 10, besaran nyata dalam bentuk baku, memilih operasi
        mc(
          'satuan-dasar',
          '1 km sama dengan …',
          [['10² m', 'E-SATUAN'], ['10³ m'], ['10⁻³ m', 'E-TANDA'], ['10⁶ m', 'E-SATUAN']],
          ['Kilo berarti seribu.', '1 km = 1.000 m.', '1.000 = 10³, jadi 1 km = 10³ m.'],
          ['Awalan "kilo" artinya seribu.', 'Berapa meter dalam 1 km?', '1.000 m = 10 pangkat … m.'],
          lit(['RUMUS'], 'PERSONAL', 'SATUAN'),
        ),
        mc(
          'pilih-informasi',
          'Sebuah bus membawa 4 × 10¹ penumpang dan menempuh 3 × 10² km. Untuk menghitung banyak penumpang 6 bus sejenis, informasi yang diperlukan adalah …',
          [['jarak tempuh dan banyak bus', 'E-MODEL'], ['jarak tempuh saja', 'E-MODEL'], ['banyak penumpang dan jarak tempuh', 'E-MODEL'], ['banyak penumpang satu bus dan banyak bus']],
          ['Yang ditanyakan adalah banyak penumpang, bukan jarak.', 'Penumpang 6 bus = penumpang 1 bus × banyak bus.', 'Jarak tempuh (3 × 10² km) tidak diperlukan. Informasinya: 4 × 10¹ penumpang dan 6 bus.'],
          ['Baca lagi: apa yang ditanyakan?', 'Yang ditanyakan banyak penumpang. Informasi mana yang berhubungan dengan penumpang?', 'Jarak tempuh tidak mengubah banyak penumpang. Pilih informasi tentang penumpang dan banyak bus.'],
          lit(['RUMUS'], 'SOSBUD', 'KALI'),
        ),
        mc(
          'pilih-operasi',
          'Satu kotak berisi 2 × 10² kelereng. Ada 3 × 10³ kotak. Operasi untuk mencari banyak kelereng seluruhnya adalah …',
          [['kali'], ['bagi', 'E-MODEL'], ['tambah', 'E-MODEL'], ['kurang', 'E-MODEL']],
          ['Setiap kotak isinya sama, dan kotaknya ada banyak.', '"Isi tiap kotak × banyak kotak" = seluruh kelereng.', 'Jadi operasinya kali: (2 × 10²) × (3 × 10³).'],
          ['Bayangkan dengan angka kecil: 3 kotak, masing-masing 2 kelereng.', 'Isi setiap kotak sama banyak. Itu penjumlahan berulang.', 'Penjumlahan berulang yang sama ditulis dengan operasi …'],
          lit(['RUMUS'], 'PERSONAL', 'KALI'),
        ),
        // sedang — menyusun model, menafsirkan ukuran, menghitung soal cerita, membandingkan data
        mc(
          'susun-model-bagi',
          'Uang Rp6 × 10⁶ dibagi rata kepada 3 × 10² siswa. Model yang tepat untuk menghitung bagian tiap siswa adalah …',
          [['(6 × 10⁶) × (3 × 10²)', 'E-MODEL'], ['(6 × 10⁶) : (3 × 10²)'], ['(3 × 10²) : (6 × 10⁶)', 'E-MODEL'], ['(6 × 10⁶) − (3 × 10²)', 'E-MODEL']],
          ['"Dibagi rata" berarti operasi bagi.', 'Yang dibagi adalah uangnya, pembaginya banyak siswa.', 'Model: (6 × 10⁶) : (3 × 10²).'],
          ['Kata "dibagi rata" menunjukkan operasinya.', 'Urutan pada pembagian penting: apa yang dibagi, dan dibagi kepada siapa?', 'Uangnya yang dibagi, banyak siswa sebagai pembagi.'],
          lit(['RUMUS'], 'SOSBUD', 'BAGI'),
        ),
        mc(
          'tafsir-ukuran',
          'Tebal selembar kertas tipis 9 × 10⁻⁵ m. Pernyataan yang benar adalah … (1 mm = 10⁻³ m)',
          [['Kertas itu lebih tebal dari 1 mm, karena 9 > 1', 'E-PANGKAT'], ['Tebalnya 9 mm', 'E-SATUAN'], ['Kertas itu lebih tipis dari 1 mm, karena 10⁻⁵ < 10⁻³'], ['Tebalnya bilangan negatif', 'E-TANDA']],
          ['Bandingkan 9 × 10⁻⁵ m dengan 1 × 10⁻³ m: lihat pangkatnya dulu.', '−5 lebih kecil dari −3, jadi 9 × 10⁻⁵ m lebih kecil.', '9 × 10⁻⁵ m = 0,00009 m = 0,09 mm, lebih tipis dari 1 mm.'],
          ['Ubah 1 mm ke meter: 1 × 10⁻³ m.', 'Saat membandingkan bentuk baku, bandingkan pangkatnya dulu.', 'Mana yang lebih kecil: −5 atau −3?'],
          lit(['TAFSIR'], 'PERSONAL', 'BANDING'),
        ),
        mul(P('5', -3), P('2', 3), {
          text: 'Seekor semut panjangnya 5 × 10⁻³ m. Berapa meter panjang barisan 2 × 10³ semut yang berjajar rapat?',
          unit: 'm',
          ...lit(['RUMUS', 'TERAP'], 'SAINTIFIK', 'KALI'),
        }),
        cmp([P('1,4', 6), P('9,6', 5)], 'besar', {
          text: 'Kota A berpenduduk 1,4 × 10⁶ jiwa, kota B 9,6 × 10⁵ jiwa. Pilih jumlah penduduk yang lebih banyak.',
          ...lit(['TAFSIR'], 'SOSBUD', 'BANDING'),
        }),
        // sulit — rata-rata per unit, dua langkah dengan ubah satuan, menafsirkan hasil
        div(P('4,5', 7), P('9', 4), {
          text: 'Sebuah provinsi berpenduduk 4,5 × 10⁷ jiwa dengan luas 9 × 10⁴ km². Rata-rata ada berapa jiwa setiap 1 km²?',
          unit: 'jiwa',
          ...lit(['RUMUS', 'TERAP', 'TAFSIR'], 'SOSBUD', 'BAGI'),
        }),
        mc(
          'dua-langkah-satuan',
          'Sebuah pesawat terbang 8 × 10² km setiap jam selama 1,5 × 10¹ jam. Berapa meter jarak yang ditempuh? (1 km = 10³ m)',
          [['1,2 × 10⁴ m', 'E-SATUAN'], ['1,2 × 10⁷ m'], ['12 × 10⁶ m', 'E-NORMAL'], ['1,2 × 10⁶ m', 'E-PANGKAT']],
          ['Jarak = kecepatan × waktu = (8 × 10²) × (1,5 × 10¹) = 12 × 10³ km = 1,2 × 10⁴ km.', 'Ubah ke meter: (1,2 × 10⁴) × 10³ = 1,2 × 10⁷ m.', 'Jadi jaraknya 1,2 × 10⁷ m.'],
          ['Langkah 1: jarak dalam km = kecepatan × waktu.', '(8 × 10²) × (1,5 × 10¹) = 12 × 10³ km. Normalkan dulu.', 'Langkah 2: ubah km ke m dengan mengalikan 10³.'],
          lit(['RUMUS', 'TERAP'], 'SAINTIFIK', 'KALI'),
        ),
        mc(
          'tafsir-hasil',
          'Rambut tumbuh sekitar 4 × 10⁻⁴ m setiap hari. Pernyataan yang benar tentang pertumbuhannya dalam 1 × 10³ hari adalah … (1 m = 10² cm)',
          [['4 × 10⁻¹ m, yaitu 4 cm', 'E-SATUAN'], ['4 × 10⁻¹² m', 'E-OPERASI'], ['4 × 10⁻¹ m, yaitu 40 cm'], ['4 × 10⁷ m', 'E-TANDA']],
          ['Pertumbuhan = (4 × 10⁻⁴) × (1 × 10³) = 4 × 10⁻¹ m.', '4 × 10⁻¹ m = 0,4 m.', '0,4 m × 10² = 40 cm.'],
          ['Pertumbuhan total = pertumbuhan per hari × banyak hari.', 'Pangkatnya dijumlah: −4 + 3 = −1.', '4 × 10⁻¹ m = 0,4 m. Ubah ke cm: kalikan 10².'],
          lit(['TERAP', 'TAFSIR'], 'PERSONAL', 'KALI'),
        ),
      ]),
    },
    quiz: [
      mul(P('7', 0), P('1', -6), {
        text: '1 µm (mikrometer) = 10⁻⁶ m. Tulis 7 µm dalam meter (bentuk baku).',
        unit: 'm',
        traps: [{ a: '7', n: 0, code: 'E-SATUAN' }],
        ...lit(['RUMUS'], 'SAINTIFIK', 'SATUAN'),
      }),
      mul(P('1', 5), P('3,65', 2), {
        text: 'Jantung berdetak sekitar 1 × 10⁵ kali sehari. Berapa kali jantung berdetak dalam 3,65 × 10² hari (1 tahun)?',
        unit: 'kali',
        ...lit(['RUMUS', 'TERAP'], 'SAINTIFIK', 'KALI'),
      }),
      div(P('1,5', 3), P('5', -1), {
        text: 'Air 1,5 × 10³ L dimasukkan ke botol-botol berisi 5 × 10⁻¹ L. Berapa botol yang diperlukan?',
        unit: 'botol',
        ...lit(['RUMUS', 'TERAP'], 'PERSONAL', 'BAGI'),
      }),
      mc(
        'urut-konteks',
        'Urutkan dari yang terkecil: bakteri 2 × 10⁻⁶ m, virus 1 × 10⁻⁷ m, butir pasir 5 × 10⁻⁴ m.',
        [['bakteri, virus, butir pasir', 'E-PANGKAT'], ['butir pasir, bakteri, virus', 'E-TANDA'], ['virus, bakteri, butir pasir'], ['virus, butir pasir, bakteri', 'E-PANGKAT']],
        ['Bandingkan pangkatnya: −7 < −6 < −4.', 'Pangkat paling kecil berarti ukuran paling kecil.', 'Urutannya: virus (10⁻⁷), bakteri (10⁻⁶), butir pasir (10⁻⁴).'],
        ['Untuk bentuk baku, bandingkan pangkatnya dulu.', 'Pangkat negatif yang lebih jauh dari nol berarti bilangannya lebih kecil.', 'Urutkan −4, −6, dan −7 dari yang terkecil.'],
        lit(['TAFSIR'], 'SAINTIFIK', 'BANDING'),
      ),
      sci('384.000', { text: 'Jarak Bumi ke Bulan sekitar 384.000 km. Tulis dalam bentuk baku:', ...lit(['RUMUS'], 'SAINTIFIK', 'BENTUK_BAKU') }),
    ],
  },
};

/**
 * Level 5 · Kuis Akhir: 10 soal, 2 dari setiap topik (`topic` = nomor topik). Tidak sama dengan soal
 * lain di bank (angka, kalimat, dan susunan pilihan berbeda) dan tidak ada pola yang berulang.
 */
export const FINAL_QUIZ = [
  { ...pv('9.402,1', 2), topic: 1 },
  {
    ...mc(
      'tulis-perkalian-berulang',
      '10 × 10 × 10 × 10 × 10 × 10 ditulis sebagai …',
      [['60', 'E-LAIN'], ['6¹⁰', 'E-LAIN'], ['10⁵', 'E-PANGKAT'], ['10⁶']],
      ['Angka 10 dikalikan berulang, jadi bisa ditulis sebagai pangkat dengan basis 10.', 'Angka 10 muncul 6 kali.', 'Jadi hasilnya 10⁶ = 1.000.000.'],
      ['Perkalian berulang ditulis sebagai bilangan berpangkat.', 'Basisnya adalah angka yang dikalikan berulang, yaitu 10.', 'Pangkatnya = banyak angka 10 yang dikalikan. Hitung ada berapa.'],
    ),
    topic: 1,
  },
  {
    ...mc(
      'batas-a',
      'Manakah yang BUKAN bentuk baku?',
      [['1 × 10⁵', 'E-NORMAL'], ['10 × 10³'], ['9,99 × 10⁻²', 'E-NORMAL'], ['4,1 × 10⁰', 'E-NORMAL']],
      ['Bentuk baku: a × 10ⁿ dengan 1 ≤ a < 10. Nilai a = 1 boleh, a = 10 tidak boleh.', '1, 9,99, dan 4,1 memenuhi syarat; pangkat 0 dan pangkat negatif juga boleh.', '10 × 10³ bukan bentuk baku. Bentuk bakunya 1 × 10⁴.'],
      ['Ingat syarat a: 1 ≤ a < 10. Perhatikan tanda ≤ dan <.', 'Apakah a = 1 boleh? Apakah a = 10 boleh?', 'Pangkat 0 dan pangkat negatif tetap boleh. Cari pilihan yang nilai a-nya tidak memenuhi.'],
    ),
    topic: 2,
  },
  { ...sci('0,0034'), topic: 2 },
  { ...back('6,4', -7), topic: 3 },
  { ...zero('40.700.000.000'), topic: 3 },
  { ...mul(P('6', 4), P('5', -7)), topic: 4 },
  { ...div(P('2,4', 9), P('8', 3)), topic: 4 },
  {
    ...mul(P('2,5', 1), P('6', 1), {
      text: 'Sebuah keran mengalirkan 2,5 × 10¹ L air setiap menit. Berapa liter air yang keluar dalam 6 × 10¹ menit (1 jam)?',
      unit: 'L',
      ...lit(['RUMUS', 'TERAP'], 'PERSONAL', 'KALI'),
    }),
    topic: 5,
  },
  {
    ...mc(
      'ubah-satuan-bagi',
      'Sebuah truk mengangkut 8 × 10³ kg pasir. Berapa ton muatannya? (1 ton = 10³ kg)',
      [['8 ton'], ['8 × 10⁶ ton', 'E-SATUAN'], ['80 ton', 'E-PANGKAT'], ['0,8 ton', 'E-PANGKAT']],
      ['Dari kg ke ton: bagi dengan 10³.', '(8 × 10³) : (1 × 10³) = 8 × 10⁰.', 'Jadi muatannya 8 ton.'],
      ['Ton lebih besar dari kg, jadi angkanya menjadi lebih kecil.', 'Bagi 8 × 10³ kg dengan 10³ kg.', '10³ : 10³ = 10⁰ = 1.'],
      lit(['RUMUS', 'TERAP'], 'PERSONAL', 'SATUAN'),
    ),
    topic: 5,
  },
];

/** Satu level latihan per topik (23 Nov 2026). Bentuk daftar dipertahankan agar halaman lama tetap jalan. */
export const LEVELS = [{ level: 1, name: 'Latihan', desc: '10 soal bertahap: mudah → sedang → sulit' }];

/** Nama level untuk label (Level 5 = Kuis Akhir). */
export const LEVEL_NAMES = { 1: 'Latihan', 5: 'Kuis Akhir' };

/** Soal per sesi: semua 10 soal latihan, berurutan. */
export const PER_SESSION = 10;
/** Lulus bila minimal 6 dari 10 benar (60%). */
export const PASS_COUNT = 6;
/** Batas lulus 60%, juga untuk sesi lama di Riwayat (5 soal → 3, 4 soal → 3, 10 soal → 6). Tanpa floating point. */
export const isPassed = (correct, total) => total > 0 && correct * 10 >= total * 6;
