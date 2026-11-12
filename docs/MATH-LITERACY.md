# Literasi Matematika & Pemodelan Matematika

Dokumen ini menjelaskan bagaimana NoBaku menumbuhkan **literasi matematika** siswa dan melatih **pemodelan matematika** soal cerita, dengan konteks utama **notasi ilmiah / bentuk baku**. Acuan: **PISA 2022 Mathematics Framework** (OECD) dan **AKM Numerasi** (Asesmen Nasional, Kemendikbudristek).

> Catatan asal-usul: tujuan literasi & pemodelan merupakan **perluasan dari pengembang**, bukan temuan langsung wawancara. Namun tujuan ini didukung oleh temuan EL05 (bingung memilih informasi pada soal cerita dengan satuan berbeda), K01 (konteks uang membantu), dan GL04 (pernah menjelaskan penyelesaian ke orang lain). Lihat [RESEARCH-INSIGHTS.md](RESEARCH-INSIGHTS.md#7-perluasan-literasi-matematika--pemodelan).

## 1. Definisi Kerja

| Sumber | Definisi ringkas |
|---|---|
| PISA 2022 | Kapasitas individu untuk **bernalar secara matematis** serta **merumuskan, menerapkan, dan menafsirkan** matematika untuk memecahkan masalah dalam berbagai konteks dunia nyata. |
| AKM Numerasi | Kemampuan berpikir menggunakan konsep, prosedur, fakta, dan alat matematika untuk menyelesaikan masalah sehari-hari dalam berbagai konteks yang relevan bagi individu sebagai warga negara. |

**Definisi kerja NoBaku:** siswa mampu **mengenali** besaran sangat besar/sangat kecil dalam situasi nyata, **memodelkannya** dengan notasi ilmiah dan operasi yang tepat, **menyelesaikan** model tersebut, lalu **menafsirkan** dan **menilai kewajaran** hasilnya dalam konteks semula.

## 2. Kerangka Gabungan PISA + AKM

### 2.1 Proses (dipakai sebagai label setiap soal & langkah)

| Kode | Proses PISA | Padanan level kognitif AKM | Wujud dalam notasi ilmiah |
|---|---|---|---|
| `RUMUS` | Merumuskan (*formulate*) | Penerapan / Penalaran | Memilih informasi relevan, menyamakan satuan, menyusun model (mis. `t = d ÷ v`) |
| `TERAP` | Menerapkan (*employ*) | Pemahaman / Penerapan | Mengubah ke bentuk baku, mengalikan/membagi bentuk baku, menormalkan hasil |
| `TAFSIR` | Menafsirkan & mengevaluasi (*interpret & evaluate*) | Penalaran | Mengembalikan hasil ke konteks (satuan, kalimat jawaban), menilai kewajaran, membandingkan |
| `NALAR` | Penalaran matematis (inti PISA 2022) | Penalaran | Menjelaskan alasan langkah, memeriksa klaim orang lain (soal `find_error`) |

### 2.2 Konten
Fokus **Bilangan** (AKM) / **Quantity** (PISA): bilangan berpangkat, notasi ilmiah, orde besaran, satuan pengukuran, rasio sederhana.

### 2.3 Konteks

| Kode | AKM | PISA | Contoh konteks soal |
|---|---|---|---|
| `PERSONAL` | Personal | Personal | Kuota internet, memori HP, uang saku, pertumbuhan rambut |
| `SOSBUD` | Sosial-budaya | Societal + Occupational | Anggaran sekolah/daerah, jumlah penduduk, sampah, bantuan sosial |
| `SAINTIFIK` | Saintifik | Scientific | Jarak antarplanet, kecepatan cahaya, ukuran virus/sel, massa partikel |

Setiap modul minimal memuat soal dari **ketiga konteks**.

### 2.4 Format Soal (selaras AKM)

| Format | Kode `type` | Contoh pemakaian |
|---|---|---|
| Pilihan ganda | `choose_correct` | Memilih bentuk baku yang benar |
| Pilihan ganda kompleks | `multi_select` | Memilih semua pernyataan yang benar tentang besaran |
| Menjodohkan | `matching` | Menjodohkan benda dengan ukurannya (orde besaran) |
| Isian singkat | `to_scientific`, `to_standard`, `short_numeric` | Menulis hasil |
| Uraian terstruktur | `modeling` | Siklus pemodelan 5 langkah |

## 3. Siklus Pemodelan 5 Langkah ("PMSTP")

Siklus pemodelan disederhanakan agar sesuai untuk siswa SMP dan prinsip *segmenting*. Setiap langkah tampil sebagai satu panel, dengan label proses PISA.

| # | Langkah | Proses | Yang dilakukan siswa | Bentuk input di aplikasi |
|---|---|---|---|---|
| 1 | **Pahami** | RUMUS | Menandai informasi yang **diketahui** dan yang **ditanya**, termasuk satuannya; mengabaikan informasi pengecoh | Ketuk/sorot frasa dalam teks; isi kartu "Diketahui" & "Ditanya" |
| 2 | **Modelkan** | RUMUS | Menyamakan satuan, menulis besaran dalam bentuk baku, memilih operasi, menyusun model | Kartu besaran (nilai + satuan) + pilih jenis model + susun ekspresi dari kartu |
| 3 | **Selesaikan** | TERAP | Menghitung dengan aturan bentuk baku dan menormalkan hasil | Langkah terpandu: kalikan/bagi `a`, jumlah/kurangi pangkat, normalkan |
| 4 | **Tafsirkan** | TAFSIR | Menulis hasil dengan satuan yang diminta, menyusun kalimat jawaban | Input hasil + satuan + pilih/isi kalimat jawaban |
| 5 | **Periksa** | TAFSIR / NALAR | Menilai kewajaran (estimasi orde besaran, tanda pangkat, satuan) | Pertanyaan cek: "Masuk akal? Lebih dari atau kurang dari 1? Kenapa?" |

Prinsip CLT pada siklus ini:
- **Kerangka langkah selalu tampil** (mengurangi beban "harus mulai dari mana").
- **Kartu besaran** memisahkan informasi relevan dari teks panjang (← EL05, *split-attention*).
- **Fading lintas level:** L1 semua langkah dibimbing; L2 langkah 1 sudah terisi; L3 hanya kerangka; L4 jawaban akhir + langkah 5 saja (siswa boleh membuka bimbingan).

## 4. Jenis Model Matematika

| Kode | Jenis model | Bentuk umum | Contoh soal | Model & penyelesaian (terverifikasi) |
|---|---|---|---|---|
| `KONVERSI` | Penulisan bentuk baku | `x = a × 10ⁿ` | Anggaran sekolah Rp2.500.000.000 | Rp2,5 × 10⁹ |
| `SATUAN` | Konversi satuan | `x [u₁] = x × 10ᵏ [u₂]` | Jarak Bumi–Matahari 150.000.000 km dalam meter | 1,5 × 10⁸ × 10³ = **1,5 × 10¹¹ m** |
| `KALI` | Perkalian (jumlah × besaran per unit, laju × waktu) | `y = p × q` | Rambut tumbuh 0,0004 m/hari. Panjang pertambahan dalam 30 hari? | 4 × 10⁻⁴ × 3 × 10¹ = 12 × 10⁻³ = **1,2 × 10⁻² m** (1,2 cm) |
| `BAGI` | Pembagian (waktu = jarak ÷ kecepatan) | `y = p ÷ q` | Cahaya menempuh 1,5 × 10¹¹ m dengan kecepatan 3 × 10⁸ m/s. Berapa detik? | 0,5 × 10³ = **5 × 10² s** (±8,3 menit) |
| `PER_UNIT` | Bagi rata / per kapita / kapasitas | `y = total ÷ banyak` | Dana Rp6.000.000.000 dibagi rata ke 12.000 siswa | 6 × 10⁹ ÷ 1,2 × 10⁴ = **Rp5 × 10⁵** (Rp500.000) |
| `KAPASITAS` | Berapa banyak muat | `n = kapasitas ÷ ukuran` | Memori 64 GB (6,4 × 10¹⁰ byte), satu foto 4 MB (4 × 10⁶ byte) | **1,6 × 10⁴ foto** (16.000) |
| `BANDING` | Perbandingan "berapa kali" | `r = p ÷ q` | Virus berdiameter 1 × 10⁻⁷ m. Berapa virus berjajar sepanjang 1 mm? | 1 × 10⁻³ ÷ 1 × 10⁻⁷ = **1 × 10⁴** (10.000) |
| `URUT` | Membandingkan/mengurutkan besaran | bandingkan `n`, lalu `a` | Urutkan: 3 × 10⁻⁵, 8 × 10⁻⁶, 1,2 × 10⁻⁵ | 8 × 10⁻⁶ < 1,2 × 10⁻⁵ < 3 × 10⁻⁵ |
| `SOSIAL` | Kombinasi (kali + satuan) | `y = p × q`, lalu konversi | 2,8 × 10⁸ penduduk, masing-masing 0,7 kg sampah/hari | 2,8 × 10⁸ × 7 × 10⁻¹ = 19,6 × 10⁷ = **1,96 × 10⁸ kg/hari** |

> Data konteks ditulis sebagai **perkiraan** ("sekitar") dan dicek ke sumber resmi (BPS, NASA, buku IPA SMP) sebelum dimasukkan ke bank soal.

## 5. Pemetaan ke Modul

| Modul | Proses dominan | Konteks | Peran literasi |
|---|---|---|---|
| M1 Prasyarat | TERAP | Personal | Pengantar orde besaran (ribu, juta, miliar; persepuluh, perseribu) |
| M2 Bilangan Besar | TERAP, TAFSIR | Sosial-budaya (uang — K01) | Membaca angka besar dalam berita/anggaran |
| M3 Bilangan Kecil | TERAP, TAFSIR | Saintifik | Ukuran benda mikroskopis |
| M4 Nol di Tengah | TERAP | Saintifik, Personal | Data presisi (hasil pengukuran) |
| M5 Bentuk Biasa | TAFSIR | Semua | Menafsirkan bentuk baku menjadi kalimat sehari-hari |
| M6 Soal Cerita & Satuan | RUMUS | Semua | Model `KONVERSI`, `SATUAN`, `URUT` |
| **M7 Kali & Bagi Bentuk Baku** | TERAP | Saintifik | Prasyarat prosedural untuk model `KALI`/`BAGI` |
| **M8 Pemodelan Matematika** | RUMUS, TERAP, TAFSIR, NALAR | Semua | Siklus 5 langkah penuh, semua jenis model, Asisten AI |

Detail M7 dan M8 ada di [LEARNING-DESIGN.md](LEARNING-DESIGN.md#modul-7--perkalian--pembagian-bentuk-baku).

## 6. Rubrik Penilaian Pemodelan

Dipakai untuk menilai soal `modeling` (otomatis untuk input terstruktur; manual/guru untuk jawaban kalimat bebas).

| Langkah | 0 | 1 | 2 |
|---|---|---|---|
| Pahami | Informasi relevan tidak teridentifikasi | Sebagian benar / satuan terlewat | Diketahui & ditanya lengkap dengan satuan |
| Modelkan | Model tidak sesuai | Operasi benar tetapi satuan belum disamakan | Model & satuan tepat |
| Selesaikan | Hasil salah | Nilai benar tetapi belum dinormalkan (mis. 12 × 10⁻³) | Hasil benar dalam bentuk baku |
| Tafsirkan | Tidak ada satuan/kalimat | Satuan atau kalimat kurang tepat | Hasil + satuan + kalimat sesuai konteks |
| Periksa | Tidak menilai | Menilai tanpa alasan | Menilai kewajaran dengan alasan (orde besaran/tanda) |

Skor maksimal 10 per soal. Profil literasi dihitung per proses (RUMUS, TERAP, TAFSIR) dan per konteks.

## 7. Profil Literasi Siswa

Kategori mengikuti istilah laporan AKM agar familier bagi guru:

| Kategori | Rentang skor literasi (0–100) | Deskripsi singkat |
|---|---|---|
| Perlu Intervensi Khusus | < 40 | Belum dapat mengubah besaran ke bentuk baku dalam konteks sederhana |
| Dasar | 40–59 | Dapat menerapkan prosedur bentuk baku, belum dapat merumuskan model sendiri |
| Cakap | 60–79 | Dapat merumuskan dan menyelesaikan model satu langkah dalam konteks yang familier |
| Mahir | ≥ 80 | Dapat memodelkan masalah multi-langkah, menyamakan satuan, dan menilai kewajaran |

Skor literasi = rata-rata tertimbang skor rubrik pemodelan (60%) dan skor soal berlabel proses RUMUS/TAFSIR di kuis & tes (40%). Ambang kategori akan dikalibrasi ulang setelah uji coba.

## 8. Strategi Menumbuhkan Literasi (ringkas)

1. **Stimulus nyata di setiap modul** — pemantik berupa kutipan berita/infografis sederhana (teks pendek, satu gambar).
2. **"Baca angkanya"** — latihan TAFSIR singkat: "10⁹ rupiah itu kira-kira berapa? (miliar)".
3. **Estimasi sebelum menghitung** — langkah Periksa melatih *number sense* orde besaran.
4. **Informasi pengecoh terkontrol** — mulai L3, soal memuat 1 angka tidak relevan (EL05 dilatih bertahap, bukan dihindari).
5. **Penjelasan diri** — siswa memilih/menulis alasan langkah (← GL04).
6. **Soal buatan siswa** — siswa membawa soal dari buku/berita ke Asisten AI (lihat [AI-TUTOR.md](AI-TUTOR.md)).
