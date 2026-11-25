# Content Guide — Pedoman Menulis Materi & Soal

## 1. Gaya Bahasa

| Aturan | Contoh baik | Hindari |
|---|---|---|
| Kalimat pendek (≤ 15 kata) | "Cari angka bukan nol pertama dari kiri." | "Langkah pertama yang harus kamu lakukan adalah mengidentifikasi digit signifikan pertama yang bukan nol dari sebelah kiri bilangan." |
| Satu langkah per kalimat | "Taruh koma setelah angka itu." | "Taruh koma lalu hitung lompatannya dan tentukan tandanya." |
| Sapaan "kamu" | "Coba kamu hitung lompatannya." | "Siswa diminta menghitung…" |
| Istilah konsisten | angka bukan nol pertama, lompatan koma, pangkat, nol di tengah | digit signifikan, eksponen, mantisa (di UI siswa) |
| Umpan balik tidak menyalahkan | "Belum tepat. Hitung lagi lompatannya." | "Salah!" |
| Maks ±40 kata per layar konsep | — | Paragraf panjang |

## 2. Format Angka

- **Koma** = pemisah desimal: `3,5`; **titik** = pemisah ribuan: `4.500.000`.
- Bentuk baku ditulis `a × 10ⁿ` dengan `1 ≤ a < 10`. Di KaTeX: `3{,}2 \times 10^{-4}` (gunakan `{,}` agar tidak ada spasi setelah koma).
- Rupiah: `Rp2.500.000` (tanpa spasi) → bentuk baku `Rp2,5 × 10⁶`.
- Satuan dipisah spasi: `1,5 × 10¹¹ m`.

**Aturan parser input siswa** (diimplementasikan di `lib/sci/parse`):
1. Kolom `a`: menerima `,` sebagai desimal; `.` diterima sebagai desimal **hanya** jika muncul sekali dan tidak membentuk pola ribuan (mis. `3.5` → 3,5; `4.500` di kolom `a` → ditolak dengan pesan format).
2. Kolom bentuk biasa: titik ribuan bersifat opsional (`4500000` dan `4.500.000` sama-sama diterima); koma = desimal.
3. Spasi diabaikan. Tanda minus boleh `-` atau `−`.

## 3. Format File Konten

Konten disimpan di `frontend/src/content/` dan di-seed ke database oleh `backend/app/seed.py`. Setiap file divalidasi dengan skema Zod (FE) dan Pydantic (BE).

### 3.1 Modul (`modules/m3.json`)
```json
{
  "id": "m3",
  "order_no": 3,
  "title": "Bilangan Kecil (Pangkat Negatif)",
  "learning_objective": "Mengubah bilangan antara 0 dan 1 ke bentuk baku a × 10⁻ⁿ.",
  "content_version": 1,
  "items": [
    { "id": "m3-intro", "type": "intro",
      "payload": { "title": "Benda yang sangat kecil",
                   "text": "Tebal selembar rambut sekitar 0,00008 meter. Banyak nolnya, ya? Yuk, tulis lebih singkat." } },
    { "id": "m3-c1", "type": "concept",
      "payload": { "title": "Kenapa pangkatnya negatif?",
                   "text": "Bilangan kurang dari 1 didapat dengan membagi 10 berkali-kali. Itu sebabnya pangkatnya negatif.",
                   "visual": { "kind": "place_value_table", "highlight": ["10^-1", "10^-2", "10^-3"] } } },
    { "id": "m3-c2", "type": "concept",
      "payload": { "title": "Koma bergeser ke kanan",
                   "text": "Koma bergeser ke kanan → pangkatnya negatif.",
                   "visual": { "kind": "comma_visualizer", "value": "0,00032", "mode": "auto" } } },
    { "id": "m3-we1", "type": "worked_example",
      "payload": { "value": "0,0405",
                   "steps": [
                     "Angka bukan nol pertama adalah 4.",
                     "Taruh koma setelah 4 → 4,05.",
                     "Koma melompat 2 kali ke kanan.",
                     "Ke kanan berarti negatif → 10⁻²."
                   ],
                   "answer": { "a": "4,05", "n": -2 } } },
    { "id": "m3-fe1", "type": "faded_example",
      "payload": { "value": "0,00032", "blank_steps": [4], "answer": { "a": "3,2", "n": -4 } } },
    { "id": "m3-g1", "type": "guided", "payload": { "question_id": "m3-g-001" } },
    { "id": "m3-practice", "type": "practice", "payload": { "levels": [1, 2, 3, 4], "per_level": 5 } },
    { "id": "m3-quiz", "type": "quiz", "payload": { "count": 5 } },
    { "id": "m3-survey", "type": "survey", "payload": { "instrument": "paas" } }
  ]
}
```

