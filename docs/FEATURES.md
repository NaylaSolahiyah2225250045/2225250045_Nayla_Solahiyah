# Spesifikasi Fitur

Setiap fitur (F-xx) dipetakan ke kebutuhan fungsional (FR-xx) di [PRD.md](PRD.md).

| Fitur | FR | Prioritas |
|---|---|---|
| F-01 Akun & Kelas | FR-01, FR-02 | M |
| F-02 Mikro-materi & Modul | FR-03, FR-04, FR-11 | M |
| F-03 Visualisasi Geser Koma | FR-05, FR-12 | M |
| F-04 Contoh Terurai & Faded | FR-06 | M |
| F-05 Langkah Terpandu | FR-07 | M |
| F-06 Latihan Bertahap & Petunjuk | FR-08, FR-10 | M |
| F-07 Umpan Balik & Diagnosis | FR-09 | M |
| F-08 Soal Cerita Terstruktur | FR-13 | S |
| F-09 Pre-test, Post-test, Kuis | FR-14 | M |
| F-10 Progres Siswa | FR-15 | M |
| F-11 Dashboard Guru | FR-16 | M |
| F-12 Kuesioner Beban Kognitif | FR-17 | S |
| F-13 Mode Offline | FR-18 | S |
| F-14 Ekspor Data Penelitian | FR-19 | S |
| F-15 Self-explanation | FR-20 | C |
| F-16 Pemodelan Terbimbing | FR-22, FR-23, FR-24 | M |
| F-17 Asisten AI – Siswa | FR-25 | S |
| F-18 Asisten AI – Guru (Pembuat Soal) | FR-26 | S |
| F-19 Profil Literasi | FR-21, FR-27, FR-29 | M |
| F-20 Pengaturan AI Kelas | FR-28 | S |

---

## F-01 Akun & Kelas

**Peran:** `student`, `teacher`, `admin`.

**Registrasi siswa:** nama tampilan, username (unik, 4–20 karakter, huruf/angka/underscore), password (min. 8 karakter), **kode kelas** (wajib). Tidak meminta email/telepon.
**Registrasi guru:** nama, email, password. Akun guru perlu aktivasi admin (mencegah siswa mendaftar sebagai guru).
**Login:** username/email + password → access token (30 menit) + refresh token (7 hari). Di Android, token disimpan dengan Capacitor Preferences; di web, refresh token di cookie `HttpOnly`.
**Lupa password siswa:** guru dapat mereset password siswa di kelasnya (siswa tidak punya email).

**Kelas:**
- Guru membuat kelas (nama, tingkat, tahun ajaran) → sistem membuat kode 6 karakter (tanpa huruf mirip: 0/O, 1/I/L).
- Guru dapat menonaktifkan/membuat ulang kode.
- Satu siswa dapat bergabung ke beberapa kelas (jarang, tetapi didukung).

## F-02 Mikro-materi & Modul

- 8 modul (lihat [LEARNING-DESIGN.md](LEARNING-DESIGN.md)); setiap modul terdiri atas *lesson items* berurutan bertipe: `intro` (stimulus literasi), `concept`, `worked_example`, `faded_example`, `guided`, `modeling`, `practice`, `quiz`, `survey`.
- Satu layar = satu item; navigasi "Kembali"/"Lanjut", progress bar tipis di atas (titik per item).
- Modul 1 disarankan otomatis jika skor prasyarat pre-test < 70%.
- Modul 3 (Pangkat Negatif) memiliki 4 segmen konsep (3a–3d).
- Siswa dapat membuka kembali item mana pun yang sudah dilewati.

## F-03 Visualisasi Geser Koma

Komponen inti aplikasi (← IL02, IL05, EL02, DS03).

