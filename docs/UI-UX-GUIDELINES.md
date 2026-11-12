# UI/UX Guidelines & Design System

Tujuan utama desain: **mengurangi extraneous load**. Setiap elemen di layar harus membantu belajar; jika tidak, hapus.

## 1. Prinsip Desain

1. **Satu hal per layar.** Satu konsep, satu contoh, atau satu soal.
2. **Tenang dan bersih.** Latar polos, ruang kosong lega, tanpa ornamen (← EL03).
3. **Isyarat konsisten.** Warna dan bentuk yang sama selalu berarti hal yang sama di seluruh aplikasi.
4. **Teks dekat visual.** Label langkah menempel pada angka yang dijelaskan.
5. **Siswa yang mengatur tempo.** Tidak ada auto-advance; animasi bisa dijeda dan diulang.
6. **Umpan balik di tempat.** Pesan benar/salah muncul tepat di bawah input, bukan di pop-up yang menutupi soal.
7. **Mobile-first.** Rancang untuk 360 × 640 px, lalu perluas.

## Tema NoBaku (mockup UI/UX)

Tampilan aplikasi mengikuti mockup NoBaku yang ditetapkan pengembang (11 November 2026). Token terbaru ada di `frontend/src/styles/tokens.css` dan menggantikan nilai warna di tabel bagian 2 di bawah (tabel itu dipertahankan sebagai sejarah desain awal).

