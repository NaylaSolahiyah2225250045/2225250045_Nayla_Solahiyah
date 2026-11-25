# Learning Design — Desain Pembelajaran Berbasis Teori Beban Kognitif

Dokumen ini menjelaskan **apa** yang dipelajari, **urutannya**, dan **bagaimana** setiap modul menerapkan prinsip CLT. Format penulisan konten mengikuti [CONTENT-GUIDE.md](CONTENT-GUIDE.md).

## 1. Landasan Teori

| Prinsip CLT | Penjelasan singkat | Penerapan di NoBaku |
|---|---|---|
| Pre-training | Kenalkan komponen dasar sebelum materi kompleks | Modul 1 Prasyarat (pangkat 10, nilai tempat) |
| Segmenting | Pecah materi menjadi unit kecil yang dikontrol pengguna | 1 konsep/layar, tombol "Lanjut" dikontrol siswa |
| Worked example | Contoh lengkap dengan langkah eksplisit | Setiap modul diawali 2 contoh terurai |
| Fading | Bantuan dikurangi bertahap | Contoh faded: 1 langkah kosong → 2 langkah kosong → mandiri |
| Signaling | Isyarat visual untuk informasi penting | Warna konsisten untuk koma, digit bermakna, nol |
| Spatial contiguity | Teks & gambar terkait diletakkan berdekatan | Label langkah menempel pada visual angka |
| Redundancy | Hindari informasi ganda yang tidak perlu | Tanpa teks panjang yang mengulang animasi |
| Coherence | Buang materi tidak esensial | Tanpa dekorasi, musik, maskot bergerak |
| Expertise reversal | Bantuan dikurangi saat siswa makin mahir | Level latihan L1→L4 mengurangi scaffold |
| Immediate feedback | Umpan balik segera mengoreksi skema | Diagnosis kesalahan per jawaban |
| Self-explanation | Menjelaskan langkah memperkuat skema | Pertanyaan "Kenapa pangkatnya negatif?" (fase C) |

**Rigorous Mathematical Thinking (RMT, 21 Nov 2026).** Selain CLT, NoBaku memakai RMT (Kinard & Kozulin) sebagai acuan mediasi: fungsi kognitif Fase Input/Elaborasi/Output, alat psikologis matematika, dan Mediated Learning Experience (Intensionalitas & Resiprositas, Transendensi, Pemberian Makna). Tahap 1 menambahkan tujuan & alasan penting tiap level, pertanyaan pemandu, pertanyaan balik pada umpan balik, aturan umum setelah menjawab, dan pemetaan kesalahan ke fase untuk guru — tanpa mengubah bank soal. PMSTP adalah siklus NoBaku, bukan tahapan RMT. Rincian: [RMT.md](RMT.md).

## 2. Capaian & Tujuan Pembelajaran

**Capaian Pembelajaran (Kurikulum Merdeka, Fase D – Bilangan):** peserta didik dapat membaca, menulis, dan membandingkan bilangan, termasuk bilangan berpangkat dan notasi ilmiah, serta menggunakannya dalam pemecahan masalah.

| Kode | Tujuan Pembelajaran (TP) | Modul |
|---|---|---|
| TP-1 | Menentukan nilai 10ⁿ dan 10⁻ⁿ serta hubungan pangkat 10 dengan nilai tempat. | 1 |
| TP-2 | Mengubah bilangan besar (≥ 10) ke notasi ilmiah a × 10ⁿ, n > 0. | 2 |
| TP-3 | Mengubah bilangan kecil (0 < x < 1) ke notasi ilmiah a × 10⁻ⁿ. | 3 |
| TP-4 | Menuliskan notasi ilmiah dengan benar untuk bilangan yang memuat nol di tengah. | 4 |
| TP-5 | Mengubah notasi ilmiah ke bentuk biasa (positif & negatif). | 5 |
| TP-6 | Menggunakan notasi ilmiah pada soal cerita, termasuk konversi satuan. | 6 |
| TP-7 | Mengalikan dan membagi bilangan dalam bentuk baku serta menormalkan hasilnya. | 7 |
| TP-8 | Merumuskan model matematika dari masalah kontekstual, menyelesaikannya, menafsirkan hasil, dan menilai kewajarannya (literasi matematika). | 8 |

Kerangka literasi (proses RUMUS/TERAP/TAFSIR/NALAR dan konteks PERSONAL/SOSBUD/SAINTIFIK) dijelaskan di [MATH-LITERACY.md](MATH-LITERACY.md). Setiap item konten dan soal diberi label proses & konteks.