**Tampilan:**
```
  Posisi:      1   2   3   4
           0 , 0   0   0   3   2
               ↑───────────────→●
  Lompatan: 4 ke kanan   →   pangkat: −4
  Hasil:    3,2 × 10⁻⁴
```
- Setiap digit di kotak (sel) berukuran sama, font monospace besar.
- **Pewarnaan (signaling):** koma = `--color-comma`; angka bukan nol pertama = `--color-lead-digit`; nol depan/belakang = abu-abu; nol tengah = warna digit normal + tebal. Selain warna, gunakan garis bawah/ikon agar tidak bergantung warna saja.
- **Penghitung lompatan** tampil di bawah, bertambah tiap lompatan, dengan tanda (+/−) mengikuti arah.

**Mode:**
1. **Putar otomatis** — koma melompat satu sel per ±600 ms, dapat dijeda/ulang/kecepatan 0,5×–1,5×.
2. **Manual** — siswa menggeser koma dengan tombol ◀ ▶ (atau drag/swipe); umpan balik muncul saat posisi valid (1 ≤ a < 10).
3. **Hitung nol** (FR-12) — nol depan diberi nomor posisi 1, 2, 3, … agar siswa membaca langsung "posisi ke-n".

**Aksesibilitas:** animasi menghormati `prefers-reduced-motion` (lompatan menjadi langkah statis bernomor); setiap lompatan diumumkan ke pembaca layar (`aria-live`).

**Input:** string bilangan (bentuk biasa) atau `{mantissa, exponent}`. Komponen murni presentasi; perhitungan dari `lib/sci`.

### F-03a Lab Koma (menu khusus, Alpha — 11 Nov 2026)

Pengembangan F-03 menjadi **alat eksplorasi** tersendiri: menu **Lab Koma** (`#/lab`) di Dashboard, sidebar, dan navigasi bawah. Visualisasi di dalam materi tetap ada dan diberi tautan "Coba geser sendiri di Lab Koma" (`#/lab?n=<bilangan>`).

| Aspek | Ketentuan |
|---|---|
| Panggung | Area utama besar berlatar kertas berpetak; sel digit menyesuaikan lebar layar (container query) — hingga 12 angka muat di HP 360px, sel sampai ±79px di laptop |
| Menggeser koma | Seret koma oranye (sentuh/mouse, *snap* ke celah terdekat), ketuk celah di antara angka, tombol **Geser kiri/kanan**, atau panah ←/→/Home/End pada koma (`role="slider"`) |
| Yang terlihat langsung | Bilangan baru × 10ᵏ dengan **nilai tetap** (k = posisi asal − posisi koma); busur lompatan bernomor (biru = ke kiri/pangkat naik, magenta = ke kanan/pangkat turun); koma asal samar; penanda **a < 1 · 1 ≤ a < 10 · a ≥ 10**; penghitung "Koma bergeser", "Pangkat 10", "Ke bentuk baku" |
| Umpan balik | Langsung & spesifik (`content/lab.js`): arah yang masih diperlukan, makna satu langkah (10× lebih kecil/besar), konfirmasi bentuk baku + alasan pangkatnya, dan efisiensi (jumlah geseran vs jalan terpendek) |
| Kontrol lain | **Reset**, **Tunjukkan caranya** (koma melompat sendiri satu langkah per 650 ms, bisa dijeda), contoh bilangan besar/kecil berkonteks nyata, input bilangan sendiri (divalidasi), **Acak** |
| Riwayat | Tabel setiap langkah: arah + bilangan × 10ᵏ; baris bentuk baku disorot |
| Logika | `lib/sci/lab.js` (`prepareLab`, `readAt`, `randomLabNumber`) — string digit, tanpa floating point; tes memastikan bacaan × 10ᵏ = bilangan asal di semua posisi |
| Maskot & hiasan | Maskot kecil di sudut kartu umpan balik (petunjuk; merayakan dengan bintang saat bentuk baku tercapai) dan 5 bintang hias berkilau di tepi halaman/panggung — tunduk pada pengaturan Animasi (disetujui pengembang, 11 Nov 2026) |
| Beban kognitif | Tanpa maskot/dekorasi di jalur angka, koma, dan persamaan; animasi hanya menjelaskan (koma meluncur, busur muncul, persamaan berdenyut sekali); penjelasan "Kenapa begitu?" ≤ 40 kata per kartu |

