# Testing & Evaluation Plan

Pengujian dibagi dua: **pengujian perangkat lunak** (apakah aplikasi benar & andal) dan **evaluasi pembelajaran** (apakah aplikasi efektif & menurunkan beban kognitif).

## Bagian A — Pengujian Perangkat Lunak

### A1. Unit Test Logika Notasi Ilmiah (prioritas tertinggi)

Lokasi: `frontend/src/lib/sci/*.test.ts` (Vitest) dan `backend/tests/test_sci_vectors.py` (pytest). Keduanya membaca **`shared/test-vectors.json`**. Target cakupan ≥ 90%.

**Contoh isi `shared/test-vectors.json`:**
```json
{
  "conversions": [
    { "standard": "4.500.000",       "a": "4,5",    "n": 6 },
    { "standard": "135.000.000",     "a": "1,35",   "n": 8 },
    { "standard": "2.500.000.000",   "a": "2,5",    "n": 9 },
    { "standard": "70.080.000",      "a": "7,008",  "n": 7 },
    { "standard": "3.004.000",       "a": "3,004",  "n": 6 },
    { "standard": "8",               "a": "8",      "n": 0 },
    { "standard": "10",              "a": "1",      "n": 1 },
    { "standard": "9,99",            "a": "9,99",   "n": 0 },
    { "standard": "0,0405",          "a": "4,05",   "n": -2 },
    { "standard": "0,00032",         "a": "3,2",    "n": -4 },
    { "standard": "0,0000075",       "a": "7,5",    "n": -6 },
    { "standard": "0,000506",        "a": "5,06",   "n": -4 },
    { "standard": "0,00602",         "a": "6,02",   "n": -3 },
    { "standard": "0,0000000090387", "a": "9,0387", "n": -9 },
    { "standard": "120.000",         "a": "1,2",    "n": 5 },
    { "standard": "250.000.000",     "a": "2,5",    "n": 8 }
  ],
  "diagnosis": [
    { "question": "0,0000075",   "answer": { "a": "7,5",   "n": 6 },  "expected": "E-TANDA" },
    { "question": "0,0000075",   "answer": { "a": "7,5",   "n": -7 }, "expected": "E-PANGKAT" },
    { "question": "135.000.000", "answer": { "a": "13,5",  "n": 7 },  "expected": "E-KOMA" },
    { "question": "70.080.000",  "answer": { "a": "7,8",   "n": 7 },  "expected": "E-NOL" },
    { "question": "0,000506",    "answer": { "a": "5,6",   "n": -4 }, "expected": "E-NOL" },
    { "question": "4.500.000",   "answer": { "a": "4,5",   "n": 6 },  "expected": null },
    { "question": "4.500.000",   "answer": { "a": "4,5,0", "n": 6 },  "expected": "E-FORMAT" }
  ],
  "operations": [
    { "op": "mul", "x": { "a": "3",   "n": 8 },   "y": { "a": "5",   "n": 2 },  "result": { "a": "1,5", "n": 11 } },
    { "op": "mul", "x": { "a": "4",   "n": -4 },  "y": { "a": "3",   "n": 1 },  "result": { "a": "1,2", "n": -2 } },
    { "op": "mul", "x": { "a": "2,8", "n": 8 },   "y": { "a": "7",   "n": -1 }, "result": { "a": "1,96", "n": 8 } },
    { "op": "div", "x": { "a": "1,5", "n": 11 },  "y": { "a": "3",   "n": 8 },  "result": { "a": "5",   "n": 2 } },
    { "op": "div", "x": { "a": "6",   "n": 9 },   "y": { "a": "1,2", "n": 4 },  "result": { "a": "5",   "n": 5 } },
    { "op": "div", "x": { "a": "1",   "n": -3 },  "y": { "a": "1",   "n": -7 }, "result": { "a": "1",   "n": 4 } }
  ],
  "units": [
    { "value": "150.000.000", "from": "km", "to": "m",    "result": { "a": "1,5", "n": 11 } },
    { "value": "64",          "from": "GB", "to": "byte", "result": { "a": "6,4", "n": 10 } },
    { "value": "4",           "from": "MB", "to": "byte", "result": { "a": "4",   "n": 6 } },
    { "value": "1",           "from": "mm", "to": "m",    "result": { "a": "1",   "n": -3 } }
  ],
  "modeling": [
    { "expression": "d / c", "quantities": { "d": ["150.000.000", "km"], "c": ["300.000.000", "m/s"] },
      "answer_unit": "s", "result": { "a": "5", "n": 2 } },
    { "expression": "m / f", "quantities": { "m": ["64", "GB"], "f": ["4", "MB"] },
      "answer_unit": "buah", "result": { "a": "1,6", "n": 4 } }
  ]
}
```

