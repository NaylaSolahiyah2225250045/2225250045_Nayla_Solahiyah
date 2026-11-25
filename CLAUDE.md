# CLAUDE.md

Panduan untuk Claude Code (dan pengembang lain) saat bekerja di repositori ini. Baca file ini sebelum menulis kode apa pun.

## Ringkasan Proyek

**NoBaku** adalah aplikasi belajar **Notasi Ilmiah / Bentuk Baku** khusus untuk siswa **SMP kelas VIII** (kelas tetap, tidak dipilih siswa — seluruh materi & fitur dirancang untuk kelas VIII). Berjalan sebagai **PWA (web)** dan **Android (Capacitor)**, dengan backend **FastAPI** untuk login, kelas, progres, dan dashboard guru. Seluruh desain didasarkan pada **Teori Beban Kognitif (CLT)** dan hasil wawancara siswa. Aplikasi juga menumbuhkan **literasi matematika** (kerangka PISA + AKM Numerasi) melalui **pemodelan soal cerita** dengan siklus PMSTP, secara terbimbing maupun dengan **Asisten AI** (Groq API, lewat backend) yang tidak menghitung dan tidak memberi jawaban akhir.

Dokumen sumber kebenaran (baca sesuai kebutuhan):
- Kebutuhan produk: [docs/PRD.md](docs/PRD.md) (kode FR-xx / NFR-xx)
- Desain pembelajaran: [docs/LEARNING-DESIGN.md](docs/LEARNING-DESIGN.md)
- Literasi & pemodelan: [docs/MATH-LITERACY.md](docs/MATH-LITERACY.md)
- Asisten AI: [docs/AI-TUTOR.md](docs/AI-TUTOR.md)
- Spesifikasi fitur: [docs/FEATURES.md](docs/FEATURES.md)
- UI/UX: [docs/UI-UX-GUIDELINES.md](docs/UI-UX-GUIDELINES.md)
- Arsitektur: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Database: [docs/DATABASE.md](docs/DATABASE.md)
- API: [docs/API-SPEC.md](docs/API-SPEC.md)
- Konten & format soal: [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md)
- Rigorous Mathematical Thinking (acuan mediasi): [docs/RMT.md](docs/RMT.md)
- Pengujian: [docs/TESTING-PLAN.md](docs/TESTING-PLAN.md)

Jika kode dan dokumen bertentangan, **tanyakan dulu** ke pengguna; jangan diam-diam menyimpang dari dokumen. Jika keputusan berubah, perbarui dokumen terkait di commit yang sama.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | **JavaScript** (ES2022, JSX), React 18, Vite 5, React Router 6 (HashRouter), vite-plugin-pwa; CSS biasa dengan design token (`src/styles/tokens.css`) |
| Distribusi | PWA yang dipasang langsung dari browser (Android, iOS/iPadOS, Windows, macOS) — tanpa Play Store/App Store; APK Android via Capacitor (menyusul) |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, JWT (python-jose), passlib[bcrypt] |
| AI (Asisten Belajar) | **Groq API** (kompatibel OpenAI) lewat `httpx`, model dari `GROQ_MODEL` (default `openai/gpt-oss-20b`), hanya dipanggil dari backend; kunci `GROQ_API_KEY` hanya di `backend/.env` (dimuat `python-dotenv`) |
| Database | PostgreSQL 16 (produksi), SQLite (pengembangan lokal) |
| Testing | Vitest (FE), pytest + FastAPI TestClient (BE); E2E Playwright menyusul |
| Lint/format | Belum dipasang di Alpha — rencana: ESLint + Prettier (FE), Ruff + Black (BE) |

