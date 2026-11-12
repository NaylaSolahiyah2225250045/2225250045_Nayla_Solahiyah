# Research Insights — Sintesis Wawancara Beban Kognitif

| Item | Keterangan |
|---|---|
| Narasumber | S01, siswa kelas 9A (identitas disamarkan) |
| Tanggal | 4 November 2026 |
| Pewawancara | Nayla Solahiyah |
| Durasi | 18 menit, rekaman dengan persetujuan narasumber |
| Materi | Notasi Ilmiah / Bentuk Baku (Bilangan Berpangkat) — dipelajari di kelas VIII |
| Artefak pemicu | Buku Matematika SMP Kelas VIII (Penerbit MKP), LKS Matematika Kelas VIII, lembar soal pemicu, buku catatan siswa |

## 1. Kerangka Analisis

Wawancara dikodekan dengan kategori **Teori Beban Kognitif (Sweller)**:

| Kode | Kategori | Arti |
|---|---|---|
| K | Konteks | Pengalaman belajar sebelumnya |
| IL | Intrinsic Load | Kesulitan yang melekat pada materi (kompleksitas & interaktivitas elemen) |
| EL | Extraneous Load | Beban yang muncul dari cara penyajian/pembelajaran yang kurang efektif |
| GL | Germane Load | Usaha mental yang membantu pembentukan skema/pemahaman |
| DS | Design Suggestion | Usulan siswa untuk aplikasi |

## 2. Hasil Tugas Pemicu

Saat wawancara, S01 mengerjakan 4 soal:

| Soal | Jawaban benar | Catatan |
|---|---|---|
| 135.000.000 → bentuk baku | 1,35 × 10⁸ | Dapat dikerjakan |
| 0,0000075 → bentuk baku | 7,5 × 10⁻⁶ | Dapat dikerjakan, tetapi siswa mengaku ragu pada pangkat negatif (K03) |
| 2,5 × 10⁸ → bentuk biasa | 250.000.000 | Dapat dikerjakan |
| 9,0387 × 10⁻⁹ → bentuk biasa | 0,0000000090387 | Bentuk dengan pangkat negatif + nol di tengah ("0387") = paling rawan salah hitung nol |

Bukti hasil latihan kelas VIII juga menunjukkan siswa pernah menyelesaikan latihan dengan nilai baik, sehingga masalahnya lebih ke **retensi** dan **keyakinan** pada kasus sulit, bukan ketidakmampuan total.

## 3. Temuan per Kategori

### 3.1 Konteks (K)
- **K01** — Contoh guru memakai **nominal uang** → konteks nyata yang familier membantu (dipakai sebagai konteks awal di aplikasi).
- **K02** — Pembelajaran: penjelasan papan tulis → latihan soal (model ceramah klasik).
- **K03** — Masih mengenali materi, tetapi **ragu pada pangkat negatif**.

### 3.2 Intrinsic Load (IL)
- **IL01** — Bagian tersulit: soal dengan **pangkat negatif**.
- **IL02** — Fokus pikiran saat mengerjakan: **"menaruh koma di mana"**.
- **IL03** — Menyadari perlunya **dasar bilangan berpangkat** (prasyarat).
- **IL04** — Soal sulit jika **banyak angka nol** dan hasilnya **berpangkat negatif**.
- **IL05** — Sering **salah menaruh koma dan salah hitung** (jumlah pergeseran).

**Interpretasi:** Interaktivitas elemen tinggi karena siswa harus serentak: (1) menemukan angka bukan nol pertama, (2) menaruh koma, (3) menghitung jumlah pergeseran, (4) menentukan tanda pangkat, (5) menjaga nol di tengah. Kelima elemen ini perlu **dipecah dan dilatih bertahap**.

### 3.3 Extraneous Load (EL)
- **EL01** — Lupa penjelasan yang membingungkan karena materi sudah lewat → masalah **retensi**; perlu materi yang bisa diulang kapan saja.
- **EL02** — Hanya penjelasan lisan, **tanpa gambar/tabel** → tidak ada representasi visual pergeseran koma.
- **EL03** — Tidak ada informasi tambahan yang mengganggu → pertahankan tampilan yang bersih.
- **EL04** — Materi hanya **satu pertemuan**, tidak mendalam → kurang latihan terdistribusi.
- **EL05** — **Soal cerita** dengan banyak angka dan **satuan berbeda** (m→km, juta→miliar) membingungkan pemilihan informasi.

### 3.4 Germane Load (GL)
- **GL01** — Paham saat **mengerjakan latihan** → praktik aktif efektif.
- **GL02** — Tahu benar/salah hanya **saat diperiksa guru** → umpan balik tertunda; perlu umpan balik otomatis langsung.
- **GL03** — Terbantu jika **contoh soal mirip dengan latihan** → efek *worked example* dan transfer dekat.
- **GL04** — Pernah **menjelaskan ke orang lain** → potensi fitur *self-explanation*.
- **GL05** — Sudah memahami langkah **mencari angka bukan nol pertama** untuk menentukan nilai *a* → skema awal sudah ada; jadikan titik jangkar.

