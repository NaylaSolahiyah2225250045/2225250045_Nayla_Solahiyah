"""Mengikuti alur percakapan Asisten Belajar (25 Nov 2026, diperluas 26 Nov 2026).

Masalah yang diperbaiki: semua instruksi ada di awal (system prompt) lalu riwayat, sehingga model kecil cenderung
meniru pola balasannya sendiri, menjawab dengan petunjuk umum, dan mengulang penjelasan saat siswa bilang "belum paham".

Modul ini (tanpa AI, deterministik):
- `classify_intent` / `classify_turn` — jenis pesan terakhir siswa (maksud soal, mengapa, bagaimana, istilah,
                       belum paham, konfirmasi, menjawab pertanyaan asisten, …); `classify_turn` memakai konteks riwayat;
- `turn_note`        — CATATAN GILIRAN yang diletakkan SETELAH riwayat: apa yang ditanya sekarang, cara menjawabnya,
                       hal yang belum dipahami, tahap PMSTP (soal cerita), visual yang belum dipakai;
- `preferred_visuals`— urutan visual yang paling membantu untuk jenis pertanyaan itu;
- `similarity`       — kemiripan dua balasan (untuk menolak balasan yang hanya mengulang).
Teks siswa hanya dibaca dengan pola kata, tidak pernah dijalankan sebagai instruksi.
"""

from __future__ import annotations

import re

# Urutan penting: yang lebih spesifik dulu.
_INTENTS: tuple[tuple[str, re.Pattern[str]], ...] = tuple(
    (name, re.compile(rx, re.IGNORECASE))
    for name, rx in (
        ("minta_jawaban", r"\b(jawaban(nya)?\s*(apa|yang mana|dong)|kasih\s*(tau|tahu)\s*(aja\s*)?jawaban|kunci(nya)?|langsung\s*(aja\s*)?jawab)"),
        ("cek_jawaban", r"\b(bene?r\s*(ga|gak|nggak|tidak|kan|ya|gk|enggak)?\s*\??$|betul\s*(ga|gak|tidak|kan)|udah\s*bene?r|sudah\s*benar|aku\s*(jawab|pilih|isi)|jawabanku|salah\s*(ga|gak|nggak)|apa\s*bene?r)"),
        # 25 Nov 2026: "maksud soal ini apa?" dulu tergolong `istilah` (arahannya: "jangan langsung masuk ke soal"),
        # dan tombol "Aku bingung maksud soalnya" tergolong `lain` — sehingga AI tidak menjelaskan maksud soal.
        ("maksud_soal", r"(maksud(nya)?\s*(dari\s*)?(soal|pertanyaan|kalimat)|bingung\s*(sama\s*|dengan\s*)?(maksud|soal)|soal(nya)?\s*(ini\s*)?(tuh\s*|itu\s*)?(maksudnya|nyuruh|minta|nanya|disuruh)|(disuruh|nyuruh|diminta|suruh)\s*(apa|ngapain|ngerjain\s*apa)|yang\s*ditanya(kan)?\s*(apa|itu)|soal\s*ini\s*(apa|gimana)\s*(sih|ya)?\s*\??$|ini\s*(soal\s*)?(apa\s*)?maksudnya)"),
        ("lebih_sederhana", r"(lebih\s*(sederhana|simpel|simple|gampang|mudah|pelan)|bahasa\s*yang\s*(mudah|gampang|sederhana)|jelasin\s*(lagi\s*)?pelan|pake\s*bahasa)"),
        ("contoh_lain", r"(contoh\s*(lain|lagi|yang\s*lain)|kasih\s*contoh|beri(kan)?\s*contoh|ada\s*contoh|minta\s*contoh|contohnya\s*(apa|gimana))"),
        ("belum_paham", r"(belum\s*(paham|ngerti|mengerti|jelas|nangkep|tau|tahu)|masih\s*(bingung|belum|ga\s*ngerti|gak\s*ngerti)|(ga|gak|nggak|tidak|enggak|kurang|gk)\s*(paham|ngerti|mengerti|jelas|nangkep|nyambung)|\bbingung\b|maksudnya\s*gimana|^\s*hah\b|\bhah\s*\??\s*$|apaan\s*(sih|tuh|itu)?|(jelasin|jelaskan|terangin|ulang(i|in)?)\s*(ulang|lagi)|susah\s*(dimengerti|dipahami))"),
        # 26 Nov 2026: siswa menyimpulkan sendiri ("oh, jadi aku harus lihat angka 7 di tempat apa?") — dulu `lain`.
        ("konfirmasi", r"^\s*(oh+|o+h|owh|ooh+|ohh+|berarti|jadi|oke\s*,?\s*jadi|oh\s*,?\s*berarti)\b.*(\?|\b(ya|kan|gitu|begitu)\s*\??)\s*$"),
        ("istilah", r"(apa\s*(itu|sih|arti|maksud)|artinya\s*apa|maksud(nya)?\s*(apa|dari)|yang\s*dimaksud|disebut\s*apa|istilah)"),
        ("mengapa", r"\b(kenapa|mengapa|kok|alasan(nya)?|kenapa\s*harus|harus\s*pakai|buat\s*apa|untuk\s*apa)\b"),
        ("bagaimana", r"\b(gimana|bagaimana|caranya|cara\s*(nya|ngerjain|mengerjakan|menghitung)|langkah(nya)?|mulai\s*dari\s*mana|harus\s*ngapain|diapain|terus\s*apa|selanjutnya)\b"),
    )
)
_MISCONCEPTION_HINT = re.compile(r"\b(bukannya|kan\s+(harus|seharusnya)|menurutku|aku\s*kira|bukan(nya)?\s*\w+\s*ya|harusnya)\b", re.IGNORECASE)

