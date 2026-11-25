# Rigorous Mathematical Thinking (RMT) di NoBaku

Dokumen acuan pedagogis untuk penerapan **Rigorous Mathematical Thinking** pada NoBaku (materi Bentuk Baku/Notasi Ilmiah, SMP kelas VIII).

**Acuan utama:** ringkasan buku *Rigorous Mathematical Thinking: Conceptual Formation in the Mathematics Classroom* karya James T. Kinard, Sr. dan Alex Kozulin, dari dosen pembimbing (Bab 1–6 dan Simpulan). Istilah di dokumen ini mengikuti istilah aslinya.

> **Status (21 Nov 2026):** Tahap 0 (dokumen ini) dan Tahap 1 (mediasi lewat teks) sudah diterapkan. Tahap 2–5 belum dikerjakan (lihat §8).
> **Bank soal tidak diubah.** Semua tambahan RMT berada di `content/rmt.js` dan `content/messages.js` (kolom `ask`). Tes `content/rmt.test.js` memeriksa sidik isi bank soal.

## 1. Ringkasan konsep RMT (dari dokumen acuan)

**Definisi.** RMT adalah proses mental ketika siswa secara aktif **menginternalisasi alat-alat psikologis matematika**, lalu memakainya untuk mengorganisasi, meregulasi, dan mentransformasikan pemikirannya saat memecahkan masalah. Model ini menyintesis dua teori:
- teori sosiokultural **Vygotsky**: alat simbolik, konsep ilmiah, *Learning Activity*, dan ZPD;
- teori *Structural Cognitive Modifiability* dan *Mediated Learning Experience* (SCM/MLE) dari **Feuerstein**.

**Rigor** adalah kualitas berpikir yang didorong keinginan kuat, gigih, dan konsisten untuk memahami secara mendalam. Cirinya: ketajaman fokus dan persepsi, kejelasan dan kelengkapan definisi, ketepatan (*precision*), akurasi, dan kedalaman pemahaman.

### Tiga pilar RMT

| Pilar | Isi menurut dokumen acuan |
|---|---|
| **1. Mathematically-Oriented Cognitive Functions** | Fungsi kognitif dalam tiga fase pemrosesan informasi (Feuerstein). **Fase Input** (mengumpulkan informasi): persepsi jelas dan terorganisasi, orientasi ruang dan waktu, ketepatan dan akurasi data. **Fase Elaborasi** (*Elaboration*, mengolah data): hubungan sebab-akibat, hubungan bagian-keseluruhan (*part-whole*), penalaran hipotetis, induktif, dan deduktif. **Fase Output** (mengekspresikan hasil): komunikasi jelas, menghindari *trial-and-error*, ketepatan bahasa dan simbol. Kekurangan di satu fase mengganggu seluruh proses berpikir. |
| **2. Mathematically Specific Psychological Tools** | (1) **Tanda & simbol** (enkoding/dekoding makna); (2) **organizer grafis/simbolik**: sistem nilai tempat, garis bilangan, tabel, bidang koordinat; (3) **rumus & persamaan**, yang menuntut kesepadanan ruas kiri dan kanan; (4) **bahasa matematika**, sebagai alat untuk mengekspresikan sekaligus menciptakan pemikiran. Alat eksternal harus **diinternalisasi**, seperti sempoa yang menjadi "sempoa mental". |
| **3. Mediated Learning Experience (MLE)** | Mediator (guru) menyeleksi, mengubah, mengorganisasi, dan menafsirkan stimulus bagi siswa. Ada tiga kriteria: **Intensionalitas & Resiprositas** (perhatian diarahkan sengaja pada tujuan, siswa aktif merespons), **Transendensi** (melampaui soal saat itu menuju aturan, prinsip, atau penerapan umum), dan **Pemberian Makna** (alasan, nilai, dan pentingnya materi). |

### Konsep pendukung yang dipakai

