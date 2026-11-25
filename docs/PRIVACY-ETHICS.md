# Privasi Data & Etika Penelitian

Pengguna utama NoBaku adalah **anak di bawah umur** (±13–15 tahun). Karena itu perlindungan data dan etika penelitian menjadi kebutuhan wajib, bukan tambahan. Acuan: **UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)** — khususnya ketentuan pemrosesan data pribadi anak yang memerlukan persetujuan orang tua/wali — serta kode etik penelitian di perguruan tinggi.

## 1. Prinsip

1. **Minimalisasi data** — hanya kumpulkan yang diperlukan untuk belajar dan penelitian.
2. **Tujuan terbatas** — data dipakai untuk pembelajaran, pemantauan guru, dan penelitian yang disetujui; tidak untuk iklan atau dijual.
3. **Persetujuan** — dari sekolah, guru, orang tua/wali, dan *assent* (persetujuan) siswa.
4. **Keamanan** — enkripsi transport, hashing password, kontrol akses ketat.
5. **Transparansi** — kebijakan privasi berbahasa sederhana di dalam aplikasi.
6. **Hak subjek data** — akses, koreksi, dan penghapusan.

## 2. Inventaris Data

| Data | Siapa | Wajib? | Tujuan | Catatan |
|---|---|---|---|---|
| Nama tampilan | Siswa | Ya | Dikenali guru | Boleh nama panggilan |
| Username, password (hash) | Siswa | Ya | Login | Tanpa email/telepon |
| Keanggotaan kelas | Siswa | Ya | Dashboard guru | — |
| Jawaban, waktu, hint, kode kesalahan | Siswa | Ya | Umpan balik, progres, penelitian | — |
| Skor beban kognitif | Siswa | Tidak (bisa dilewati) | Penelitian | — |
| Nama, email, password (hash) | Guru | Ya | Login, aktivasi | — |
| Alamat IP | Semua | Sementara | Rate limiting, keamanan | Tidak disimpan permanen di DB |
| Teks soal cerita yang dimasukkan ke Asisten AI | Siswa, Guru | Tidak (fitur opsional) | Analisis soal & bimbingan | Dikirim ke Groq API tanpa identitas (email/HP disensor); **tidak disimpan** di server NoBaku |

**Tidak dikumpulkan:** email/telepon siswa, foto, lokasi, kontak, ID perangkat iklan, data biometrik. Tidak ada SDK analytics/iklan pihak ketiga.

### 2.1 Pemrosesan oleh Layanan AI Pihak Ketiga
- **Ketentuan Groq (diperiksa 21 Nov 2026):** pemilik akun Groq wajib ≥ 18 tahun (pengembang, bukan siswa). Aplikasi untuk pengguna di bawah umur tidak dilarang, tetapi menurut Services Agreement §6.3(d) pengembang **bertanggung jawab penuh** atas kepatuhan hukum (di Indonesia: UU PDP — persetujuan orang tua/sekolah). Groq tidak memakai input/output untuk melatih model; secara bawaan tidak menyimpan data inferensi, kecuali log penyalahgunaan/gangguan ≤ 30 hari (opsi *Zero Data Retention* di Data Controls). Selama uji coba, persetujuan orang tua ditangani **di luar aplikasi**; fitur AI mati secara bawaan (`AI_ENABLED=false`).
- Asisten AI memakai **Groq API** sebagai pemroses data. Yang dikirim **hanya teks soal** (dan, untuk petunjuk, ringkasan langkah & kode kesalahan) — **tanpa** nama, username, ID siswa, kelas, atau sekolah.
- Sebelum dikirim, backend menyaring pola data pribadi sederhana (nomor HP, email) dan menolak teks yang tampak berisi data pribadi.
- AI **nonaktif secara default**; guru mengaktifkan per kelas setelah sekolah dan orang tua menyetujui (formulir persetujuan menyebut penggunaan layanan AI secara eksplisit).
- Siswa tanpa persetujuan orang tua untuk AI (`ai_consent = false`) tidak dapat membuka fitur Asisten AI, tetapi tetap dapat memakai mode terbimbing.
- Kebijakan penggunaan dan penyimpanan data penyedia AI ditinjau sebelum uji coba dan diringkas di kebijakan privasi aplikasi.