# Cara menjawab untuk tiap jenis pesan. Ditulis sebagai arahan untuk model (bukan untuk siswa).
_HOW: dict[str, str] = {
    "maksud_soal": "Siswa bertanya MAKSUD SOAL. Jelaskan dulu dengan bahasa sehari-hari apa yang diminta soal ini (pakai 'Maksud soal' di KONTEKS, dengan kata-katamu sendiri): apa arti kata/simbol penting di soal, dan jawaban seperti apa yang diminta. Jangan mengerjakan soalnya, jangan menyalin bunyi soal atau pilihan, dan jangan menyuruh siswa menjelaskan ulang soal. Boleh ditutup dengan satu ajakan ringan ke langkah pertama.",
    "mengapa": "Siswa bertanya MENGAPA sesuatu benar. Jawab LANGSUNG alasan matematis dari hal yang ia tanyakan, memakai bilangan/ekspresi yang ia sebut, langkah demi langkah (mis. ditanya kenapa 10³ = 1.000: 10³ = 10 × 10 × 10; 10 × 10 = 100; 100 × 10 = 1.000; pangkat 3 = banyaknya faktor 10). Jangan mengganti pertanyaannya dengan contoh bilangan lain; contoh lain hanya boleh SESUDAH itu sebagai penguatan. Setelah itu boleh satu pertanyaan cek pemahaman.",
    "bagaimana": "Siswa bertanya BAGAIMANA CARANYA / langkah berikutnya. Jelaskan langkah yang ia tanyakan itu, bertahap. Bila langkah itu langsung menghasilkan jawaban akhir soal yang belum ia sebut, tunjukkan prosesnya sampai sebelum hasil akhir (atau pada contoh serupa) dan biarkan ia menyelesaikan langkah terakhir.",
    "istilah": "Siswa menanyakan ARTI ISTILAH. Jelaskan artinya dengan bahasa sehari-hari, memakai bilangan yang ia sebut bila ada, lalu (bila membantu) satu contoh kecil dan kaitan singkat dengan soal.",
    "belum_paham": "Siswa BELUM PAHAM penjelasanmu sebelumnya (mis. 'gak jelas', 'hah?', 'bingung'). Itu tanda penjelasanmu belum mengena — bukan salah siswa. Akui singkat dengan wajar, lalu jelaskan LAGI bagian yang sama; jangan langsung bertanya balik dan jangan pindah ke pertanyaan pemandu. JANGAN mengulang penjelasan atau contoh yang sama dengan kata lain. Pakai PENDEKATAN BERBEDA: bilangan yang lebih kecil dan langkah yang lebih kecil, cara lain (mis. kali 10 berulang, tabel, garis bilangan, perbandingan dua bentuk), atau visual yang belum dipakai. Satu ide saja.",
    "lebih_sederhana": "Siswa minta penjelasan yang LEBIH SEDERHANA. Pakai kalimat sangat pendek, bilangan kecil, tanpa istilah baru; satu ide saja. Jangan mengulang kalimat sebelumnya.",
    "contoh_lain": "Siswa minta CONTOH LAIN. Beri satu contoh BARU dengan bilangan yang berbeda dari contoh sebelumnya (bukan bilangan soal), lengkap dan benar, lalu tunjukkan hubungannya dengan aturannya.",
    "konfirmasi": "Siswa MENYIMPULKAN sendiri langkah atau hasilnya dan minta kepastian. Periksa kesimpulannya: bila tepat, katakan tepat dan jelaskan singkat MENGAPA tepat; bila kurang tepat, tunjukkan bagian yang keliru dan alasannya (tanpa menyebut jawaban akhir yang belum ia temukan). Lalu satu dorongan kecil untuk langkah berikutnya.",
    "menjawab": "Siswa sedang MENJAWAB pertanyaanmu sebelumnya. Tanggapi jawabannya dulu: sebut bagian yang sudah tepat, atau tunjukkan dengan lembut bagian yang perlu dicek (tanpa membenarkan jawaban akhir soal), lalu lanjut satu langkah.",
    "cek_jawaban": "Siswa menyebut hasil/langkahnya dan minta DIPERIKSA. Periksa dengan sungguh-sungguh: bila benar, katakan benar dan jelaskan proses matematisnya dengan bilangan yang sama; bila keliru, tunjukkan langkah yang keliru dan alasannya, lalu beri petunjuk untuk memperbaikinya tanpa menyebut jawaban benarnya.",
    "minta_jawaban": "Siswa minta JAWABAN AKHIR soal latihan yang belum ia selesaikan. Jangan berikan jawabannya. Tolak singkat dan hangat (tanpa kalimat templat), lalu bimbing bertahap: satu petunjuk konkret untuk langkah pertama dan satu pertanyaan kecil.",
    "salah_paham": "Pesan siswa memuat dugaan yang mungkin keliru. Sebut bagian yang sudah tepat, lalu tunjukkan dengan contoh kecil di mana dugaannya tidak berlaku. Jangan bilang 'betul' untuk bagian yang keliru.",
    "lain": "Tanggapi persis apa yang ditulis siswa, sesuai pembahasan yang sedang berlangsung, lalu lanjut satu langkah.",
}