## 3. Peta Modul

> **Susunan berlaku sejak 16 Nov 2026: lima topik.** Topik 1 Pangkat Sepuluh & Nilai Tempat (= M1 + nilai angka menurut posisi) · Topik 2 Bilangan Besar & Kecil (= M2 + M3 + membandingkan) · Topik 3 Mengubah Bentuk Biasa & Baku (= M5 + M4 + bilangan berkoma) · Topik 4 Operasi Hitung Bentuk Baku (= rancangan M7) · Topik 5 Penerapan Bentuk Baku (= rancangan M6 + pemodelan sederhana dari M8). Rincian M1–M8 di bawah tetap menjadi sumber isi tiap topik. Pemodelan PMSTP penuh & Asisten AI (M8) belum dibangun.
>
> Latihan (1 level × 10 soal per topik (disetujui pengembang, 23 Nov 2026)): satu latihan per topik berisi 10 soal berurutan — 3 mudah (mengenali), 4 sedang (alasan, hubungan, menghitung), 3 sulit (penalaran bertahap, soal kontekstual/PMSTP); lalu **Level 5 · Kuis Akhir** 10 soal (2 per topik). Kuis topik (5 soal) tetap ada di modul interaktif.

```
[Pre-test] → M1 Prasyarat* → M2 Bilangan Besar → M3 Bilangan Kecil → M4 Nol di Tengah
           → M5 Kembali ke Bentuk Biasa → M6 Soal Cerita & Satuan
           → M7 Kali & Bagi Bentuk Baku → M8 Pemodelan Matematika → [Post-test]
* M1 wajib jika skor pre-test bagian prasyarat < 70%, opsional jika ≥ 70%.
Asisten AI (mode siswa) terbuka setelah M6 selesai dan bila guru mengaktifkannya.
```

Estimasi waktu: 10–15 menit per modul (M8 ±25 menit, dapat dibagi beberapa sesi), total ±2 jam → bisa dibagi beberapa hari (mengatasi EL04 "cuma satu pertemuan").

### Struktur seragam setiap modul
1. **Pemantik** (1 layar) — konteks nyata singkat (uang, jarak, ukuran benda).
2. **Mikro-materi** (2–4 layar) — 1 konsep/layar + visual.
3. **Contoh terurai** (2 contoh) — semua langkah tampil, dengan Visualisasi Geser Koma.
4. **Contoh faded** (2 contoh) — sebagian langkah diisi siswa.
5. **Langkah terpandu** (2–3 soal) — siswa mengerjakan per sub-langkah.
6. **Latihan bertahap**: 10 soal per topik, mudah → sedang → sulit (23 Nov 2026).
7. **Kuis modul** (5 soal, tanpa hint).
8. **Kuesioner beban kognitif** (1 pertanyaan Paas, ±10 detik).

## 4. Rincian Modul

### Modul 1 — Prasyarat: Pangkat 10 dan Nilai Tempat (← IL03)
**Mikro-materi:**
1. Arti pangkat: 10³ = 10 × 10 × 10 = 1.000.
2. Pola: pangkat = banyaknya nol → 10⁶ = 1.000.000.
3. Pangkat negatif sebagai pembagian: 10⁻¹ = 1/10 = 0,1; 10⁻³ = 1/1.000 = 0,001.
4. Tabel nilai tempat (ribuan … persepuluhan, perseratusan, perseribuan) dan hubungannya dengan 10ⁿ.

**Visual:** tabel nilai tempat horizontal dengan label pangkat di atas setiap kolom (… 10² 10¹ 10⁰ , 10⁻¹ 10⁻² …).

**Contoh soal:**
| Soal | Jawaban |
|---|---|
| 10⁴ = … | 10.000 |
| 10⁻² = … | 0,01 |
| 1.000.000 = 10^… | 10⁶ |
| 0,001 = 10^… | 10⁻³ |

### Modul 2 — Bilangan Besar (Pangkat Positif) (← K01, GL05)
**Aturan inti (disajikan sebagai 4 langkah):**
1. Cari angka **bukan nol pertama** dari kiri.
2. Taruh koma **tepat setelah** angka itu.
3. Hitung berapa **lompatan ke kiri** yang dilakukan koma → itu nilai pangkat (**positif**).
4. Tulis **a × 10ⁿ**, buang nol di belakang yang tidak perlu.