## 3. Persetujuan

| Pihak | Bentuk | Waktu |
|---|---|---|
| Sekolah (kepala sekolah) | Surat izin penelitian | Sebelum uji coba |
| Guru | Persetujuan tertulis | Sebelum membuat kelas untuk penelitian |
| Orang tua/wali | Formulir persetujuan (*informed consent*) tercetak/digital | Sebelum siswa mendaftar |
| Siswa | *Assent* — layar penjelasan sederhana saat pertama login + centang "Saya mengerti" | Saat pendaftaran |

Siswa yang tidak mendapat persetujuan orang tua tetap boleh belajar memakai aplikasi, tetapi datanya **dikecualikan** dari ekspor penelitian (flag `research_consent = false`).

Isi layar *assent* (contoh):
> "Aplikasi ini membantumu belajar bentuk baku. Jawabanmu akan dilihat gurumu dan dipakai (tanpa namamu) untuk penelitian agar aplikasi jadi lebih baik. Kamu boleh berhenti kapan saja."

## 4. Anonimisasi untuk Penelitian

- Setiap siswa diberi `research_code` acak (mis. `S-7K3Q`), tidak diturunkan dari nama/username.
- Ekspor penelitian hanya memakai `research_code`; kode kelas di-hash.
- Laporan/skripsi hanya menyajikan data agregat atau kode (seperti S01 pada wawancara awal).
- Foto dokumentasi yang menampilkan wajah atau nama siswa (termasuk nama pada lembar jawaban) **disamarkan/diburamkan** sebelum dimasukkan ke laporan publik.

## 5. Keamanan Teknis

- HTTPS di semua lingkungan non-lokal; HSTS di web.
- Password: bcrypt (cost ≥ 12). Refresh token disimpan sebagai hash dan dapat dicabut.
- Otorisasi: guru hanya mengakses siswa di kelasnya; admin terbatas (dibuat lewat CLI).
- Rate limit login; pesan error login tidak membedakan "username tidak ada" dan "password salah".
- Log tidak memuat password, token, atau isi jawaban yang dapat diidentifikasi.
- Backup database terenkripsi oleh penyedia (Neon/Supabase); akses DB hanya oleh pengembang.
- Rahasia di `.env`/secret manager, tidak di repositori.

## 6. Retensi & Penghapusan

| Data | Masa simpan |
|---|---|
| Akun & progres siswa | Selama kelas aktif; dihapus 1 tahun setelah tidak aktif |
| Data penelitian anonim | Sampai penelitian selesai + 1 tahun (atau sesuai ketentuan kampus) |
| Rekaman wawancara | Disimpan offline terenkripsi; dihapus setelah transkrip divalidasi dan penelitian selesai |

Permintaan penghapusan dapat diajukan siswa/orang tua melalui guru → guru mengeluarkan siswa & meminta admin menghapus akun. Admin menyelesaikan dalam ≤ 14 hari.

## 7. Etika Interaksi dalam Aplikasi

- Tidak ada perbandingan publik antarsiswa (leaderboard) yang dapat menimbulkan rasa malu.
- Pesan umpan balik suportif, tidak menyalahkan.
- Tidak ada desain manipulatif (notifikasi berlebihan, *streak* yang menekan).
- Asisten AI diperkenalkan sebagai **program komputer**, bukan manusia/teman; label "Asisten" selalu tampil.
- Asisten AI menuntun, tidak mengerjakan; siswa diberi tahu bahwa AI bisa keliru dan dapat menandai "tidak sesuai".
- Waktu belajar wajar; tidak ada notifikasi di luar jam sekolah secara default.

## 8. Checklist Sebelum Uji Coba

- [ ] Surat izin sekolah diperoleh
- [ ] Formulir persetujuan orang tua terkumpul
- [ ] Kebijakan privasi tersedia di aplikasi
- [ ] Layar *assent* siswa aktif
- [ ] `research_consent` tercatat untuk setiap siswa
- [ ] Ekspor penelitian diverifikasi tidak memuat identitas
- [ ] Foto dokumentasi telah disamarkan
- [ ] Persetujuan penggunaan Asisten AI (`ai_consent`) tercatat; AI hanya diaktifkan di kelas yang disetujui
- [ ] Batas anggaran & kuota AI dikonfigurasi