### F-00 Dashboard & menu utama (Tahap 1 — 11 Nov 2026)

| Menu | Isi (Tahap 1) | Data |
|---|---|---|
| Beranda | Sapaan + avatar, status "sudah belajar hari ini", XP/level, 4 statistik (hari beruntun, titik latihan, lencana, % tepat), kartu lanjutkan membaca & latihan berikutnya, strip 7 hari bercap kapibara, pintasan Lab Koma & Catatan | gabungan |
| Materi | Buku digital interaktif: sampul, Bab 1 Bilangan Berpangkat (pengertian, bentuk umum aⁿ, contoh, pangkat 10, pangkat nol & negatif), Bab 2 Bentuk Baku (definisi, alasan, bilangan besar/kecil, nol di tengah, kembali ke bentuk biasa, cek kewajaran), Bab 3 Nol di Tengah (tiga jenis nol, visual peran nol, aturan, 2 contoh, Coba sendiri + pembahasan), Bab 4 Kembali ke Bentuk Biasa (membalik langkah, jalur koma balik dengan nol tambahan & nomor lompatan, empat langkah, contoh, cek kewajaran, Coba sendiri + pembahasan), lalu halaman penutup. Laptop: daftar isi berlabel pendek agar 4 bab muat sebaris. Semua hasil hitungan dari `lib/sci`/BigInt (`content/book.js`, divalidasi tes). Di bawah buku: modul interaktif (alur Alpha). **Fungsi dipisah (keputusan pengembang, 12 Nov 2026):** buku = membaca materi secara runtut (Bab 1–4); daftar "Belajar bertahap per modul" (nomor 1–5) = pembelajaran interaktif (langkah terpandu, latihan per level, kuis) dan tetap membuka modul masing-masing; nomor 6–8 "Segera hadir" sampai disetujui | `nobaku.book.v1` |
| Latihan | Jalur berkelok 25 titik (Level 1–4 + Kuis untuk Modul 1–5). Titik selesai (hijau ✓), sedang dikerjakan (ungu, berdenyut, "Mulai!", kapibara melompat di sampingnya), terkunci (abu-abu 🔒). Tiap titik 5 soal, lulus ≥ 3 benar → titik berikutnya terbuka. **Jawaban salah langsung menampilkan jawaban siswa, jawaban benar, alasan (kode diagnosis), dan penjelasan langkah demi langkah di bawah soal** (satu kali jawab per soal; petunjuk bertingkat tetap tersedia sebelum menjawab) | `lib/path.js`, progres + riwayat |
| Catatan Pintar | Rangkuman, Rumus Penting, Contoh Penyelesaian Singkat, Tips, Kesalahan Umum (jawaban salah vs benar per kode E-KOMA/E-TANDA/E-PANGKAT/E-NOL); filter per bagian | `content/notes.js` |
| Riwayat Latihan | Setiap sesi (latihan, kuis, coba lagi): nilai, tanggal, per soal: soal, jawaban siswa, jawaban benar, penjelasan. Tombol **Coba lagi soal yang salah** (`#/riwayat/ulang/:id`) | `nobaku.history.v1` (maks. 60 sesi) |
| Kalender Belajar | Kalender bulanan; **cap kapibara hanya pada tanggal ada kegiatan belajar sungguhan** (membaca halaman buku, berpindah layar modul, menjawab soal latihan/kuis/ulang, menggeser koma di Lab) — masuk aplikasi/membuka Dashboard tidak dicatat. 3 tingkat cap (sedikit/sedang/rajin). Tekan tanggal bercap → rincian aktivitas | `nobaku.activity.v1` |
| Profil Siswa | Nama, kelas, username, avatar terpilih (6 pilihan), level & XP, **Progres Belajar** (buku, jalur, per modul, kesalahan tersering), **Pencapaian**, **Koleksi Lencana** (11 lencana: nama, desain medali + emblem unik, kriteria, kemajuan untuk yang terkunci), pengaturan Animasi, Pasang, hapus progres, Keluar | gabungan |