def classify_intent(text: str) -> str:
    """Jenis pesan siswa (kata kunci sederhana, bahasa sehari-hari)."""
    t = text.strip()
    for name, rx in _INTENTS:
        if rx.search(t):
            if name == "konfirmasi":
                if re.search(r"jawab|hasil|=|\d[\d.,]*\d|×\s*10", t, re.IGNORECASE):
                    return "cek_jawaban"  # "jadi hasilnya 700 ya?" = minta jawaban diperiksa
                if re.search(r"\batau\b", t, re.IGNORECASE):
                    return "bagaimana"  # "jadi pakai kali atau bagi?" = minta dibantu memilih
            return name
    if _MISCONCEPTION_HINT.search(t):
        return "salah_paham"
    return "lain"


def _last_assistant(history: list[dict[str, str]]) -> str:
    """Balasan asisten tepat sebelum pesan siswa terakhir ('' bila belum ada)."""
    for m in reversed(history[:-1]):
        if m["role"] == "assistant":
            return m["content"]
    return ""


def last_question(text: str) -> str | None:
    """Kalimat tanya terakhir di balasan asisten (untuk memahami jawaban singkat siswa)."""
    clean = _TAG.sub("", text)
    # Kalimat dipisah pada tanda baca + spasi, jadi titik ribuan ("67.000") tidak memotong kalimat.
    sentences = [x.strip() for line in clean.splitlines() for x in re.split(r"(?<=[.!?])\s+", line)]
    asks = [x for x in sentences if x.endswith("?")]
    return asks[-1] if asks else None