- **Learning Activity** (Vygotsky/Davydov): **Analisis Tugas**, **Perencanaan Tindakan**, dan **Refleksi**. Tujuannya siswa menjadi *self-regulated learner*.
- **ZPD dan asesmen dinamis**: intervensi diarahkan ke fungsi yang sedang berkembang. Format *cake* memberi petunjuk bertahap saat tes; format *sandwich* berupa pre-test, intervensi, post-test. LPAD memakai pola *Test–Intervene–Retest*.
- **Konsep sehari-hari ke konsep ilmiah**: intuisi empiris siswa diubah menjadi struktur konseptual yang sistematis, abstrak, dan generatif.
- **Peta Kognitif** (tujuh dimensi): konten, modalitas, operasi mental, fungsi kognitif prasyarat, kompleksitas, abstraksi, dan efisiensi.
- **Mediated questioning**: guru memediasi *cara berpikir* di balik prosedur lewat pertanyaan terpimpin dan dialog reflektif.
- **Siklus penyelidikan matematika** (studi kasus Bab 6): **Representasi, Manipulasi, Validasi**. (Sejak 23 Nov 2026 dipakai eksplisit oleh Asisten Belajar; visual matematika aplikasi mendukung tahap Representasi — docs/AI-TUTOR.md §2b.)
- **Tiga tingkat pengetahuan matematika**: prosedur & operasi, konsep, dan wawasan (*insight*).

## 2. Kedudukan PMSTP