| Elemen | Ketentuan |
|---|---|
| Identitas | Nama **NoBaku**; maskot kapibara bertoga (SVG); logo = kepala maskot + teks "NoBaku" |
| Warna | Primer ungu `#7B6CF0` (gradasi ke `#6352E4`), latar lavender `#F3F2FD` dengan gumpalan gradasi lembut, teks navy `#1F2559`, CTA kuning `#FFD45A`, chip kuning `#FFF2C8` |
| Penanda belajar | Tetap: koma jingga, angka bukan nol pertama hijau-toska, nol abu-abu, pangkat positif biru, pangkat negatif **magenta** (diubah dari ungu agar tidak tertukar dengan warna primer) |
| Tipografi | Nunito (dibundel, berfungsi offline), judul 800–900; angka tetap monospace |
| Tombol | Pil (radius penuh): primer ungu bergradasi, CTA kuning (mis. "Mulai Belajar"), sekunder putih bergaris |
| Kartu | Putih, radius 20–28px, bayangan lembut keunguan |
| Tata letak laptop (≥960px) | Sidebar kiri berisi **7 menu** langsung: Beranda, Materi, Latihan, Catatan Pintar, Riwayat Latihan, Kalender Belajar, Profil Siswa (+ maskot tenang & kartu profil). Pada layar pendek (<760px tinggi) maskot sidebar disembunyikan agar menu tetap muat |
| Tata letak HP | Logo + avatar (ke Profil) di atas; navigasi bawah **5 menu**: Beranda, Materi, Latihan, Profil, **Lainnya**. "Lainnya" membuka panel bawah (bottom sheet) berisi Catatan Pintar, Riwayat Latihan, Kalender Belajar — baris besar (≥72px) dengan ikon & keterangan. Ikon 24px, label 0,8rem, tinggi tombol 64px (tidak dikecilkan) |
| Alur halaman (Tahap 1, 11 Nov 2026) | **Sambutan** (`#/`) → **Masuk/Daftar** (`#/masuk`) → **Dashboard** = 7 menu: `#/beranda` (sapaan, avatar, status belajar hari ini, statistik, lanjutkan membaca/latihan, strip minggu bercap kapibara), `#/materi` (buku digital: 2 halaman berdampingan ≥1024px, 1 halaman di HP, animasi balik halaman 3D, geser/tombol/panah keyboard; Bab 1 bilangan berpangkat → Bab 2 bentuk baku), `#/latihan` (jalur berkelok: titik selesai/sedang/terkunci), `#/catatan`, `#/riwayat`, `#/kalender`, `#/profil`. Progres Belajar & Koleksi Lencana ada di Profil. Lab Koma (`#/lab`) dibuka dari Beranda & Materi. Alamat lama `#/progres`, `#/akun`, `#/modul` dialihkan |
| Gamifikasi (disetujui pengembang) | XP: +10 per jawaban tepat, +50 per modul selesai, naik level tiap 250 XP. Lencana: 7 pencapaian (lib/rewards.js). Bersifat pribadi — tanpa papan peringkat/perbandingan antarsiswa. Dihitung dari progres yang ada, tanpa data baru |
| Lab Koma (11 Nov 2026) | Menu ke-5 (Dashboard · Belajar · **Lab Koma** · Progres · Pasang), nada warna oranye koma (`--tone-lab`). Panggung besar berpetak dengan sel digit adaptif, koma oranye yang bisa diseret + pegangan ‹ ›, busur lompatan bernomor, persamaan besar bilangan × 10ᵏ, penanda posisi a, kartu umpan balik, contoh bilangan, riwayat langkah, dan "Kenapa begitu?". Maskot kecil hanya di sudut kartu umpan balik (kepala saat memberi petunjuk; jempol + bintang saat bentuk baku tercapai) dan 5 bintang hias berkilau pelan di tepi kepala halaman & sudut luar panggung — semuanya mati bila Animasi nonaktif dan tidak pernah menutupi jalur angka/koma/persamaan. Spesifikasi: FEATURES F-03a |
| Akun (Alpha) | Akun **lokal di perangkat**: nama panggilan, username, kata sandi ≥6 karakter disimpan sebagai hash PBKDF2-SHA256 + salt. Tanpa email/telepon. Diganti login server (JWT) saat backend akun dibangun. Kelas tidak dipilih: selalu **VIII** (NoBaku khusus kelas VIII); formulir Daftar hanya menampilkan info "Kelas VIII". |
| Hiasan halaman (Tahap 1) | Komponen `Decor`: bintang, angka (10³, 10⁶), simbol (×, =, ✓), bentuk geometri (lingkaran, segitiga, persegi, plus) dan titik-titik — 4–6 buah per kepala halaman, opasitas rendah, hanya bintang yang berkilau (bila Animasi aktif). Tidak pernah di teks buku, soal, atau jawaban |
| Perbaikan tampilan (11 Nov 2026) | (1) 12 pose kapibara — tersenyum, berkedip (kedipan beranimasi), melambai, senang, melompat, berpikir, membaca, memberi semangat, menunjuk, terkejut, dapat ide (bola lampu menyala), jempol — tiap pose punya gerak khas (napas, goyang, lompat, angguk membaca, miring berpikir, kepalan naik-turun, tangan menunjuk, melayang) dan maskot utama halaman berganti pose tiap ±7 detik serta saat disentuh; set pose disesuaikan halaman (mis. Materi: berpikir↔membaca↔ide, Latihan: lompat↔menunjuk↔semangat, Riwayat dengan soal salah: semangat). (2) Laptop: Sambutan muat satu layar (ukuran judul, maskot, dan kartu mengikuti tinggi layar; layar < 640px tinggi menyembunyikan pelengkap). (3) Buku Materi di laptop (≥1024px): kepala ringkas + daftar isi satu baris, buku mengisi sisa tinggi layar, tombol Sebelumnya/Berikutnya selalu terlihat tanpa scroll; huruf buku diskalakan dengan tinggi layar. (4) Bintang hias ditabur alami (acak berbiji, jarak minimum, ukuran 7–24px, bentuk bintang/kilau/titik cahaya, ritme kilau berbeda, sebagian melayang, sesekali bintang jatuh) di kepala halaman & latar sambutan. Tampilan HP tidak berubah |
| Dashboard laptop berwarna (11 Nov 2026) | Hanya ≥960px: sidebar bergradasi lembut (lavender → merah muda → biru) dengan ikon menu berwarna khas, kartu maskot berlatar; area konten diberi gumpalan warna lembut dan hiasan di tepi (bintang berkilau, simbol ×, ÷, +, √, 10⁶, lingkaran, segitiga, persegi, segi enam, titik-titik) — tidak dipasang di Materi & Lab Koma (layar belajar). Beranda: kartu statistik & lanjutan bergradasi warna; ≥1100px "Minggu ini" + jalan pintas berdampingan sehingga Beranda muat satu layar 1366×768; ≥1440px konten melebar & statistik 2×2 di samping kepala. Logo resmi baru menunggu gambar bertuliskan NoBaku. Tampilan HP tidak berubah |
| Logo resmi & gaya HP (11 Nov 2026) | (1) Logo resmi: gambar kapibara bertoga di atas awan "NoBaku" (latar hitam dibuat transparan, tidak dipotong/diubah bentuk) di Sambutan, Masuk/Daftar, sidebar (ukuran mengikuti tinggi layar), bilah atas HP, halaman modul, ikon PWA, dan favicon. (2) Maskot Sambutan lebih besar (HP ±210px, laptop hingga 340px); saat diketuk: bintang + gerak + balon berganti kalimat acak dari 10 sapaan (balon tidak lagi disembunyikan di laptop pendek). (3) HP mengikuti gaya laptop: navigasi bawah dengan ikon dalam chip berwarna khas menu (aktif = gradasi ungu), panel Lainnya bergradasi dengan ikon berwarna, kartu Beranda berwarna, beberapa hiasan kecil di tepi layar — susunan 5 menu tetap |
| Pose kapibara (Tahap 1) | Pose: tersenyum (`smile`), berkedip (`wink`), melambai (`wave`), lompat kecil (`motion="hop"`), senang (`happy`, saat lulus latihan), berpikir (`think`, di Materi), memberi semangat (`cheer`, saat belum lulus / ada soal yang perlu diulang), jempol, membaca. Per halaman hanya **satu** maskot yang bergerak terus (napas/lompat); maskot sidebar hanya bereaksi saat disentuh. Avatar siswa: 6 kepala kapibara beraksesori (toga, bunga, kacamata, bintang, headset, pita) |
| Maskot hidup (disetujui pengembang, 11 Nov 2026) | Komponen `MascotLive`: animasi masuk kecil→normal dengan mantul jelly, gerak ringan (napas, kedip, rumbai toga & tangan bergoyang), bintang kecil saat disentuh/diklik, balon ucapan berganti saat diketuk. **Hanya** di layar non-soal: Sambutan, Masuk/Daftar, Dashboard, sidebar, Akun, layar "Modul selesai". Di layar materi/latihan/kuis maskot tetap statis dan tidak pernah di area soal (CLT) |
| Pengaturan Animasi | Sakelar **Animasi Aktif/Nonaktif** di Sambutan dan Akun & Pengaturan (`lib/settings.js`, kunci `nobaku.settings.v1`, atribut `<html data-motion>`). Nonaktif: maskot tetap tampil tetapi diam, bintang/transisi/angka melayang dimatikan. Bawaan mengikuti `prefers-reduced-motion` sistem; pilihan pengguna menang |

