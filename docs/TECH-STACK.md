# Tech Stack

> **Pembaruan (Alpha, 11 November 2026):** atas permintaan pengembang, frontend ditulis dalam **JavaScript** (bukan TypeScript). Agar Alpha ringan dan mudah dipelajari, Alpha hanya memakai React, React Router, Vite, dan vite-plugin-pwa; styling memakai CSS biasa dengan design token. Library lain di tabel bawah (Tailwind, Zustand, TanStack Query, KaTeX, Framer Motion, Capacitor) tetap menjadi rencana dan ditambahkan saat fitur yang membutuhkannya dibangun. Distribusi utama adalah **PWA yang dipasang dari browser** di semua platform — lihat [DEPLOYMENT.md](DEPLOYMENT.md).

## Ringkasan Keputusan

| Kebutuhan | Pilihan | Alasan |
|---|---|---|
| Satu kode untuk web & Android | **React + Vite** sebagai PWA, dibungkus **Capacitor** | Satu basis kode; PWA dapat dipasang & offline; Capacitor menghasilkan APK tanpa menulis ulang aplikasi |
| Bahasa frontend | **TypeScript (strict)** | Mencegah bug tipe pada logika angka dan kontrak API |
| Backend | **Python + FastAPI** | Sesuai pilihan pengembang; cepat dibuat; dokumentasi API otomatis (Swagger); Pydantic untuk validasi |
| Database | **PostgreSQL** (prod), **SQLite** (dev) | Relasional cocok untuk data kelas/attempt; gratis di Render/Supabase/Neon |
| Hosting | Vercel/Netlify (FE), Render/Railway (BE), Neon/Supabase (DB) | Ada paket gratis yang cukup untuk uji coba |

## Frontend

| Paket | Versi target | Kegunaan |
|---|---|---|
| react, react-dom | 18.x | UI |
| vite | 5.x | Build tool & dev server |
| typescript | 5.x | Tipe statis |
| tailwindcss | 3.x | Styling berbasis token design system |
| react-router-dom | 6.x | Routing |
| zustand | 4.x | State lokal (sesi belajar, preferensi) |
| @tanstack/react-query | 5.x | Data server, cache, retry |
| katex | 0.16.x | Menampilkan rumus `a × 10ⁿ` |
| framer-motion | 11.x | Animasi lompatan koma |
| vite-plugin-pwa (Workbox) | 0.20.x | Service worker, manifest, offline |
| idb-keyval / dexie | — | Penyimpanan IndexedDB untuk antrian offline |
| zod | 3.x | Validasi skema konten soal & respons API |
| recharts | 2.x | Grafik dashboard guru |
| @capacitor/core, @capacitor/android | 6.x | Bungkus Android |
| @capacitor/preferences, @capacitor/haptics, @capacitor/network | 6.x | Simpan token, getaran, status jaringan |

**Kualitas:** ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier, Vitest + React Testing Library, Playwright, Lighthouse CI.

## Backend

| Paket | Kegunaan |
|---|---|
| Python 3.12 | Runtime |
| fastapi, uvicorn[standard] | Web framework & server ASGI |
| sqlalchemy 2.x | ORM |
| alembic | Migrasi skema |
| pydantic v2, pydantic-settings | Validasi & konfigurasi `.env` |
| psycopg[binary] | Driver PostgreSQL |
| python-jose[cryptography] | JWT |
| passlib[bcrypt] | Hash password |
| slowapi | Rate limiting (login) |
| pytest, httpx, pytest-cov | Pengujian |
| ruff, black, mypy | Lint, format, cek tipe |
| anthropic | SDK resmi Claude API untuk Asisten AI (structured output, prompt caching) |

Logika notasi ilmiah, evaluator ekspresi, dan registri satuan memakai `decimal.Decimal` (standard library) — tanpa dependensi tambahan.

### Layanan AI

| Item | Pilihan | Alasan |
|---|---|---|
| Penyedia | Claude API (Anthropic) | Pemahaman bahasa Indonesia baik; mendukung structured output sehingga hasil dapat divalidasi skema |
| Model | `claude-opus-5-5` (dapat diganti via `AI_MODEL`) | Model default terbaru; tarif $4 / $20 per 1 juta token input/output |
| Pola | Satu panggilan per tugas (ekstraksi, petunjuk, draf soal) — **bukan agen** | Tugas sempit dan terdefinisi; lebih murah, cepat, dan mudah diuji |
| Verifikasi | `app/sci` (deterministik) | AI tidak dipercaya untuk aritmetika |

Detail: [AI-TUTOR.md](AI-TUTOR.md).

## Alternatif yang Dipertimbangkan

| Alternatif | Mengapa tidak dipilih (untuk MVP) |
|---|---|
| Flutter | Perlu belajar Dart; build web kurang ringan |
| React Native/Expo | Komponen web & native berbeda; Capacitor lebih sederhana untuk aplikasi berbasis konten |
| Firebase/Supabase penuh (tanpa backend Python) | Pengembang memilih Python; logika diagnosis & laporan lebih mudah dikontrol di backend sendiri |
| Django | Lebih berat; FastAPI cukup untuk API murni |

## Lingkungan Pengembangan

- Node.js 20 LTS, npm 10
- Python 3.12 + venv
- PostgreSQL 16 (Docker opsional) atau SQLite
- Android Studio (SDK 34), JDK 17 untuk build APK
- VS Code + ekstensi ESLint, Prettier, Python, Ruff, Tailwind CSS IntelliSense
- Git + GitHub (repositori privat)
