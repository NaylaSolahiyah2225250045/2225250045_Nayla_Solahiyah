# Spesifikasi REST API

- Base URL: `/api/v1`
- Format: JSON (UTF-8). Waktu dalam ISO 8601 UTC.
- Autentikasi: `Authorization: Bearer <access_token>` kecuali endpoint bertanda 🌐 (publik).
- Dokumentasi interaktif otomatis: `/docs` (Swagger) dan `/redoc` saat pengembangan.

> **Sudah dibangun (17 Nov 2026, `backend/app/routers`):** `POST /auth/register/student` (`class_code` opsional), `POST /auth/register/teacher` (`display_name`, `login` = email atau username, `password` ≥ 8, `school`; status `pending` bila `TEACHER_REQUIRE_APPROVAL=true`), `POST /auth/login` (`login` = username siswa atau email/username guru → `user.role`), `GET/PATCH /me`; `GET/POST /classes` (nama hanya `VIII-A`…`VIII-E`, unik per guru), `GET/PATCH/DELETE /classes/{id}`, `POST /classes/{id}/regenerate-code`, `GET /classes/{id}/students`, `DELETE /classes/{id}/students/{student_id}`, `POST /classes/join`, `GET /me/classes`, `DELETE /me/classes/{id}` (siswa keluar); **sinkronisasi** `PUT/GET /sync/me` (siswa mengirim ringkasan belajar `{v, modules, history, days, bookRead, updatedAt}`); **laporan guru** `GET /reports/overview`, `GET /reports/classes/{id}`, `GET /reports/students/{student_id}`. `PATCH /me` juga menerima `preferences` (`music`, `sfx`, `volume` 0–100, `tourDone`; kunci lain ditolak) dan `user.preferences` dikembalikan saat login (migrasi `0002_preferensi`, 21 Nov 2026). Kelas/siswa milik guru lain → 404. Guru `pending` → 403 `TEACHER_PENDING` pada endpoint kelas & laporan. Endpoint lain di dokumen ini masih rencana.

## 1. Format Error

```json
{
  "error": {
    "code": "CLASS_CODE_INVALID",
    "message": "Kode kelas tidak ditemukan atau sudah tidak aktif.",
    "details": {}
  }
}
```

| HTTP | `code` (contoh) | Arti |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Input tidak valid |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` | Belum login / token kedaluwarsa |
| 403 | `FORBIDDEN` | Peran/kelas tidak sesuai |
| 404 | `NOT_FOUND`, `CLASS_CODE_INVALID` | Data tidak ada |
| 409 | `USERNAME_TAKEN`, `ALREADY_MEMBER` | Konflik |
| 429 | `RATE_LIMITED`, `AI_QUOTA_EXCEEDED` | Terlalu banyak percobaan login / kuota AI harian habis |
| 503 | `AI_UNAVAILABLE`, `AI_BUDGET_REACHED` | Layanan AI gagal/nonaktif — klien beralih ke mode terbimbing |
| 500 | `INTERNAL_ERROR` | Kesalahan server |

Pesan `message` dalam Bahasa Indonesia sehingga dapat ditampilkan langsung.

## 2. Auth

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| POST | `/auth/register/student` 🌐 | — | Daftar siswa dengan kode kelas |
| POST | `/auth/register/teacher` 🌐 | — | Daftar guru (status menunggu aktivasi) |
| POST | `/auth/login` 🌐 | — | Login (rate limit 5/menit/IP) |
| POST | `/auth/refresh` 🌐 | — | Tukar refresh token |
| POST | `/auth/logout` | semua | Cabut refresh token |
| GET | `/me` | semua | Profil pengguna |
| PATCH | `/me` | semua | Ubah nama tampilan / password |

**POST `/auth/register/student`**
```json
// request
{ "display_name": "Dina", "username": "dina_8a", "password": "rahasia123", "class_code": "K7M2QX" }
// 201
{ "user": { "id": "…", "role": "student", "display_name": "Dina", "username": "dina_8a" },
  "access_token": "…", "refresh_token": "…", "token_type": "bearer" }