Belum dikerjakan di Tahap 1: tutorial interaktif, deployment, APK, login server/kelas/guru.

## F-04 Contoh Terurai & Faded

- **Contoh terurai:** langkah 1–4 tampil berurutan (siswa mengetuk "Langkah berikutnya"), masing-masing dengan visual F-03 berdampingan (spatial contiguity).
- **Contoh faded:** urutan yang sama, tetapi 1 langkah (contoh faded pertama) atau 2 langkah (kedua) diganti input kosong. Langkah yang dihilangkan dimulai dari langkah terakhir (*backward fading*).
- Contoh dan latihan dibuat **semirip mungkin** strukturnya (← GL03).

## F-05 Langkah Terpandu

Soal dipecah menjadi sub-langkah wajib dengan validasi per langkah:

| # | Sub-langkah | Input |
|---|---|---|
| 1 | Ketuk angka bukan nol pertama | Ketuk digit |
| 2 | Taruh koma | Ketuk celah antar-digit |
| 3 | Berapa kali koma melompat? | Angka |
| 4 | Ke kiri atau ke kanan? → tanda pangkat | Pilih (Kiri/+ , Kanan/−) |
| 5 | Tulis bentuk baku | Input a dan n |

Setiap sub-langkah salah → umpan balik khusus langkah itu; siswa tidak bisa lanjut sebelum benar (maks 2 percobaan, lalu ditunjukkan).

## F-06 Latihan Bertahap & Petunjuk

**Latihan:**
- 4 level (L1–L4), 5 soal/level, diambil acak dari bank soal per level.
- Tipe soal: `to_scientific`, `to_standard`, `choose_correct` (pilihan ganda dengan pengecoh berbasis miskonsepsi), `word_problem`, `find_error` (temukan kesalahan pada jawaban orang lain).
- **Input jawaban notasi ilmiah:** dua kolom terpisah — `a` (keyboard angka + tombol koma) dan pangkat `n` (keyboard angka + tombol ±). Mengurangi beban mengetik format.
- **Input bentuk biasa:** keyboard angka khusus dengan tombol "000" dan penanda pemisah ribuan otomatis.
- Level terbuka bila ≥ 3/5 benar; guru dapat membuka manual.

**Petunjuk (hint):**
- Tombol "💡 Petunjuk" dengan 3 tingkat (strategi → langkah → hampir jawaban).
- Penggunaan hint dicatat (`hints_used`) dan mempengaruhi skor latihan (benar tanpa hint = 1, dengan hint 1–2 = 0,75, dengan hint 3 = 0,5). Kuis tidak menyediakan hint.

## F-07 Umpan Balik Langsung & Diagnosis Kesalahan

Pengecekan dilakukan **di klien** (instan, bisa offline) dengan `lib/sci`, lalu **divalidasi ulang di server** saat sinkronisasi.

**Algoritma diagnosis** (urutan pemeriksaan untuk soal `to_scientific`, jawaban `a'`, `n'`, kunci `a`, `n`):
1. Format tidak valid / tidak dapat diparse → `E-FORMAT`.
2. `a' × 10^n'` bernilai sama dengan kunci tetapi `|a'| ∉ [1, 10)` → `E-KOMA` (nilai benar, bentuk tidak baku).
3. digit `a'` = digit `a` tanpa nol tengah → `E-NOL`.
4. `a' = a` dan `n' = −n` → `E-TANDA`.
5. `a' = a` dan `|n' − n| ≤ 2` → `E-PANGKAT`.
6. Soal cerita & jawaban benar dalam satuan asal → `E-SATUAN`.
7. Lainnya → `E-LAIN` (umpan balik umum + tawarkan hint).

