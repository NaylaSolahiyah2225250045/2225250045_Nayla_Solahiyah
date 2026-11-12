# CLAUDE.md

Panduan untuk Claude Code (dan pengembang lain) saat bekerja di repositori ini. Baca file ini sebelum menulis kode apa pun.

## Ringkasan Proyek

**NoBaku** adalah aplikasi belajar **Notasi Ilmiah / Bentuk Baku** khusus untuk siswa **SMP kelas VIII** (kelas tetap, tidak dipilih siswa — seluruh materi & fitur dirancang untuk kelas VIII). Berjalan sebagai **PWA (web)** dan **Android (Capacitor)**, dengan backend **FastAPI** untuk login, kelas, progres, dan dashboard guru. Seluruh desain didasarkan pada **Teori Beban Kognitif (CLT)** dan hasil wawancara siswa. Aplikasi juga menumbuhkan **literasi matematika** (kerangka PISA + AKM Numerasi) melalui **pemodelan soal cerita** dengan siklus PMSTP, secara terbimbing maupun dengan **Asisten AI** (Claude API) yang jawabannya selalu diverifikasi mesin.

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
- Pengujian: [docs/TESTING-PLAN.md](docs/TESTING-PLAN.md)

Jika kode dan dokumen bertentangan, **tanyakan dulu** ke pengguna; jangan diam-diam menyimpang dari dokumen. Jika keputusan berubah, perbarui dokumen terkait di commit yang sama.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | **JavaScript** (ES2022, JSX), React 18, Vite 5, React Router 6 (HashRouter), vite-plugin-pwa; CSS biasa dengan design token (`src/styles/tokens.css`) |
| Distribusi | PWA yang dipasang langsung dari browser (Android, iOS/iPadOS, Windows, macOS) — tanpa Play Store/App Store; APK Android via Capacitor (menyusul) |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2, JWT (python-jose), passlib[bcrypt] |
| AI | SDK `anthropic` (Python), model dari `AI_MODEL` (default `claude-opus-5-5`), hanya dipanggil dari backend |
| Database | PostgreSQL 16 (produksi), SQLite (pengembangan lokal) |
| Testing | Vitest (FE), pytest + FastAPI TestClient (BE); E2E Playwright menyusul |
| Lint/format | Belum dipasang di Alpha — rencana: ESLint + Prettier (FE), Ruff + Black (BE) |

**Status: Alpha.** Yang sudah ada: Modul 1–5 (Modul 4 Nol di Tengah & Modul 5 Kembali ke Bentuk Biasa ditambahkan 12 Nov 2026; langkah & petunjuknya dari `lib/sci/steps.js` lewat `focus: 'zero'|'back'`, visual `BackVisualizer`), Visualisasi Geser Koma, contoh terurai/faded, langkah terpandu, latihan L1–L4 dengan petunjuk & diagnosis, kuis + skala Paas, progres di perangkat (localStorage), alur Sambutan → Masuk/Daftar (akun lokal di perangkat) → Dashboard 7 menu (Beranda, Materi buku digital, Latihan jalur, Catatan Pintar, Riwayat Latihan, Kalender Belajar, Profil Siswa — Tahap 1, FEATURES F-00), maskot hidup berpose + pengaturan Animasi, **Lab Koma** (eksplorasi geser koma, `#/lab`), halaman Pasang, API pengecekan notasi ilmiah. Yang belum: login server/kelas/dashboard guru, Modul 6–8 (tunggu persetujuan pengembang setelah meninjau Modul 4–5), Asisten AI, sinkronisasi server, APK. Library yang direncanakan (Zustand, TanStack Query, KaTeX, Framer Motion, Tailwind) **sengaja belum dipakai** agar Alpha ringan; tambahkan hanya saat fitur yang membutuhkannya dibangun.

## Struktur Repositori