```

**POST `/auth/login`**
```json
// request (siswa memakai username, guru memakai email)
{ "login": "dina_8a", "password": "rahasia123" }
// 200
{ "user": { … }, "access_token": "…", "refresh_token": "…", "token_type": "bearer" }
```

## 3. Kelas

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| GET | `/classes` | teacher | Daftar kelas milik guru |
| POST | `/classes` | teacher | Buat kelas |
| GET | `/classes/{class_id}` | teacher (pemilik) | Detail kelas |
| PATCH | `/classes/{class_id}` | teacher (pemilik) | Ubah nama / aktif-nonaktif kode / `ai_enabled` / `ai_daily_quota` |
| POST | `/classes/{class_id}/regenerate-code` | teacher (pemilik) | Buat kode baru |
| GET | `/classes/{class_id}/students` | teacher (pemilik) | Daftar siswa |
| DELETE | `/classes/{class_id}/students/{student_id}` | teacher (pemilik) | Keluarkan siswa |
| POST | `/classes/{class_id}/students/{student_id}/reset-password` | teacher (pemilik) | Reset password → kembalikan password sementara |
| POST | `/classes/{class_id}/students/{student_id}/unlock` | teacher (pemilik) | Body `{ "module_id": "m3", "level": 3 }` |
| POST | `/classes/join` | student | Body `{ "class_code": "K7M2QX" }` |
| GET | `/me/classes` | student | Kelas yang diikuti |

**POST `/classes`**
```json
// request
{ "name": "8A", "grade": "VIII", "academic_year": "2026/2027" }
// 201
{ "id": "…", "name": "8A", "grade": "VIII", "academic_year": "2026/2027", "join_code": "K7M2QX", "join_enabled": true, "student_count": 0 }
```

## 4. Konten

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| GET | `/modules` | semua | Daftar modul + `content_version` |
| GET | `/modules/{module_id}` | semua | Detail modul + `lesson_items` |
| GET | `/modules/{module_id}/questions?set=practice&level=2` | student | Soal (tanpa kunci jawaban jika `set=quiz`/tes) |
| GET | `/content/version` 🌐 | — | Versi konten terbaru (klien membandingkan dengan bundle) |

> Klien memakai konten bundel untuk tampilan offline. Untuk **kuis & tes**, kunci jawaban **tidak dikirim**; penilaian kuis/tes dilakukan server (umpan balik ditampilkan setelah submit).

## 5. Attempt & Jawaban

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| POST | `/attempts` | student | Mulai attempt |
| POST | `/attempts/{attempt_id}/answers:batch` | student | Kirim satu/lebih jawaban (idempoten via `client_id`) |
| POST | `/attempts/{attempt_id}/finish` | student | Selesaikan attempt → skor & ringkasan |
| GET | `/attempts/{attempt_id}` | student (pemilik) / teacher (kelas) | Detail attempt |

**POST `/attempts`**
```json
// request
{ "kind": "practice", "module_id": "m3", "level": 2 }
// kind: practice | guided | quiz | pretest | posttest
// 201
{ "id": "…", "kind": "practice", "module_id": "m3", "level": 2,
  "question_ids": ["m3-l2-004", "m3-l2-011", "m3-l2-002", "m3-l2-017", "m3-l2-009"],
  "question_set": null, "started_at": "2026-11-20T02:10:00Z" }
```

**POST `/attempts/{id}/answers:batch`**
```json
// request
{ "answers": [
  { "client_id": "6f1c…", "question_id": "m3-l2-004",
    "response": { "a": "5,6", "n": -4 },
    "hints_used": 1, "try_no": 1, "time_ms": 21450,
    "client_result": { "is_correct": false, "error_code": "E-NOL" },
    "answered_at": "2026-11-20T02:11:12Z" }
]}
// 200
{ "results": [
  { "client_id": "6f1c…", "is_correct": false, "error_code": "E-NOL", "mismatch": false }
]}
```
`mismatch: true` jika hasil server berbeda dari `client_result` (dicatat untuk debugging).

Untuk soal `modeling`, setiap langkah dikirim sebagai jawaban terpisah dengan field tambahan `"step"` (`pahami`/`modelkan`/`selesaikan`/`tafsirkan`/`periksa`); respons menyertakan `rubric_score` (0–2).
```json
{ "client_id": "9a2e…", "question_id": "m8-l2-003", "step": "modelkan",
  "response": { "conversions": [{ "symbol": "d", "to_unit": "m", "exp": 3 }],
                "quantities": { "d": { "a": "1,5", "n": 11 }, "c": { "a": "3", "n": 8 } },
                "model_type": "BAGI", "expression": "d / c" },
  "hints_used": 0, "try_no": 1, "time_ms": 48200, "answered_at": "2026-12-03T03:20:00Z" }