def classify_turn(history: list[dict[str, str]]) -> str:
    """Jenis pesan siswa terakhir DENGAN konteks (26 Nov 2026): jawaban singkat atas pertanyaan asisten
    ("ke kiri", "3 kali", "yang b") dikenali sebagai `menjawab`, bukan pesan tanpa jenis."""
    last = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
    intent = classify_intent(last)
    if intent == "lain" and last_question(_last_assistant(history)):
        return "menjawab"
    return intent


_WORD = re.compile(r"[a-zA-ZÀ-ɏ]+|\d+(?:[.,]\d+)*")
_TAG = re.compile(r"\[\[[^\[\]\n]{0,40}\]\]")


def _words(text: str) -> set[str]:
    return {w.lower() for w in _WORD.findall(_TAG.sub("", text)) if len(w) > 2 or w.isdigit()}


def similarity(a: str, b: str) -> float:
    """Kemiripan kata (Jaccard) dua balasan, 0–1."""
    wa, wb = _words(a), _words(b)
    if not wa or not wb:
        return 0.0
    return len(wa & wb) / len(wa | wb)


def opening(text: str) -> str:
    """Tiga kata pertama balasan (huruf kecil) — untuk menolak kalimat pembuka yang sama berturut-turut."""
    return " ".join(w.lower() for w in _WORD.findall(_TAG.sub("", text))[:3])


def visuals_used(history: list[dict[str, str]]) -> list[str]:
    """Id visual yang sudah tampil di percakapan (penanda [[visual:id]] pada balasan asisten)."""
    used: list[str] = []
    for m in history:
        if m["role"] == "assistant":
            used += re.findall(r"\[\[\s*visual\s*:\s*([a-z-]{2,24})\s*\]\]", m["content"], re.IGNORECASE)
    return used


# Visual yang paling membantu per jenis pertanyaan (26 Nov 2026). Langkah/proses → visual bertahap;
# alasan/arti → visual struktur (nilai tempat, kelompok nol, garis bilangan); soal cerita → tabel PMSTP dulu.
_STEPS = ("ubah-bentuk", "kali-bagi", "tambah-kurang", "geser-koma", "pmstp", "nilai-tempat", "kelompok-nol", "garis-bilangan")
_CONCEPT = ("nilai-tempat", "kelompok-nol", "garis-bilangan", "geser-koma", "pmstp", "ubah-bentuk", "kali-bagi", "tambah-kurang")
_PREFER: dict[str, tuple[str, ...]] = {
    "bagaimana": _STEPS,
    "contoh_lain": _STEPS,
    "lebih_sederhana": _CONCEPT,
    "belum_paham": _CONCEPT,
    "mengapa": _CONCEPT,
    "istilah": _CONCEPT,
    "maksud_soal": ("pmstp", *_CONCEPT),
}


def preferred_visuals(intent: str, ids: list[str], *, story: bool = False) -> list[str]:
    """Id visual yang tersedia, diurutkan menurut kecocokan dengan jenis pertanyaan (urutan aplikasi bila tidak ada).

    Soal cerita: tabel PMSTP selalu lebih dulu. Diagram kali/bagi menunjukkan operasinya, padahal memilih operasi
    adalah langkah Modelkan milik siswa (temuan simulasi 26 Nov 2026: "pakai kali atau bagi?" → contoh perkalian)."""
    order = _PREFER.get(intent)
    out = list(ids)
    if order:
        rank = {v: i for i, v in enumerate(order)}
        out = sorted(ids, key=lambda v: (rank.get(v, len(order)), ids.index(v)))
    if story and "pmstp" in out:
        out = ["pmstp", *(v for v in out if v != "pmstp")]
    return out