| Kode | Arti | Pesan (ringkas) |
|---|---|---|
| E-FORMAT | Format tidak sesuai a × 10ⁿ | "Tulis dalam bentuk a × 10ⁿ." |
| E-KOMA | Nilai a tidak di antara 1 dan 10 | "Taruh koma tepat setelah angka bukan nol pertama." |
| E-NOL | Nol tengah hilang | "Nol di antara angka bukan nol tetap ditulis." |
| E-TANDA | Tanda pangkat terbalik | "Bilangan < 1 → pangkat negatif; ≥ 10 → positif." |
| E-PANGKAT | Jumlah lompatan salah | "Hitung lagi lompatan komanya." |
| E-SATUAN | Satuan belum dikonversi | "Periksa satuan yang diminta." |
| E-OPERASI | Aturan pangkat saat kali/bagi salah | "Kali → pangkat dijumlah; bagi → pangkat dikurang." |
| E-NORMAL | Hasil operasi benar tetapi belum bentuk baku | "a harus antara 1 dan 10. Geser lagi komanya." |
| E-MODEL | Jenis model/operasi tidak sesuai (pemodelan) | "Besaran yang ditanya didapat dengan kali atau bagi?" |
| E-INFO | Memakai informasi tidak relevan / melewatkan yang relevan | "Ada angka yang tidak diperlukan. Mana yang dipakai?" |
| E-LAIN | Lainnya | "Belum tepat. Coba lihat petunjuk." |

Setiap pesan disertai aksi visual (sorot digit / putar ulang lompatan). Kode kesalahan disimpan di `answers.error_code` untuk dashboard guru.

## F-08 Soal Cerita Terstruktur

- Teks soal dengan bilangan relevan **disorot** (opsi "Tandai info penting" yang bisa dimatikan pada L4).
- Kerangka 4 langkah: Diketahui → Satuan diminta → Konversi → Bentuk baku.
- Panel **tabel konversi satuan** (km, m, cm, mm, µm, nm; ribu, juta, miliar, triliun) dapat dibuka di samping (desktop) atau sebagai *bottom sheet* (mobile).
- Konteks: uang (K01), astronomi, biologi (sel, virus), fisika (kecepatan cahaya), geografi (jumlah penduduk).
- Kerangka 4 langkah ini adalah versi awal siklus PMSTP; versi lengkap ada di F-16.

## F-09 Pre-test, Post-test, Kuis

- Pre-test wajib saat pertama login (dapat dilewati jika guru mengizinkan); post-test terbuka setelah Modul 8 selesai.
- Ada dua bagian: **prosedural** (12 soal) dan **literasi** (8 soal format AKM berbasis stimulus, termasuk 1 uraian pemodelan yang dinilai dengan rubrik PMSTP).
- Pre/post-test memakai dua set paralel (A/B); urutan set diacak per siswa untuk penelitian (counterbalancing) bila diaktifkan guru/peneliti.
- Tanpa hint, umpan balik ditampilkan **setelah** tes selesai (bukan per soal).
- Timer opsional (default: tidak tampil, untuk mengurangi kecemasan); durasi tetap direkam.

## F-10 Progres Siswa

- Beranda menampilkan daftar modul dengan status: terkunci / tersedia / sedang / selesai, dan skor kuis.
- Tombol "Lanjutkan" membawa ke item terakhir.
- Rekap pribadi: akurasi per jenis soal (positif, negatif, nol tengah, balik, cerita) dan kesalahan tersering dengan tautan "Latih lagi bagian ini".
- Tidak ada perbandingan dengan siswa lain.

## F-11 Dashboard Guru

- **Daftar kelas** → pilih kelas.
- **Ringkasan kelas:** jumlah siswa, % selesai per modul, rata-rata pre-test vs post-test, rata-rata skala Paas per modul.
- **Tabel siswa × modul:** status, skor kuis, waktu belajar; klik → detail siswa (riwayat jawaban, kesalahan tersering).
- **Peta kesalahan:** grafik batang distribusi `error_code` per modul; daftar siswa yang paling sering `E-TANDA`, dll. → bahan remedial.
- **Aksi:** reset password siswa, buka kunci level, keluarkan siswa dari kelas, ekspor CSV.
- Guru hanya melihat siswa di kelas miliknya.

