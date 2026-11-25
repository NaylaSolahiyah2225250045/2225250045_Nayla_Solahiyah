# Arsitektur Sistem

## 1. Gambaran Umum

```mermaid
flowchart LR
    subgraph Client["Klien (satu kode React + TS)"]
        PWA["PWA di browser<br/>(Chrome/Edge/Firefox)"]
        APK["APK Android<br/>(Capacitor WebView)"]
        SW["Service Worker<br/>cache aset & konten"]
        IDB[("IndexedDB<br/>antrian offline")]
    end

    subgraph Server["Backend (Render/Railway)"]
        API["FastAPI<br/>/api/v1"]
        SVC["Services<br/>grading · diagnosis · reports · literacy"]
        SCI["app/sci<br/>Decimal · expr · units"]
        AIS["AI service<br/>ai_tutor · prompts · guardrails"]
    end

    DB[("PostgreSQL<br/>(Neon/Supabase)")]
    CLAUDE["Groq API<br/>(penyedia AI)"]

    API --> AIS
    AIS -->|teks soal saja| CLAUDE
    AIS -->|verifikasi ModelSpec| SCI

    PWA --> SW
    APK --> SW
    PWA <-->|HTTPS JSON + JWT| API
    APK <-->|HTTPS JSON + JWT| API
    PWA --- IDB
    APK --- IDB
    API --> SVC --> SCI
    SVC --> DB
```

**Prinsip:**
- **Konten statis di klien:** materi & bank soal di-bundle sebagai JSON (`frontend/src/content`) agar cepat dan offline. Backend menyimpan salinan yang sama (di-seed dari file yang sama) untuk validasi & laporan.
- **Pengecekan jawaban ganda:** klien memeriksa instan (umpan balik < 300 ms); server memeriksa ulang saat attempt dikirim → nilai resmi berasal dari server.
- **Append-only attempts:** progres dihitung dari riwayat jawaban, sehingga sinkronisasi offline aman dari konflik.
- **AI di belakang backend:** klien tidak pernah memanggil Groq API langsung; `GROQ_API_KEY` hanya di `backend/.env`. Asisten Belajar Tahap 1: `/api/v1/ai/status` & `/api/v1/ai/chat`, saringan angka & kunci jawaban di `app/ai/guardrails.py`. AI menghasilkan `ModelSpec`, sedangkan angka dihitung `app/sci`. Detail: [AI-TUTOR.md](AI-TUTOR.md).

## 2. Struktur Folder

### Frontend
```
frontend/
├── index.html
├── vite.config.ts             # + vite-plugin-pwa
├── capacitor.config.ts
├── tailwind.config.ts         # token design system
├── android/                   # dibuat oleh `npx cap add android`
└── src/
    ├── main.tsx
    ├── app/
    │   ├── router.tsx         # rute publik, siswa, guru, admin
    │   ├── providers.tsx      # QueryClient, Theme, Auth
    │   └── layouts/
    ├── features/
    │   ├── auth/              # LoginPage, RegisterStudentPage, RegisterTeacherPage
    │   ├── home/              # StudentHome, ModuleList
    │   ├── lessons/           # LessonPlayer (merender item per tipe)
    │   ├── comma-visualizer/  # CommaVisualizer, NumberStrip, useCommaAnimation
    │   ├── guided/            # GuidedSteps
    │   ├── practice/          # PracticeSession, LevelPicker, HintPanel
    │   ├── quiz/              # Pre/Post test, ModuleQuiz
    │   ├── survey/            # PaasScale
    │   ├── progress/          # ProgressPage, LiteracyProfile
    │   ├── modeling/          # ModelingStepper, QuantityCard, UnitConverter, ExpressionBuilder
    │   ├── ai-assistant/      # ProblemInputForm, AiSession, AiHintBubble
    │   └── teacher/           # ClassList, ClassDashboard, StudentDetail, ErrorChart, LiteracyReport, AiAuthoring, AiSettings
    ├── components/ui/         # Button, Card, NumericKeypad, SciInput, FeedbackBanner, ...
    ├── lib/
    │   ├── sci/               # parse.ts, toScientific.ts, toStandard.ts, compare.ts, diagnose.ts, format.ts,
    │   │                      # ops.ts (kali/bagi/normalisasi), units.ts, expr.ts, modeling.ts (cek langkah PMSTP)
    │   ├── api/               # client.ts (fetch + refresh token), endpoints.ts, types.ts
    │   ├── offline/           # queue.ts (IndexedDB), sync.ts
    │   └── platform.ts        # deteksi web vs Capacitor
    ├── content/
    │   ├── modules/m1.json … m6.json
    │   ├── questions/m1.json … m6.json, pretest-a.json, pretest-b.json
    │   └── strings.id.json    # teks UI
    ├── stores/                # authStore, lessonStore, settingsStore
    └── styles/tokens.css
```