**Status: Alpha.** Yang sudah ada: **lima topik materi** (disusun 16 Nov 2026 — `content/modules.js` t1–t5 & buku `content/book.js` Bab 1–5: Pangkat Sepuluh & Nilai Tempat · Bilangan Besar & Kecil · Mengubah Bentuk Biasa & Baku · Operasi Hitung · Penerapan; layar Modul Alpha 1–5 dipakai ulang di Topik 1–3, progres lama dipindah otomatis lewat `MIGRATE` + `migrateProgress`), **Jalur Latihan** 1 level × 10 soal per topik (disetujui pengembang, 23 Nov 2026): satu latihan berisi 10 soal berurutan mudah → sedang → sulit (`tier`), lulus ≥ 6 benar + **Level 5 · Kuis Akhir** 10 soal (`FINAL_QUIZ`, #/kuis-akhir), jenis soal nilai tempat / menormalkan / kali-bagi / membandingkan / soal cerita (`lib/sci/ops.js`), langkah nol di tengah & bentuk biasa (`lib/sci/steps.js`, `BackVisualizer`), Visualisasi Geser Koma, contoh terurai/faded, langkah terpandu, latihan L1–L4 dengan petunjuk & diagnosis, kuis + skala Paas, progres di perangkat (localStorage), alur Sambutan → Masuk/Daftar (akun lokal di perangkat) → Dashboard 7 menu (Beranda, Materi buku digital, Latihan jalur, Catatan Pintar, Riwayat Latihan, Kalender Belajar, Profil Siswa — Tahap 1, FEATURES F-00), maskot hidup berpose + pengaturan Animasi, **Lab Koma** (eksplorasi geser koma, `#/lab`), halaman Pasang, API pengecekan notasi ilmiah. Peran **Guru** (17 Nov 2026): Daftar memilih jenis akun Siswa/Guru (guru: nama lengkap, email/username, sandi ≥ 8, sekolah/instansi), Masuk mengenali peran otomatis dan mengarahkan ke Dashboard Siswa (`/beranda`) atau **Dashboard Guru** (`/guru`: Beranda Guru, Kelas Saya, Daftar Siswa, Progres Belajar, Hasil Latihan & Kuis, Profil Guru); guru membuat kelas VIII-A–VIII-E dengan kode 6 karakter, siswa bergabung di Profil → Kelas Saya; backend FastAPI + SQLAlchemy + Alembic (`users`, `classes`, `class_members`, `learner_snapshots`), JWT, verifikasi guru opsional. Asisten Belajar Tahap 1 (Groq, 21 Nov 2026): chat terbimbing di bawah soal latihan, mati secara bawaan. Yang belum: refresh token, "Bawa soalmu"/mode guru AI, APK. Library yang direncanakan (Zustand, TanStack Query, KaTeX, Framer Motion, Tailwind) **sengaja belum dipakai** agar Alpha ringan; tambahkan hanya saat fitur yang membutuhkannya dibangun.

## Struktur Repositori

```
frontend/
  src/
    main.jsx, App.jsx  # entri, router (HashRouter), registrasi service worker
    pages/teacher/  # Dashboard Guru (#/guru …): TeacherHomePage, TeacherClassesPage, TeacherStudentsPage, TeacherStudentPage, TeacherProgressPage, TeacherResultsPage, TeacherProfilePage
    features/teacher/  # TeacherNav (sidebar & navigasi bawah guru), data.js (useTeacherData, topicProgress), ui.jsx (StatTile, BarList, Meter, ClassFilter)
    pages/          # WelcomePage (#/), AuthPage (#/masuk); 7 menu: HomePage=Beranda (#/beranda), BookPage=Materi (#/materi), PathPage=Latihan (#/latihan) + SessionPage (#/latihan/:titik), NotesPage (#/catatan), HistoryPage (#/riwayat) + RetryPage, CalendarPage (#/kalender), ProfilePage (#/profil); pendukung: LabPage (#/lab), InstallPage, ModulePage/PracticePage/QuizPage (modul interaktif)
    features/       # lessons (LessonItem, Visual), practice (QuestionCard), guided (GuidedSolver); nanti: modeling, ai-assistant, teacher
    components/     # AppBar, BottomNav, NumberStrip, CommaVisualizer, AnswerInputs, Feedback, HintPanel, PaasScale, Sci, Icons
    lib/sci/        # LOGIKA NOTASI ILMIAH (murni, tanpa React) + tes: sci, diagnose, questions, format, worked, lab (Lab Koma)
    lib/            # api.js (alamat server sekolah & klien API), classroom.js (kelas: server atau mode lokal), snapshot.js (ringkasan belajar untuk guru), progress.js, account.js (akun siswa/guru + avatar), settings.js (Animasi), rewards.js (XP & 11 lencana), activity.js (log Kalender), history.js (Riwayat), path.js (jalur Latihan), learner.js (ringkasan + posisi buku), install.js, shuffle.js
    content/        # modules.js (materi), bank.js (soal), messages.js (pesan umpan balik), lab.js (contoh & pesan Lab Koma) + tes validasi konten
    styles/         # tokens.css (SEMUA warna/ukuran), app.css
  public/icons/     # ikon PWA & apple-touch-icon
backend/
  app/
    main.py         # /api/v1/health, /sci/*, + router auth, classes, reports (akun, kelas, sinkronisasi, laporan guru)
    db.py, models.py, schemas.py, admin.py  # SQLAlchemy, Pydantic, perintah verifikasi guru (python -m app.admin)
    core/           # config, security, deps
    models/         # SQLAlchemy models
    schemas/        # Pydantic schemas
    routers/        # auth, classes, modules, attempts, progress, reports, surveys
    services/       # business logic (grading, diagnosis, reports)
    sci/            # logika notasi ilmiah versi Python (cermin lib/sci): konversi, operasi, satuan, ekspresi, cek langkah PMSTP
    ai/             # Asisten Belajar: groq_client (httpx), prompts (RMT/CLT/literasi), guardrails (sensor data pribadi, saringan angka & kunci), tutor (alur + batas harian di memori)
    seed.py
  alembic/
  tests/
shared/
  test-vectors.json # kasus uji konversi — WAJIB dipakai tes FE & BE
docs/
```

## Perintah

```bash
# Frontend (di folder frontend/) — Node.js 20 LTS
npm install
npm run dev          # server dev http://localhost:5173
npm run build        # build produksi ke dist/ (PWA + service worker)
npm run preview      # sajikan dist/ di http://localhost:4173
npm run test         # Vitest (logika sci + validasi seluruh bank soal)

# Backend (di folder backend/) — Python 3.12
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest                     # tidak memanggil API sungguhan (klien Groq tiruan / httpx.MockTransport)
pytest -m ai_eval          # evaluasi AI dengan API sungguhan — BERBIAYA, minta izin pengguna dulu
ruff check . && black --check .
alembic revision --autogenerate -m "pesan"
alembic upgrade head
python -m app.seed
```

## Aturan Penting

### 1. Logika matematika
- **Jangan pernah memakai floating point** (`number` JS / `float` Python) untuk konversi atau pengecekan jawaban. Pakai representasi string digit + eksponen integer (`{sign, digits, exp}`, BigInt untuk operasi) di JS dan string digit/int Python di backend.
- Bentuk baku: `a × 10^n` dengan `1 ≤ |a| < 10`, `n` bilangan bulat.
- Format angka Indonesia: **koma = desimal** (`3,5`), **titik = pemisah ribuan** (`4.500.000`). Parser input harus menerima `3,5` dan `3.5` sebagai desimal hanya jika tidak ambigu (lihat [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md)).
- Logika di `frontend/src/lib/sci/` dan `backend/app/sci/` harus **memberi hasil identik** untuk semua kasus di `shared/test-vectors.json`. Tambah kasus baru ke file itu, bukan hanya ke satu sisi.
- Diagnosis kesalahan memakai kode tetap: `E-KOMA`, `E-TANDA`, `E-PANGKAT`, `E-NOL`, `E-FORMAT`, `E-SATUAN`, `E-OPERASI`, `E-NORMAL`, `E-MODEL`, `E-INFO`, `E-LAIN` (definisi di [docs/FEATURES.md](docs/FEATURES.md#f-07-umpan-balik-langsung--diagnosis-kesalahan)).

### 2. Prinsip beban kognitif (WAJIB untuk setiap layar belajar)
- **Satu konsep per layar** (segmenting). Jangan menumpuk teks panjang; maks ±40 kata penjelasan per layar.
- Urutan: **contoh terurai → contoh setengah-terurai (faded) → latihan mandiri**.
- **Signaling konsisten**: koma = warna aksen koma, angka bukan nol pertama = warna aksen digit, angka nol = abu-abu. Gunakan token warna dari design system, jangan warna ad hoc.
- **Tidak ada dekorasi yang mengganggu**: tanpa animasi latar, maskot bergerak, musik, atau iklan di layar belajar (materi, latihan, kuis). Animasi hanya untuk menjelaskan (mis. pergeseran koma). Maskot hidup (`MascotLive`) hanya di layar non-soal — Sambutan, Masuk/Daftar, Dashboard, sidebar, Akun, layar selesai — dan selalu tunduk pada pengaturan Animasi (disetujui pengembang, 11 Nov 2026). Pengecualian Lab Koma (disetujui pengembang, 11 Nov 2026): maskot kecil (≤ 66px) di sudut kartu umpan balik untuk petunjuk & apresiasi, plus ≤ 5 bintang hias berkilau di tepi kepala halaman/panggung — **tidak pernah** di jalur angka, koma, atau persamaan.
- **Musik latar global (disetujui pengembang, 21 Nov 2026 — menggantikan aturan "musik hanya di Sambutan" dan larangan musik di layar belajar):** lagu instrumental ceria "Langit Ceria" diputar di SELURUH halaman (Sambutan, Masuk/Daftar, Dashboard Siswa, materi, latihan, kuis, Dashboard Guru) oleh satu pemutar `components/GlobalMusic.jsx` di App, sehingga tidak mengulang saat pindah halaman. Langsung bermelodi (tanpa intro hening); mencoba autoplay, bila diblokir browser mulai pada interaksi pertama; memudar saat tab disembunyikan; musik dikecilkan sebentar saat efek suara berbunyi. Tombol ♪ `components/AudioControl.jsx` (Musik ON/OFF, volume 0–100, Efek suara ON/OFF; panel lewat portal) ada di bilah atas HP, sidebar laptop, AppBar layar soal, kepala modul, Sambutan, dan Masuk/Daftar. Preferensi suara disimpan per akun (`prefs` di data akun + `users.preferences` di server, lewat `AudioPrefsSync`) dan diterapkan lagi saat masuk. Ketentuan lama yang tetap berlaku: Audio & langit berhias (17 Nov 2026): **efek suara** singkat untuk klik tombol, pilih menu, jawaban benar/salah (latihan & contoh setengah jadi — **tidak** di kuis, karena kuis dinilai di akhir), selesai level, selesai kuis, lencana baru. Semua bunyi disintesis Web Audio di `lib/audio.js` (tanpa berkas audio pihak lain), tidak bertumpuk, volume rendah, mengikuti pengaturan `music`/`sfx` di `nobaku.settings.v1` (Profil → Pengaturan). Bintang berkelap-kelip, bintang jatuh sesekali, dan kilauan (`components/SkyFx.jsx`, `styles/sky.css`) hanya di Sambutan, Masuk/Daftar, dan menu Dashboard (lewat `DashBackdrop`) — **tidak** di buku Materi, Lab Koma, atau layar soal; gerak digating `[data-motion='on']`.
- **Dekorasi dikembalikan & diperluas (disetujui pengembang, 21 Nov 2026 — menggantikan aturan "latar berhias tidak dipasang di Materi & Lab Koma / layar soal"):** `DashBackdrop` (bintang, kilauan, simbol matematika, bentuk geometri, **awan pastel** `deco--cloud`, gumpalan warna, `SkyFx`) kini juga di Materi & Lab Koma; layar belajar terfokus (`FocusLayout` di App: sesi latihan, ulang soal, modul interaktif, kuis topik, Kuis Akhir) memakai `DashBackdrop variant="study"` — hiasan yang sama di tepi layar tetapi tanpa bintang jatuh/kilauan besar. Dashboard Guru memakai taburan `Decor` di kepala halaman (set `guru`, `kelas`, `siswa`, `progres`, `hasil`) + maskot kecil, dan maskot + taburan di sidebar seperti siswa. Aturan tetap: hiasan selalu di belakang konten (tidak pernah menutupi teks, tombol, input — diuji dengan elementFromPoint), di tepi, bukan di area soal/persamaan; gerak hanya bila `[data-motion='on']`; di HP hanya hiasan bertanda `hp`.
- **Rigorous Mathematical Thinking (RMT, 21 Nov 2026):** acuan utama mediasi adalah dokumen RMT dari dosen (Kinard & Kozulin) — [docs/RMT.md](docs/RMT.md). Pertahankan istilahnya (Fase Input/Elaborasi/Output; Mathematically Specific Psychological Tools; MLE: Intensionalitas & Resiprositas, Transendensi, Pemberian Makna). **PMSTP adalah siklus NoBaku, bukan tahapan resmi RMT.** Konten RMT hanya di `content/rmt.js` (tujuan level, pertanyaan pemandu, aturan umum, `ERROR_PHASES`) dan kolom `ask` di `content/messages.js`, dibaca lewat `lib/rmt.js` — **bank soal tidak boleh diubah** untuk RMT (tes sidik isi di `content/rmt.test.js`; perubahan bank butuh persetujuan pengembang). Pemetaan kesalahan → fase boleh lebih dari satu fase atau kosong bila bukti belum cukup; label fase hanya untuk guru. Tampilan RMT ringkas: tanpa layar/tombol baru, tujuan berupa baris terlipat, aturan umum tampil setelah menjawab.
- **Umpan balik langsung & spesifik** setelah setiap jawaban; hindari hanya "Salah".
- **Petunjuk bertingkat** (hint 1 → 2 → 3); hint ke-3 = langkah hampir lengkap.
- Teks dan gambar yang saling terkait harus **berdekatan** (hindari split-attention).

### 2a. Literasi & pemodelan
- Setiap soal kontekstual wajib berlabel `literacy` (proses RUMUS/TERAP/TAFSIR/NALAR, konteks PERSONAL/SOSBUD/SAINTIFIK, `model_type`).
- Soal pemodelan memakai skema `model_spec` yang **sama** dengan keluaran Asisten AI; pemeriksa langkah PMSTP (`checkModelingStep`) dipakai untuk keduanya.
- Evaluator ekspresi adalah parser buatan sendiri — **dilarang** memakai `eval`/`exec`/`new Function`.
- Layar pemodelan: satu panel langkah terbuka, kartu besaran dekat teks soal.

### 2b. Asisten AI
- **Penyedia AI aplikasi = Groq API** (disetujui pengembang, 21 Nov 2026; menggantikan rencana Claude API). Claude tetap dipakai sebagai *coding assistant* pengembang, bukan di dalam aplikasi.
- **Asisten Belajar (Tahap 1, 21 Nov 2026):** chat **terbimbing** di bawah soal latihan (`features/assistant/AssistantPanel.jsx`, tidak di kuis), hanya di mode server untuk akun siswa, **mati secara bawaan** (`AI_ENABLED=false`). Endpoint `GET /api/v1/ai/status`, `POST /api/v1/ai/chat`. Batas pesan per siswa per hari di **memori server** (`AI_DAILY_LIMIT`, kembali ke nol saat server dimulai ulang). Persetujuan orang tua untuk uji coba ditangani **di luar aplikasi**. Tidak memengaruhi penilaian, XP, progres, atau jumlah petunjuk; percakapan tidak disimpan di server.
- **RMT & visual (23 Nov 2026):** prompt menerapkan Input–Elaborasi–Output, Representasi–Manipulasi–Validasi, MLE, alat psikologis matematika, PMSTP, dan CLT. Visual matematika (tabel nilai tempat, kelompok nol, garis bilangan, geser koma, langkah ubah bentuk, diagram kali/bagi & tambah/kurang, tabel PMSTP) **dibuat & dihitung aplikasi** (`lib/assistantVisuals.js`, contoh serupa di `content/visuals.js`), bukan AI; AI hanya memilih id lewat `[[visual:id]]` yang diperiksa `guardrails.extract_visual`. Visual tidak boleh memuat kunci jawaban (diuji untuk seluruh bank) — lihat docs/AI-TUTOR.md §2b.
- **AI tidak pernah menghitung bilangan soal & tidak memberi jawaban akhir.** `app/ai/guardrails.py` menolak balasan yang memuat kunci jawaban (bentuk apa pun dari `key_texts`, termasuk ekspresi di dalam pilihan benar), menghitung bilangan soal, memuat persamaan salah, atau angka baru yang tidak terverifikasi. Sejak 25 Nov 2026 AI **boleh membuat contoh kecil dengan bilangan lain** (mis. "67.000 = 6,7 × 10⁴", tabel 10ⁿ) karena setiap persamaan dihitung ulang `app/ai/mathcheck.py` (pecahan eksak); balasan yang ditolak ditulis ulang sekali, lalu bila tetap gagal diganti cadangan berisi aturan umum + pertanyaan pemandu RMT (docs/AI-TUTOR.md §2c). Sejak 25 Nov 2026 asisten mengikuti alur percakapan: `app/ai/dialog.py` mengenali jenis pertanyaan siswa dan menaruh catatan giliran setelah riwayat; balasan yang mengulang ditulis ulang; cadangan tanpa templat (docs/AI-TUTOR.md §2d). Konteks juga membawa topik + "maksud soal" bahasa sehari-hari (`content/assistantTasks.js`, tanpa kunci), sehingga "maksud soal ini apa?" dijawab dengan menjelaskan soalnya dan "gak jelas" memicu penjelasan ulang hal yang sama dengan cara lain; cadangan mengikuti hal yang sedang dibahas (§2e). Perbaikan menyeluruh 26 Nov 2026 (§2f, prioritas mutu bimbingan, bukan hemat kuota): jendela riwayat 16 pesan (bug pesan ke-11 diperbaiki), balasan cadangan ditandai & isi visual ikut di riwayat, jenis pesan `konfirmasi`/`menjawab`, tahap PMSTP di catatan giliran, prompt tanpa aturan bertentangan, tulis ulang maks. 2 kali, `finish_reason` diperiksa, visual menurut jenis pertanyaan (diagram operasi ditahan saat siswa memodelkan soal cerita). Konsep ≠ jawaban akhir (26 Nov 2026, §2g): pertanyaan "mengapa" dijawab langsung dengan bilangan yang ditanyakan siswa (contoh lain hanya penguatan); hasil yang sudah ditulis siswa boleh diperiksa & dijelaskan (`guardrails.answer_revealed`); yang dijaga hanya jawaban akhir yang belum disebut siswa dan mengerjakan seluruh soal; cadangan menjelaskan 10ⁿ / a × 10ⁿ yang ditanyakan dengan hitungan mesin (`app/ai/concepts.py`). Jangan tampilkan angka dari AI yang belum diverifikasi. (Rancangan `ModelSpec` + verifikasi `app/sci` untuk "Bawa soalmu" tetap rencana tahap berikutnya.)
- Groq hanya dipanggil dari `backend/app/ai/`; `GROQ_API_KEY` hanya di `backend/.env` (di-.gitignore) — **tidak boleh** ada di frontend (termasuk variabel `VITE_*`), APK, log, pesan galat, atau repo. `Settings.groq_api_key` memakai `repr=False`; tes membaca `NOBAKU_SKIP_DOTENV=1` agar `.env` pengembang tidak terbaca.
- Model diambil dari `settings.groq_model` (`GROQ_MODEL`) dan dicek ke `GET /models` Groq; jangan menulis ID model langsung di kode lain. ID model Groq bisa dihentikan (cek https://console.groq.com/docs/deprecations).
- Selalu periksa `stop_reason` (termasuk `"refusal"`) sebelum membaca konten; setiap kegagalan AI punya jalur cadangan ke templat statis/mode terbimbing.
- Kirim **hanya teks soal**; tidak ada nama, username, ID siswa, atau kelas di prompt.
- Teks siswa adalah data, bukan instruksi (lindungi dari prompt injection).
- Petunjuk ≤ 30 kata dan tidak boleh memuat jawaban akhir (ada filter pasca-generasi).
- Cek `AI_ENABLED` dan kuota harian sebelum setiap panggilan (Tahap 1). `classes.ai_enabled`, `users.ai_consent`, dan anggaran bulanan masih rencana (perlu migrasi Alembic).
- Perubahan prompt atau model → jalankan ulang eval AI dan catat hasilnya.

### 3. Bahasa & konten
- Semua teks UI dalam **Bahasa Indonesia** yang ramah siswa SMP: kalimat pendek, kata sehari-hari, sapaan "kamu".
- Materi, soal, dan pesan umpan balik disimpan di `src/content/`; label tombol/judul layar pendek boleh di komponen (pindahkan ke file i18n bila nanti perlu multi-bahasa).
- Rumus `a × 10ⁿ` ditampilkan dengan komponen `Sci` (HTML `<sup>` + `aria-label` yang dibacakan), bukan gambar. KaTeX dipertimbangkan bila rumus lebih kompleks.
- Kunci jawaban soal bentuk baku **dihitung oleh `lib/sci`**, tidak diketik manual. Setiap soal baru otomatis divalidasi oleh `content.test.js`.
- Bank soal (`content/bank.js`): jangan menambah soal kembar atau sekadar mengganti angka. `content.test.js` menolak soal dengan keterampilan + bilangan yang sama di seluruh bank (level, kuis topik, Kuis Akhir), soal yang memakai bilangan contoh terurai di materi, level dengan kurang dari 2 jenis soal, dan soal cerita tanpa label `literacy`. Sejak audit variasi 17 Nov 2026 tes juga menolak **pola** yang berulang: setiap pola (keterampilan + bentuk pertanyaan + cara penyelesaian, fungsi `pattern` di tes) hanya boleh muncul sekali dalam latihan sebuah topik dan sekali di setiap kuis; pilihan ganda konsep wajib punya `form` unik, 3 `hints`, dan `explain`; kalimat soal (angka diabaikan) dan susunan pilihan tidak boleh dipakai dua kali; letak jawaban benar harus bervariasi. Struktur (1 level × 10 soal per topik (disetujui pengembang, 23 Nov 2026)): `BANK[t].levels[1]` = 10 soal per topik (total 50), dikerjakan **berurutan** (tidak diacak) dengan `tier`: soal 1–3 `mudah` (mengenali), 4–7 `sedang` (alasan, hubungan, menghitung, kesalahan sederhana), 8–10 `sulit` (penalaran bertahap, gabungan konsep, konteks/PMSTP). `PER_SESSION = 10`, `PASS_COUNT = 6`, `isPassed(benar, total)` = 60% (juga menilai sesi Riwayat lama). Kuis topik (5 soal) & Kuis Akhir (10 soal) tidak berubah. Jumlah soal dikunci tes (jangan dipangkas); sidik isi bank di `content/rmt.test.js`. Titik jalur `t*-latihan`; titik lama `t*-l1…l4` dialihkan; topik selesai bila `practiceDone` (progres), lulus `t*-latihan`, lulus Level 4 lama, atau kuis topik dikerjakan.

### 4. Keamanan & privasi (pengguna di bawah umur)
- Data siswa minimum: nama tampilan, username, kelas (selalu `VIII`, konstanta `KELAS` di `lib/account.js`; tidak ada pilihan kelas di Daftar maupun Profil). **Jangan** minta email/telepon/alamat siswa.
- Password di-hash (bcrypt). Jangan log password, token, atau data pribadi.
- Endpoint guru hanya boleh membaca data siswa **di kelasnya sendiri**. Setiap query laporan wajib difilter `class_id` milik guru.
- Ekspor data penelitian harus teranonimkan (kode siswa, bukan nama).
- Rahasia hanya di `.env` (jangan di-commit).

### 5. Gaya kode
- JavaScript: modul ES, komponen fungsional `.jsx`; nama komponen & file komponen `PascalCase`, hook `useXxx`; dokumentasikan bentuk data dengan JSDoc (`@typedef`) pada logika di `lib/`.
- Tampilan mengikuti mockup NoBaku (lihat [docs/UI-UX-GUIDELINES.md](docs/UI-UX-GUIDELINES.md#tema-nobaku-mockup-uiux)). Warna/ukuran hanya lewat token di `src/styles/tokens.css`; gaya tema di `src/styles/theme.css` (dimuat setelah `app.css`). Pengecualian: ilustrasi SVG (maskot `Mascot.jsx`, `BookCover.jsx`) boleh memakai warna tetap.
- Maskot kapibara: hidup (animasi, bisa dinonaktifkan) di sambutan, masuk/daftar, dashboard, sidebar, akun, layar selesai; di layar materi tampil kecil (52px, kepala saja) di pojok kanan atas kartu pada layar < 1240px, dan besar di sisi kanan pada ≥1240px. **Tidak** pernah di area soal, input jawaban, atau umpan balik (disetujui pengembang, 11 Nov 2026).
- Kunci penyimpanan progres tetap `komaku.progress.v1` (nama internal lama) agar progres siswa tidak hilang; jangan diganti tanpa migrasi data.
- Kunci lain: `nobaku.accounts.v1` & `nobaku.session.v1` (akun lokal; kata sandi hanya sebagai hash), `nobaku.settings.v1` (Animasi, Musik, volume, Efek suara — juga disalin ke akun sebagai `prefs`), `nobaku.badges.seen.v1` (lencana yang sudah diumumkan, agar bunyi lencana tidak berulang), `nobaku.activity.v1` (Kalender — hanya kegiatan belajar sungguhan, jangan catat sekadar membuka Dashboard), `nobaku.history.v1` (Riwayat), `nobaku.book.v1` (posisi buku), `nobaku.server.v1` (alamat server sekolah; kosong = mode lokal), `nobaku.classroom.v1` (kelas & ringkasan siswa di mode lokal).
- Panduan awal (onboarding, 17 Nov 2026): tur 7 tahap berpemandu kapibara (`components/OnboardingTour.jsx`, teks di `content/onboarding.js`, gaya `styles/tour.css`) muncul otomatis di atas Dashboard bagi akun yang baru mendaftar. Status per akun disimpan di data akun `nobaku.accounts.v1` (`tourPending` → `false` + `tourDoneAt` lewat `completeTour()` saat selesai/dilewati/Esc); akun lama tanpa tanda tidak mendapat panduan otomatis. Bisa dibuka lagi dari Profil → Pengaturan → "Buka panduan" (`openTour()`, tidak disimpan). Menu yang dijelaskan disorot lewat `data-tour` di SideNav/BottomNav + `html[data-tour-focus]`; navigasi tidak bisa diklik selama panduan. Ini layar non-soal, jadi maskot hidup diperbolehkan.
- Panduan guru (21 Nov 2026): `OnboardingTour` dipakai ulang dengan `TEACHER_TOUR_STEPS` (content/onboarding.js: sambutan, Beranda, Kelas, Siswa, Progres, Hasil, penutup), tombol Kembali/Selanjutnya/Lewati/Selesai, sorotan menu guru lewat `data-tour` (`guru`, `guru-kelas`, …) + kelas `.is-tour-focus`. Muncul sekali untuk guru baru (`tourPending`), status selesai juga disimpan di server (`preferences.tourDone`) agar tidak muncul lagi di perangkat lain; dibuka lagi dari Profil Guru → "Buka panduan guru".
- Peran Guru (17 Nov 2026): profil akun punya `role` ('student' bawaan untuk akun lama | 'teacher'). `RequireAuth` (halaman siswa) mengalihkan guru ke `/guru`; `RequireTeacher` mengalihkan siswa ke `/beranda`. Data kelas lewat `classroom()` (lib/classroom.js): server bila akun punya token, selain itu mode lokal dengan bentuk & aturan akses yang SAMA (guru hanya kelas miliknya; kelas guru lain = 404). Siswa mengirim **ringkasan belajar** (`buildSnapshot`: progres topik, riwayat ringkas berisi teks soal/jawaban/benar-salah/kode kesalahan, hari belajar, jumlah halaman buku — tanpa data pribadi tambahan) lewat `ClassSync` ±2,5 detik setelah ada perubahan; guru menghitung ulang dengan `summarizeSnapshot` → `summarizeLearner` (rumus yang sama dengan Dashboard Siswa). Server menolak kunci ringkasan yang tidak dikenal (`SNAPSHOT_KEYS`) dan ukuran > 300 KB. Satu siswa hanya di satu kelas. Kelas hanya VIII-A–VIII-E. Email hanya untuk guru — siswa tetap tanpa email.
- Pose maskot (12): smile, wink, wave, happy, jump, think, book, cheer, point, surprised, idea, thumb — masing-masing punya gerak khas (`POSE_MOTION` di MascotLive). Beri `poses={[...]}` sesuai konteks halaman; maskot utama berganti pose tiap ±7 detik & saat disentuh. Hanya satu maskot per halaman yang bergerak terus (`idle`), lainnya `idle={false}`.
- Tata letak laptop diatur di `styles/laptop.css` (dimuat terakhir, hanya dalam media query): Sambutan & buku Materi (dua halaman + tombol navigasi) muat satu layar dengan ukuran berbasis tinggi layar (vh); jangan sekadar mengecilkan semua elemen. Dashboard laptop (≥960px): sidebar bergradasi dengan ikon menu berwarna, latar `DashBackdrop` (bintang, simbol matematika, bentuk geometri, awan di tepi area konten — sejak 21 Nov 2026 juga di Materi & Lab Koma), Beranda bergrid 12 kolom (≥1100px) dan lebih lebar (≥1440px). Tampilan HP tidak memakai aturan ini.
- Logo resmi = gambar kapibara di atas awan bertuliskan "NoBaku" (`src/assets/logo-sm.webp` 160px & `logo-md.webp` 360px, latar transparan; ikon PWA/favicon di `public/icons/` dibuat dari gambar yang sama). Selalu tampil utuh lewat komponen `Logo` (`Mascot.jsx`) — jangan dipotong, diregangkan, atau diganti warna; di bawah 72px nama "NoBaku" ditulis di sampingnya.
- Identitas visual bersama HP & laptop ada di `styles/brand.css` (dimuat sebelum laptop.css): warna khas tiap menu lewat kelas `tone-*` (sidebar, navigasi bawah, panel Lainnya — sama dengan warna kepala halamannya), kartu Beranda berwarna, dan latar `DashBackdrop` (di HP hanya hiasan bertanda `hp`, kecil di tepi layar).
- Jalur Latihan memakai satu kali jawab per soal: bila salah, jawaban benar + penjelasan (`explanationFor`) langsung tampil di bawah soal (permintaan pengembang, 11 Nov 2026). Alur latihan modul (PracticePage) tetap 3 percobaan + petunjuk bertingkat.
- Efek React tidak boleh mengembalikan nilai selain fungsi pembersih: tulis `useEffect(() => { window.scrollTo(...); }, [])` dengan kurung kurawal (scrollTo di browser baru mengembalikan Promise). Animasi dekoratif di CSS wajib digating `[data-motion='on']`.
- Semua akses `localStorage` dibungkus `try/catch` (aplikasi tetap jalan bila penyimpanan diblokir).
- Python: type hints di semua fungsi; router tipis, logika di `services/`; nama `snake_case`.
- Tulis tes untuk setiap logika di `lib/sci`, `app/sci`, dan `services/`.
- Aksesibilitas: target sentuh ≥ 44px, kontras WCAG AA, semua kontrol bisa dipakai dengan keyboard, `aria-label` pada tombol ikon.

## Definition of Done

Sebuah tugas dianggap selesai jika:
1. Memenuhi acceptance criteria FR terkait di PRD.
2. `npm run test && npm run build` (frontend) dan/atau `pytest` (backend) lulus.
3. Layar baru lolos checklist CLT di [docs/UI-UX-GUIDELINES.md](docs/UI-UX-GUIDELINES.md#checklist-beban-kognitif-per-layar).
4. Tampil benar di lebar 360px (Android) dan 1280px (desktop).
5. Dokumen terkait diperbarui bila ada perubahan perilaku/API/skema.

## Yang Tidak Boleh Dilakukan
- Menambah fitur gamifikasi berlebihan (leaderboard publik, efek suara di luar yang sudah disetujui 17 Nov 2026) tanpa persetujuan — berisiko menambah extraneous load dan membandingkan siswa.
- Menggunakan layanan pihak ketiga yang mengirim data siswa (analytics, iklan) tanpa persetujuan.
- Membuat antarmuka chatbot bebas atau membiarkan AI memberi jawaban akhir langsung.
- Memanggil API AI (Groq) dari frontend, menaruh kuncinya di luar `backend/.env`, atau menjalankan eval AI dengan API sungguhan tanpa izin.
- Mengubah skema database tanpa migrasi Alembic.