### 3.2 Soal (`questions/m3.json`)
```json
[
  {
    "id": "m3-l1-001",
    "module_id": "m3",
    "set": "practice",
    "level": 1,
    "type": "to_scientific",
    "category": "small",
    "prompt": { "text": "Tulis dalam bentuk baku:", "value": "0,0007" },
    "answer": { "a": "7", "n": -4 },
    "hints": [
      "Cari angka bukan nol pertama dari kiri.",
      "Angka 7 ada di posisi ke-4 setelah koma.",
      "Koma pindah 4 kali ke kanan → 7 × 10^(…). Positif atau negatif?"
    ]
  },
  {
    "id": "m3-l3-002",
    "module_id": "m3",
    "set": "practice",
    "level": 3,
    "type": "choose_correct",
    "category": "small",
    "prompt": { "text": "Bentuk baku dari 0,0000075 adalah …" },
    "answer": { "choice": "b" },
    "options": [
      { "key": "a", "text": "7,5 × 10⁶",  "error_code": "E-TANDA" },
      { "key": "b", "text": "7,5 × 10⁻⁶" },
      { "key": "c", "text": "7,5 × 10⁻⁷", "error_code": "E-PANGKAT" },
      { "key": "d", "text": "75 × 10⁻⁷",  "error_code": "E-KOMA" }
    ],
    "hints": ["…", "…", "…"]
  },
  {
    "id": "m6-l4-001",
    "module_id": "m6",
    "set": "practice",
    "level": 4,
    "type": "word_problem",
    "category": "word",
    "prompt": {
      "text": "Jarak Bumi ke Matahari sekitar 150.000.000 km. Nyatakan jarak itu dalam meter dalam bentuk baku.",
      "highlights": ["150.000.000 km", "meter"]
    },
    "answer": { "a": "1,5", "n": 11, "unit": "m" },
    "unit_trap": { "a": "1,5", "n": 8, "error_code": "E-SATUAN" },
    "hints": [
      "Satuan yang diminta meter, bukan km.",
      "1 km = 10³ m.",
      "1,5 × 10⁸ km × 10³ = 1,5 × 10^(…) m"
    ]
  }
]
```

**Aturan pengecoh (`choose_correct`):** setiap pengecoh harus mewakili satu miskonsepsi (E-TANDA, E-PANGKAT, E-KOMA, E-NOL) agar pilihan siswa langsung terdiagnosis.