```

**POST `/attempts/{id}/finish`**
```json
// 200
{ "score": 80, "correct": 4, "total": 5,
  "error_summary": { "E-TANDA": 1 },
  "next_level_unlocked": 3 }
```

## 6. Progres

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| GET | `/progress/me` | student | Progres semua modul |
| PUT | `/progress/me/{module_id}/position` | student | Simpan `last_item_id` |
| GET | `/progress/me/summary` | student | Akurasi per kategori & kesalahan tersering |
| GET | `/progress/me/literacy` | student | Profil literasi (skor per proses & konteks, kategori) |

**GET `/progress/me`**
```json
{ "modules": [
  { "module_id": "m1", "status": "completed", "best_quiz_score": 90, "highest_level_unlocked": 4, "last_item_id": "m1-q5" },
  { "module_id": "m3", "status": "in_progress", "best_quiz_score": null, "highest_level_unlocked": 2, "last_item_id": "m3-c3" }
],
  "pretest_done": true, "posttest_available": false }
```

## 7. Kuesioner Beban Kognitif

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| POST | `/surveys/cognitive-load` | student | Kirim skor |

```json
{ "module_id": "m3", "paas_score": 6, "il_score": null, "el_score": null, "gl_score": null }
```

## 8. Laporan Guru

Semua endpoint memeriksa `classes.teacher_id == current_user.id`.

| Metode | Path | Deskripsi |
|---|---|---|
| GET | `/reports/classes/{class_id}/overview` | Ringkasan kelas |
| GET | `/reports/classes/{class_id}/matrix` | Tabel siswa × modul |
| GET | `/reports/classes/{class_id}/errors?module_id=m3` | Distribusi kode kesalahan + daftar siswa |
| GET | `/reports/classes/{class_id}/students/{student_id}` | Detail siswa |
| GET | `/reports/classes/{class_id}/export.csv` | Ekspor CSV kelas (dengan nama — untuk guru) |
| GET | `/reports/classes/{class_id}/literacy` | Profil literasi kelas: rata-rata per proses & konteks, distribusi kategori, pre vs post |
| GET | `/reports/classes/{class_id}/ai-usage` | Penggunaan AI: jumlah sesi, rasio petunjuk, soal yang ditandai |

**GET `/reports/classes/{id}/literacy`**
```json
{ "process_avg": { "RUMUS": 58.4, "TERAP": 76.0, "TAFSIR": 61.2 },
  "context_avg": { "PERSONAL": 70.1, "SOSBUD": 66.3, "SAINTIFIK": 57.9 },
  "category_distribution": { "intervensi": 3, "dasar": 9, "cakap": 12, "mahir": 4 },
  "pre_post": { "pre_avg": 45.2, "post_avg": 68.7, "n_gain": 0.43 },
  "top_modeling_errors": [ { "code": "E-SATUAN", "share": 0.32 }, { "code": "E-INFO", "share": 0.21 } ] }
