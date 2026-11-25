"""Pemeriksa persamaan di balasan Asisten Belajar (25 Nov 2026).

AI boleh membuat contoh kecil sendiri untuk menjelaskan konsep ("67.000 = 6,7 × 10.000 = 6,7 × 10⁴") dan
tabel ("| 10⁹ | 1.000.000.000 | satu miliar |"). Agar tidak ada angka keliru yang tampil:
- setiap rantai "A = B = C" dihitung ulang dengan aritmetika PECAHAN EKSAK (fractions.Fraction, tanpa floating
  point) — satu saja persamaan "=" yang salah membuat balasan ditolak (guardrails, alasan "wrong_math");
- angka di persamaan yang terbukti benar (juga "A → B" / "A menjadi B" dan baris tabel yang nilainya sama)
  dianggap TERVERIFIKASI dan boleh tampil;
- "→" dan "menjadi" tidak pernah dianggap salah, karena sering dipakai untuk langkah geser koma
  ("4,7 → 47 → 470"), bukan untuk kesamaan nilai.

Ekspresi yang dikenali: bilangan format Indonesia (4.500.000; 0,05), 10ⁿ / 10^n (pangkat boleh berupa ekspresi
superskrip seperti 10²⁺⁵), ×, :, /, +, −, dan kurung. Teks lain memutus ekspresi.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from fractions import Fraction

from ..sci.core import parse_standard

_SUP = str.maketrans({"⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+", "⁽": "(", "⁾": ")"})
_SUP_RUN = re.compile(r"[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺⁽⁾]+")
_NUM = re.compile(r"\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?")
_MATH_RUN = re.compile(r"[0-9.,^()×:/+\-\s]+")
_MAX_EXP = 60


# Kalimat aritmetika bahasa Indonesia (25 Nov 2026): "6,7 dikalikan 10, hasilnya menjadi 67" → "6,7 × 10 = 67".
# Hanya bila operasi terletak DI ANTARA dua bilangan; kalimat elips ("Kalau dikalikan 100, hasilnya 670")
# tidak diubah menjadi persamaan sehingga tidak dinilai salah.
_NUM_TXT = r"\d[\d.,]*(?:\^\([^()]*\))?"
_NL_OPS = (
    (re.compile(rf"({_NUM_TXT})\s+(?:dikalikan dengan|dikalikan|dikali)\s+(?=\d)", re.IGNORECASE), r"\1 × "),
    (re.compile(rf"({_NUM_TXT})\s+(?:dibagi dengan|dibagi)\s+(?=\d)", re.IGNORECASE), r"\1 : "),
)
_NL_EQ = re.compile(rf"(?<=\d|\))\s*,?\s*(?:hasilnya menjadi|hasilnya adalah|hasilnya|sama dengan|setara dengan|bernilai)\s+(?=\d)", re.IGNORECASE)
# "6.700.000 ditulis 6,7 × 10⁴", "0,05 jadi 5": klaim perubahan bentuk → diperlakukan seperti panah (dinilai salah hanya
# bila salah satu sisinya bentuk a × 10ⁿ, agar langkah geser koma "4,7 jadi 47" tidak dicap salah).
_NL_ARROW = re.compile(r"(?<=\d)\s+(?:ditulis sebagai|ditulis menjadi|ditulis|jadi)\s+(?=\d)", re.IGNORECASE)


# "6 700 000" / "6\u202f700\u202f000" (spasi biasa, tak-putus, atau sempit sebagai pemisah ribuan) → "6.700.000".
# Tanpa ini bilangan seperti itu terbaca sebagai angka-angka kecil terpisah dan lolos pemeriksaan (temuan 25 Nov 2026).
_SPACED_THOUSANDS = re.compile(r"(?<![\d,.])\d{1,3}(?:[ \u00a0\u202f\u2009]\d{3})+(?![\d])")


def group_spaced_thousands(text: str) -> str:
    return _SPACED_THOUSANDS.sub(lambda m: re.sub(r"[ \u00a0\u202f\u2009]", ".", m.group(0)), text)


def normalize(text: str) -> str:
    """Superskrip → ^(…), tanda kali/minus/bagi disamakan, LaTeX sederhana dibuang, kalimat aritmetika → simbol."""
    t = group_spaced_thousands(text.replace("**", ""))
    t = _SUP_RUN.sub(lambda m: "^(" + m.group(0).translate(_SUP) + ")", t)
    t = t.replace("$", "").replace("\\times", "×").replace("\\cdot", "×").replace("\\div", ":")
    t = t.replace("\\(", "").replace("\\)", "").replace("\\[", "").replace("\\]", "")
    t = re.sub(r"\\frac\{([^{}]*)\}\{([^{}]*)\}", r"(\1)/(\2)", t)
    t = re.sub(r"\\text\{([^{}]*)\}", r"\1", t)
    t = re.sub(r"\^\{([^{}]*)\}", r"^(\1)", t)
    t = t.replace("{,}", ",").replace("{", "").replace("}", "").replace("\\,", " ")
    t = t.replace("−", "-").replace("–", "-").replace("·", "×").replace("÷", ":")
    t = re.sub(r"(?<=\d)\s*[x*]\s*(?=\d)", " × ", t)
    for pattern, repl in _NL_OPS:
        t = pattern.sub(repl, t)
    t = _NL_EQ.sub(" = ", t)
    t = _NL_ARROW.sub(" → ", t)
    return t


class _Parser:
    """Recursive descent: expr = term (('+'|'-') term)*; term = unary (('×'|':'|'/') unary)*;
    unary = '-' unary | power; power = primary ('^' primary)?; primary = number | '(' expr ')'."""

    def __init__(self, s: str) -> None:
        self.s = re.sub(r"\s", "", s)
        self.i = 0

    def peek(self) -> str:
        return self.s[self.i] if self.i < len(self.s) else ""

    def parse(self) -> Fraction | None:
        try:
            v = self.expr()
        except (ValueError, ZeroDivisionError, OverflowError):
            return None
        return v if self.i == len(self.s) else None

    def expr(self) -> Fraction:
        v = self.term()
        while self.peek() in ("+", "-"):
            op = self.peek()
            self.i += 1
            w = self.term()
            v = v + w if op == "+" else v - w
        return v

    def term(self) -> Fraction:
        v = self.unary()
        while self.peek() in ("×", ":", "/"):
            op = self.peek()
            self.i += 1
            w = self.unary()
            v = v * w if op == "×" else v / w
        return v

    def unary(self) -> Fraction:
        if self.peek() == "-":
            self.i += 1
            return -self.unary()
        if self.peek() == "+":
            self.i += 1
            return self.unary()
        return self.power()

    def power(self) -> Fraction:
        base = self.primary()
        if self.peek() == "^":
            self.i += 1
            if self.peek() == "-":  # 10^-3
                self.i += 1
                e = -self.primary()
            else:
                e = self.primary()
            if e.denominator != 1 or abs(e) > _MAX_EXP:
                raise ValueError("pangkat tidak wajar")
            return base ** int(e)
        return base

    def primary(self) -> Fraction:
        if self.peek() == "(":
            self.i += 1
            v = self.expr()
            if self.peek() != ")":
                raise ValueError("kurung")
            self.i += 1
            return v
        m = _NUM.match(self.s, self.i)
        if not m:
            raise ValueError("bukan bilangan")
        self.i = m.end()
        return _fraction(m.group(0))


def _fraction(lit: str) -> Fraction:
    x = parse_standard(lit)
    if x is None:
        if re.fullmatch(r"[0.,]+", lit):
            return Fraction(0)
        raise ValueError("bilangan")
    mant = Fraction(int(x.digits))
    shift = x.exp - (len(x.digits) - 1)
    return x.sign * mant * (Fraction(10) ** shift)


def evaluate(expr: str) -> Fraction | None:
    """Nilai eksak sebuah ekspresi (sudah dinormalisasi), atau None bila bukan ekspresi angka yang lengkap."""
    e = expr.strip()
    # buang sisa di ujung: titik/koma kalimat, operator menggantung, kurung tak berpasangan ("1.000.000.000 (")
    while True:
        t = e.strip().strip(".,").strip().rstrip("(+-×:/").rstrip().lstrip(")×:/+").lstrip()
        if t.count("(") > t.count(")") and t.startswith("("):
            t = t[1:]
        if t.count(")") > t.count("(") and t.endswith(")"):
            t = t[:-1]
        if t == e:
            break
        e = t
    if not e or not re.search(r"\d", e):
        return None
    return _Parser(e).parse()


# Kata yang menandakan ekspresi belum selesai (mis. "45 dikali 10 = 450", "10⁹ = 1 diikuti 9 nol"):
# di batas seperti ini persamaan tidak dinilai salah, hanya tidak diverifikasi.
_OPEN_BEFORE = re.compile(r"(?:dikalikan|dikalikan dengan|dibagi dengan|dengan|dikali|dibagi|ditambah|dikurangi|kali|bagi|tambah|kurang|pangkat|ke-|posisi|sebanyak)\s*$", re.IGNORECASE)
_OPEN_AFTER = re.compile(r"^\s*(?:diikuti|kali|angka|nol|digit|tempat|lompatan|langkah|buah|x\b)", re.IGNORECASE)


_LIST_MARK = re.compile(r"^\s*(?:[-•*–]|\d{1,2}[.)])\s+")

# ------------------------------------------------------------------ suku bilangan (untuk saringan kunci & "menghitung soal")
_SCI_ATOM = re.compile(r"(\d[\d.,]*)\s*×\s*10\^\(([-+]?\d+)\)")
_POW_ATOM = re.compile(r"(?<![\d,.])10\^\(([-+]?\d+)\)")
_PLAIN_ATOM = re.compile(r"(?<![\d,.^(])\d{1,3}(?:\.\d{3})+(?:,\d+)?|(?<![\d,.^(])\d+(?:,\d+)?")


def atoms(text: str) -> list[tuple[str, Fraction]]:
    """Suku bilangan di teks: ('sci', nilai) untuk a × 10ⁿ, ('pow', nilai) untuk 10ⁿ, ('plain', nilai) untuk bilangan biasa.
    Nilai eksak (pecahan). Teks dinormalisasi lebih dulu (superskrip, spasi ribuan, LaTeX)."""
    t = normalize(_LIST_MARK.sub("", text)) if "^(" not in text else text
    out: list[tuple[str, Fraction]] = []

    def take(rx: re.Pattern[str], kind: str, value) -> None:  # type: ignore[no-untyped-def]
        nonlocal t
        for m in rx.finditer(t):
            try:
                out.append((kind, value(m)))
            except (ValueError, ZeroDivisionError):
                continue
        t = rx.sub(" ", t)

    take(_SCI_ATOM, "sci", lambda m: _fraction(m.group(1).rstrip(".,")) * Fraction(10) ** int(m.group(2)))
    take(_POW_ATOM, "pow", lambda m: Fraction(10) ** int(m.group(1)))
    take(_PLAIN_ATOM, "plain", lambda m: _fraction(m.group(0)))
    return out


def _trailing_math(seg: str) -> str:
    m = list(_MATH_RUN.finditer(seg))
    return m[-1].group(0) if m and m[-1].end() == len(seg) else ""


def _leading_math(seg: str) -> str:
    m = _MATH_RUN.match(seg)
    return m.group(0) if m else ""


@dataclass
class MathCheck:
    verified: list[str] = field(default_factory=list)  # potongan teks yang terbukti benar
    wrong: list[str] = field(default_factory=list)  # persamaan "=" yang salah
    pairs: list[tuple[str, str]] = field(default_factory=list)  # (kiri, kanan) yang terbukti sama nilainya


_DIR = re.compile(r"\bke\s+(kiri|kanan)\b", re.IGNORECASE)
_DIR_SKIP = re.compile(r"\b(dibagi|bagi|pembagian|dikali|dikalikan|kalikan|perkalian|bukan|salah|jangan|keliru|padahal|seharusnya|harusnya)\b|:", re.IGNORECASE)
_TARGET_CUE = re.compile(r"\b(jadi|menjadi|supaya|agar|sehingga|ditulis|hasilnya)\b|→", re.IGNORECASE)
_SENTENCE = re.compile(r"(?<=[.!?])\s+")


def _first_atom(t: str) -> tuple[int, str, re.Match[str]] | None:
    """Suku bilangan PERTAMA (menurut letak) di teks yang sudah dinormalisasi: bentuk baku didahulukan bila seletak."""
    found = [(m.start(), rank, kind, m) for rank, (kind, rx) in enumerate((("sci", _SCI_ATOM), ("pow", _POW_ATOM), ("plain", _PLAIN_ATOM))) if (m := rx.search(t))]
    if not found:
        return None
    start, _, kind, m = min(found, key=lambda f: (f[0], f[1]))
    return start, kind, m


def check_shift_direction(text: str) -> list[str]:
    """Arah geser koma yang salah dalam KALIMAT (25 Nov 2026), mis. "2,3 × 10⁻⁴ → geser koma 4 tempat ke kanan".

    Uji percakapan menemukan model sering menulis arah terbalik; persamaannya tidak salah, jadi lolos pemeriksaan
    lain. Sengaja hati-hati (lebih baik tidak menilai daripada salah menolak). Kalimat hanya dinilai bila memuat kata
    "koma", tepat satu arah, dan bilangan PERTAMA-nya adalah bilangan asal yang jelas, sebelum kata arah dan tanpa
    kata tujuan ("jadi", "supaya", "→") di depannya:
    - bentuk a × 10ⁿ → bentuk biasa: pangkat positif → ke kanan, pangkat negatif → ke kiri;
    - bentuk biasa ≥ 10 → bentuk baku: ke kiri; bentuk biasa < 1 → ke kanan.
    Kalimat tentang kali/bagi, kesalahan orang lain ("bukan", "salah", "seharusnya"), 10ⁿ, dan kelipatan 10 dilewati."""
    wrong: list[str] = []
    for raw in text.splitlines():
        for seg in _SENTENCE.split(_LIST_MARK.sub("", raw)):
            if "koma" not in seg.lower() or _DIR_SKIP.search(seg):
                continue
            dirs = {d.lower() for d in _DIR.findall(seg)}
            if len(dirs) != 1:
                continue
            t = normalize(seg)
            first = _first_atom(t)
            dm = _DIR.search(t)
            if not first or not dm or first[0] > dm.start() or _TARGET_CUE.search(t[: first[0]]):
                continue
            _, kind, m = first
            if kind == "sci":
                n = int(m.group(2))
                expected = "kanan" if n > 0 else "kiri" if n < 0 else None
            elif kind == "plain":
                try:
                    v = _fraction(m.group(0))
                except (ValueError, ZeroDivisionError):
                    continue
                if v >= 10 and _digits_only(v) != "1":
                    expected = "kiri"
                elif 0 < v < 1 and _digits_only(v) != "1":
                    expected = "kanan"
                else:
                    expected = None
            else:
                expected = None
            found = dirs.pop()
            if expected and found != expected:
                wrong.append(f"arah geser koma salah: dari {_pretty(m.group(0))} koma bergeser ke {expected}, bukan ke {found}")
    return wrong


def _digits_only(v: Fraction) -> str:
    """Digit bermakna (tanpa nol depan/belakang) bilangan desimal berhingga; '' bila bukan."""
    for k in range(31):
        y = abs(v) * 10**k
        if y.denominator == 1:
            return str(y.numerator).strip("0") or "0"
    return ""


_PUNCT_COLON = re.compile(r"(?<=[^\s:]):(?=\s)")


def check_math(text: str) -> MathCheck:
    """Periksa semua persamaan & baris tabel di balasan."""
    out = MathCheck()
    out.wrong.extend(check_shift_direction(text))
    for raw in text.splitlines():
        # penanda daftar ("- ", "• ", "1. ") bukan tanda minus (temuan uji 25 Nov 2026: "- 10¹ = 10" dinilai salah)
        # Titik dua TANDA BACA ("10 × 10 × 10: 10 × 10 = 100") menempel pada kata sebelumnya lalu diikuti spasi;
        # titik dua PEMBAGIAN berspasi di kedua sisi ("6 : 2") atau tanpa spasi ("6:2"). Tanda baca jadi pemisah
        # (26 Nov 2026: penjelasan yang benar sempat dinilai salah).
        line = normalize(_PUNCT_COLON.sub(" ; ", _LIST_MARK.sub("", raw)))
        if line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            vals = [(c, evaluate(c)) for c in cells if re.search(r"\d", c) and not re.fullmatch(r"[\s:\-]+", c)]
            vals = [(c, v) for c, v in vals if v is not None]
            if len(vals) >= 2 and len({v for _, v in vals}) == 1:
                out.verified.extend(c for c, _ in vals)
                out.pairs.extend((vals[0][0], c) for c, _ in vals[1:])
            else:
                # Baris konversi (bentuk baku/10ⁿ di samping bilangan biasa) harus bernilai sama
                # ("| 5.200 | 5,2 × 10¹ |" salah). Bilangan cacah kecil (≤ 20) dianggap kolom pangkat/banyak lompatan.
                powered = [(c, v) for c, v in vals if "^(" in c]
                plain = [(c, v) for c, v in vals if "^(" not in c and not (v.denominator == 1 and 0 <= v <= 20)]
                for c, v in powered:
                    for pc, pv in plain:
                        if v != pv:
                            fix = sci_text(pv)
                            out.wrong.append(f"{_pretty(pc)} = {_pretty(c)} salah" + (f" (yang benar: {_pretty(pc)} = {fix})" if fix else ""))
            continue
        parts = re.split(r"(=|→|\bmenjadi\b)", line)
        segs, ops = parts[0::2], parts[1::2]
        for k, op in enumerate(ops):
            left = _trailing_math(segs[k]) if k == 0 or not _is_pure(segs[k]) else segs[k]
            right = _leading_math(segs[k + 1])
            lv, rv = evaluate(left), evaluate(right)
            if lv is None or rv is None:
                continue
            if lv == rv:
                out.verified.extend([left, right])
                out.pairs.append((left, right))
            # "→"/"menjadi" biasanya langkah geser koma (4,7 → 47) dan tidak dinilai salah — KECUALI salah satu sisinya
            # bentuk a × 10ⁿ: itu klaim konversi, jadi nilainya harus sama ("6.700.000 → 6,7 × 10⁴" salah).
            elif (op == "=" or _is_sci(left) or _is_sci(right)) and _clean_edges(segs[k], left, segs[k + 1], right):
                fix = sci_text(lv) if _is_sci(right) else std_text(lv)
                lt, rt = _pretty(left.strip(" 	.,;:")), _pretty(right.strip(" 	.,;:"))
                hint = f" (yang benar: {lt} = {fix})" if fix else ""
                out.wrong.append(f"{lt} = {rt} salah{hint}")
    return out


def _clean_edges(seg_left: str, left: str, seg_right: str, right: str) -> bool:
    """True bila kedua sisi jelas ekspresi utuh (bukan potongan kalimat seperti "1 diikuti 9 nol")."""
    # spasi di tepi potongan ekspresi ikut dihitung sebagai pemisah, bukan bagian ekspresi
    # …begitu juga tanda baca kalimat di tepinya ("Jadi, 123.000 = …": koma setelah "Jadi" adalah pemisah).
    core_left = left.lstrip().lstrip(",.;:").lstrip()
    core_right = right.rstrip().rstrip(",.;:").rstrip()
    before = seg_left[: len(seg_left) - len(left)] + left[: len(left) - len(core_left)] if seg_left.endswith(left) else ""
    after = right[len(core_right) :] + seg_right[len(right) :] if seg_right.startswith(right) else ""
    # sisi yang terpotong di tengah kata/token (mis. "Rp6", "7}") tidak dinilai
    cut_before = bool(before) and not re.search(r"[\s.,;:!?(\"'“]$", before)
    cut_after = bool(after) and not re.match(r"^[\s.,;:!?)\"'”]", after)
    return not (cut_before or cut_after or _OPEN_BEFORE.search(before) or _OPEN_AFTER.search(after))


_SUP_OUT = str.maketrans("0123456789-+", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺")


def _pretty(expr: str) -> str:
    """'6,7 × 10^(4)' → '6,7 × 10⁴' (untuk pesan tulis ulang)."""
    return re.sub(r"\^\(([-+]?\d+)\)", lambda m: m.group(1).translate(_SUP_OUT), expr)


def sci_text(value: Fraction) -> str | None:
    """Nilai eksak → bentuk baku 'a × 10ⁿ' (format Indonesia), atau None bila bukan desimal berhingga/≤ 0."""
    if value <= 0:
        return None
    for k in range(31):
        y = value * 10**k
        if y.denominator == 1:
            digits = str(y.numerator).rstrip("0") or "0"
            exp = len(str(y.numerator)) - 1 - k
            mant = digits[0] + ("," + digits[1:] if len(digits) > 1 else "")
            return f"{mant} × 10{str(exp).translate(_SUP_OUT)}"
    return None


def std_text(value: Fraction) -> str | None:
    """Nilai eksak → bentuk biasa format Indonesia ('6.700.000', '0,1'), atau None bila bukan desimal berhingga."""
    neg, x = value < 0, abs(value)
    for k in range(31):
        y = x * 10**k
        if y.denominator == 1:
            s = str(y.numerator).rjust(k + 1, "0")
            whole, frac = s[: len(s) - k] if k else s, s[len(s) - k :] if k else ""
            whole = f"{int(whole):,}".replace(",", ".")
            frac = frac.rstrip("0")
            return ("−" if neg else "") + whole + ("," + frac if frac else "")
    return None


def _is_sci(expr: str) -> bool:
    """Ekspresi berbentuk a × 10ⁿ (sudah dinormalisasi)."""
    return bool(re.search(r"\d\s*×\s*10\^\(", expr))


def _is_pure(seg: str) -> bool:
    return bool(_MATH_RUN.fullmatch(seg))
