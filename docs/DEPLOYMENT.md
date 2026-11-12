# Distribusi & Deployment

NoBaku dibagikan **langsung kepada siswa tanpa Play Store maupun App Store**. Caranya: aplikasi dihosting sebagai situs web (PWA), lalu siswa memasangnya dari browser.

## 1. Cara Pemasangan per Platform

| Platform | Cara memasang | Offline | Catatan |
|---|---|---|---|
| Android | Chrome → tombol **Pasang aplikasi** di halaman *Pasang*, atau menu ⋮ → *Instal aplikasi* | Ya | Opsi tambahan: file APK (Capacitor) untuk diunduh langsung — fase berikutnya |
| iPhone / iPad | Safari → **Bagikan** → *Tambahkan ke Layar Utama* | Ya | Apple tidak mengizinkan aplikasi biasa dipasang di luar App Store; PWA adalah satu-satunya jalur |
| Windows | Edge/Chrome → ikon pasang di bilah alamat / tombol **Pasang aplikasi** | Ya | Muncul di menu Start, bisa disematkan ke taskbar |
| macOS | Chrome/Edge → ikon pasang; Safari (Sonoma+) → *File → Tambahkan ke Dock* | Ya | Muncul di Launchpad/Dock |

Halaman **Pasang** di dalam aplikasi (`#/pasang`) mendeteksi platform siswa dan menampilkan langkah yang sesuai.

Syarat teknis agar bisa dipasang: disajikan lewat **HTTPS**, memiliki `manifest.webmanifest`, ikon 192/512 px, dan service worker — semuanya sudah dibuat otomatis oleh `npm run build`.

## 2. Hosting Frontend (gratis)

`npm run build` menghasilkan folder `frontend/dist/` berisi file statis. Folder ini bisa dihosting di mana saja yang mendukung HTTPS:

| Layanan | Langkah singkat |
|---|---|
| **Netlify** (paling mudah) | Masuk ke app.netlify.com → *Add new site* → *Deploy manually* → seret folder `dist/` |
| Vercel | Impor repositori; Root `frontend`, Build `npm run build`, Output `dist` |
| GitHub Pages | Unggah isi `dist/` ke cabang `gh-pages` (path relatif sudah diatur lewat `base: './'`) |

Karena aplikasi memakai **HashRouter** dan path relatif, tidak perlu konfigurasi *rewrite* server dan aplikasi bisa dihosting di subfolder.

Bagikan tautan HTTPS-nya ke siswa (mis. lewat grup kelas atau kode QR).

## 3. Hosting Backend

Alpha frontend **belum membutuhkan backend** (semua logika & progres berjalan di perangkat). Backend (`/api/v1/...`) disiapkan untuk fase login/kelas/AI:

- Render/Railway: perintah start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, root `backend/`.
- Atur `CORS_ORIGINS` ke domain frontend.

## 4. APK Android (fase berikutnya)

Untuk file `.apk` yang bisa diunduh langsung:
1. Pasang Android Studio + JDK 17.
2. `npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android`
3. `npx cap init NoBaku id.nobaku.app --web-dir dist && npx cap add android`
4. `npm run build && npx cap sync android && npx cap open android` → *Build → Generate Signed APK*.
5. Unggah APK ke situs; siswa mengaktifkan "Instal dari sumber tidak dikenal".

## 5. Pembaruan

Service worker memakai `registerType: 'autoUpdate'`: setelah versi baru di-deploy, aplikasi yang sudah terpasang otomatis memperbarui diri saat dibuka kembali dengan koneksi internet.

## 6. Versi Pratinjau Satu Berkas

`npm run build:preview` membuat `frontend/preview/nobaku-preview.html`: seluruh aplikasi (JS, CSS, font) dalam satu berkas HTML, tanpa service worker. Dipakai untuk membagikan pratinjau lewat halaman yang tidak mengizinkan berkas terpisah (mis. Artifact claude.ai). Fitur belajar sama; pemasangan PWA dan mode offline hanya aktif pada hosting biasa (bagian 2).