**Konteks pemantik (K01 – nominal uang):** "Anggaran pembangunan sekolah Rp2.500.000.000. Bagaimana menulisnya lebih singkat?"

**Contoh terurai:**
| Soal | Langkah | Jawaban |
|---|---|---|
| 4.500.000 | koma asal di akhir → pindah ke antara 4 dan 5 → 6 lompatan ke kiri | 4,5 × 10⁶ |
| 135.000.000 | koma setelah 1 → 8 lompatan ke kiri | 1,35 × 10⁸ |
| 2.500.000.000 | koma setelah 2 → 9 lompatan ke kiri | 2,5 × 10⁹ |

**Cara cepat (setelah contoh):** "Pangkat = banyak angka di depan koma asal dikurangi 1." (135.000.000 punya 9 angka → 10⁸.)

### Modul 3 — Bilangan Kecil (Pangkat Negatif) (← IL01, IL04, K03, DS02)
Modul ini dipecah lebih halus karena merupakan sumber kesulitan utama.

**Segmen 3a — Kenapa negatif?** Bilangan < 1 → kita membagi dengan 10 berkali-kali → pangkat negatif. Hubungkan dengan Modul 1 (10⁻³ = 0,001).

**Segmen 3b — Arah lompatan:** koma bergeser **ke kanan** → pangkat **negatif**. Visual: panah ke kanan dengan label "−".
> Jembatan keledai: **"Ke kiri bilangannya besar (+), ke kanan bilangannya kecil (−)."**

**Segmen 3c — Aturan cepat posisi:** "Angka bukan nol pertama ada di **posisi ke-n setelah koma** → pangkatnya **−n**." Nol depan disorot abu-abu dan diberi nomor posisi 1, 2, 3, … (← IL04).

**Contoh terurai:**
| Soal | Langkah | Jawaban |
|---|---|---|
| 0,0405 | angka bukan nol pertama (4) di posisi ke-2 → 2 lompatan ke kanan | 4,05 × 10⁻² |
| 0,00032 | 3 di posisi ke-4 | 3,2 × 10⁻⁴ |
| 0,0000075 | 7 di posisi ke-6 | 7,5 × 10⁻⁶ |

**Segmen 3d — Cek kewajaran:** "Bilanganmu kurang dari 1? Pangkatnya harus negatif." Ditampilkan sebagai pengecekan otomatis dalam langkah terpandu.

### Modul 4 — Nol di Tengah (← DS02, IL04)
**Konsep:** Nol **di depan** angka bukan nol pertama → hanya menentukan pangkat (dibuang). Nol **di tengah** (di antara angka bukan nol) → **bagian dari a**, tidak boleh dibuang. Nol **di belakang** (setelah angka bukan nol terakhir, pada bilangan bulat) → dibuang.

**Visual:** tiga warna — nol depan (abu-abu, dicoret), nol tengah (warna digit, tebal), nol belakang (abu-abu, dicoret).

**Contoh terurai:**
| Soal | Jawaban |
|---|---|
| 70.080.000 | 7,008 × 10⁷ |
| 0,000506 | 5,06 × 10⁻⁴ |
| 3.004.000 | 3,004 × 10⁶ |

**Implementasi (12 Nov 2026):** 15 layar — tujuan, tiga jenis nol, visual peran nol (`zeros`) untuk 70.080.000 & 0,000506, aturan singkat, 3 contoh terurai (5 langkah, `zeroSteps`), cek dengan membalik (jembatan ke Modul 5), 2 contoh setengah jadi (5.008.000, 0,0302), 2 langkah terpandu (60.500, 0,00907), latihan L1–L4 (6 soal/level, pengecoh E-NOL) & kuis 5 soal. Materinya juga tersaji di buku digital sebagai Bab 3 (blok `zeros`, `convert` + `focus`, `try`).

### Modul 5 — Kembali ke Bentuk Biasa (← IL05, tugas pemicu)
**Aturan:** pangkat positif → koma geser ke **kanan** n kali (tambah nol di belakang jika perlu); pangkat negatif → koma geser ke **kiri** n kali (tambah nol di depan).

**Contoh terurai:**
| Soal | Jawaban |
|---|---|
| 2,5 × 10⁸ | 250.000.000 |
| 1,2 × 10⁵ | 120.000 |
| 6,02 × 10⁻³ | 0,00602 |
| 9,0387 × 10⁻⁹ | 0,0000000090387 |