```

## 8a. Asisten AI

Semua endpoint AI memeriksa: `AI_ENABLED`, anggaran bulanan, kelas siswa `ai_enabled = true`, dan kuota harian. Teks soal maksimal 800 karakter. Detail perilaku: [AI-TUTOR.md](AI-TUTOR.md).

| Metode | Path | Peran | Deskripsi |
|---|---|---|---|
| POST | `/ai/problems/analyze` | student, teacher | Analisis soal cerita → `ModelSpec` terverifikasi (tanpa jawaban untuk siswa) |
| POST | `/ai/problems/{problem_id}/flag` | student | Tandai "tidak sesuai soalku" |
| POST | `/ai/sessions` | student | Mulai sesi bimbingan untuk `problem_id` |
| POST | `/ai/sessions/{session_id}/turn` | student (pemilik) | Kirim jawaban langkah atau minta petunjuk |
| GET | `/ai/sessions/{session_id}` | student (pemilik) / teacher (kelas) | Riwayat sesi |
| GET | `/me/ai-quota` | student | Sisa kuota hari ini |
| POST | `/ai/questions/draft` | teacher | Buat draf soal pemodelan dari teks guru |
| POST | `/ai/questions/{problem_id}/approve` | teacher (pemilik) | Simpan draf (yang sudah diedit) ke bank soal kelas |
| POST | `/ai/questions/{problem_id}/reject` | teacher (pemilik) | Tolak draf |
| GET | `/classes/{class_id}/ai/flagged` | teacher (pemilik) | Daftar soal yang ditandai siswa |

**POST `/ai/problems/analyze`**
```json
// request
{ "text": "Sebuah HP memiliki memori 64 GB. Jika satu foto berukuran 4 MB, berapa banyak foto yang dapat disimpan?" }
// 200 (siswa) — tanpa jawaban
{ "problem_id": "…", "status": "valid", "context": "PERSONAL",
  "quantities": [
    { "symbol": "m", "label": "memori HP", "value": "64", "unit": "GB", "relevant": true },
    { "symbol": "f", "label": "ukuran satu foto", "value": "4", "unit": "MB", "relevant": true } ],
  "asked": { "label": "banyak foto", "unit": "buah" },
  "steps": ["pahami", "modelkan", "selesaikan", "tafsirkan", "periksa"],
  "quota_remaining": 9 }
// 200 di luar lingkup
{ "problem_id": "…", "status": "out_of_scope",
  "message": "Soal ini belum bisa dibantu NoBaku. Coba soal tentang bilangan sangat besar atau sangat kecil, ya." }
```

**POST `/ai/sessions/{id}/turn`**
```json
// request — jawaban langkah
{ "step": "modelkan", "response": { "model_type": "BAGI", "expression": "m / f",
  "conversions": [ { "symbol": "m", "to_unit": "byte", "exp": 9 }, { "symbol": "f", "to_unit": "byte", "exp": 6 } ] } }
// request — minta petunjuk
{ "step": "selesaikan", "hint_request": true }
// 200
{ "correct": true, "error_code": null, "rubric_score": 2,
  "feedback": "Tepat! Sekarang bagi 6,4 × 10¹⁰ dengan 4 × 10⁶.",
  "feedback_source": "ai",          // "ai" atau "template"
  "next_step": "selesaikan", "hints_used": 0 }
```

**POST `/ai/questions/draft`** (guru)
```json
// request
{ "text": "…soal cerita…", "target_level": 3, "context": "SOSBUD" }
// 200
{ "problem_id": "…", "verification": "passed",
  "draft": { "prompt": { "text": "…", "highlights": ["…"] },
             "model_spec": { … }, "answer": { "a": "1,96", "n": 8, "unit": "kg/hari" },
             "hints": ["…", "…", "…"],
             "distractors": [ { "text": "19,6 × 10⁷ kg/hari", "error_code": "E-NORMAL" },
                             { "text": "1,96 × 10⁷ kg/hari", "error_code": "E-PANGKAT" } ],
             "literacy": { "process": ["RUMUS", "TERAP", "TAFSIR"], "context": "SOSBUD", "model_type": "KALI" } } }
```

**GET `/reports/classes/{id}/overview`**
```json
{ "student_count": 28,
  "module_completion": { "m1": 1.0, "m2": 0.92, "m3": 0.80, "m4": 0.68, "m5": 0.55, "m6": 0.40 },
  "pretest_avg": 54.2, "posttest_avg": 78.1,
  "paas_avg_by_module": { "m1": 3.1, "m2": 3.8, "m3": 5.9 },
  "top_errors": [ { "code": "E-TANDA", "module_id": "m3", "share": 0.41 } ] }
```

**GET `/reports/classes/{id}/errors?module_id=m3`**
```json
{ "module_id": "m3",
  "distribution": { "E-TANDA": 34, "E-PANGKAT": 21, "E-KOMA": 9, "E-NOL": 6, "E-FORMAT": 3, "E-LAIN": 2 },
  "students_by_error": { "E-TANDA": [ { "student_id": "…", "display_name": "Ani", "count": 5 } ] } }