### 3.5 Usulan Desain (DS)
- **DS01** — Penjelasan **lebih jelas dan simpel** + **petunjuk** mengerjakan soal.
- **DS02** — Penjelasan khusus **pangkat negatif** dan **angka nol di tengah** angka bukan nol.
- **DS03** — "Semuanya dibutuhkan": penjelasan materi, **visualisasi pergeseran koma**, contoh soal, **latihan bertahap**.

## 4. Matriks Keterlacakan: Temuan → Implikasi → Fitur

| Temuan | Implikasi desain (prinsip CLT) | Fitur (PRD) |
|---|---|---|
| IL03 | *Pre-training*: kuasai 10ⁿ dan pangkat dulu | FR-03 Modul Prasyarat |
| IL02, IL05, EL02, DS03 | Representasi visual & animasi pergeseran koma (*signaling*, *modality*) | FR-05 Visualisasi Geser Koma |
| IL01, IL04, K03, DS02 | Pangkat negatif sebagai modul tersendiri, bertahap | FR-11 Modul Pangkat Negatif Bertahap |
| IL04, DS02 | Sorot angka nol & nol di tengah, hitung pergeseran berbantuan | FR-12 Penyorotan Nol |
| EL04, DS01 | Materi dipecah menjadi unit kecil (*segmenting*) | FR-04 Mikro-materi |
| GL03, GL05, DS01 | *Worked example* → *faded example* → latihan | FR-06 Contoh Terurai & Faded |
| IL02, DS01 | Langkah terpandu per sub-langkah | FR-07 Langkah Terpandu |
| GL01, DS03 | Latihan bertingkat kesulitan | FR-08 Latihan Bertahap |
| GL02, IL05 | Umpan balik langsung & diagnosis jenis kesalahan | FR-09 Umpan Balik & Diagnosis |
| DS01 | Petunjuk bertingkat sesuai kebutuhan | FR-10 Petunjuk Bertingkat |
| EL05, K01 | Pisahkan informasi relevan, bantu konversi satuan, konteks uang | FR-13 Soal Cerita Terstruktur |
| EL01 | Akses ulang materi kapan saja, latihan ulang terjadwal | FR-15 Progres & Ulangi |
| GL02 | Guru tetap dapat memantau, tapi tidak jadi satu-satunya sumber umpan balik | FR-16 Dashboard Guru |
| GL04 | Ajak siswa menjelaskan langkahnya | FR-20 Self-explanation (nice-to-have) |
| EL03 | Pertahankan tampilan minim distraksi | NFR-08 Minimal Distraksi |

## 5. Miskonsepsi yang Diantisipasi

Berdasarkan temuan IL dan pola umum kesalahan notasi ilmiah:

| Kode | Miskonsepsi | Contoh salah | Benar |
|---|---|---|---|
| E-KOMA | Koma tidak setelah digit bukan nol pertama | 13,5 × 10⁷ | 1,35 × 10⁸ |
| E-TANDA | Tanda pangkat terbalik | 7,5 × 10⁶ untuk 0,0000075 | 7,5 × 10⁻⁶ |
| E-PANGKAT | Jumlah pergeseran salah (±1) | 7,5 × 10⁻⁷ | 7,5 × 10⁻⁶ |
| E-NOL | Nol di tengah hilang | 9,387 × 10⁻⁹ | 9,0387 × 10⁻⁹ |
| E-SATUAN | Lupa mengonversi satuan | 1,5 × 10⁸ m (padahal km) | 1,5 × 10¹¹ m |
| E-FORMAT | Format tidak valid | 135 × 10⁶ (a ≥ 10) | 1,35 × 10⁸ |

## 6. Keterbatasan & Rencana Validasi

- **n = 1**: temuan belum dapat digeneralisasi. Rencana: wawancara/observasi tambahan 3–5 siswa dan 1–2 guru matematika sebelum desain final.
- Data retrospektif (materi dipelajari setahun lalu) → ingatan siswa terbatas (EL01).
- Validasi lanjutan: uji usabilitas prototipe, pengukuran beban kognitif (skala Paas), pre-test/post-test. Lihat [TESTING-PLAN.md](TESTING-PLAN.md).

## 7. Perluasan: Literasi Matematika & Pemodelan

Tujuan **literasi matematika** dan **pemodelan soal cerita** ditambahkan oleh pengembang (bukan usulan langsung narasumber), dengan dasar berikut:

| Dasar | Kaitan |
|---|---|
| EL05 | Siswa bingung memilih angka yang relevan dan menyamakan satuan pada soal cerita → inti proses **merumuskan** (PISA) |
| K01 | Konteks nyata (nominal uang) membantu siswa → konteks **personal/sosial-budaya** (AKM) |
| GL04 | Siswa pernah menjelaskan penyelesaian kepada orang lain → proses **penalaran** dan *self-explanation* |
| DS01 | Siswa meminta petunjuk mengerjakan soal → Asisten AI pemodelan memberi petunjuk bertahap |
| Kebijakan | Numerasi diukur dalam Asesmen Nasional (AKM); literasi matematika diukur PISA |

Karena belum didukung data wawancara langsung, **validasi diperlukan**: wawancara lanjutan perlu menambah pertanyaan tentang pengalaman siswa dengan soal cerita/AKM dan penerimaan siswa-guru terhadap asisten AI. Rancangan lengkap: [MATH-LITERACY.md](MATH-LITERACY.md) dan [AI-TUTOR.md](AI-TUTOR.md).