### Backend
```
backend/
├── app/
│   ├── main.py                # create_app, CORS, router include
│   ├── core/
│   │   ├── config.py          # Settings (pydantic-settings)
│   │   ├── security.py        # hash, JWT
│   │   ├── deps.py            # get_db, get_current_user, require_role, require_class_teacher
│   │   └── db.py              # engine, SessionLocal
│   ├── models/                # user.py, class_.py, content.py, attempt.py, survey.py
│   ├── schemas/               # Pydantic request/response
│   ├── routers/               # auth.py, classes.py, modules.py, attempts.py, progress.py, reports.py, surveys.py, admin.py, ai.py
│   ├── services/              # grading.py, diagnosis.py, progress.py, reports.py, codes.py, literacy.py
│   ├── sci/                   # parse.py, convert.py, compare.py, diagnose.py, ops.py, units.py, expr.py, modeling.py (cermin lib/sci)
│   ├── ai/
│   │   ├── groq_client.py     # httpx → Groq (kompatibel OpenAI), timeout, galat tanpa kunci
│   │   ├── schemas.py         # ModelSpec, QuestionDraft (Pydantic, untuk structured output)
│   │   ├── prompts/           # extract_system.md, hint_system.md, author_system.md + contoh
│   │   ├── tutor.py           # analyze_problem, next_hint, draft_question
│   │   ├── guardrails.py      # saring data pribadi, filter kebocoran jawaban, cek lingkup
│   │   └── budget.py          # kuota siswa, cache hash, batas anggaran
│   └── seed.py                # baca ../frontend/src/content → DB
├── alembic/
├── tests/
│   ├── test_sci_vectors.py    # memakai ../shared/test-vectors.json
│   ├── test_auth.py, test_classes.py, test_attempts.py, test_reports.py
│   ├── test_expr_units.py, test_modeling.py
│   ├── test_ai_chat.py        # klien Groq tiruan + httpx.MockTransport (tanpa API sungguhan)
│   └── ai_eval/               # set evaluasi AI (pytest -m ai_eval, memanggil API sungguhan)
└── requirements.txt
```

## 3. Logika Notasi Ilmiah (`lib/sci` & `app/sci`)

Representasi internal (tanpa float):
```ts
type SciNumber = {
  sign: 1 | -1;
  digits: string;   // digit bermakna tanpa nol depan/belakang, mis. "1035"
  exponent: number; // pangkat bentuk baku (bilangan bulat)
};
```
Konvensi: nilai = `d1,d2d3… × 10^exponent` (bentuk baku), `digits[0] ≠ '0'`. Contoh: `70.080.000` → `{sign: 1, digits: "7008", exponent: 7}` = 7,008 × 10⁷.

Fungsi utama (nama sama di TS & Python):

| Fungsi | Masukan → Keluaran |
|---|---|
| `parseStandard(str)` | `"0,000506"` → `{sign:1, digits:"506", exponent:-4}` |
| `parseScientific(a, n)` | `("5,06", -4)` → SciNumber (validasi 1 ≤ a < 10 terpisah) |
| `toScientific(sci)` | → `{mantissa:"5,06", exponent:-4}` |
| `toStandard(sci)` | → `"0,000506"` (dengan pemisah ribuan untuk bilangan besar) |
| `equalsValue(x, y)` | Sama nilai? |
| `isNormalized(a)` | 1 ≤ \|a\| < 10 ? |
| `shiftSteps(str)` | Daftar posisi koma per lompatan (untuk animasi F-03) |
| `diagnose(question, answer)` | → `{correct: boolean, errorCode?: ErrorCode}` |
| `multiply(x, y)`, `divide(x, y)`, `normalize(x)` | Operasi bentuk baku (Modul 7) |
| `convertUnit(value, from, to)` | Konversi satuan via registri (mis. km → m = × 10³) |
| `evaluateExpr(expr, quantities)` | Evaluasi ekspresi model (`d / c`) tanpa `eval` |
| `checkModelingStep(step, response, spec)` | Pemeriksaan langkah PMSTP → `{correct, errorCode?}` |