## 2. Token Warna

Didefinisikan sebagai CSS variables dan diteruskan ke Tailwind theme.

| Token | Light | Dark | Kegunaan |
|---|---|---|---|
| `--color-bg` | `#FAFAF7` | `#16181D` | Latar |
| `--color-surface` | `#FFFFFF` | `#1F2229` | Kartu |
| `--color-text` | `#1F2933` | `#E6E8EB` | Teks utama |
| `--color-text-muted` | `#616E7C` | `#9AA5B1` | Teks sekunder |
| `--color-primary` | `#2F5DDE` | `#7C9BF2` | Tombol utama, tautan |
| `--color-comma` | `#D9480F` | `#FF8A50` | **Koma** (selalu) |
| `--color-lead-digit` | `#0B7A75` | `#3CC9C1` | **Angka bukan nol pertama** |
| `--color-zero` | `#9AA5B1` | `#616E7C` | Nol depan/belakang (dibuang) |
| `--color-exp-pos` | `#2F5DDE` | `#7C9BF2` | Pangkat positif / lompatan ke kiri |
| `--color-exp-neg` | `#8E44AD` | `#C39BD3` | Pangkat negatif / lompatan ke kanan |
| `--color-success` | `#2B8A3E` | `#69DB7C` | Benar |
| `--color-error` | `#C92A2A` | `#FF8787` | Salah |
| `--color-hint` | `#F59F00` | `#FFD43B` | Petunjuk |
| `--color-known` | `#E7F5FF` / teks `#1864AB` | `#1C2B3A` / teks `#74C0FC` | Kartu besaran "Diketahui" |
| `--color-asked` | `#FFF4E6` / teks `#A34A00` | `#3A2A1A` / teks `#FFC078` | Kartu "Ditanya" |
| `--color-ai` | `#F3F0FF` / teks `#5F3DC4` | `#2B2540` / teks `#B197FC` | Gelembung petunjuk Asisten AI |

