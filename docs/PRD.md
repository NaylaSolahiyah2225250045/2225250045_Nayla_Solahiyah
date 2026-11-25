# Product Requirements Document (PRD) — NoBaku

| Item | Keterangan |
|---|---|
| Produk | NoBaku — Aplikasi Belajar Notasi Ilmiah |
| Versi dokumen | 1.1 — menambah literasi matematika, pemodelan, Modul 7–8, dan Asisten AI |
| Tanggal | 10 November 2026 |
| Penyusun | Nayla Solahiyah |
| Status | Draf untuk ditinjau |
| Dokumen terkait | [RESEARCH-INSIGHTS](RESEARCH-INSIGHTS.md), [LEARNING-DESIGN](LEARNING-DESIGN.md), [MATH-LITERACY](MATH-LITERACY.md), [AI-TUTOR](AI-TUTOR.md), [FEATURES](FEATURES.md) |

---

## 1. Latar Belakang

Notasi ilmiah (bentuk baku) diajarkan di SMP kelas VIII sebagai bagian dari bab Bilangan Berpangkat. Wawancara dengan siswa kelas IX (S01) menunjukkan bahwa meskipun siswa mampu mengerjakan soal dasar, ia masih **ragu pada pangkat negatif**, **sering salah menaruh koma**, dan **bingung dengan angka nol yang banyak atau berada di tengah**. Pembelajaran sebelumnya hanya berupa penjelasan lisan dalam **satu pertemuan** tanpa representasi visual, dan umpan balik hanya didapat dari **pemeriksaan guru**.

Kondisi ini menunjukkan **intrinsic load** tinggi yang tidak dikelola dan **extraneous load** dari cara penyajian. Aplikasi digital yang dirancang berdasarkan Teori Beban Kognitif dapat membantu siswa belajar bertahap, mandiri, dan mendapat umpan balik langsung.

Selain penguasaan prosedur, siswa juga perlu **literasi matematika**: kemampuan merumuskan masalah nyata menjadi model matematika, menyelesaikannya, dan menafsirkan hasilnya (PISA, AKM Numerasi). Temuan EL05 menunjukkan siswa kesulitan memilih informasi dan menyamakan satuan pada soal cerita — tepat pada proses **merumuskan** model.

## 2. Pernyataan Masalah

> Siswa SMP kesulitan mengubah bilangan ke/dari notasi ilmiah — terutama yang berpangkat negatif dan mengandung banyak nol — karena materi disajikan sekaligus, tanpa visualisasi pergeseran koma, dan tanpa umpan balik langsung. Siswa juga belum terlatih **memodelkan soal cerita** (memilih informasi, menyamakan satuan, memilih operasi, menafsirkan hasil), sehingga notasi ilmiah belum menjadi alat untuk memahami dunia nyata.

## 3. Tujuan Produk

| ID | Tujuan |
|---|---|
| G1 | Siswa mampu mengubah bilangan besar dan kecil ke notasi ilmiah dan sebaliknya dengan benar. |
| G2 | Menurunkan beban kognitif yang dirasakan siswa saat belajar notasi ilmiah. |
| G3 | Siswa dapat belajar mandiri dengan umpan balik langsung tanpa menunggu guru. |
| G4 | Guru dapat memantau progres dan kesalahan umum siswa di kelasnya. |
| G5 | Menyediakan data untuk penelitian (efektivitas & beban kognitif). |
| G6 | Menumbuhkan literasi matematika siswa (merumuskan, menerapkan, menafsirkan) dalam konteks personal, sosial-budaya, dan saintifik. |
| G7 | Siswa mampu memodelkan berbagai soal cerita bertema besaran sangat besar/kecil ke dalam model matematika dan menyelesaikannya, dengan bimbingan terstruktur maupun Asisten AI. |

## 4. Metrik Keberhasilan