**Bantuan hitung nol:** kotak-kotak tempat digit diberi nomor lompatan, sehingga siswa tidak perlu menghitung nol di kepala.

**Implementasi (12 Nov 2026):** 14 layar — tujuan (konteks jarak Bumi–Matahari), membalik arah lompatan, visual lompatan balik (`BackVisualizer`: kotak kosong terisi nol + nomor lompatan) untuk 2,5 × 10⁸ & 6,02 × 10⁻³, empat langkah (+ pangkat 0), 4 contoh terurai (1,2 × 10⁵; 3,456 × 10²; 6,02 × 10⁻³; 7 × 10⁻⁵ — `backSteps`), cek kewajaran (n + 1 angka / posisi ke-n), 2 contoh setengah jadi (4,08 × 10⁶; 9,1 × 10⁻⁴), latihan L1–L4 & kuis 5 soal. Langkah terpandu interaktif untuk arah balik belum dibuat. Materi yang sama juga tersaji di buku digital sebagai Bab 4 (`content/book.js`, blok `backWork` & `try`).

### Modul 6 — Soal Cerita & Satuan (← EL05, K01)
**Struktur penyelesaian 4 langkah (selalu tampil sebagai kerangka):**
1. **Diketahui:** sorot bilangan & satuan yang relevan (bilangan tak relevan ditampilkan normal).
2. **Satuan yang diminta:** apa satuan jawaban?
3. **Konversi:** pakai tabel konversi (1 km = 10³ m, 1 juta = 10⁶, 1 miliar = 10⁹, 1 mm = 10⁻³ m, 1 µm = 10⁻⁶ m).
4. **Tulis bentuk baku.**

**Contoh:**
| Soal | Jawaban |
|---|---|
| Jarak Bumi–Matahari ±150.000.000 km. Nyatakan dalam meter dalam bentuk baku. | 150.000.000 km = 1,5 × 10⁸ km = 1,5 × 10⁸ × 10³ m = **1,5 × 10¹¹ m** |
| Kecepatan cahaya ±300.000.000 m/s. Tulis dalam bentuk baku. | **3 × 10⁸ m/s** |
| Massa sebutir debu ±0,00000075 kg. Tulis dalam bentuk baku. | **7,5 × 10⁻⁷ kg** |
| Dana bantuan Rp3,2 miliar. Tulis dalam rupiah bentuk baku. | 3,2 × 10⁹ → **Rp3,2 × 10⁹** |

Mulai Modul 6, kerangka 4 langkah di atas diperkenalkan sebagai versi awal **siklus pemodelan PMSTP** (lengkap di Modul 8).

### Modul 7 — Perkalian & Pembagian Bentuk Baku
Prasyarat prosedural agar model `KALI`, `BAGI`, `PER_UNIT`, dan `BANDING` dapat diselesaikan.

**Mikro-materi:**
1. **Kali:** kalikan bagian `a`, **jumlahkan** pangkat: (a × 10ᵐ) × (b × 10ⁿ) = (a × b) × 10ᵐ⁺ⁿ.
2. **Bagi:** bagi bagian `a`, **kurangkan** pangkat: (a × 10ᵐ) ÷ (b × 10ⁿ) = (a ÷ b) × 10ᵐ⁻ⁿ.
3. **Normalkan:** jika hasil `a` ≥ 10 → geser koma ke kiri, pangkat +1; jika `a` < 1 → geser koma ke kanan, pangkat −1 (memakai Visualisasi Geser Koma yang sama — skema yang sudah dikenal).
4. **Hati-hati tanda:** 10⁻⁴ × 10³ = 10⁻¹; 10³ ÷ 10⁻⁴ = 10⁷ (mengurangi bilangan negatif).

**Contoh terurai (terverifikasi):**
| Soal | Langkah | Jawaban |
|---|---|---|
| (3 × 10⁸) × (5 × 10²) | 3 × 5 = 15; 8 + 2 = 10 → 15 × 10¹⁰ → normalkan | 1,5 × 10¹¹ |
| (4 × 10⁻⁴) × (3 × 10¹) | 12 × 10⁻³ → normalkan | 1,2 × 10⁻² |
| (1,5 × 10¹¹) ÷ (3 × 10⁸) | 0,5 × 10³ → normalkan | 5 × 10² |
| (6 × 10⁹) ÷ (1,2 × 10⁴) | 5 × 10⁵ | 5 × 10⁵ |
| (1 × 10⁻³) ÷ (1 × 10⁻⁷) | −3 − (−7) = 4 | 1 × 10⁴ |