**PMSTP (Pahami, Modelkan, Selesaikan, Tafsirkan, Periksa) adalah siklus pemodelan buatan NoBaku** ([MATH-LITERACY.md](MATH-LITERACY.md#3-siklus-pemodelan-5-langkah-pmstp)). PMSTP **bukan tahapan resmi RMT**. RMT dipakai sebagai cara memediasi di setiap langkah PMSTP. Kaitan di bawah ini hanya berarti "mendukung", bukan "sama dengan":

| Langkah PMSTP (NoBaku) | Unsur RMT yang didukung |
|---|---|
| Pahami | Fase Input; Analisis Tugas (Learning Activity) |
| Modelkan | Fase Elaborasi; Perencanaan Tindakan; Representasi |
| Selesaikan | Fase Elaborasi & Output; Manipulasi |
| Tafsirkan | Fase Output (ketepatan bahasa, simbol, satuan) |
| Periksa | Refleksi; Validasi |

## 3. Penerapan Tahap 1 di NoBaku

Pada Tahap 1 hanya **teks mediasi** yang ditambahkan. Desain, alur, penilaian, XP, progres, dan bank soal tetap sama.

| Unsur RMT | Wujud di aplikasi | Letak |
|---|---|---|
| **Intensionalitas** & **Pemberian Makna** | **Tujuan** dan **Kenapa penting?** untuk 5 topik (`LEVEL_GOALS`; sejak 23 Nov 2026 satu tujuan per latihan 10 soal), kuis topik (`QUIZ_GOAL`), dan Kuis Akhir (`FINAL_GOAL`). Di sesi Jalur Latihan tampil sebagai **satu baris terlipat** di atas soal pertama (tanpa layar atau tombol baru). Di kuis tampil di layar pembuka yang sudah ada. | `content/rmt.js`, `SessionRunner` (`GoalNote`), `QuizPage` |
| **Resiprositas** dan *mediated questioning* | **Pertanyaan pemandu** per keterampilan (`SKILLS[].guide`) atau per topik (`TOPIC_RULES[].guide`). Tampil di atas petunjuk saat kotak petunjuk dibuka ("Tanya dirimu: …"). Tidak dihitung sebagai petunjuk; petunjuk bank tidak diubah. | `HintPanel` (`guide`), `QuestionCard` |
| Umpan balik yang mendorong berpikir & menjelaskan | **Pertanyaan balik** per kode kesalahan (`ERROR_MESSAGES[].ask`): "Coba pikirkan: …" saat salah, "Renungkan: …" di pembahasan. Judul dan teks pesan lama tidak diubah. | `content/messages.js`, `QuestionCard`, `GuidedSolver` |
| **Transendensi** | Kotak **Aturan umum** setelah menjawab (benar maupun salah, di bawah pembahasan yang sudah ada), ditambah aturan umum topik di layar selesai sesi. Aturan memakai rumus umum tanpa angka soal. | `SKILLS[].rule`, `TOPIC_RULES[].rule`, `RuleBox` |
| **Fase fungsi kognitif** (diagnosis) | Pemetaan kode kesalahan ke fase Input/Elaborasi/Output (§4). Tampil di Dashboard Guru (Hasil Latihan & Kuis, detail siswa) beserta keterangan arti fase. | `ERROR_PHASES`, `lib/rmt.js` (`phaseLabel`), halaman guru |
| **Alat psikologis** | Sudah ada sebelum Tahap 1: komponen `Sci` (tanda & simbol), tabel nilai tempat, `NumberStrip`, visualisasi geser koma, tabel pangkat 10, rumus di Catatan Pintar. Pertanyaan pemandu dan aturan umum merujuk ke alat-alat ini. | — |

Keterampilan sebuah soal ditentukan `lib/rmt.js` `skillOf(q)` dari jenis soal: `pangkat10`, `nilaiTempat`, `keBaku`, `nolTengah`, `keBiasa`, `banding`, `normal`, `kali`, `bagi`, `cerita`. Soal pilihan ganda konsep (yang hanya ditandai `form`) memakai pertanyaan dan aturan topiknya.

## 4. Pemetaan kode kesalahan ke fase fungsi kognitif

Satu kesalahan **dapat melibatkan lebih dari satu fase**. Pemetaan hanya dibuat sejauh didukung **bukti dari cara mesin mendiagnosis** (`lib/sci/diagnose.js`, `lib/sci/ops.js`). Kalau bukti belum cukup, kode **tidak dipetakan**. Urutan fase menunjukkan dukungan bukti yang paling sering.

| Kode | Fase | Bukti dari diagnosis mesin |
|---|---|---|
| E-FORMAT | Output | Jawaban kosong atau tidak dapat dibaca sebagai bilangan / a × 10ⁿ |
| E-NORMAL | Output | Nilai hasil operasi sudah benar (pengolahan berhasil), tetapi belum ditulis dalam bentuk baku |
| E-KOMA | Output, Elaborasi | Dua keadaan: nilai benar tetapi a di luar 1 ≤ a < 10 (Output), atau angka a benar tetapi koma salah tempat sehingga nilainya salah (Elaborasi: letak koma belum dihubungkan dengan syarat 1 ≤ a < 10) |
| E-NOL | Input, Output | Angka bukan nol benar, tetapi nol di tengah hilang atau bertambah: kurang teliti mengamati angka (Input) atau saat menyalin a (Output) |
| E-PANGKAT | Input, Elaborasi | Angka & tanda benar, pangkat meleset 1–2: salah menghitung lompatan atau posisi (Input). Pada soal membandingkan, kode ini menandai pilihan yang salah dibandingkan (Elaborasi) |
| E-TANDA | Elaborasi, Output | Pangkat tepat berlawanan tanda: belum menghubungkan besar-kecil bilangan dengan tanda pangkat (Elaborasi), atau lupa menulis tanda minus (Output) |
| E-OPERASI | Elaborasi | Angka a benar, tetapi pangkat hasil kali/bagi salah atau cocok dengan jebakan aturan pangkat |
| E-MODEL | Elaborasi, Input | Hasil cocok dengan model hitung keliru: hubungan antarbesaran belum diolah (Elaborasi), atau salah menangkap yang ditanya (Input) |
| E-SATUAN | Input, Elaborasi | Hasil cocok dengan perhitungan tanpa menyamakan satuan: satuan yang diminta terlewat (Input) atau konversinya belum diolah (Elaborasi) |
| E-LAIN | — (tidak dipetakan) | Jawaban tidak cocok dengan pola kesalahan yang dikenal; belum cukup bukti |

**Batasan:** diagnosis otomatis hanya melihat jawaban akhir, bukan proses berpikir siswa. Label fase adalah **dugaan awal untuk guru sebagai mediator**, bukan penilaian pasti. Untuk memastikannya, guru perlu bertanya kepada siswa (*mediated questioning*). Pada Tahap 1, label fase tidak ditampilkan kepada siswa, supaya tidak menambah istilah baru.

## 5. Kaitan dengan Cognitive Load

| Beban | Pengaturan pada Tahap 1 |
|---|---|
| **Intrinsic** | Tidak berubah: satu konsep per layar, latihan 10 soal naik bertahap mudah → sedang → sulit (23 Nov 2026). Tujuan level menyebut satu fokus saja. |
| **Extraneous** | Tidak ada layar atau tombol baru. Tujuan di sesi berupa satu baris terlipat. Pertanyaan pemandu hanya tampil kalau petunjuk dibuka. Aturan umum baru tampil **setelah** menjawab. Semua teks pendek (tujuan ≤ 20 kata, pertanyaan ≤ 16 kata, aturan ≤ 28 kata) dan memakai warna token yang sudah ada. |
| **Germane** | Pertanyaan balik ("Coba pikirkan", "Renungkan") dan aturan umum (Transendensi) mengajak siswa menjelaskan alasan dan menghubungkan soal dengan prinsip umum. |

## 6. Aturan menulis konten RMT

1. **Jangan mengubah bank soal** (`content/bank.js`: kalimat, angka, pilihan, kunci, pembahasan, petunjuk, jumlah, urutan) tanpa persetujuan pengembang. Tes sidik isi di `content/rmt.test.js` akan gagal kalau bank berubah.
2. Konten RMT hanya ditulis di `content/rmt.js` dan kolom `ask` di `content/messages.js`.
3. Pertanyaan pemandu dan pertanyaan balik **tidak memuat jawaban**. Bentuknya pertanyaan yang mengarahkan ke alat psikologis (letak koma, nilai tempat, tanda pangkat, satuan).
4. Aturan umum berupa **rumus atau prinsip umum** tanpa angka soal. Hanya angka 1 dan 10 yang boleh muncul, dan ini diuji. Kebenaran matematisnya diuji dengan `lib/sci`.
5. Batas kata: tujuan dan alasan ≤ 20 kata, pertanyaan pemandu dan pertanyaan balik ≤ 16 kata, aturan umum ≤ 28 kata. Gunakan bahasa ramah siswa SMP dengan sapaan "kamu".
6. Pemetaan fase hanya boleh ditambah atau diubah kalau ada bukti dari diagnosis mesin. Tulis buktinya di `ERROR_PHASES[].evidence`.

## 7. Analisis kondisi awal (sebelum Tahap 1)

- **Pilar 2** (alat psikologis) sudah kuat.
- **Pilar 1**: Fase Input dan Output kuat (Langkah Terpandu, `ZeroRoles`, isian a dan n terpisah, satu kali jawab di Jalur). Fase Elaborasi lemah: petunjuk lebih banyak berupa perintah prosedur.
- **Pilar 3**: Pemberian Makna kuat (konteks nyata di buku), Intensionalitas sebagian (tujuan hanya ada di modul), Transendensi hampir tidak ada.
- **PMSTP** belum dibangun di aplikasi.
- **Germane load** paling lemah (belum ada refleksi atau penjelasan diri).

## 8. Tahap berikutnya (belum dikerjakan, perlu persetujuan)

| Tahap | Isi |
|---|---|
| 2 | Elaborasi & refleksi: prediksi sebelum menjawab (L3–L4), refleksi singkat di akhir sesi, jeda sebelum mencoba lagi di latihan modul, skala Paas di Kuis Akhir |
| 3 | Alat psikologis & internalisasi: garis bilangan orde besaran, *fading* bantuan visual per level, tampilan kesetaraan ruas kiri = kanan |
| 4 | Pemodelan Terbimbing PMSTP tanpa AI |
| 5 | Guru sebagai mediator: kesalahan per fase dan saran pertanyaan mediasi untuk guru |
