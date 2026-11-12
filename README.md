# NoBaku — Aplikasi Belajar Notasi Ilmiah untuk Siswa SMP

> *Sebelumnya bernama kerja "KomaKu"; nama resmi aplikasi kini **NoBaku**.*

NoBaku adalah aplikasi belajar matematika berbasis **web (PWA)** dan **Android** khusus untuk siswa SMP kelas VIII pada materi **Notasi Ilmiah / Bentuk Baku** (bagian dari bab Bilangan Berpangkat). Aplikasi dirancang dengan prinsip **Teori Beban Kognitif (Cognitive Load Theory / CLT)** berdasarkan hasil wawancara siswa: menurunkan *extraneous load*, mengelola *intrinsic load* secara bertahap, dan mendorong *germane load* melalui latihan terarah dan umpan balik langsung.

Aplikasi juga menumbuhkan **literasi matematika** (kerangka PISA + AKM Numerasi): siswa dilatih **memodelkan soal cerita** ke dalam model matematika dan menyelesaikannya dengan siklus 5 langkah **PMSTP** (Pahami → Modelkan → Selesaikan → Tafsirkan → Periksa), baik secara **terbimbing** maupun dengan **Asisten AI** untuk soal yang dibawa siswa sendiri.

| Item | Keterangan |
|---|---|
| Pengembang | Nayla Solahiyah (NIM 2225250045), Kelas 3A |
| Status | **Alpha** — Modul 1–5 dapat dipakai (lihat "Yang sudah ada" di bawah) |
| Platform | PWA yang dipasang langsung dari browser di Android, iPhone/iPad, Windows, macOS — tanpa Play Store/App Store |
| Frontend | JavaScript (React + Vite) |
| Backend | Python (FastAPI) + PostgreSQL |
| AI | Claude API (Anthropic), dipanggil dari backend; jawaban diverifikasi mesin |
| Pengguna | Siswa, Guru, Peneliti/Admin |

---

## Masalah yang Diselesaikan

Temuan utama wawancara siswa S01 (kelas 9A, 4 November 2026):

1. **Pangkat negatif** adalah bagian tersulit (IL01, IL04, K03).
2. Siswa **bingung menaruh koma** dan sering salah hitung pergeseran (IL02, IL05).
3. **Angka nol yang banyak / nol di tengah** membingungkan (IL04, DS02).
4. Materi hanya **dijelaskan lisan dalam satu pertemuan**, tanpa gambar atau tabel (EL02, EL04).
5. Siswa **bergantung pada guru** untuk tahu jawaban benar/salah (GL02).
6. Siswa meminta **penjelasan lebih simpel, petunjuk langkah, visualisasi geser koma, contoh, dan latihan bertahap** (DS01–DS03).
7. Siswa **bingung memilih informasi dan menyamakan satuan pada soal cerita** (EL05) → dasar fitur literasi & pemodelan.

Lihat analisis lengkapnya di [docs/RESEARCH-INSIGHTS.md](docs/RESEARCH-INSIGHTS.md).

---

## Peta Dokumen

Baca dokumen dengan urutan berikut:

| # | Dokumen | Isi | Untuk siapa |
|---|---|---|---|
| 1 | [docs/RESEARCH-INSIGHTS.md](docs/RESEARCH-INSIGHTS.md) | Sintesis wawancara → implikasi desain | Semua |
| 2 | [docs/PRD.md](docs/PRD.md) | Kebutuhan produk (FR/NFR, user story, metrik) | Semua |
| 3 | [docs/LEARNING-DESIGN.md](docs/LEARNING-DESIGN.md) | Desain pembelajaran & strategi CLT per modul (M1–M8) | Pengembang konten, dosen |
| 4 | [docs/MATH-LITERACY.md](docs/MATH-LITERACY.md) | Kerangka literasi (PISA + AKM), siklus pemodelan PMSTP, jenis model, rubrik | Pengembang konten, dosen |
| 5 | [docs/AI-TUTOR.md](docs/AI-TUTOR.md) | Asisten AI hybrid: alur, ModelSpec, pengaman, biaya, evaluasi | Pengembang, dosen |
| 6 | [docs/FEATURES.md](docs/FEATURES.md) | Spesifikasi detail setiap fitur | Pengembang |
| 7 | [docs/UI-UX-GUIDELINES.md](docs/UI-UX-GUIDELINES.md) | Design system & wireframe | Desainer, frontend |
| 8 | [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md) | Pedoman menulis materi & format soal | Pengembang konten |
| 9 | [docs/TECH-STACK.md](docs/TECH-STACK.md) | Pilihan teknologi & alasannya | Pengembang |
| 10 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arsitektur sistem & struktur folder | Pengembang |
| 11 | [docs/DATABASE.md](docs/DATABASE.md) | Skema basis data & ERD | Backend |
| 12 | [docs/API-SPEC.md](docs/API-SPEC.md) | Spesifikasi REST API | Frontend & backend |
| 13 | [docs/TESTING-PLAN.md](docs/TESTING-PLAN.md) | Strategi pengujian, evaluasi beban kognitif, literasi & AI | Pengembang, peneliti |
| 14 | [docs/ROADMAP.md](docs/ROADMAP.md) | Jadwal & milestone pengembangan | Semua |
| 15 | [docs/PRIVACY-ETHICS.md](docs/PRIVACY-ETHICS.md) | Privasi data anak, layanan AI & etika penelitian | Semua |
| 16 | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting & cara siswa memasang aplikasi tanpa toko aplikasi | Pengembang, guru |
| — | [CLAUDE.md](CLAUDE.md) | Panduan kerja untuk Claude Code | AI coding assistant |