## F-12 Kuesioner Beban Kognitif

- Muncul di akhir setiap modul (sebelum ringkasan); dapat dilewati.
- Pertanyaan (skala Paas 1–9): "Seberapa besar usaha mental yang kamu keluarkan untuk memahami materi ini?" — label 1 = "Sangat-sangat ringan", 9 = "Sangat-sangat berat", dengan ikon wajah netral sederhana.
- Opsional (diaktifkan peneliti): 3 butir tambahan adaptasi IL/EL/GL (Leppink dkk., 2013), skala 0–10.
- Data disimpan di `cognitive_load_surveys`.

## F-13 Mode Offline

- Service worker (vite-plugin-pwa) men-cache aset aplikasi dan file konten modul/soal (JSON).
- Jawaban & progres disimpan di IndexedDB (antrian `pendingAttempts`) lalu dikirim saat online (background sync / saat aplikasi dibuka).
- Indikator status kecil: "Offline — progres akan disimpan nanti".
- Login pertama tetap memerlukan internet.
- Konflik progres: server menyimpan semua attempt (append-only); progres dihitung ulang dari attempt sehingga tidak ada konflik tulis.

## F-14 Ekspor Data Penelitian

- Khusus admin. Ekspor CSV: `research_code`, `class_code_hash`, skor pre/post per kategori, waktu per modul, jumlah hint, distribusi error_code, skor Paas.
- Tidak berisi nama, username, atau email.

## F-15 Self-explanation (Could)

- Setelah jawaban benar pada contoh faded, sesekali muncul pertanyaan pilihan: "Kenapa pangkatnya negatif?" (3 opsi alasan).
- Opsional: "Jelaskan ke temanmu" — siswa merekam/ketik penjelasan singkat (← GL04).

---

## F-16 Pemodelan Terbimbing

Inti literasi & pemodelan, berjalan **tanpa AI** dan **offline** (konten dari bank soal). Kerangka: [MATH-LITERACY.md](MATH-LITERACY.md).

**Layar pemodelan** menampilkan teks soal di atas dan **5 panel langkah PMSTP** di bawahnya; hanya satu panel aktif terbuka.

| Langkah | Interaksi | Pemeriksaan |
|---|---|---|
| 1 Pahami | Ketuk frasa angka di teks → menjadi **kartu besaran** (nilai + satuan). Isi kartu "Ditanya" dari pilihan. | Kartu relevan terpilih semua, kartu pengecoh tidak terpilih (`E-INFO`) |
| 2 Modelkan | (a) Samakan satuan dengan **konverter satuan** (pilih satuan tujuan → mesin menampilkan × 10ᵏ, siswa mengisi pangkatnya). (b) Ubah tiap kartu ke bentuk baku (memakai `SciInput`). (c) Pilih jenis model (kali/bagi/banding/…) dan susun **ekspresi** dengan menyeret kartu ke templat, mis. `[ ] ÷ [ ]`. | Satuan (`E-SATUAN`), bentuk baku (E-xx biasa), model (`E-MODEL`) |
| 3 Selesaikan | Langkah terpandu Modul 7: hitung bagian `a`, hitung pangkat, normalkan (dengan `CommaVisualizer`). | `E-OPERASI`, `E-NORMAL`, E-xx biasa |
| 4 Tafsirkan | Isi hasil + pilih satuan; lengkapi kalimat jawaban (isian rumpang atau pilih kalimat yang tepat). Opsional: ubah ke satuan yang lebih mudah dibaca (500 s ≈ 8,3 menit). | Nilai & satuan setara |
| 5 Periksa | Jawab 1–2 pertanyaan kewajaran (mis. "Hasilnya lebih besar atau lebih kecil dari 1? Mengapa?") | Pilihan sesuai kunci; alasan (opsional) disimpan untuk guru |