Semua pasangan teks/latar wajib kontras ≥ 4.5:1. Warna tidak boleh menjadi satu-satunya penanda: koma juga lebih besar/tebal, nol buang juga dicoret, pangkat negatif juga diberi tanda "−" dan panah →.

## 3. Tipografi

| Peran | Font | Ukuran (mobile / desktop) |
|---|---|---|
| Judul layar | Inter / Nunito, 700 | 22 / 28 px |
| Teks penjelasan | Inter / Nunito, 400 | 17 / 18 px, line-height 1.6 |
| Angka di visualisasi | JetBrains Mono / Roboto Mono, 600 | 32 / 44 px |
| Rumus | KaTeX | mengikuti konteks |
| Label kecil | 14 px | — |

Batasi teks penjelasan ±40 kata per layar, paragraf ≤ 3 kalimat.

## 4. Komponen Inti

| Komponen | Deskripsi |
|---|---|
| `AppBar` | Tombol kembali, judul modul, indikator progres (titik). |
| `ConceptCard` | Judul konsep + teks pendek + slot visual. |
| `NumberStrip` | Deretan sel digit (dasar F-03) dengan pewarnaan token. |
| `CommaVisualizer` | `NumberStrip` + animasi lompatan + penghitung + kontrol putar/manual. |
| `StepList` | Langkah bernomor, langkah aktif disorot, langkah lain redup. |
| `SciInput` | Dua kolom input: mantissa `a` dan pangkat `n` (dengan tombol ±). |
| `StandardNumberInput` | Input bentuk biasa dengan pemisah ribuan otomatis. |
| `NumericKeypad` | Keyboard angka khusus: 0–9, `,`, `±`, `000`, hapus. |
| `FeedbackBanner` | Inline di bawah input; varian benar/salah/info; berisi aksi visual. |
| `HintButton` + `HintPanel` | 3 tingkat, terbuka berurutan. |
| `LevelPicker` | L1–L4 dengan gembok. |
| `PaasScale` | 9 tombol skala dengan label ujung. |
| `ConversionTable` | Tabel satuan (bottom sheet di mobile). |
| `TeacherTable`, `ErrorChart` | Komponen dashboard guru. |
| `StimulusCard` | Teks konteks pendek + satu gambar/infografis sederhana (pemantik literasi). |
| `ModelingStepper` | 5 panel PMSTP; panel aktif terbuka, panel selesai diringkas 1 baris dengan ✓. |
| `HighlightableText` | Teks soal yang frasa angkanya dapat diketuk untuk dijadikan kartu. |
| `QuantityCard` | Kartu besaran: label, nilai, satuan; varian diketahui/ditanya/pengecoh. |
| `UnitConverter` | Pilih satuan asal → tujuan; tampil `× 10ᵏ` dengan kotak isian pangkat. |
| `ExpressionBuilder` | Templat model (`[ ] × [ ]`, `[ ] ÷ [ ]`) tempat kartu diseret/diketuk. |
| `AnswerSentence` | Kalimat jawaban rumpang/pilihan. |
| `LiteracyProfile` | Batang skor per proses + label kategori. |
| `AiHintBubble` | Gelembung petunjuk AI (≤ 30 kata) dengan label "Asisten" dan tombol "Petunjuk lain". |
| `ProblemInputForm` | Textarea soal + penghitung karakter + peringatan data pribadi + sisa kuota. |

## 5. Wireframe Layar Utama (Mobile)

### 5.1 Beranda Siswa
```
┌──────────────────────────────┐
│ Halo, Dina 👋                │
│ ┌──────────────────────────┐ │
│ │ Lanjutkan belajar        │ │
│ │ Modul 3 · Bilangan Kecil │ │
│ │ ███████░░░  6/10         │ │
│ │        [ Lanjutkan ]     │ │
│ └──────────────────────────┘ │
│ Modul                        │
│ ✓ 1 Prasyarat        90      │
│ ✓ 2 Bilangan Besar   80      │
│ ● 3 Bilangan Kecil   …       │
│ 🔒 4 Nol di Tengah           │
│ 🔒 5 Kembali ke Bentuk Biasa │
│ 🔒 6 Soal Cerita             │
│ [Beranda] [Progres] [Akun]   │
└──────────────────────────────┘
```