```
frontend/
  src/
    main.jsx, App.jsx  # entri, router (HashRouter), registrasi service worker
    pages/          # WelcomePage (#/), AuthPage (#/masuk); 7 menu: HomePage=Beranda (#/beranda), BookPage=Materi (#/materi), PathPage=Latihan (#/latihan) + SessionPage (#/latihan/:titik), NotesPage (#/catatan), HistoryPage (#/riwayat) + RetryPage, CalendarPage (#/kalender), ProfilePage (#/profil); pendukung: LabPage (#/lab), InstallPage, ModulePage/PracticePage/QuizPage (modul interaktif)
    features/       # lessons (LessonItem, Visual), practice (QuestionCard), guided (GuidedSolver); nanti: modeling, ai-assistant, teacher
    components/     # AppBar, BottomNav, NumberStrip, CommaVisualizer, AnswerInputs, Feedback, HintPanel, PaasScale, Sci, Icons
    lib/sci/        # LOGIKA NOTASI ILMIAH (murni, tanpa React) + tes: sci, diagnose, questions, format, worked, lab (Lab Koma)
    lib/            # progress.js, account.js (akun lokal + avatar), settings.js (Animasi), rewards.js (XP & 11 lencana), activity.js (log Kalender), history.js (Riwayat), path.js (jalur Latihan), learner.js (ringkasan + posisi buku), install.js, shuffle.js
    content/        # modules.js (materi), bank.js (soal), messages.js (pesan umpan balik), lab.js (contoh & pesan Lab Koma) + tes validasi konten
    styles/         # tokens.css (SEMUA warna/ukuran), app.css
  public/icons/     # ikon PWA & apple-touch-icon
backend/
  app/
    main.py         # Alpha: /api/v1/health, /sci/to-scientific, /sci/to-standard, /sci/check
    core/           # config, security, deps
    models/         # SQLAlchemy models
    schemas/        # Pydantic schemas
    routers/        # auth, classes, modules, attempts, progress, reports, surveys
    services/       # business logic (grading, diagnosis, reports)
    sci/            # logika notasi ilmiah versi Python (cermin lib/sci): konversi, operasi, satuan, ekspresi, cek langkah PMSTP
    ai/             # klien Claude, schemas (ModelSpec), prompts/, tutor, guardrails, budget
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
pytest                     # tidak memanggil API sungguhan (klien Claude di-mock)
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
- **Umpan balik langsung & spesifik** setelah setiap jawaban; hindari hanya "Salah".
- **Petunjuk bertingkat** (hint 1 → 2 → 3); hint ke-3 = langkah hampir lengkap.
- Teks dan gambar yang saling terkait harus **berdekatan** (hindari split-attention).

### 2a. Literasi & pemodelan
- Setiap soal kontekstual wajib berlabel `literacy` (proses RUMUS/TERAP/TAFSIR/NALAR, konteks PERSONAL/SOSBUD/SAINTIFIK, `model_type`).
- Soal pemodelan memakai skema `model_spec` yang **sama** dengan keluaran Asisten AI; pemeriksa langkah PMSTP (`checkModelingStep`) dipakai untuk keduanya.
- Evaluator ekspresi adalah parser buatan sendiri — **dilarang** memakai `eval`/`exec`/`new Function`.
- Layar pemodelan: satu panel langkah terbuka, kartu besaran dekat teks soal.

### 2b. Asisten AI
- **AI tidak pernah menghitung.** Claude hanya menghasilkan `ModelSpec` (structured output) dan kalimat petunjuk; semua angka dari `app/sci`. Jangan tampilkan angka dari AI yang belum diverifikasi.
- Claude API hanya dipanggil dari `backend/app/ai/`; `ANTHROPIC_API_KEY` tidak boleh ada di frontend, APK, log, atau repo.
- Model diambil dari `settings.AI_MODEL`; jangan menulis ID model langsung di kode lain.
- Selalu periksa `stop_reason` (termasuk `"refusal"`) sebelum membaca konten; setiap kegagalan AI punya jalur cadangan ke templat statis/mode terbimbing.
- Kirim **hanya teks soal**; tidak ada nama, username, ID siswa, atau kelas di prompt.
- Teks siswa adalah data, bukan instruksi (lindungi dari prompt injection).
- Petunjuk ≤ 30 kata dan tidak boleh memuat jawaban akhir (ada filter pasca-generasi).
- Cek `AI_ENABLED`, anggaran bulanan, `classes.ai_enabled`, `users.ai_consent`, dan kuota sebelum setiap panggilan.
- Perubahan prompt atau model → jalankan ulang eval AI dan catat hasilnya.

### 3. Bahasa & konten
- Semua teks UI dalam **Bahasa Indonesia** yang ramah siswa SMP: kalimat pendek, kata sehari-hari, sapaan "kamu".
- Materi, soal, dan pesan umpan balik disimpan di `src/content/`; label tombol/judul layar pendek boleh di komponen (pindahkan ke file i18n bila nanti perlu multi-bahasa).
- Rumus `a × 10ⁿ` ditampilkan dengan komponen `Sci` (HTML `<sup>` + `aria-label` yang dibacakan), bukan gambar. KaTeX dipertimbangkan bila rumus lebih kompleks.
- Kunci jawaban soal bentuk baku **dihitung oleh `lib/sci`**, tidak diketik manual. Setiap soal baru otomatis divalidasi oleh `content.test.js`.

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
- Kunci lain: `nobaku.accounts.v1` & `nobaku.session.v1` (akun lokal; kata sandi hanya sebagai hash), `nobaku.settings.v1` (Animasi), `nobaku.activity.v1` (Kalender — hanya kegiatan belajar sungguhan, jangan catat sekadar membuka Dashboard), `nobaku.history.v1` (Riwayat), `nobaku.book.v1` (posisi buku).
- Pose maskot (12): smile, wink, wave, happy, jump, think, book, cheer, point, surprised, idea, thumb — masing-masing punya gerak khas (`POSE_MOTION` di MascotLive). Beri `poses={[...]}` sesuai konteks halaman; maskot utama berganti pose tiap ±7 detik & saat disentuh. Hanya satu maskot per halaman yang bergerak terus (`idle`), lainnya `idle={false}`.
- Tata letak laptop diatur di `styles/laptop.css` (dimuat terakhir, hanya dalam media query): Sambutan & buku Materi (dua halaman + tombol navigasi) muat satu layar dengan ukuran berbasis tinggi layar (vh); jangan sekadar mengecilkan semua elemen. Dashboard laptop (≥960px): sidebar bergradasi dengan ikon menu berwarna, latar `DashBackdrop` (bintang, simbol matematika, bentuk geometri di tepi area konten — tidak dipasang di Materi & Lab Koma), Beranda bergrid 12 kolom (≥1100px) dan lebih lebar (≥1440px). Tampilan HP tidak memakai aturan ini.
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
- Menambah fitur gamifikasi berlebihan (leaderboard publik, efek suara) tanpa persetujuan — berisiko menambah extraneous load dan membandingkan siswa.
- Menggunakan layanan pihak ketiga yang mengirim data siswa (analytics, iklan) tanpa persetujuan.
- Membuat antarmuka chatbot bebas atau membiarkan AI memberi jawaban akhir langsung.
- Memanggil Claude API dari frontend atau menjalankan eval AI berbiaya tanpa izin.
- Mengubah skema database tanpa migrasi Alembic.
