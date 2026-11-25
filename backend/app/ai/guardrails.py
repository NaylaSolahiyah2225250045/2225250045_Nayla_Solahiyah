"""Pengaman Asisten Belajar (docs/AI-TUTOR.md §Guardrails).

1. Sensor data pribadi pada pesan siswa SEBELUM dikirim ke penyedia AI (email, nomor HP).
2. Saringan balasan AI — "AI tidak menghitung" (CLAUDE.md §2b):
   - balasan yang memuat kunci jawaban (dalam bentuk apa pun yang dikirim klien) ditolak;
   - balasan yang memuat ANGKA BARU (tidak ada di soal, pertanyaan pemandu/aturan umum, atau pesan siswa) ditolak,
     sehingga angka hasil hitungan AI yang belum diverifikasi mesin tidak pernah tampil;
   - balasan kosong atau terlalu panjang (beban kognitif) ditolak.
   Balasan yang ditolak diganti pesan cadangan berisi pertanyaan pemandu RMT (lihat tutor.py).
Tanpa floating point: angka dibandingkan sebagai string digit.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from fractions import Fraction

from .mathcheck import atoms, check_math, group_spaced_thousands, normalize

MAX_USER_CHARS = 300
MAX_HISTORY = 16  # 8 giliran (26 Nov 2026; dulu 10 = 5 giliran, topik awal cepat hilang)
MAX_REPLY_WORDS = 150  # kata dalam KALIMAT (tabel & diagram tidak dihitung); prompt meminta ±80 kata. Terlalu ketat → penjelasan wajar jatuh ke cadangan (uji 25 Nov 2026)
MAX_VISUAL_LINES = 10  # baris tabel/diagram teks paling banyak (beban kognitif; prompt meminta tabel ≤ 5 baris)

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# Nomor HP Indonesia: 08…, +62 8…, 62 8… (boleh dipisah spasi/strip). Bilangan matematika tidak diawali 08.
_PHONE_RE = re.compile(r"(?<![\d,.])(?:\+?62[\s-]?|0)8\d(?:[\s-]?\d){6,11}(?!\d|[.,]\d)")

_SUPERSCRIPT = str.maketrans({"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+"})
_SUP_RUN_RE = re.compile(r"[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+")
_NUMBER_RE = re.compile(r"\d+(?:[.,]\d+)*")
# Pangkat negatif ditulis "−5"/"-5": tanda minus tidak memengaruhi digit, jadi cukup digitnya yang dibandingkan.

# Angka umum yang selalu boleh (bilangan dasar 10, angka 1, nol).
_ALWAYS_ALLOWED = {"0", "1"}


def scrub_personal(text: str) -> str:
    """Sembunyikan email & nomor HP sebelum teks dikirim ke penyedia AI."""
    text = _EMAIL_RE.sub("[email disembunyikan]", text)
    return _PHONE_RE.sub("[nomor disembunyikan]", text)


def _expand_superscripts(text: str) -> str:
    """'10⁻⁵' → '10^-5' agar pangkat terbaca sebagai angka terpisah."""
    return _SUP_RUN_RE.sub(lambda m: "^" + m.group(0).translate(_SUPERSCRIPT), text)


def _canonical(token: str) -> str:
    """Digit saja, tanpa nol di depan/belakang: '4.500.000' → '45', '0,0072' → '72', '4,5' → '45'."""
    digits = re.sub(r"\D", "", token).strip("0")
    return digits or "0"


def number_tokens(text: str) -> set[str]:
    """Himpunan angka (bentuk kanonik) di dalam teks, termasuk pangkat superskrip."""
    return {_canonical(t) for t in _NUMBER_RE.findall(_expand_superscripts(group_spaced_thousands(text)))}


def _norm_expr(text: str) -> str:
    """Normalisasi untuk mencari kunci jawaban: superskrip → ^n, tanpa spasi, '×/x/*' disamakan,
    titik ribuan di antara digit dihapus, minus disamakan."""
    t = _expand_superscripts(text).lower()
    t = t.replace("−", "-").replace("–", "-")
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"[x*·]", "×", t)
    t = re.sub(r"(?<=\d)\.(?=\d{3})", "", t)
    t = t.replace("^(", "^").replace(")", "")
    return t


_PLAIN_NUMBER_RE = re.compile(r"-?\d+(?:,\d+)?")
# Kunci yang tepat "10" (mis. soal semut, hasil 1 × 10¹): angka 10 di frasa aturan umum bukan jawaban
# ("1 ≤ a < 10", "di antara 1 dan 10", "10 atau lebih", "dikali 10"). Uji 25 Nov 2026: penjelasan wajar ditolak.
_TEN_PHRASES = re.compile(
    r"\b1\s*(?:dan|sampai|hingga|[–-])\s*10\b(?![\d,.]\d)|[<≤>≥]\s*10\b(?![\d,.]\d)|\b10\s*[<≤>≥]"
    r"|\b(?:kurang|lebih)\s+dari\s+10\b(?![\d,.]\d)|\b10\s+atau\s+(?:lebih|kurang)\b"
    r"|×\s*10(?![\d⁰¹²³⁴⁵⁶⁷⁸⁹⁻^]|\s*[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻])|\b10(?=\s*×)"
    r"|\b(?:dengan|dibagi|dikali|dikalikan|kali|bagi|basis|pangkat)\s+10\b(?![\d,.]\d|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻^])|\b10\s+(?:kali|pangkat)\b",
    re.IGNORECASE,
)
_BASE10_RE = re.compile(r"10\^[-+]?\d+")


def _loose_numbers(normed: str) -> set[str]:
    """Bilangan yang berdiri sendiri pada teks ternormalisasi (basis 10 dari 10ⁿ tidak dihitung)."""
    return set(re.findall(r"\d+(?:,\d+)?", _BASE10_RE.sub(" ", normed)))


def leaks_key(reply: str, key_texts: list[str]) -> bool:
    """True bila balasan memuat salah satu bentuk kunci jawaban (hanya kunci yang memuat angka).

    Kunci berupa bilangan ("1.000", "0,0056") dicocokkan per bilangan utuh, sehingga contoh serupa "100.000"
    tidak dianggap membocorkan kunci "1.000". Kunci berupa ekspresi ("4,5 × 10^6") dicocokkan sebagai potongan.
    (Aturan yang sama dengan frontend lib/assistantVisuals.js `leaksKey`.)
    """
    if any(_norm_expr(k) == "10" for k in key_texts):
        reply = _TEN_PHRASES.sub(" ", reply)
    r = _norm_expr(group_spaced_thousands(reply))
    loose = _loose_numbers(r)
    for key in key_texts:
        if not re.search(r"\d", key):
            continue
        k = _norm_expr(key)
        if not k:
            continue
        if _PLAIN_NUMBER_RE.fullmatch(k):
            if k.lstrip("-") in loose:
                return True
        elif k in r:
            return True
    return _leaks_key_value(reply, key_texts)


def _leaks_key_value(reply: str, key_texts: list[str]) -> bool:
    """Kunci dicocokkan menurut NILAI (25 Nov 2026): "5,0 × 10⁻²" sama dengan kunci "5 × 10⁻²".
    Kunci a × 10ⁿ dibandingkan dengan suku a × 10ⁿ di balasan, kunci 10ⁿ dengan suku 10ⁿ, dan kunci bilangan biasa
    (≥ 2 digit) dengan bilangan biasa — sehingga bilangan soal sendiri (mis. 0,05) tidak dianggap bocor."""
    found = atoms(reply)
    for key in key_texts:
        if not re.search(r"\d", key):
            continue
        key_atoms = atoms(key)
        if len(key_atoms) != 1:
            continue
        kind, value = key_atoms[0]
        if kind == "plain" and len(re.sub(r"\D", "", key)) < 2:
            continue
        if any(k == kind and v == value for k, v in found):
            return True
    return False


_VISUAL_TAG_RE = re.compile(r"\[\[\s*visual\s*:\s*([a-z-]{2,24})\s*\]\]", re.IGNORECASE)
_ANY_TAG_RE = re.compile(r"[ \t]*\[\[[^\[\]\n]{0,40}\]\]")


def extract_visual(reply: str, allowed_ids: list[str]) -> tuple[str, str | None]:
    """Pisahkan penanda [[visual:id]] dari balasan. Kembalikan (teks tanpa penanda, id) — id hanya bila ada
    di daftar visual yang dikirim klien (visual dibuat & dihitung oleh aplikasi, bukan oleh AI)."""
    found = [m.lower() for m in _VISUAL_TAG_RE.findall(reply)]
    # Semua penanda [[…]] dibuang dari teks, termasuk yang salah tulis (mis. "[[visual:1]]"), agar tidak tampil.
    text = _ANY_TAG_RE.sub("", reply).strip()
    chosen = next((v for v in found if v in allowed_ids), None)
    return text, chosen


@dataclass(frozen=True)
class ReplyCheck:
    ok: bool
    reason: str | None = None  # empty | key | number | computes | wrong_math | long
    detail: str | None = None  # mis. persamaan yang salah (untuk permintaan tulis ulang; tanpa kunci jawaban)


_EXP_RE = re.compile(r"\^([-+]?\d+)")
# Bilangan cacah kecil untuk penjelasan ("bertambah 3 nol", "langkah ke-2") — kecuali pangkat kunci soal ini.
_SMALL_COUNTS = {str(i) for i in range(2, 13)}
_MAX_FREE_EXP = 20


def _exponent_tokens(text: str) -> set[str]:
    """Pangkat yang ditulis di teks (10⁹ → '9'), bentuk kanonik."""
    return {_canonical(m) for m in _EXP_RE.findall(_expand_superscripts(text)) if abs(int(m)) <= _MAX_FREE_EXP}


def answer_revealed(key_texts: list[str], student_text: str) -> bool:
    """True bila SISWA sendiri sudah menulis jawaban akhir (bentuk apa pun dari kunci), mis. "kenapa 10³ hasilnya 1000?".

    26 Nov 2026: menjelaskan konsep ≠ membocorkan jawaban. Hasil yang sudah disebut siswa bukan rahasia lagi, jadi
    asisten boleh memeriksa dan menjelaskan prosesnya (dulu penjelasan "10 × 10 × 10 = 1.000" ditolak sebagai bocoran,
    lalu model berganti membahas 10⁵ — tidak menjawab pertanyaan siswa)."""
    return bool(student_text.strip()) and any(leaks_key(student_text, [k]) for k in key_texts if re.search(r"\d", k))


def check_reply(
    reply: str,
    *,
    allowed_sources: list[str],
    key_texts: list[str],
    question: str = "",
    student_text: str = "",
) -> ReplyCheck:
    """Periksa balasan AI sebelum ditampilkan ke siswa.

    Sejak 25 Nov 2026 AI boleh membuat contoh kecil sendiri untuk menjelaskan konsep. Angka baru boleh tampil bila:
    ada di soal/pemandu/visual/pesan siswa, ada di persamaan atau baris tabel yang TERBUKTI BENAR (mathcheck,
    pecahan eksak), berupa pangkat 10ⁿ, atau bilangan cacah kecil 2–12. Persamaan "=" yang salah → ditolak.
    Pangkat & angka depan KUNCI soal ini tetap terlarang kecuali sudah ada di soal/pesan siswa.

    26 Nov 2026 — konsep vs jawaban akhir (`student_text` = semua pesan siswa):
    - jawaban akhir yang sudah ditulis siswa sendiri → boleh dibahas, diperiksa, dan dihitung prosesnya;
    - ekspresi/hasil yang ditanyakan siswa (mis. "kenapa 10³ × 10⁴ jadi 10⁷?") → boleh dijelaskan langsung;
    - yang tetap ditolak: jawaban akhir yang BELUM disebut siswa, dan mengerjakan soal sampai hasil baru.
    """
    text = reply.strip()
    if not text:
        return ReplyCheck(False, "empty")
    revealed = answer_revealed(key_texts, student_text)
    if revealed:
        key_texts = []
    if leaks_key(text, key_texts):
        return ReplyCheck(False, "key")
    math = check_math(text)
    if math.wrong:
        return ReplyCheck(False, "wrong_math", math.wrong[0])
    student_atoms = set(atoms(student_text)) if student_text else set()
    student_values = {v for _, v in student_atoms}
    # pangkat yang ditulis siswa ("10⁷" → 7) juga miliknya: "3 + 4 = 7" menjelaskan pertanyaannya, bukan menghitung soal
    student_values |= {Fraction(int(e)) for e in re.findall(r"10\^\(([-+]?\d+)\)", normalize(student_text))} if student_text else set()
    if question and not revealed and (
        _computes_question(math.pairs, question, student_values) or _converts_question(text, question, student_atoms)
    ):
        return ReplyCheck(False, "computes")
    if question and (bad := _misformatted_question_number(text, question)):
        return ReplyCheck(False, "format", bad)
    source_tokens = set(_ALWAYS_ALLOWED)
    for src in allowed_sources:
        source_tokens |= number_tokens(src)
    # Bagian kunci (pangkat & angka depan) yang belum ada di soal: tidak boleh muncul dalam bentuk apa pun.
    key_parts: set[str] = set()
    for key in key_texts:
        if re.search(r"\d", key):
            mantissa = {_canonical(t) for t in _NUMBER_RE.findall(_expand_superscripts(key).split("^")[0])}
            key_parts |= _exponent_tokens(key) | {m for m in mantissa if len(m) >= 2}
    key_parts -= source_tokens | _ALWAYS_ALLOWED
    tokens = number_tokens(text)
    verified = number_tokens(" ".join(math.verified))
    if _leaks_key_mantissa(text, key_texts, question):
        return ReplyCheck(False, "key")
    # Angka di contoh yang terbukti benar (dan tidak menghitung bilangan soal) boleh, meski sama dengan bagian kunci.
    if (tokens & key_parts) - verified:
        return ReplyCheck(False, "number")
    allowed = (
        source_tokens | _SMALL_COUNTS | _exponent_tokens(text) | verified | _shift_pairs(text)
        | _example_mantissas(text, question) | _cued_examples(text, question)
    )
    if tokens - allowed:
        return ReplyCheck(False, "number")
    prose, visual = split_visual_lines(text)
    if len(" ".join(prose).split()) > MAX_REPLY_WORDS or len(visual) > MAX_VISUAL_LINES:
        return ReplyCheck(False, "long")
    return ReplyCheck(True)


_OP_RE = re.compile(r"[×:/+\-]|\^")


def _computes_question(pairs: list[tuple[str, str]], question: str, student_values: set[Fraction] | None = None) -> bool:
    """True bila AI "mengerjakan" soal: satu sisi persamaan berisi operasi dengan bilangan soal saja, sisi lain
    memunculkan angka baru (mis. "10⁷ : 10⁴ = 10³" untuk soal 4,5 × 10⁷ : 9 × 10⁴). Contoh dengan bilangan lain boleh."""
    # Dicek per SUKU bilangan soal (25 Nov 2026), bukan per digit: contoh "(2 × 10²) × (3 × 10³)" tidak lagi dianggap
    # menghitung soal "(5 × 10³) × (4 × 10²)" hanya karena digit 2 dan 3 juga muncul di soal.
    q: set = set()
    for kind, value in atoms(question):
        q.add(value)
    for m in re.finditer(r"(\d[\d.,]*)\s*×\s*10\^\(([-+]?\d+)\)", normalize(question)):
        q.add(atoms(m.group(1))[0][1] if atoms(m.group(1)) else None)  # angka depan
        q.add(Fraction(10) ** int(m.group(2)))  # 10ⁿ
        q.add(Fraction(int(m.group(2))))  # pangkatnya (untuk "7 − 4")
    for left, right in pairs:
        for a, b in ((left, right), (right, left)):
            va, vb = [v for _, v in atoms(a)], [v for _, v in atoms(b)]
            # Hasil yang sudah ditulis siswa sendiri (yang ia tanyakan) bukan hasil baru: menjelaskannya boleh.
            new = [v for v in vb if v not in q and v not in (student_values or set())]
            if len(va) >= 2 and all(v in q for v in va) and _OP_RE.search(a) and new:
                return True
    return False


def _converts_question(text: str, question: str, student_atoms: set[tuple[str, Fraction]] | None = None) -> bool:
    """True bila AI menulis bilangan SOAL dalam bentuk lain, mis. "2,3 × 10⁻⁴ = 0,00023" atau "… geser … → 0,00023"
    untuk soal yang memuat 2,3 × 10⁻⁴ (uji 25 Nov 2026). Mengubah bentuk bilangan soal adalah pekerjaan siswa —
    kecuali bentuk itu sudah ditulis siswa sendiri (26 Nov 2026; dicocokkan per BENTUK, bukan hanya nilai, agar siswa
    yang sekadar mengutip bilangan soal tidak membuka pengaman ini)."""
    student_atoms = student_atoms or set()
    q = set(atoms(question))
    q_values: dict[Fraction, set[str]] = {}
    for kind, value in q:
        q_values.setdefault(value, set()).add(kind)
    for kind, value in atoms(text):
        if value in (0, 1) or (kind, value) in q or (kind, value) in student_atoms:
            continue
        if kind not in q_values.get(value, {kind}):
            return True
    return False


_SEP_NUMBER = re.compile(r"\d+(?:[.,]\d+)+")


def _misformatted_question_number(text: str, question: str) -> str | None:
    """Bilangan soal yang ditulis dengan pemisah tertukar, mis. "3,725" padahal soalnya 3.725 (uji 25 Nov 2026).
    Nilainya jadi lain, dan siswa bisa bingung; minta ditulis ulang persis seperti di soal."""
    swap = str.maketrans(".,", ",.")
    for tok in set(_SEP_NUMBER.findall(question)):
        wrong = tok.translate(swap)
        if wrong in question:
            continue
        if re.search(rf"(?<![\d.,]){re.escape(wrong)}(?![.,]?\d)", text):
            return f"{wrong} seharusnya ditulis {tok} (seperti di soal; titik = ribuan, koma = desimal)"
    return None


def _digits_of(value: Fraction) -> str:
    """Digit bermakna sebuah bilangan desimal eksak (0,0045 → '45', 4.500 → '45'); '' bila bukan desimal berhingga."""
    x = abs(value)
    for k in range(31):
        y = x * 10**k
        if y.denominator == 1:
            return _canonical(str(y.numerator))
    return ""


def _shift_pairs(text: str) -> set[str]:
    """Bilangan contoh yang muncul sebagai PASANGAN GESER KOMA: digit sama, nilai berbeda kelipatan 10
    (mis. "0,0045 … 4,5", "56 → 5,6"). Contoh pergeseran seperti itu konsisten dengan sendirinya, jadi boleh tampil
    walau tidak ditulis sebagai persamaan "=" (uji 25 Nov 2026: tabel langkah yang benar sempat ditolak)."""
    groups: dict[str, set[Fraction]] = {}
    for kind, value in atoms(text):
        if kind == "pow" or value == 0:
            continue
        digits = _digits_of(value)
        if digits:
            groups.setdefault(digits, set()).add(value)
    return {digits for digits, values in groups.items() if len(values) >= 2}


def _leaks_key_mantissa(text: str, key_texts: list[str], question: str) -> bool:
    """Angka depan kunci (mis. 4,05 untuk soal 4.050 → 4,05 × 10³) disebut sendiri, misalnya "a-nya 4,05".

    Celah lama (ditemukan 25 Nov 2026): digitnya sama dengan bilangan soal ('405'), jadi lolos saringan token.
    Sekarang dibandingkan menurut NILAI: nilai angka depan kunci yang bukan nilai bilangan di soal tidak boleh muncul
    sama sekali — juga di persamaan yang benar (mis. "4,05 × 1.000 = 4.050" tetap membocorkan jawaban).

    26 Nov 2026: hanya angka depan BERKOMA (4,05; 1,2). Angka depan bulat 1–9 terlalu umum (banyak faktor, pangkat,
    hitungan), sehingga "Pangkat 3 menunjukkan banyaknya faktor 10" sempat ditolak untuk kunci 3 × 10³."""
    q_values = {v for _, v in atoms(question)} if question else set()
    mantissas: set[Fraction] = set()
    for key in key_texts:
        if "×" in key:
            for kind, v in atoms(key.split("×")[0]):
                if kind == "plain" and v.denominator != 1 and v not in q_values:
                    mantissas.add(v)
    return bool(mantissas) and any(kind == "plain" and v in mantissas for kind, v in atoms(text))


_RAW_NUMBER = re.compile(r"(?<![\d.,])\d{1,3}(?:\.\d{3})+(?:,\d+)?|(?<![\d.,])\d+(?:,\d+)?")
_EXAMPLE_CUE = re.compile(r"\b(contoh(nya)?|misal(nya)?|bayangkan|pikirkan|ambil|anggap|seperti|bilangan|angka|kita punya)\b", re.IGNORECASE)
_CLAIM_CUE = re.compile(r"\b(hasil(nya)?|jawab(an|annya)?|jadi|menjadi|sekitar|kira-kira|sama dengan)\b|=|→", re.IGNORECASE)


def _cued_examples(text: str, question: str) -> set[str]:
    """Bilangan CONTOH yang jelas diperkenalkan sebagai contoh: "pikirkan bilangan 12.400", "(misalnya 1.240)".

    Uji 26 Nov 2026: contoh nilai tempat yang wajar ditolak karena bilangannya tidak ditulis dalam persamaan.
    Syarat (hati-hati): ±30 karakter sebelumnya memuat kata contoh, ±15 karakter sebelumnya TIDAK memuat kata klaim
    hasil ("hasilnya", "jadi", "=", "kira-kira"), digitnya bukan potongan bilangan soal, dan bilangan yang sama tidak
    muncul juga tanpa penanda contoh. Kunci jawaban tetap disaring lebih dulu."""
    t = group_spaced_thousands(text)
    q_digits = [_digits_of(v) for _, v in atoms(question)] if question else []
    cued: set[str] = set()
    plain: set[str] = set()
    for m in _RAW_NUMBER.finditer(t):
        canon = _canonical(m.group(0))
        before = t[max(0, m.start() - 30) : m.start()]
        near = t[max(0, m.start() - 15) : m.start()]
        part_of_question = len(canon) >= 2 and any(_is_subsequence(canon, d) for d in q_digits if d)
        if _EXAMPLE_CUE.search(before) and not _CLAIM_CUE.search(near) and not part_of_question:
            cued.add(canon)
        else:
            plain.add(canon)
    return cued - plain


def _is_subsequence(small: str, big: str) -> bool:
    it = iter(big)
    return all(ch in it for ch in small)


def _example_mantissas(text: str, question: str) -> set[str]:
    """Angka depan CONTOH yang berdiri sendiri, mis. "a boleh 2,5 atau 7" atau "contoh bentuk baku: 3,2 × 10⁵".

    Uji 25 Nov 2026: penjelasan maksud soal yang wajar ("angka depannya harus di antara 1 dan 10, misalnya 2,5")
    ditolak sebagai angka baru, lalu jatuh ke cadangan. Contoh seperti itu bukan klaim hitungan, jadi boleh — dengan
    syarat sempit: nilai 1–10 dengan paling banyak satu angka di belakang koma, tidak dipakai juga sebagai bilangan
    lain di balasan yang sama, dan digitnya BUKAN potongan bilangan soal (agar "4,5" untuk soal 4.050 tetap ditolak).
    Kunci jawaban tetap disaring lebih dulu (leaks_key & key_parts)."""
    q_digits = [_digits_of(v) for _, v in atoms(question)] if question else []
    examples: set[str] = set()
    others: set[str] = set()
    for kind, value in atoms(text):
        mantissa = value
        if kind == "sci":
            while mantissa >= 10:
                mantissa /= 10
            while 0 < mantissa < 1:
                mantissa *= 10
        digits = _digits_of(mantissa)
        if kind != "pow" and 1 <= mantissa < 10 and (mantissa * 10).denominator == 1 and digits:
            if not any(_is_subsequence(digits, d) for d in q_digits if d):
                examples.add(digits)
                continue
        if kind == "plain" and digits:
            others.add(digits)
    return examples - others


def split_visual_lines(text: str) -> tuple[list[str], list[str]]:
    """Pisahkan baris kalimat dari baris visual (tabel Markdown `| … |` dan isi blok ``` diagram teks)."""
    prose: list[str] = []
    visual: list[str] = []
    fenced = False
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("```"):
            fenced = not fenced
            continue
        if fenced or s.startswith("|"):
            if s and not re.fullmatch(r"\|?[\s:|-]+\|?", s):  # baris pemisah tabel tidak dihitung
                visual.append(s)
        elif s:
            prose.append(s)
    return prose, visual


def tidy(reply: str) -> str:
    """Rapikan balasan: buang penanda Markdown tebal/judul & baris kosong berlebih."""
    text = reply.strip().replace("**", "")
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    # label sisa dari model ("(pertanyaan)", "Pertanyaan pemandu:") tidak perlu tampil
    text = re.sub(r"^\s*\(?pertanyaan(?: pemandu)?\)?\s*:?\s*$", "", text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"\s*\(pertanyaan\)\s*$", "", text, flags=re.MULTILINE | re.IGNORECASE)
    return re.sub(r"\n{3,}", "\n\n", text)