**Kasus tepi yang wajib diuji:** angka 0 (tidak punya bentuk baku normal → ditolak dengan pesan), bilangan negatif, `a` = 1 dan `a` mendekati 10 (9,99), nol di belakang desimal (`3,50` setara `3,5`), input dengan/ tanpa titik ribuan, minus Unicode `−`, bilangan sangat besar (10³⁰) dan sangat kecil (10⁻³⁰) tanpa kehilangan presisi.

### A2. Unit Test Lainnya
- Komponen UI kunci (React Testing Library): `SciInput`, `CommaVisualizer` (jumlah lompatan & arah), `HintPanel` (urutan terbuka), `FeedbackBanner`.
- Backend services: `grading`, `diagnosis`, `progress` (aturan buka level ≥ 3/5), `codes` (kode kelas unik, tanpa karakter ambigu), `literacy` (skor per proses & kategori).
- Evaluator ekspresi: menolak masukan berbahaya/aneh (`__import__`, simbol tak dikenal, pembagian dengan nol, kurung tidak seimbang).
- Pemeriksa langkah PMSTP: setiap kode `E-MODEL`, `E-INFO`, `E-SATUAN`, `E-OPERASI`, `E-NORMAL` punya minimal 2 kasus uji.
- Layanan AI (dengan klien tiruan): `ModelSpec` tidak valid → status `invalid`; `stop_reason = "refusal"` → pesan sopan; timeout → templat statis; kuota & anggaran habis → 429/503; filter kebocoran jawaban bekerja; saringan data pribadi (nomor HP, email) bekerja.

### A3. Integration Test API (pytest + httpx, DB SQLite in-memory)
| Skenario | Ekspektasi |
|---|---|
| Daftar siswa dengan kode kelas valid / tidak valid | 201 / 404 `CLASS_CODE_INVALID` |
| Login salah 6× dalam 1 menit | 429 |
| Guru A membuka laporan kelas guru B | 403 |
| Siswa membuka `/reports/*` | 403 |
| Kirim batch jawaban dua kali dengan `client_id` sama | Tidak terduplikasi |
| Hasil server berbeda dari `client_result` | `mismatch: true`, server menang |
| Kuis: respons `GET questions?set=quiz` | Tidak mengandung kunci jawaban |
| Selesai 3/5 benar di L2 | `next_level_unlocked: 3` |
| Ekspor penelitian | Tidak ada kolom nama/username/email |
| Siswa memanggil `/ai/problems/analyze` di kelas dengan `ai_enabled = false` | 403 |
| Siswa melebihi kuota harian | 429 `AI_QUOTA_EXCEEDED` |
| Respons analisis untuk siswa | Tidak mengandung `verified_answer` |
| Soal yang sama dianalisis dua kali | Panggilan Claude hanya sekali (cache `text_hash`) |
| Guru menyetujui draf | Soal muncul hanya di kelas pemilik |

### A4. End-to-End (Playwright)
1. Guru daftar → admin aktivasi → guru buat kelas → salin kode.
2. Siswa daftar dengan kode → pre-test → Modul 3 lengkap (konsep, contoh, latihan dengan hint, kuis, kuesioner) → progres tampil.
3. Offline: matikan jaringan di tengah latihan → jawab 3 soal → nyalakan → data tersinkron, progres benar.
4. Guru melihat dashboard: siswa muncul, distribusi kesalahan sesuai jawaban.
5. Siswa menyelesaikan satu soal pemodelan L2 (5 langkah) → skor rubrik & profil literasi diperbarui.
6. Guru mengaktifkan AI → siswa "Bawa soalmu" (API Claude ditiru di E2E) → menyelesaikan sesi → guru melihat penggunaan AI.