```

## 9. Admin / Penelitian

| Metode | Path | Deskripsi |
|---|---|---|
| GET | `/admin/teachers?status=pending` | Guru menunggu aktivasi |
| POST | `/admin/teachers/{user_id}/activate` | Aktifkan guru |
| GET | `/admin/research/export.csv?class_id=…` | Ekspor anonim (`research_code`, tanpa nama) |

## 10. Pemetaan Endpoint ke Kebutuhan

| FR | Endpoint |
|---|---|
| FR-01 | `/auth/*`, `/me` |
| FR-02 | `/classes*`, `/classes/join` |
| FR-03, FR-04, FR-11 | `/modules*` |
| FR-07, FR-08, FR-09, FR-10 | `/attempts*` (`hints_used`, `error_code`) |
| FR-14 | `/attempts` dengan `kind` = `quiz` / `pretest` / `posttest` |
| FR-15 | `/progress/me*` |
| FR-16 | `/reports/*`, `/classes/{id}/students/*` |
| FR-17 | `/surveys/cognitive-load` |
| FR-18 | `answers:batch` + `client_id` |
| FR-19 | `/admin/research/export.csv` |
| FR-21, FR-22, FR-23, FR-24 | `/modules*`, `/attempts*` (dengan `step`, `rubric_score`) |
| FR-25 | `/ai/problems/*`, `/ai/sessions/*`, `/me/ai-quota` |
| FR-26 | `/ai/questions/*`, `/classes/{id}/ai/flagged` |
| FR-27 | `/progress/me/literacy`, `/reports/classes/{id}/literacy` |
| FR-28 | `PATCH /classes/{id}`, `/reports/classes/{id}/ai-usage` |
| FR-29 | `/attempts` dengan `kind` = `pretest` / `posttest` dan `question_set` = `literacy_a` / `literacy_b` |

## Asisten Belajar (Groq, Tahap 1 — 21 Nov 2026)

Hanya akun **siswa** (JWT). Mati secara bawaan (`AI_ENABLED=false`). Kunci Groq hanya di `backend/.env`.

**GET /ai/status** → `200 { "available": true, "daily_limit": 20, "remaining": 18 }` (`available=false` bila AI mati, kunci kosong, atau model tidak tersedia).

**POST /ai/chat**
```json
{
  "context": { "text": "Tulis dalam bentuk baku:\n4.500.000", "skill": "keBaku", "guide": "Di mana angka bukan nol pertamanya? …", "rule": "Setiap bilangan positif …", "topic": "Topik 3 · Mengubah Bentuk Biasa dan Bentuk Baku — konsep: …", "task": "Soal ini minta kamu menulis ulang bilangan itu dalam bentuk baku …", "key_texts": ["4,5 × 10⁶"], "visuals": [{ "id": "geser-koma", "summary": "67.000 → 6,7 × 10⁴: koma melompat 4 kali ke kiri, jadi pangkatnya 4." }] },
  "messages": [{ "role": "user", "content": "Aku bingung mulai dari mana." }]
}
```
→ `200 { "reply": "…", "visual": "geser-koma" | null, "source": "ai" | "fallback", "remaining": 17 }`. `visuals` (maks. 6; `id` huruf kecil & strip, `summary` ≤ 400 karakter) = visual contoh serupa yang dibuat aplikasi; `visual` = id yang dipilih AI (atau dipasang otomatis), selalu salah satu dari `visuals` (23 Nov 2026). `topic` (≤ 200) & `task` (≤ 400, "maksud soal" bahasa sehari-hari tanpa kunci) opsional sejak 25 Nov 2026. `key_texts` hanya untuk saringan balasan (tidak diteruskan ke Groq). Pesan terakhir wajib `role: "user"`, ≤ 300 karakter. Sejak 26 Nov 2026: `messages` maks. 200 (server memakai 16 pesan terakhir; klien mengirim jendela 16 pesan yang diawali pesan siswa), dan pesan asisten boleh membawa `source: "ai" | "fallback"` (balasan cadangan ditandai untuk model).

Galat: `401 UNAUTHORIZED`, `403 FORBIDDEN` (bukan siswa), `422 VALIDATION_ERROR`, `429 AI_LIMIT` (kuota harian habis), `503 AI_DISABLED`. Galat penyedia (Groq) tidak diteruskan — balasan cadangan `source: "fallback"`.