- Setiap panel punya petunjuk bertingkat (3 level) dan label proses kecil (RUMUS/TERAP/TAFSIR) untuk guru (dapat disembunyikan bagi siswa).
- Bantuan memudar sesuai level L1–L4 (lihat [LEARNING-DESIGN.md](LEARNING-DESIGN.md#modul-8--pemodelan-matematika-literasi)).
- Skor dihitung dengan rubrik 0–2 per langkah (maks 10) dan disimpan per langkah (`answers.step`).
- Format soal AKM lain (`multi_select`, `matching`, `short_numeric`) memakai komponen sederhana yang sama gaya visualnya.

## F-17 Asisten AI – Siswa

"**Bawa soalmu sendiri**": siswa mengetik soal cerita dari buku/LKS/berita, lalu dituntun memodelkannya dengan alur PMSTP yang sama dengan F-16. Spesifikasi teknis lengkap: [AI-TUTOR.md](AI-TUTOR.md).

- Terbuka setelah Modul 6 selesai, hanya jika kelas mengaktifkan AI (F-20) dan perangkat online.
- Form input: teks maks 800 karakter + peringatan "Jangan tulis nama atau data pribadi".
- Hasil analisis ditampilkan sebagai kartu besaran yang **dapat dikoreksi** siswa ("Ini tidak sesuai soalku" → ditandai untuk guru).
- Penilaian langkah oleh mesin; AI hanya merangkai kalimat petunjuk ≤ 30 kata.
- Jawaban akhir tidak diberikan langsung; pembahasan lengkap muncul setelah siswa menjawab atau setelah petunjuk tingkat 3 di langkah Tafsirkan.
- Soal di luar lingkup → pesan sopan: "Soal ini belum bisa dibantu NoBaku. Coba soal tentang bilangan sangat besar atau sangat kecil, ya."
- Sisa kuota harian tampil kecil di form.

## F-18 Asisten AI – Guru (Pembuat Soal)

- Guru menempel soal cerita, memilih level target & konteks → AI membuat **draf soal pemodelan**: kartu besaran, model, kunci (dihitung mesin), 3 petunjuk, pengecoh bermiskonsepsi, label proses/konteks.
- Draf tampil di formulir yang dapat diedit; tanda ✓ hijau bila kunci & pengecoh lolos verifikasi mesin, tanda ⚠ bila ada yang perlu diperbaiki.
- Tombol **Setujui** → masuk bank soal kelas; **Tolak** → dihapus. Hanya soal yang disetujui yang muncul ke siswa.
- Guru juga dapat meninjau soal yang ditandai siswa "tidak sesuai" dan mengubahnya menjadi soal kelas.

## F-19 Profil Literasi

- **Siswa:** kartu profil di halaman Progres — skor per proses (Merumuskan, Menerapkan, Menafsirkan) dalam bentuk batang sederhana, kategori (Perlu Intervensi Khusus / Dasar / Cakap / Mahir), dan saran "Latih bagian ini" yang menautkan ke soal berlabel proses terlemah. Tanpa perbandingan dengan teman.
- **Guru:** grafik skor rata-rata per proses & konteks, distribusi kategori kelas, perbandingan pre vs post literasi, daftar siswa per kategori, dan jenis model yang paling sering salah (`E-MODEL`, `E-INFO`, `E-SATUAN`).
- Perhitungan skor & kategori: [MATH-LITERACY.md](MATH-LITERACY.md#7-profil-literasi-siswa).

## F-20 Pengaturan AI Kelas

- Per kelas: Asisten AI siswa **aktif/nonaktif** (default nonaktif), kuota soal per siswa per hari (default 10), dan Asisten AI guru (aktif untuk guru yang diaktivasi).
- Global (admin, `.env`): `AI_ENABLED`, `AI_MODEL`, `AI_MONTHLY_BUDGET_USD`. Bila anggaran tercapai, semua fitur AI nonaktif otomatis dan guru diberi tahu; mode terbimbing tetap berjalan.
- Riwayat penggunaan AI per kelas (jumlah sesi, rasio petunjuk/sesi, soal yang ditandai) tampil di dashboard guru.