### A4b. Evaluasi Asisten AI
Dijalankan dengan API sungguhan sebelum rilis & setiap perubahan prompt/model (`pytest -m ai_eval`). Set evaluasi, metrik, dan target ada di [AI-TUTOR.md](AI-TUTOR.md#8-evaluasi-kualitas-ai). Hasil dicatat (tanggal, model, versi prompt, skor, biaya) di `backend/tests/ai_eval/results.md`.

Dijalankan di viewport 360×740 (mobile) dan 1280×800 (desktop).

### A5. Non-Fungsional
| Aspek | Alat | Kriteria |
|---|---|---|
| Kinerja | Lighthouse (mobile, throttling 4G) | Performance ≥ 85, LCP < 3 dtk |
| PWA | Lighthouse PWA | Installable, offline berfungsi |
| Aksesibilitas | axe-core + Lighthouse | Skor ≥ 95, tanpa pelanggaran kritis |
| Android | Uji manual di 2 perangkat (Android 8–14, RAM 3–4 GB) | Tidak crash, animasi lancar ≥ 30 fps |
| Keamanan | Checklist OWASP ASVS L1 dasar, `pip-audit`, `npm audit` | Tanpa kerentanan tinggi |

### A6. Uji Konten
- Skrip `python -m app.seed --validate` memeriksa: skema JSON valid, kunci jawaban konsisten dengan `app/sci`, setiap soal punya 3 hint, pengecoh `choose_correct` benar-benar menghasilkan `error_code` yang ditandai.
- Review ahli: minimal 1 guru matematika SMP & dosen pembimbing memvalidasi materi dan soal (lembar validasi ahli materi & media).

## Bagian B — Evaluasi Pembelajaran & Beban Kognitif

### B1. Uji Usabilitas (Formatif)
- **Peserta:** 5 siswa SMP kelas VIII (sasaran NoBaku; S01 sendiri kelas IX yang sudah mempelajari materi ini di kelas VIII).
- **Metode:** think-aloud saat menyelesaikan Modul 3 + 1 tugas guru (membaca dashboard).
- **Ukuran:** tingkat penyelesaian tugas, jumlah kesalahan navigasi, waktu, kutipan kebingungan, **SUS** (System Usability Scale, target ≥ 70).
- **Output:** daftar masalah dengan tingkat keparahan → perbaikan sebelum uji lapangan.

### B2. Pengukuran Beban Kognitif
| Instrumen | Kapan | Skala |
|---|---|---|
| Skala Paas (1 butir usaha mental) | Akhir setiap modul | 1–9 |
| Kuesioner beban kognitif 3 dimensi (adaptasi Leppink dkk., 2013: IL, EL, GL) | Setelah Modul 3 dan Modul 6 | 0–10 per butir |

Analisis: rata-rata per modul; bandingkan dengan target (Paas ≤ 5); korelasikan dengan skor kuis; identifikasi modul dengan EL tinggi untuk perbaikan desain.

### B3. Efektivitas (Pre-test / Post-test)
- Desain: one-group pretest–posttest (atau kelompok kontrol bila memungkinkan: kelas dengan pembelajaran biasa).
- Instrumen: 12 soal paralel set A/B (lihat [LEARNING-DESIGN.md](LEARNING-DESIGN.md#8-penilaian)), divalidasi ahli; uji reliabilitas pada uji coba terbatas.
- Analisis: uji-t berpasangan (atau Wilcoxon bila tidak normal), **N-gain** (target ≥ 0,3 kategori sedang), analisis per kategori soal (khusus pangkat negatif & nol di tengah).

### B4. Literasi Matematika
- **Instrumen:** tes literasi set A/B (8 soal per set, 2–3 stimulus, format AKM: PG, PG kompleks, menjodohkan, isian, 1 uraian pemodelan). Kisi-kisi memetakan setiap butir ke proses (RUMUS/TERAP/TAFSIR) × konteks (PERSONAL/SOSBUD/SAINTIFIK).
- **Validasi:** validitas isi oleh 2 ahli (dosen & guru) dengan indeks Aiken's V; uji coba terbatas untuk reliabilitas (Cronbach's α ≥ 0,7) dan tingkat kesukaran.
- **Penilaian uraian:** rubrik PMSTP 0–2 per langkah ([MATH-LITERACY.md](MATH-LITERACY.md#6-rubrik-penilaian-pemodelan)); 20% jawaban dinilai dua penilai untuk kesepakatan antar-penilai (Cohen's κ ≥ 0,7).
- **Analisis:** N-gain skor literasi, perubahan distribusi kategori (Perlu Intervensi Khusus → Mahir), analisis per proses (diharapkan peningkatan terbesar pada RUMUS karena temuan EL05).

### B5. Evaluasi Asisten AI oleh Pengguna
- Kuesioner singkat setelah sesi AI (3 butir skala 1–5): petunjuk membantu, petunjuk mudah dipahami, aku tetap berpikir sendiri.
- Guru menilai sampel 20 sesi AI (kesesuaian model, kualitas petunjuk, kebocoran jawaban).
- Bandingkan skor rubrik pemodelan siswa yang memakai AI vs yang hanya memakai mode terbimbing (eksploratif, bukan kausal).

### B6. Wawancara Lanjutan
Wawancara singkat dengan beberapa siswa dan guru setelah uji coba, memakai kerangka koding yang sama (K/IL/EL/GL/DS) agar dapat dibandingkan dengan temuan awal di [RESEARCH-INSIGHTS.md](RESEARCH-INSIGHTS.md). Tambahkan pertanyaan tentang soal cerita/pemodelan dan pengalaman memakai Asisten AI.

## Kriteria Rilis v1.0
- Semua tes A1–A4 lulus di CI; tanpa bug kritis/tinggi terbuka.
- Skor SUS uji usabilitas ≥ 70 atau masalah berat sudah diperbaiki.
- Konten tervalidasi ahli.
- Evaluasi AI (A4b) memenuhi target; jika tidak, Asisten AI dirilis dalam keadaan nonaktif (mode terbimbing tetap rilis).
- APK terpasang dan berjalan di ≥ 2 perangkat Android uji.