CONFUSED = ("belum_paham", "lebih_sederhana")
# Hal yang sedang dibahas (untuk "belum paham" berikutnya): diambil dari jenis pertanyaan siswa sebelumnya.
_SUBJECT: dict[str, str] = {
    "maksud_soal": "MAKSUD SOAL (apa yang diminta soal)",
    "mengapa": "ALASAN yang ia tanyakan",
    "bagaimana": "CARA mengerjakannya",
    "istilah": "ARTI ISTILAH yang ia tanyakan",
    "contoh_lain": "contoh yang kamu berikan",
    "salah_paham": "dugaannya yang perlu dicek",
    "cek_jawaban": "cara memeriksa jawabannya",
    "minta_jawaban": "langkah pertama soal",
    "konfirmasi": "langkah yang ia simpulkan",
}
_RETRY_SUBJECT: dict[str, str] = {
    "maksud_soal": " Untuk maksud soal, coba pecah kalimat soal per bagian, pakai perumpamaan sehari-hari, atau tunjukkan seperti apa bentuk jawabannya pada bilangan lain.",
}


def user_intents(history: list[dict[str, str]]) -> list[str]:
    """Jenis setiap pesan siswa di riwayat, berurutan."""
    return [classify_intent(m["content"]) for m in history if m["role"] == "user"]


def pending_subject(history: list[dict[str, str]]) -> str | None:
    """Jenis pertanyaan yang belum terjawab: pertanyaan siswa terakhir SEBELUM rangkaian "belum paham" sekarang."""
    intents = user_intents(history)
    for it in reversed(intents[:-1]):
        if it not in CONFUSED:
            return it
    return None


def confusion_streak(history: list[dict[str, str]]) -> int:
    """Berapa kali berturut-turut (sampai pesan terakhir) siswa bilang belum paham."""
    n = 0
    for it in reversed(user_intents(history)):
        if it not in CONFUSED:
            break
        n += 1
    return n


# ------------------------------------------------------------------ PMSTP (soal cerita, 26 Nov 2026)
PMSTP = ("Pahami", "Modelkan", "Selesaikan", "Tafsirkan", "Periksa")
_PMSTP_CUES: tuple[tuple[str, re.Pattern[str]], ...] = tuple(
    (stage, re.compile(rx, re.IGNORECASE))
    for stage, rx in (
        ("Periksa", r"\b(cek|periksa|masuk\s*akal|wajar|bener\s*ga|benar\s*tidak)\b"),
        ("Tafsirkan", r"\b(artinya\s*hasil|hasilnya\s*berarti|satuan(nya)?\s*(jawaban|hasil)|kalimat\s*jawaban)\b"),
        ("Selesaikan", r"\b(hitung(nya)?|dihitung|menghitung|ngitung(nya)?|angka\s*depan(nya)?|pangkat(nya)?|dikali(in)?|dibagi(in)?|hasil(nya)?)\b"),
        ("Modelkan", r"\b(kali\s*atau\s*bagi|bagi\s*atau\s*kali|operasi|model|rumus(nya)?|samakan|satuan|pakai\s*(kali|bagi))\b"),
        ("Pahami", r"\b(maksud|diketahui|ditanya|cerita(nya)?|apa\s*yang)\b"),
    )
)


def pmstp_stage(history: list[dict[str, str]]) -> str:
    """Tahap PMSTP yang sedang dibahas, dari pesan siswa terakhir (kembali ke tahap sebelumnya bila tidak jelas)."""
    for m in reversed([m for m in history if m["role"] == "user"]):
        for stage, rx in _PMSTP_CUES:
            if rx.search(m["content"]):
                return stage
    return "Pahami"