| Metrik | Target MVP | Cara ukur |
|---|---|---|
| Peningkatan skor pre-test → post-test | Rata-rata naik ≥ 20 poin (skala 100) | Kuis pre/post di aplikasi (FR-14) |
| Akurasi soal pangkat negatif | ≥ 75% pada post-test | Analisis jawaban per kategori |
| Beban kognitif yang dirasakan (skala Paas 1–9) | Rata-rata ≤ 5 setelah modul | Kuesioner dalam aplikasi (FR-17) |
| Penyelesaian modul | ≥ 70% siswa menyelesaikan semua modul inti | Data progres |
| Kemudahan penggunaan (SUS) | Skor ≥ 70 | Kuesioner SUS setelah uji coba |
| Kinerja | Halaman pertama tampil < 3 detik di 4G | Lighthouse |
| Peningkatan skor literasi (tes format AKM) | N-gain ≥ 0,3; proporsi siswa kategori Cakap/Mahir naik ≥ 20 poin persentase | Pre/post-test literasi (FR-29) |
| Skor rubrik pemodelan (Modul 8) | Rata-rata ≥ 7/10 pada L2–L3 | Rubrik PMSTP |
| Akurasi Asisten AI (jawaban terverifikasi benar) | ≥ 90% pada set evaluasi | Eval AI (lihat [AI-TUTOR.md](AI-TUTOR.md#8-evaluasi-kualitas-ai)) |

## 5. Persona

### 5.1 Siswa — "Dina", 13–14 tahun, kelas VIII
- Belajar notasi ilmiah di kelas, tetapi materi cepat berlalu.
- Memakai HP Android kelas menengah; kuota internet terbatas.
- **Kebutuhan:** penjelasan simpel, contoh mirip latihan, tahu langsung benar/salah, petunjuk saat bingung.
- **Frustrasi:** pangkat minus, menghitung nol, menaruh koma, soal cerita dengan satuan berbeda.

### 5.2 Guru Matematika — "Pak Andi"
- Mengajar beberapa kelas; waktu terbatas untuk memeriksa latihan satu per satu.
- **Kebutuhan:** melihat siapa yang tertinggal dan kesalahan apa yang paling sering terjadi.

### 5.3 Peneliti/Admin — Nayla
- **Kebutuhan:** mengelola konten, mengambil data anonim (skor, waktu, beban kognitif) untuk analisis.

## 6. Ruang Lingkup

### 6.1 Dalam Lingkup (MVP)
- Materi notasi ilmiah: prasyarat 10ⁿ, bilangan besar (pangkat positif), bilangan kecil (pangkat negatif), nol di tengah, konversi balik, soal cerita & satuan, **perkalian & pembagian bentuk baku**.
- **Literasi matematika**: label proses & konteks pada konten, stimulus nyata, format soal AKM, profil literasi.
- **Pemodelan matematika**: siklus PMSTP terbimbing (Modul 8) untuk 8 jenis model.
- **Asisten AI (hybrid)**: siswa memasukkan soal cerita sendiri dan dituntun memodelkannya; guru membuat draf soal dengan AI lalu meninjaunya. Jawaban selalu diverifikasi mesin.
- Visualisasi geser koma, contoh terurai/faded, langkah terpandu, latihan bertahap, hint, umpan balik & diagnosis.
- Pre-test, post-test (prosedural & literasi), kuis per modul.
- Akun siswa & guru, kelas dengan kode gabung, dashboard guru.
- Kuesioner beban kognitif singkat.
- PWA (dapat dipasang & dipakai offline untuk materi) dan APK Android.

### 6.2 Di Luar Lingkup (MVP)
- Soal cerita di luar notasi ilmiah/bilangan berpangkat (persamaan linear, aritmetika sosial, dll.) → fase 2.
- Input soal berupa foto untuk Asisten AI → fase 2.
- Obrolan AI bebas (chatbot umum).
- Bab bilangan berpangkat lain (sifat perpangkatan, bentuk akar) → fase 2.
- Rilis di Google Play Store (MVP cukup APK langsung) → fase 2.
- iOS.
- Chat, forum, leaderboard publik.
- Pembayaran.

## 7. User Stories & Acceptance Criteria

### Siswa
| ID | User story | Acceptance criteria |
|---|---|---|
| US-01 | Sebagai siswa, saya ingin mendaftar dengan kode kelas dari guru agar progres saya terlihat oleh guru. | Form berisi nama tampilan, username, password, kode kelas; kode tidak valid → pesan jelas; tidak meminta email/telepon. |
| US-02 | Sebagai siswa, saya ingin mengulang dasar pangkat 10 sebelum masuk materi inti. | Modul Prasyarat tersedia & disarankan bila skor pre-test bagian prasyarat < 70%. |
| US-03 | Sebagai siswa, saya ingin melihat koma bergeser langkah demi langkah agar tahu cara menghitung pangkat. | Animasi per lompatan; penghitung lompatan tampil; bisa diputar ulang & dikontrol manual. |
| US-04 | Sebagai siswa, saya ingin penjelasan khusus pangkat negatif secara bertahap. | Modul 3 berisi ≥ 3 segmen; aturan "angka bukan nol pertama di posisi ke-n setelah koma → pangkat −n" disajikan dengan visual. |
| US-05 | Sebagai siswa, saya ingin langsung tahu jawaban saya benar/salah dan kenapa. | Umpan balik < 300 ms; jika salah, tampil pesan sesuai kode kesalahan (E-KOMA, E-TANDA, dst.). |
| US-06 | Sebagai siswa, saya ingin petunjuk saat bingung tanpa langsung diberi jawaban. | 3 tingkat hint; hint dibuka berurutan; penggunaan hint tercatat. |
| US-07 | Sebagai siswa, saya ingin latihan dari mudah ke sulit. | 4 level per modul; level berikutnya terbuka setelah ≥ 3 dari 5 soal benar di level sebelumnya (bisa dilewati guru). |
| US-08 | Sebagai siswa, saya ingin terbantu memahami soal cerita dengan satuan berbeda. | Soal cerita menampilkan langkah "Apa yang diketahui → Satuan → Konversi → Bentuk baku". |
| US-09 | Sebagai siswa, saya ingin melihat progres saya dan mengulang materi kapan saja. | Halaman progres per modul; semua materi yang sudah dibuka bisa diakses ulang, termasuk offline. |
| US-16 | Sebagai siswa, saya ingin dituntun mengubah soal cerita menjadi model matematika langkah demi langkah. | Panel PMSTP 5 langkah; setiap langkah dicek dan diberi umpan balik; kartu besaran memisahkan info relevan. |
| US-17 | Sebagai siswa, saya ingin memasukkan soal cerita dari buku/LKS dan dibantu memodelkannya. | Asisten AI menampilkan kartu besaran (tanpa jawaban) ≤ 10 detik; petunjuk per langkah tanpa membocorkan jawaban; soal di luar lingkup ditolak sopan. |
| US-18 | Sebagai siswa, saya ingin tahu kemampuan literasi saya. | Halaman progres menampilkan profil per proses (merumuskan/menerapkan/menafsirkan) dan kategori. |

### Guru
| ID | User story | Acceptance criteria |
|---|---|---|
| US-10 | Sebagai guru, saya ingin membuat kelas dan membagikan kode. | Kode 6 karakter unik; bisa dinonaktifkan/diperbarui. |
| US-11 | Sebagai guru, saya ingin melihat progres dan skor siswa per modul. | Tabel siswa × modul (status, skor, waktu); dapat diurutkan & diekspor CSV. |
| US-12 | Sebagai guru, saya ingin tahu kesalahan yang paling sering terjadi di kelas. | Grafik distribusi kode kesalahan per modul; daftar siswa per jenis kesalahan. |
| US-13 | Sebagai guru, saya ingin mereset/membuka level tertentu untuk siswa. | Aksi buka kunci level per siswa tercatat di log. |
| US-19 | Sebagai guru, saya ingin membuat soal pemodelan dari soal cerita yang saya punya dengan bantuan AI. | Draf (model, kunci, 3 hint, pengecoh, label) dapat diedit; kunci diverifikasi mesin; soal hanya masuk bank kelas setelah disetujui. |
| US-20 | Sebagai guru, saya ingin mengaktifkan/menonaktifkan Asisten AI dan mengatur kuotanya. | Pengaturan per kelas; default nonaktif; perubahan berlaku segera. |
| US-21 | Sebagai guru, saya ingin melihat profil literasi kelas. | Grafik skor per proses & konteks, distribusi kategori (Perlu Intervensi Khusus–Mahir), daftar siswa per kategori. |

### Peneliti/Admin
| ID | User story | Acceptance criteria |
|---|---|---|
| US-14 | Sebagai peneliti, saya ingin mengekspor data anonim pre/post-test dan beban kognitif. | CSV tanpa nama/username; memakai kode siswa acak. |
| US-15 | Sebagai admin, saya ingin mengelola konten soal tanpa mengubah kode. | Soal disimpan dalam JSON/DB dan dimuat lewat seed; validasi skema saat seed. |

## 8. Kebutuhan Fungsional

Kolom "Sumber" merujuk kode wawancara di [RESEARCH-INSIGHTS.md](RESEARCH-INSIGHTS.md). Prioritas: **M** = Must (MVP), **S** = Should, **C** = Could.

| ID | Kebutuhan | Sumber | Prioritas |
|---|---|---|---|
| FR-01 | Registrasi & login dengan peran siswa/guru/admin (JWT). | — | M |
| FR-02 | Manajemen kelas: guru membuat kelas & kode; siswa bergabung via kode. | GL02 | M |
| FR-03 | Modul Prasyarat: pangkat bulat positif, nilai 10ⁿ dan 10⁻ⁿ, nilai tempat. | IL03 | M |
| FR-04 | Mikro-materi: setiap modul dipecah menjadi segmen kecil (1 konsep/layar). | EL04, DS01 | M |
| FR-05 | Visualisasi Geser Koma interaktif (animasi + mode manual + penghitung lompatan). | IL02, IL05, EL02, DS03 | M |
| FR-06 | Contoh terurai (worked example) dan contoh setengah-terurai (faded). | GL03, GL05, DS01 | M |
| FR-07 | Langkah Terpandu: soal dikerjakan per sub-langkah (cari digit → taruh koma → hitung lompatan → tanda → tulis). | IL02, DS01 | M |
| FR-08 | Latihan bertahap 4 level per modul dengan kunci level. | GL01, DS03 | M |
| FR-09 | Umpan balik langsung & diagnosis jenis kesalahan (kode E-xx). | GL02, IL05 | M |
| FR-10 | Petunjuk bertingkat (3 level) per soal. | DS01 | M |
| FR-11 | Modul Pangkat Negatif bertahap (terpisah dari pangkat positif). | IL01, IL04, K03, DS02 | M |
| FR-12 | Penyorotan nol: nol depan, nol tengah, dan digit bermakna diberi warna berbeda; mode "hitung nol". | IL04, DS02 | M |
| FR-13 | Soal cerita terstruktur: penanda informasi penting + bantuan konversi satuan. | EL05, K01 | S |
| FR-14 | Pre-test, post-test, dan kuis akhir modul. | — | M |
| FR-15 | Progres siswa & akses ulang materi kapan saja. | EL01 | M |
| FR-16 | Dashboard guru: rekap progres, skor, kesalahan umum, ekspor CSV. | GL02 | M |
| FR-17 | Kuesioner beban kognitif (skala Paas 1–9) setelah modul. | — | S |
| FR-18 | Mode offline untuk materi & latihan; sinkronisasi saat online. | — | S |
| FR-19 | Ekspor data penelitian teranonimkan (admin). | — | S |
| FR-20 | Self-explanation: siswa memilih/menulis alasan langkah. | GL04 | C |
| FR-21 | Konteks literasi: setiap modul memuat stimulus nyata dan soal berlabel proses (RUMUS/TERAP/TAFSIR/NALAR) & konteks (PERSONAL/SOSBUD/SAINTIFIK). | K01, EL05 | M |
| FR-22 | Modul 7: perkalian & pembagian bentuk baku dengan normalisasi hasil. | — (prasyarat FR-23) | M |
| FR-23 | Pemodelan terbimbing (Modul 8): siklus PMSTP 5 langkah dengan kartu besaran dan pemeriksaan tiap langkah. | EL05, DS01 | M |
| FR-24 | Ragam jenis model (KONVERSI, SATUAN, KALI, BAGI, PER_UNIT, KAPASITAS, BANDING, URUT) dan format soal AKM (PG, PG kompleks, menjodohkan, isian, uraian). | EL05 | M |
| FR-25 | Asisten AI siswa: soal cerita teks → spesifikasi model (Groq API) → diverifikasi mesin → bimbingan per langkah tanpa membocorkan jawaban. | DS01, DS03 | S |
| FR-26 | Asisten AI guru: draf soal pemodelan dari teks guru → verifikasi mesin → tinjau & setujui → bank soal kelas. | — | S |
| FR-27 | Profil literasi siswa & kelas (per proses, konteks, kategori). | — | M |
| FR-28 | Pengaturan AI per kelas (aktif/nonaktif, kuota harian) dan batas anggaran global. | — | S |
| FR-29 | Pre-test & post-test literasi format AKM berbasis stimulus. | — | M |

Detail setiap fitur ada di [FEATURES.md](FEATURES.md).

## 9. Kebutuhan Non-Fungsional

| ID | Kategori | Kebutuhan |
|---|---|---|
| NFR-01 | Platform | Berjalan di Chrome/Edge/Firefox terbaru, Android 8.0+ (APK & PWA). |
| NFR-02 | Kinerja | LCP < 3 dtk di 4G; bundle awal < 300 KB gzip; umpan balik jawaban < 300 ms (dihitung di klien). |
| NFR-03 | Responsif | Mobile-first; layout benar di lebar 360–1440 px. |
| NFR-04 | Aksesibilitas | WCAG 2.1 AA: kontras, target sentuh ≥ 44 px, navigasi keyboard, label ARIA; tidak bergantung warna saja. |
| NFR-05 | Keamanan | Password bcrypt; JWT access 30 menit + refresh 7 hari; HTTPS; rate limit login; otorisasi berbasis peran & kelas. |
| NFR-06 | Privasi | Data siswa minimum; sesuai UU PDP No. 27/2022; lihat [PRIVACY-ETHICS.md](PRIVACY-ETHICS.md). |
| NFR-07 | Akurasi | Logika notasi ilmiah tanpa floating point; 100% lulus `shared/test-vectors.json` di FE & BE. |
| NFR-08 | Minimal distraksi | Tidak ada iklan, animasi dekoratif, atau suara di layar belajar (EL03). |
| NFR-09 | Bahasa | Bahasa Indonesia baku-ramah untuk siswa SMP; format angka Indonesia. |
| NFR-10 | Ketersediaan | Backend uptime ≥ 99% selama periode uji coba. |
| NFR-11 | Maintainability | Konten soal terpisah dari kode; cakupan tes logika inti ≥ 90%. |
| NFR-12 | Ukuran APK | < 15 MB. |
| NFR-13 | Keandalan AI | Tidak ada angka/jawaban dari AI yang ditampilkan tanpa verifikasi `app/sci`; API key hanya di backend. |
| NFR-14 | Kinerja AI | Analisis soal ≤ 10 dtk (p90); petunjuk ≤ 4 dtk (p90); gagal → templat statis. |
| NFR-15 | Biaya AI | Kuota per siswa, cache per hash soal, batas anggaran bulanan yang menonaktifkan AI otomatis. |

## 10. Alur Pengguna Utama

```
Siswa: Daftar (kode kelas) → Pre-test (prosedural + literasi) → [Prasyarat jika perlu] → Modul 2..8
       (Stimulus → Materi mikro → Contoh terurai → Contoh faded → Langkah terpandu → Latihan L1–L4 → Kuis)
       → Kuesioner beban kognitif → [Asisten AI: bawa soalmu sendiri] → Post-test → Profil literasi

Guru:  Daftar/Login → Buat kelas → Bagikan kode → (Aktifkan AI) → Pantau dashboard & profil literasi
       → Lihat kesalahan umum → Buat soal dengan AI → Tinjau & setujui → Ekspor
```

## 11. Asumsi & Ketergantungan
- Siswa memiliki akses ke HP Android atau komputer dengan browser.
- Guru bersedia membuat kelas dan membagikan kode.
- Materi mengacu pada Kurikulum Merdeka Fase D (dan selaras dengan buku/LKS kelas VIII).
- Server gratis/murah (Render/Railway + Vercel) memadai untuk skala uji coba (< 200 pengguna).

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Temuan wawancara n=1 kurang representatif | Fitur tidak tepat sasaran | Validasi dengan 3–5 siswa tambahan & guru; uji usabilitas prototipe |
| Koneksi internet sekolah lemah | Siswa tidak bisa belajar | PWA offline + sinkronisasi tertunda |
| Kesalahan logika pengecekan jawaban | Umpan balik salah, siswa bingung | Test vectors bersama FE/BE; tanpa float; review oleh guru matematika |
| Animasi terlalu ramai | Menambah extraneous load | Checklist CLT, uji usabilitas, opsi "kurangi animasi" |
| Data anak bocor | Pelanggaran privasi | Data minimum, enkripsi transport, otorisasi ketat, tanpa analytics pihak ketiga |
| Waktu pengembangan terbatas | Fitur tidak selesai | Prioritas M/S/C, roadmap bertahap |
| AI salah memahami soal atau salah hitung | Siswa mempelajari hal keliru | AI tidak menghitung; mesin memverifikasi; tombol "tidak sesuai"; eval set sebelum rilis |
| AI membocorkan jawaban / siswa terlalu bergantung | Germane load turun | Bimbingan per langkah, filter kebocoran, kuota harian, laporan rasio petunjuk |
| Biaya API melebihi anggaran | Fitur AI berhenti | Kuota, cache, batas anggaran, mode terbimbing tetap berjalan tanpa AI |
| Data anak terkirim ke layanan AI | Pelanggaran privasi | Hanya teks soal, saringan data pribadi, persetujuan orang tua mencakup AI, AI default nonaktif |
| Perluasan cakupan membuat jadwal molor | MVP tidak selesai | Asisten AI berprioritas S; mode terbimbing (M) selesai lebih dulu |

## 13. Rencana Rilis

| Rilis | Isi | Target |
|---|---|---|
| Alpha | Modul 1–3, visualisasi koma, latihan, umpan balik (tanpa login) | Minggu 4 |
| Beta | + login, kelas, dashboard guru, modul 4–8, pemodelan terbimbing, pre/post-test, profil literasi | Minggu 8 |
| v1.0 (uji coba) | + Asisten AI siswa & guru, APK Android, offline, kuesioner, perbaikan dari uji usabilitas | Minggu 13 |

Detail jadwal: [ROADMAP.md](ROADMAP.md).

## 14. Pertanyaan Terbuka
1. Apakah uji coba dilakukan di satu sekolah atau lebih? Berapa jumlah siswa?
2. Apakah guru membutuhkan fitur membuat soal sendiri (fase 2)?
3. Nama final aplikasi dan identitas visual.
4. Instrumen beban kognitif final: skala Paas saja atau kuesioner 3 dimensi (IL/EL/GL, Leppink dkk.)?
5. Siapa yang menanggung biaya API Asisten AI selama uji coba, dan berapa batas anggarannya?
6. Apakah sekolah/orang tua menyetujui penggunaan layanan AI pihak ketiga (Groq) untuk teks soal? (Uji coba Asisten Belajar: persetujuan ditangani di luar aplikasi.)
7. Apakah instrumen tes literasi akan diadaptasi dari soal AKM/PISA yang dirilis publik atau disusun sendiri lalu divalidasi ahli?