### 3.3 Soal Pemodelan (`type: "modeling"`)
Setiap soal pemodelan wajib memiliki label literasi dan `model_spec` dengan skema yang **sama** dengan keluaran Asisten AI ([AI-TUTOR.md](AI-TUTOR.md#4-skema-spesifikasi-model-modelspec)), sehingga satu mesin pemeriksa dipakai untuk keduanya.

```json
{
  "id": "m8-l3-004",
  "module_id": "m8",
  "set": "practice",
  "level": 3,
  "type": "modeling",
  "category": "modeling",
  "literacy": { "process": ["RUMUS", "TERAP", "TAFSIR"], "context": "SOSBUD", "model_type": "KALI" },
  "prompt": {
    "stimulus": "Menurut perkiraan, penduduk Indonesia sekitar 280.000.000 jiwa. Rata-rata setiap orang menghasilkan sampah 0,7 kg per hari. Indonesia memiliki sekitar 17.000 pulau.",
    "question": "Berapa kilogram sampah yang dihasilkan seluruh penduduk Indonesia dalam satu hari? Tulis dalam bentuk baku."
  },
  "model_spec": {
    "quantities": [
      { "symbol": "p", "label": "jumlah penduduk", "value": "280.000.000", "unit": "orang", "relevant": true },
      { "symbol": "s", "label": "sampah per orang per hari", "value": "0,7", "unit": "kg/hari", "relevant": true },
      { "symbol": "q", "label": "jumlah pulau", "value": "17.000", "unit": "buah", "relevant": false }
    ],
    "asked": { "label": "total sampah per hari", "unit": "kg/hari" },
    "model_type": "KALI",
    "expression": "p * s",
    "answer_unit": "kg/hari",
    "answer_sentence_template": "Seluruh penduduk Indonesia menghasilkan sekitar {hasil} sampah setiap hari."
  },
  "answer": { "a": "1,96", "n": 8, "unit": "kg/hari" },
  "check_questions": [
    { "text": "Apakah hasilnya lebih dari 1 juta kg?", "options": ["Ya", "Tidak"], "answer": "Ya",
      "reason": "10⁸ lebih besar dari 10⁶" }
  ],
  "hints": {
    "pahami": ["Angka mana yang tidak dipakai untuk menghitung sampah?", "Jumlah pulau tidak diperlukan.", "Pakai jumlah penduduk dan sampah per orang."],
    "modelkan": ["Total = banyak orang × sampah per orang.", "2,8 × 10⁸ × 7 × 10⁻¹", "Model: p × s"],
    "selesaikan": ["Kalikan 2,8 × 7 dulu.", "Pangkat: 8 + (−1) = 7.", "19,6 × 10⁷ → normalkan."],
    "tafsirkan": ["Satuannya kg per hari.", "Tulis hasil dan satuannya.", "1,96 × 10⁸ kg/hari"],
    "periksa": ["Bandingkan dengan 1 juta = 10⁶.", "Pangkat 8 > 6.", "Jadi lebih dari 1 juta kg."]
  }
}
```

**Aturan stimulus literasi:**
- Teks stimulus ≤ 60 kata, satu gambar/tabel sederhana bila perlu (tanpa dekorasi).
- Data nyata ditulis sebagai perkiraan ("sekitar") dan sumbernya dicatat di field `source` (BPS, NASA, buku IPA SMP, dll.).
- Mulai L3 boleh memuat **satu** informasi pengecoh (`relevant: false`).
- Seimbangkan konteks: setiap modul ≥ 30% soal SAINTIFIK, ≥ 30% SOSBUD, ≥ 20% PERSONAL.

### 3.4 Format AKM lain
```json
{ "type": "multi_select", "prompt": { "text": "Pilih SEMUA pernyataan yang benar:" },
  "options": [ { "key": "a", "text": "3 × 10⁸ lebih besar dari 9 × 10⁷" },
               { "key": "b", "text": "1 × 10⁻⁷ m lebih panjang dari 1 × 10⁻³ m", "error_code": "E-TANDA" },
               { "key": "c", "text": "10⁹ rupiah sama dengan satu miliar rupiah" } ],
  "answer": { "choices": ["a", "c"] } }

{ "type": "matching", "prompt": { "text": "Jodohkan benda dengan perkiraan ukurannya." },
  "left":  [ "Diameter Bumi", "Tebal rambut", "Diameter virus" ],
  "right": [ "1,27 × 10⁷ m", "8 × 10⁻⁵ m", "1 × 10⁻⁷ m" ],
  "answer": { "pairs": [[0, 0], [1, 1], [2, 2]] } }
```
Urutan kolom kanan diacak saat ditampilkan.

## 4. Komposisi Bank Soal per Modul (minimal)

> **Perubahan 23 Nov 2026 (1 level × 10 soal per topik (disetujui pengembang, 23 Nov 2026)):** `BANK[t].levels` hanya `{1: [10 soal]}` (helper `graded()` memberi `tier` 3 mudah / 4 sedang / 3 sulit sesuai urutan). Soal dipilih dari bank lama yang sudah teruji (tanpa mengubah kalimat, angka, pilihan, kunci, dan pembahasannya) lalu diurutkan bertahap; satu pola dan satu model cerita hanya sekali per topik. Kuis topik & Kuis Akhir tidak berubah. `content.test.js` mengunci 10 soal per topik dan urutan tier.
>
> **Kompetensi per topik (23 Nov 2026):** latihan tiap topik hanya melatih kompetensinya sendiri — T1 pangkat 10, nilai tempat, dekomposisi & pergeseran nilai tempat; T2 bilangan sangat besar/kecil, perbandingan, urutan, skala; T3 konversi bentuk biasa ⇄ baku & aturan penulisan (satu-satunya topik dengan soal isian konversi); T4 kali, bagi, tambah, kurang, normalisasi; T5 soal kontekstual PMSTP. Dikunci tes "setiap topik hanya melatih kompetensinya sendiri" di `content.test.js`.
>
> **Berlaku sejak 16 Nov 2026 (`content/bank.js`):** 5 topik (t1–t5) × Level 1–4 berisi 4–5 soal (semua dikerjakan) + kuis topik 5 soal, ditambah `FINAL_QUIZ` 10 soal (2 per topik). Aturan yang diuji `content.test.js`: tidak ada soal kembar (keterampilan + bilangan yang sama) di seluruh bank; soal latihan tidak memakai bilangan contoh terurai di materi; setiap level punya ≥ 2 jenis soal; soal cerita berlabel `literacy`; kunci & pengecoh pilihan ganda numerik diperiksa mesin. Jenis soal baru: `place_value`, `normalize`, `operation` (kali/bagi, `text`/`unit`/`traps` untuk soal cerita & satuan), dan pilihan ganda `focus: 'compare'`. Audit variasi 17 Nov 2026: jumlah soal per level tetap (t1 5/5/5/5, t2 4/5/5/5, t3 4/5/5/5, t4 4/5/5/4, t5 4/5/5/4; Kuis Akhir 10), tetapi soal yang hanya berganti angka/konteks dari soal lain diganti soal berpola baru (menafsirkan, memberi alasan, mencari kesalahan, mengurutkan, menyusun dari nilai tempat, mencari faktor yang hilang, operasi campuran, soal dua langkah). Setiap pilihan ganda konsep memakai `form` (nama pola), `hints` (3 tingkat) dan `explain`; helper `mc(form, text, [[teks, kode?]…], explain, hints, extra)` menandai pilihan tanpa kode kesalahan sebagai jawaban benar. `content.test.js` menolak pola kembar dalam satu topik (L1–L4) maupun dalam satu kuis. Tabel di bawah adalah rancangan awal per modul.

| Modul | L1 | L2 | L3 | L4 | Kuis | Cadangan |
|---|---|---|---|---|---|---|
| M1 Prasyarat | 5 | 5 | 5 | 5 | 5 | 5 |
| M2 Bilangan Besar | 5 | 5 | 5 | 5 | 5 | 5 |
| M3 Bilangan Kecil | 6 | 6 | 6 | 6 | 5 | 6 |
| M4 Nol di Tengah | 5 | 5 | 5 | 5 | 5 | 5 |
| M5 Bentuk Biasa | 5 | 5 | 5 | 5 | 5 | 5 |
| M6 Soal Cerita | 5 | 5 | 5 | 5 | 5 | 5 |
| M7 Kali & Bagi | 5 | 5 | 5 | 5 | 5 | 5 |
| M8 Pemodelan | 6 | 6 | 6 | 6 | 5 | 6 |
| Pre-test A / B (prosedural) | — | — | — | — | 12 / 12 | — |
| Tes literasi A / B | — | — | — | — | 8 / 8 | — |

M3 diberi soal lebih banyak karena merupakan kesulitan utama (IL01).

## 5. Contoh Soal per Level (terverifikasi)

| Modul | Level | Soal | Kunci |
|---|---|---|---|
| M1 | L1 | 10⁵ = … | 100.000 |
| M1 | L2 | 0,0001 = 10^… | 10⁻⁴ |
| M2 | L1 | 3.000 | 3 × 10³ |
| M2 | L2 | 4.500.000 | 4,5 × 10⁶ |
| M2 | L3 | 135.000.000 | 1,35 × 10⁸ |
| M2 | L4 | Rp2.500.000.000 | Rp2,5 × 10⁹ |
| M3 | L1 | 0,0007 | 7 × 10⁻⁴ |
| M3 | L2 | 0,0405 | 4,05 × 10⁻² |
| M3 | L3 | 0,0000075 | 7,5 × 10⁻⁶ |
| M3 | L4 | 0,00000075 kg | 7,5 × 10⁻⁷ kg |
| M4 | L2 | 3.004.000 | 3,004 × 10⁶ |
| M4 | L3 | 70.080.000 | 7,008 × 10⁷ |
| M4 | L3 | 0,000506 | 5,06 × 10⁻⁴ |
| M5 | L1 | 1,2 × 10⁵ | 120.000 |
| M5 | L2 | 2,5 × 10⁸ | 250.000.000 |
| M5 | L3 | 6,02 × 10⁻³ | 0,00602 |
| M5 | L4 | 9,0387 × 10⁻⁹ | 0,0000000090387 |
| M6 | L3 | Kecepatan cahaya 300.000.000 m/s | 3 × 10⁸ m/s |
| M6 | L4 | 150.000.000 km dalam meter | 1,5 × 10¹¹ m |
| M7 | L1 | (2 × 10³) × (3 × 10⁴) | 6 × 10⁷ |
| M7 | L2 | (3 × 10⁸) × (5 × 10²) | 1,5 × 10¹¹ |
| M7 | L3 | (4 × 10⁻⁴) × (3 × 10¹) | 1,2 × 10⁻² |
| M7 | L3 | (1,5 × 10¹¹) ÷ (3 × 10⁸) | 5 × 10² |
| M7 | L4 | (1 × 10⁻³) ÷ (1 × 10⁻⁷) | 1 × 10⁴ |
| M8 | L1 | Dana Rp6.000.000.000 dibagi rata ke 12.000 siswa | Rp5 × 10⁵ per siswa |
| M8 | L2 | Memori 64 GB, satu foto 4 MB; berapa foto? | 1,6 × 10⁴ foto |
| M8 | L3 | Rambut tumbuh 0,0004 m/hari; pertambahan dalam 30 hari? | 1,2 × 10⁻² m |
| M8 | L3 | 280.000.000 penduduk × 0,7 kg sampah/hari (ada info pulau) | 1,96 × 10⁸ kg/hari |
| M8 | L4 | Jarak Bumi–Matahari 150.000.000 km, cahaya 300.000.000 m/s; waktu? (ada info umur Matahari) | 5 × 10² s |

**Setiap soal baru wajib:** (1) dicek dengan fungsi `lib/sci` lewat skrip validasi seed, (2) ditinjau oleh minimal satu orang lain (dosen/guru), (3) memiliki 3 hint (soal pemodelan: 3 hint per langkah), (4) memiliki label literasi (proses, konteks, jenis model) bila berupa soal kontekstual.

## 6. Konteks Soal Cerita yang Dianjurkan

Uang & anggaran (familier — K01), jumlah penduduk Indonesia, jarak antarplanet, ukuran sel/virus/bakteri, massa partikel, kecepatan cahaya/suara, kapasitas penyimpanan data (byte). Hindari konteks yang sensitif atau asing bagi siswa SMP.

## 7. Konten Mediasi RMT (`content/rmt.js`)

Konten Rigorous Mathematical Thinking ditulis **terpisah dari bank soal** — bank soal (`content/bank.js`) tidak boleh diubah untuk keperluan ini (tes sidik isi di `content/rmt.test.js`). Acuan & alasan: [RMT.md](RMT.md).

| Konten | Kunci | Aturan |
|---|---|---|
| Tujuan & alasan penting | `LEVEL_GOALS[topik][level]`, `QUIZ_GOAL`, `FINAL_GOAL` | ≤ 20 kata, diakhiri titik; sesuai karakter level (L1 mengenali · L2 alasan · L3 menghitung · L4 penalaran) dan isi soal level itu |
| Pertanyaan pemandu | `SKILLS[keterampilan].guide`, `TOPIC_RULES[topik].guide` | ≤ 16 kata, berbentuk pertanyaan, tidak memuat jawaban; mengarah ke alat psikologis (nilai tempat, letak koma, tanda pangkat, satuan) |
| Aturan umum (Transendensi) | `SKILLS[keterampilan].rule`, `TOPIC_RULES[topik].rule` | ≤ 28 kata, prinsip/rumus umum tanpa angka soal (hanya 1 dan 10); kebenarannya diuji dengan `lib/sci` |
| Pertanyaan balik | `ERROR_MESSAGES[kode].ask` (`content/messages.js`) | ≤ 16 kata, memuat "?", mengajak memeriksa & menjelaskan alasan; judul/teks pesan lama tidak diubah |
| Fase fungsi kognitif | `ERROR_PHASES[kode]` | `phases` boleh lebih dari satu atau kosong; wajib `evidence` dari cara mesin mendiagnosis |

Contoh baik (pertanyaan pemandu, bilangan kecil): "Di mana angka bukan nol pertamanya? Bilangan ini 10 atau lebih, atau kurang dari 1?" — bukan "Pangkatnya −4."