### 5.2 Layar Konsep (Modul 3b)
```
┌──────────────────────────────┐
│ ←  Bilangan Kecil   ●●●○○○   │
│                              │
│ Koma bergeser ke KANAN       │
│ → pangkatnya NEGATIF         │
│                              │
│   0 , 0 0 0 3 2              │
│     └──→──→──→──┘ ●          │
│   lompatan: 4  →  10⁻⁴       │
│      [▶ Putar]  [↺ Ulang]    │
│                              │
│ Ingat: ke kanan = kecil (−)  │
│                              │
│ [ Kembali ]     [ Lanjut → ] │
└──────────────────────────────┘
```

### 5.3 Latihan
```
┌──────────────────────────────┐
│ ←  Latihan L2      Soal 3/5  │
│                              │
│ Tulis dalam bentuk baku:     │
│        0,000506              │
│                              │
│  [ 5,06 ] × 10^[ −4 ]        │
│                              │
│ ┌ ✗ Nol di antara angka ───┐ │
│ │ bukan nol tetap ditulis. │ │
│ │ [Lihat]                  │ │
│ └──────────────────────────┘ │
│ 💡 Petunjuk (0/3)  [ Cek ]   │
│ ┌──────────────────────────┐ │
│ │ 1  2  3  ,               │ │
│ │ 4  5  6  ±               │ │
│ │ 7  8  9  ⌫               │ │
│ │    0  000                │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

### 5.4 Hasil Modul + Kuesioner
```
┌──────────────────────────────┐
│ Modul 3 selesai              │
│ Skor kuis: 4/5               │
│ Paling sering: tanda pangkat │
│ [ Latih bagian ini ]         │
│                              │
│ Seberapa berat usaha         │
│ pikiranmu tadi?              │
│ 1 2 3 4 5 6 7 8 9            │
│ ringan            berat      │
│            [ Kirim ] Lewati  │
└──────────────────────────────┘
```

### 5.5 Dashboard Guru (Desktop)
```
┌────────────────────────────────────────────────────────────┐
│ NoBaku Guru   Kelas: 8A ▾                       [Ekspor]   │
├──────────────┬─────────────────────────────────────────────┤
│ Ringkasan    │ 28 siswa · Pre 54 → Post 78 · Paas rata 4,6  │
│ Siswa        │ ┌ Selesai per modul ────────────────────┐   │
│ Kesalahan    │ │ M1 ████████ 100%  M4 █████░░ 68%      │   │
│ Pengaturan   │ │ M2 ███████░  92%  M5 ████░░░ 55%      │   │
│              │ │ M3 ██████░░  80%  M6 ███░░░░ 40%      │   │
│              │ └───────────────────────────────────────┘   │
│              │ Kesalahan tersering: E-TANDA (M3) 41%        │
│              │ Nama    M1  M2  M3  M4  M5  M6  Pre Post     │
│              │ Ani     90  80  60  …                        │
└──────────────┴─────────────────────────────────────────────┘
```

### 5.6 Pemodelan Terbimbing (Modul 8)
```
┌──────────────────────────────┐
│ ←  Pemodelan L2    Soal 2/5  │
│ Jarak Bumi–Matahari sekitar  │
│ [150.000.000 km]. Cahaya     │
│ merambat [300.000.000 m/s].  │
│ Matahari berumur 4,6 miliar  │
│ tahun. Berapa detik cahaya   │
│ sampai ke Bumi?              │
│ ✓ 1 Pahami  jarak, kecepatan │
│ ● 2 Modelkan                 │
│ ┌──────────────────────────┐ │
│ │ jarak  150.000.000 km    │ │
│ │  → m : × 10^[ 3 ]        │ │
│ │  = [1,5] × 10^[11] m     │ │
│ │ Model:  [jarak] ÷ [kec.] │ │
│ └──────────────────────────┘ │
│ ○ 3 Selesaikan               │
│ ○ 4 Tafsirkan                │
│ ○ 5 Periksa                  │
│ 💡 Petunjuk (0/3)  [ Cek ]   │
└──────────────────────────────┘
```

### 5.7 Asisten AI – Bawa Soalmu
```
┌──────────────────────────────┐
│ ←  Bawa Soalmu    Sisa: 8/10 │
│ Tulis soal ceritamu:         │
│ ┌──────────────────────────┐ │
│ │ Sebuah HP memiliki memori│ │
│ │ 64 GB. Jika satu foto    │ │
│ │ 4 MB, berapa foto ...    │ │
│ └──────────────────────────┘ │
│ ⚠ Jangan tulis nama/data     │
│   pribadi.        142/800    │
│           [ Analisis soal ]  │
│ ─────────────────────────────│
│ Diketahui: [64 GB] [4 MB]    │
│ Ditanya:   [banyak foto]     │
│ [Ini tidak sesuai soalku]    │
│ ┌ Asisten ─────────────────┐ │
│ │ Satuannya belum sama.    │ │
│ │ Ubah dulu GB dan MB ke   │ │
│ │ byte, ya.                │ │
│ └──────────────────────────┘ │
│      [ Mulai langkah 2 → ]   │
└──────────────────────────────┘
```

## 6. Interaksi & Animasi

- Durasi transisi layar 150–200 ms (fade/slide halus); lompatan koma 600 ms/sel (dapat diatur).
- Tanpa animasi dekoratif, confetti, atau suara. Jawaban benar cukup ikon ✓ + warna + kalimat singkat.
- Dukung `prefers-reduced-motion`.
- Getaran (haptic) ringan di Android hanya saat jawaban salah — dapat dimatikan.

## 7. Aksesibilitas

- Target sentuh ≥ 44 × 44 px; jarak antar-tombol ≥ 8 px.
- Semua kontrol dapat diakses keyboard (desktop) dengan fokus terlihat.
- `aria-live="polite"` untuk umpan balik dan lompatan koma.
- Rumus KaTeX disertai teks alternatif (mis. "3,2 kali 10 pangkat negatif 4").
- Ukuran teks mengikuti pengaturan sistem (rem, tidak px tetap untuk teks).
- Mode gelap mengikuti sistem, dengan opsi manual.

## 8. Bahasa UI

- Sapaan "kamu", kalimat aktif, ≤ 15 kata per kalimat.
- Hindari istilah asing; gunakan "bentuk baku (notasi ilmiah)" secara konsisten.
- Pesan salah tidak menyalahkan: "Belum tepat" bukan "Salah!".
- Konsisten: "lompatan koma", "angka bukan nol pertama", "pangkat", "nol di tengah".

## Checklist Beban Kognitif per Layar

Gunakan checklist ini saat review setiap layar belajar:

- [ ] Hanya satu konsep/soal di layar ini.
- [ ] Teks ≤ 40 kata; tidak mengulang isi visual secara verbatim.
- [ ] Teks penjelasan berada dekat dengan visual yang dijelaskan.
- [ ] Warna koma, angka bukan nol pertama, dan nol memakai token yang benar.
- [ ] Tidak ada elemen dekoratif, animasi latar, atau suara.
- [ ] Siswa mengendalikan tempo (tidak ada auto-advance).
- [ ] Umpan balik muncul inline dan spesifik.
- [ ] Petunjuk tersedia (kecuali di kuis/tes).
- [ ] Berfungsi di 360 px dan dengan `prefers-reduced-motion`.
- [ ] Kontras & target sentuh memenuhi WCAG AA.

Tambahan untuk layar pemodelan & AI:
- [ ] Teks soal dan panel langkah aktif terlihat bersamaan tanpa menggulir jauh (hindari split-attention).
- [ ] Hanya satu panel langkah terbuka; langkah selesai diringkas.
- [ ] Gelembung AI ≤ 30 kata, satu petunjuk, tidak menyebut jawaban akhir.
- [ ] Tidak ada antarmuka obrolan bebas; siswa selalu kembali ke panel langkah.
- [ ] Status AI (memuat/gagal/offline) dijelaskan singkat dengan jalan keluar ("Coba mode terbimbing").