def turn_note(
    intent: str,
    history: list[dict[str, str]],
    visual_ids: list[str],
    *,
    story: bool = False,
    revealed: bool = False,
) -> str:
    """CATATAN GILIRAN — diletakkan sesudah riwayat agar model menjawab pesan TERAKHIR sesuai konteksnya."""
    prior = [m for m in history[:-1] if m["role"] == "assistant"]
    lines = [f"CATATAN GILIRAN INI (jangan dikutip ke siswa). {_HOW.get(intent, _HOW['lain'])}"]
    if intent == "menjawab":
        asked = last_question(_last_assistant(history))
        if asked:
            lines.append(f"Pertanyaanmu yang sedang dijawab siswa: «{asked}»")
    if prior:
        lines.append(
            "Baca riwayat: jangan mengulang contoh, kalimat pembuka, atau pertanyaan yang sudah kamu pakai. "
            "Lanjutkan dari bagian yang belum dipahami siswa. Pesan bertanda «pesan otomatis aplikasi» bukan tulisanmu: "
            "jangan meniru gayanya."
        )
    if intent in CONFUSED and prior:
        subject = pending_subject(history)
        if subject in _SUBJECT:
            lines.append(
                f"Yang belum dipahami siswa: penjelasanmu tentang {_SUBJECT[subject]}. Jelaskan ulang HAL ITU dengan cara lain."
                + _RETRY_SUBJECT.get(subject, "")
            )
        if confusion_streak(history) >= 2:
            lines.append(
                "Siswa sudah beberapa kali belum paham: mulai dari hal yang pasti ia tahu (mis. 10 × 10 = 100), "
                "pakai langkah yang jauh lebih kecil, dan cukup 2–3 kalimat pendek."
            )
    if revealed:
        lines.append(
            "Siswa SUDAH menyebut hasil akhirnya sendiri. Kamu boleh memeriksa hasil itu dan menjelaskan prosesnya "
            "langkah demi langkah dengan bilangan yang sama."
        )
    elif intent in ("mengapa", "istilah", "bagaimana", "konfirmasi", "cek_jawaban"):
        lines.append(
            "Bedakan: menjelaskan konsep/ekspresi yang ditanyakan siswa itu BOLEH (pakai bilangannya). Yang tidak boleh "
            "hanya menyebut jawaban akhir soal latihan yang belum ia sebut — untuk itu berhenti satu langkah sebelum hasilnya."
        )
    if story:
        stage = pmstp_stage(history)
        lines.append(
            f"Soal cerita — tahap PMSTP yang sedang dibahas: {stage} ({' → '.join(PMSTP)}). "
            "Bantu tahap itu saja; tahap berikutnya biar siswa yang memulai. Pada tahap Pahami/Modelkan jangan menyebut operasinya (kali atau bagi) — ajak siswa menalarnya dari cerita."
        )
    used = visuals_used(history)
    fresh = [v for v in preferred_visuals(intent, visual_ids, story=story) if v not in used]
    if fresh and intent in (*CONFUSED, "contoh_lain", "bagaimana", "mengapa", "istilah"):
        lines.append(f"Visual yang BELUM dipakai dan paling cocok: {', '.join(fresh[:2])}.")
    if used:
        lines.append(f"Visual yang sudah tampil: {', '.join(dict.fromkeys(used))} — jangan dipilih lagi.")
    if intent in (*CONFUSED, "maksud_soal"):
        lines.append(
            "Jawab kebingungannya dulu. Jangan menutup dengan pertanyaan pemandu cadangan dari KONTEKS; "
            "bila bertanya, tanyakan satu hal kecil tentang yang baru kamu jelaskan."
        )
    else:
        lines.append("Pertanyaan di akhir hanya bila perlu, paling banyak satu, dan harus nyambung dengan yang baru dijelaskan.")
    return "\n".join(lines)
