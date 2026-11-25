"""Penjelasan konsep yang dihitung MESIN untuk ekspresi yang ditanyakan siswa (26 Nov 2026).

Dipakai pesan cadangan (Groq tidak tersedia / balasan AI ditolak) supaya pertanyaan "kenapa 10³ = 1.000?" tetap
dijawab langsung — bukan diganti contoh lain. Aritmetika eksak (Fraction), tanpa floating point, format Indonesia.

- `10ⁿ` (n bulat, |n| ≤ 9): 10ⁿ = 10 × 10 × … (n faktor), dikalikan bertahap: 10 × 10 = 100, 100 × 10 = 1.000, …;
  10⁻ⁿ = 1 : 10ⁿ.
- `a × 10ⁿ`: a × 10ⁿ = a × (nilai 10ⁿ) = hasil; koma pada a bergeser n tempat.

`reveal_result=False` → langkah terakhir dibiarkan untuk siswa (bila hasilnya jawaban soal yang belum ia sebut).
"""

from __future__ import annotations

import re
from fractions import Fraction

from .mathcheck import normalize, std_text

_SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")
_MAX_N = 9


def _pow(n: int) -> str:
    return "10" + str(n).translate(_SUP)


def _num(v: Fraction) -> str:
    return std_text(v) or str(v)


def _times(n: int) -> str:
    return " × ".join(["10"] * n)


def explain_power(n: int, *, reveal_result: bool = True) -> str | None:
    """Penjelasan bertahap 10ⁿ."""
    if n == 0 or abs(n) > _MAX_N:
        return None
    if n > 0:
        if n == 1:
            return "10¹ artinya hanya satu faktor 10, jadi 10¹ = 10. Pangkat menunjukkan banyaknya faktor 10 yang dikalikan."
        steps: list[str] = []
        value = Fraction(10)
        for _ in range(n - 1):
            nxt = value * 10
            steps.append(f"{_num(value)} × 10 = {_num(nxt)}")
            value = nxt
        if not reveal_result:
            steps = steps[:-1]
        head = f"{_pow(n)} artinya 10 dikalikan sebanyak {n} kali: {_pow(n)} = {_times(n)}."
        body = f" Kalikan satu per satu: {', lalu '.join(steps)}." if steps else ""
        tail = (
            f" Jadi {_pow(n)} = {_num(value)}. Pangkat {n} menunjukkan banyaknya faktor 10 yang dikalikan — dan juga banyaknya angka nol di belakang angka 1."
            if reveal_result
            else " Langkah perkalian terakhirnya coba kamu lanjutkan sendiri, ya. Pangkat menunjukkan banyaknya faktor 10 yang dikalikan."
        )
        return head + body + tail
    k = -n
    if not reveal_result:
        return f"{_pow(n)} artinya 1 dibagi {_pow(k)}, yaitu 1 : ({_times(k)}). Pangkat negatif membuat bilangannya lebih kecil dari 1, bukan bilangan negatif."
    big = Fraction(10) ** k
    return (
        f"{_pow(n)} artinya 1 dibagi {_pow(k)}, jadi {_pow(n)} = 1 : {_pow(k)} = 1 : {_num(big)} = {_num(1 / big)}. "
        f"Angka 1-nya ada di tempat ke-{k} setelah koma. Pangkat negatif membuat bilangannya lebih kecil dari 1, bukan bilangan negatif."
    )


def explain_sci(a: Fraction, n: int, a_text: str, *, reveal_result: bool = True) -> str | None:
    """Penjelasan a × 10ⁿ → bentuk biasa."""
    if n == 0 or abs(n) > _MAX_N:
        return None
    unit = Fraction(10) ** n
    direction = "kanan" if n > 0 else "kiri"
    head = f"{a_text} × {_pow(n)} artinya {a_text} × {_num(unit)}"
    if not reveal_result:
        return head + f". Karena itu koma pada {a_text} bergeser {abs(n)} tempat ke {direction}; tempat yang kosong diisi nol. Coba geser sendiri, ya."
    return head + f" = {_num(a * unit)}. Itu sama dengan menggeser koma pada {a_text} sebanyak {abs(n)} tempat ke {direction}; tempat yang kosong diisi nol."


_WORD_POW = re.compile(r"10\s*pangkat\s*(min(?:us)?\s*|negatif\s*|[-−]\s*)?(\d+)", re.IGNORECASE)
_SCI = re.compile(r"(\d[\d.,]*)\s*×\s*10\^\(([-+]?\d+)\)")
_POW = re.compile(r"(?<![\d,.×])\s*10\^\(([-+]?\d+)\)")


def explain_from_text(text: str, *, reveal_result: bool = True) -> str | None:
    """Penjelasan untuk ekspresi PERTAMA yang ditanyakan siswa ("kenapa 10 pangkat 3 hasilnya 1000?",
    "kenapa 2,5 × 10³ jadi 2.500?"). None bila tidak ada ekspresi yang dikenali."""
    m = _WORD_POW.search(text)
    if m:
        n = int(m.group(2)) * (-1 if m.group(1) else 1)
        return explain_power(n, reveal_result=reveal_result)
    t = normalize(re.sub(r"10\s*\^\s*([-+−]?\d+)", lambda m: f"10^({m.group(1).replace('−', '-')})", text))
    s = _SCI.search(t)
    if s:
        a_text = s.group(1).rstrip(".,")
        try:
            a = Fraction(a_text.replace(".", "").replace(",", "."))
        except (ValueError, ZeroDivisionError):
            return None
        return explain_sci(a, int(s.group(2)), a_text, reveal_result=reveal_result)
    p = _POW.search(t)
    if p:
        return explain_power(int(p.group(1)), reveal_result=reveal_result)
    return None