`shared/test-vectors.json` berisi kasus `{input, scientific:{a,n}, standard}` dan kasus diagnosis `{question, answer, expectedError}` yang diuji di kedua sisi.

## 4. Autentikasi & Otorisasi

```mermaid
sequenceDiagram
    participant C as Klien
    participant A as FastAPI
    participant D as DB
    C->>A: POST /auth/login {username, password}
    A->>D: cari user, verifikasi bcrypt
    A-->>C: access_token (30 mnt) + refresh_token (7 hari)
    C->>A: GET /me (Authorization: Bearer access)
    A-->>C: profil + role
    Note over C,A: access kedaluwarsa
    C->>A: POST /auth/refresh {refresh_token}
    A-->>C: access_token baru (refresh token dirotasi)
```

- **Web:** refresh token di cookie `HttpOnly; Secure; SameSite=Lax`; access token di memori.
- **Android (Capacitor):** refresh token di `@capacitor/preferences` (cookie lintas origin tidak andal di WebView), access token di memori.
- **Role guard:** dependency `require_role("teacher")`; untuk data kelas, `require_class_teacher(class_id)` memastikan `classes.teacher_id == current_user.id`.
- Admin hanya dibuat via perintah CLI `python -m app.create_admin`.

## 5. Alur Data Jawaban (Online & Offline)

1. Siswa menjawab → `lib/sci/diagnose` → umpan balik instan.
2. Jawaban dimasukkan ke antrian IndexedDB `pendingAnswers` dengan `client_id` (UUID) dan timestamp.
3. Jika online → `POST /attempts/{id}/answers:batch`; server menilai ulang, menyimpan, menghapus duplikat berdasarkan `client_id` (idempoten).
4. Jika server dan klien berbeda hasil → server menang; klien memperbarui progres lokal & mencatat ke log (untuk perbaikan bug).
5. Progres diambil ulang dari `GET /progress/me` (React Query invalidation).

## 6. Build & Deploy

| Target | Perintah | Output |
|---|---|---|
| Web/PWA | `npm run build` | `frontend/dist` → Vercel/Netlify |
| Android | `npm run build && npx cap sync android` → Android Studio → *Build APK* | `app-release.apk` (ditandatangani keystore) |
| Backend | Docker/`uvicorn` di Render; `alembic upgrade head` saat deploy | URL API `https://api.<domain>/api/v1` |

**Konfigurasi lingkungan:**

| Variabel | Lokasi | Contoh |
|---|---|---|
| `VITE_API_BASE_URL` | frontend `.env` | `http://localhost:8000/api/v1` |
| `DATABASE_URL` | backend `.env` | `postgresql+psycopg://user:pass@host/db` |
| `JWT_SECRET` | backend `.env` | string acak ≥ 32 byte |
| `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS` | backend `.env` | `30` / `7` |
| `CORS_ORIGINS` | backend `.env` | `https://nobaku.vercel.app,capacitor://localhost,http://localhost` |
| `RESEARCH_MODE` | backend `.env` | `true` (aktifkan kuesioner tambahan & ekspor) |
| `AI_ENABLED` | backend `.env` | `false` (bawaan) — nyalakan setelah persetujuan uji coba |
| `GROQ_API_KEY` | backend `.env` / secret manager | kunci Groq (jangan pernah di frontend/APK/`VITE_*`/repo) |
| `AI_DAILY_LIMIT` | backend `.env` | `20` pesan per siswa per hari (memori server) |
| `AI_ENABLED` | backend `.env` | `true` / `false` (saklar global) |
| `GROQ_MODEL` | backend `.env` | `openai/gpt-oss-20b` |
| `AI_MONTHLY_BUDGET_USD` | backend `.env` | `50` |
| `AI_DEFAULT_DAILY_QUOTA` | backend `.env` | `10` |

CI (GitHub Actions): lint + typecheck + test FE; ruff + pytest BE; jalankan test vectors di keduanya pada setiap push.