Kode kesalahan tambahan: `E-OPERASI` (pangkat dikalikan, bukan dijumlahkan / dijumlahkan saat membagi) dan `E-NORMAL` (hasil benar tetapi belum dinormalkan).

### Modul 8 — Pemodelan Matematika (Literasi)
Modul puncak yang melatih siklus **PMSTP**: **P**ahami → **M**odelkan → **S**elesaikan → **T**afsirkan → **P**eriksa (lihat [MATH-LITERACY.md](MATH-LITERACY.md#3-siklus-pemodelan-5-langkah-pmstp)).

**Struktur:**
1. **Pemantik:** infografis sederhana (mis. "Sampah harian Indonesia").
2. **Konsep:** apa itu model matematika — "mengubah cerita menjadi kalimat matematika".
3. **Contoh terurai** pemodelan lengkap 5 langkah (1 soal `BAGI`, 1 soal `KALI`).
4. **Contoh faded** (langkah Tafsirkan & Periksa dikosongkan, lalu Modelkan juga).
5. **Latihan pemodelan** L1–L4 dengan semua jenis model (`KONVERSI`, `SATUAN`, `KALI`, `BAGI`, `PER_UNIT`, `KAPASITAS`, `BANDING`, `URUT`) dan ketiga konteks.
6. **Tantangan:** "Bawa soalmu sendiri" → Asisten AI (opsional, jika diaktifkan guru).
7. **Kuis** literasi (format AKM: PG, PG kompleks, menjodohkan, isian, uraian terstruktur).

**Contoh terurai — soal `BAGI`:**
> "Jarak Bumi ke Matahari sekitar 150.000.000 km. Cahaya merambat sekitar 300.000.000 m/s. Matahari berumur sekitar 4,6 miliar tahun. Berapa detik cahaya Matahari sampai ke Bumi?"

| Langkah | Isi |
|---|---|
| Pahami | Diketahui: jarak 150.000.000 km, kecepatan 300.000.000 m/s. Ditanya: waktu (detik). Umur Matahari **tidak diperlukan**. |
| Modelkan | Samakan satuan: 150.000.000 km = 1,5 × 10¹¹ m. Kecepatan = 3 × 10⁸ m/s. Model: waktu = jarak ÷ kecepatan. |
| Selesaikan | (1,5 × 10¹¹) ÷ (3 × 10⁸) = 0,5 × 10³ = 5 × 10² |
| Tafsirkan | Waktu = 5 × 10² detik = 500 detik. "Cahaya Matahari sampai ke Bumi dalam sekitar 500 detik (±8 menit)." |
| Periksa | Hasil > 1 dan pangkat positif masuk akal karena jaraknya jauh lebih besar daripada kecepatan per detik. |

**Level latihan pemodelan:**
| Level | Karakteristik | Bantuan |
|---|---|---|
| L1 | 1 operasi, satuan sudah sama, tanpa info pengecoh | Semua langkah dibimbing, kartu besaran sudah disiapkan |
| L2 | 1 operasi, perlu 1 konversi satuan | Langkah Pahami sudah terisi |
| L3 | 1–2 operasi, ada 1 info pengecoh | Hanya kerangka langkah + petunjuk |
| L4 | Multi-langkah, konteks baru, ada pengecoh | Jawaban akhir + Periksa; bimbingan dapat dibuka |

## 5. Level Latihan (Expertise Reversal)

> **Sejak 23 Nov 2026:** Level 1–4 per topik digabung menjadi **satu latihan 10 soal** yang naik bertahap di dalam satu sesi (soal 1–3 ≈ karakter L1, 4–7 ≈ L2–L3, 8–10 ≈ L4; field `tier` di bank soal). Lulus ≥ 6 benar. Tabel di bawah tetap menjadi acuan karakter tiap jenjang.

| Level | Karakteristik | Scaffold |
|---|---|---|
| L1 – Pemanasan | Soal dasar untuk mengenali konsep | Visual geser koma aktif, penanda posisi aktif |
| L2 – Pemahaman | Konsep & hubungan antarbilangan (membandingkan, aturan) | Penanda posisi aktif, visual bisa dibuka lewat hint |
| L3 – Penerapan | Perhitungan & penggunaan rumus | Hanya hint |
| L4 – Tantangan | Penalaran, soal cerita, kehidupan sehari-hari, pengecoh | Hint terbatas (maks 2) |
| L5 – Kuis Akhir | 10 soal dari kelima topik, tanpa petunjuk | Pembahasan di akhir |

**Aturan lulus:** ≥ 6 dari 10 benar (60%; sebelumnya ≥ 3 per level 4–5 soal). **Aturan turun bantuan otomatis:** jika 2 salah berturut-turut di L3/L4, tawarkan "Lihat contoh lagi" (kembali ke contoh terurai terkait) — bukan memaksa.

## 6. Strategi Umpan Balik

| Situasi | Umpan balik |
|---|---|
| Benar | "Tepat! 4,5 × 10⁶" + ringkasan 1 baris langkah (memperkuat skema). Tanpa animasi meriah berlebih. |
| Salah – E-KOMA | "Nilai a harus antara 1 dan 10. Taruh koma tepat setelah angka bukan nol pertama." + sorot digit itu |
| Salah – E-TANDA | "Bilanganmu kurang dari 1, jadi pangkatnya negatif." (atau sebaliknya) |
| Salah – E-PANGKAT | "Hampir! Hitung lagi lompatan komanya." + putar animasi lompatan dengan penghitung |
| Salah – E-NOL | "Nol yang ada di antara angka bukan nol tidak boleh dibuang." + sorot nol tengah |
| Salah – E-SATUAN | "Satuan yang diminta meter, sedangkan data dalam km. Ingat 1 km = 10³ m." |
| Salah – E-FORMAT | "Format yang benar: a × 10ⁿ. Contoh: 3,2 × 10⁴." |
| Salah – E-OPERASI | "Saat mengalikan, pangkatnya dijumlahkan. Saat membagi, pangkatnya dikurangkan." |
| Salah – E-NORMAL | "Hasilmu benar nilainya, tapi a harus antara 1 dan 10. Geser lagi komanya." |
| Salah – E-MODEL | "Coba pikirkan lagi: besaran yang ditanya didapat dengan mengalikan atau membagi?" |
| Salah – E-INFO | "Ada angka yang tidak diperlukan untuk menjawab. Angka mana yang benar-benar dipakai?" |

Setiap pesan juga memuat **pertanyaan balik** (RMT — *mediated questioning*, `ask` di `content/messages.js`) yang mengajak siswa memeriksa alasannya, mis. E-TANDA: "Bilangan ini 10 atau lebih, atau kurang dari 1? Apa artinya bagi tanda pangkatnya?". Setelah menjawab, kotak **Aturan umum** (Transendensi) merangkum prinsip yang berlaku untuk soal sejenis ([RMT.md](RMT.md#3-penerapan-tahap-1-di-nobaku)).

Setelah 2 kali salah pada soal yang sama → tawarkan hint berikutnya. Setelah 3 kali → tampilkan pembahasan lengkap, soal dihitung salah, dan soal serupa diberikan kemudian (*retry with variant*).

## 7. Petunjuk Bertingkat (contoh untuk 0,00032)
1. **Hint 1 (strategi):** "Cari angka bukan nol pertama dari kiri."
2. **Hint 2 (langkah):** "Angka bukan nol pertama adalah 3, di posisi ke-4 setelah koma."
3. **Hint 3 (hampir jawaban):** "Koma pindah 4 kali ke kanan, jadi bentuknya 3,2 × 10^(…). Tandanya positif atau negatif?"

## 8. Penilaian

| Instrumen | Isi | Waktu |
|---|---|---|
| Pre-test (prosedural) | 12 soal (2 prasyarat, 2 besar, 3 kecil/negatif, 2 nol tengah, 2 balik, 1 cerita) | Sebelum Modul 1 |
| Pre-test (literasi) | 8 soal format AKM berbasis 2–3 stimulus (PG, PG kompleks, menjodohkan, isian, 1 uraian pemodelan) | Sebelum Modul 1 |
| Kuis modul | 5 soal tanpa hint | Akhir setiap modul |
| Post-test (prosedural & literasi) | Set paralel dari kedua pre-test (angka & konteks berbeda) | Setelah Modul 8 |
| Beban kognitif | Skala Paas 1–9: "Seberapa besar usaha mental yang kamu keluarkan?" | Akhir setiap modul |

Bank soal awal per modul: minimal 30 soal (20 latihan + 5 kuis + 5 cadangan varian); Modul 8 minimal 24 soal pemodelan (3 per jenis model). Lihat format di [CONTENT-GUIDE.md](CONTENT-GUIDE.md).