---

## Yang Sudah Ada (Alpha)

| Fitur | Keterangan |
|---|---|
| Modul 1–5 | Prasyarat pangkat 10, bilangan besar, bilangan kecil (pangkat negatif), nol di tengah, kembali ke bentuk biasa — 1 konsep per layar |
| Visualisasi Geser Koma | Animasi lompatan koma + penghitung + tanda pangkat, mode manual, nomor posisi untuk bilangan kecil |
| Contoh terurai & setengah jadi | Langkah dibuka satu per satu; contoh setengah jadi diselesaikan siswa |
| Langkah terpandu | 5 sub-langkah interaktif (ketuk angka → ketuk celah koma → lompatan → arah → jawaban) |
| Latihan L1–L4 | 5 soal acak/level, maks 3 percobaan, petunjuk 3 tingkat, diagnosis E-KOMA/E-TANDA/E-PANGKAT/E-NOL/E-FORMAT |
| Kuis + skala Paas | 5 soal tanpa petunjuk, pembahasan di akhir, kuesioner beban kognitif |
| Progres | Tersimpan di perangkat; rekap kesalahan tersering |
| Pasang aplikasi | Halaman panduan per platform + tombol pasang; berjalan offline |
| Backend | API pengecekan notasi ilmiah (`/api/v1/sci/*`) — logika identik dengan frontend |

Belum ada: login, kelas & dashboard guru, Modul 6–8 (termasuk pemodelan), Asisten AI, APK. Lihat [docs/ROADMAP.md](docs/ROADMAP.md).

## Struktur Repositori

```
2225250045_Nayla_Solahiyah/
├── README.md, CLAUDE.md
├── docs/                  # Dokumen perencanaan
├── frontend/              # JavaScript: React + Vite, PWA (src/pages, features, components, lib/sci, content, styles)
├── backend/               # Python: FastAPI (app/sci = logika notasi ilmiah), tests/
└── shared/
    └── test-vectors.json  # Kasus uji bersama — logika JS & Python wajib lulus semuanya
```

---

## Menjalankan Proyek

**Prasyarat:** [Node.js 20 LTS](https://nodejs.org) dan [Python 3.12](https://www.python.org/downloads/) (centang *Add python.exe to PATH* saat memasang).

```bash
# Frontend (aplikasi yang dipakai siswa)
cd frontend
npm install
npm run dev          # buka http://localhost:5173
npm run test         # 178 tes: logika notasi ilmiah + validasi seluruh bank soal
npm run build        # hasil siap-hosting di frontend/dist/

# Backend (API; belum dibutuhkan oleh Alpha)
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows  (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
pytest                           # 82 tes
uvicorn app.main:app --reload    # http://localhost:8000/docs
```

Untuk membagikan ke siswa (hosting gratis + cara memasang di tiap perangkat), lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Mencoba di HP saat pengembangan:** jalankan `npm run dev -- --host`, lalu buka alamat IP komputer (mis. `http://192.168.1.5:5173`) di HP yang terhubung ke Wi-Fi yang sama. Fitur pasang/offline baru aktif setelah dihosting dengan HTTPS.

**Menyesuaikan tampilan:** semua warna, sudut, dan ukuran ada di [frontend/src/styles/tokens.css](frontend/src/styles/tokens.css).

---

## Lisensi & Catatan Akademik

Proyek ini dikembangkan untuk keperluan tugas/penelitian akademik. Data narasumber disamarkan (kode S01). Lihat [docs/PRIVACY-ETHICS.md](docs/PRIVACY-ETHICS.md).
