"""Logika notasi ilmiah (bentuk baku) tanpa floating point.

Cermin dari frontend/src/lib/sci/sci.js. Keduanya diuji dengan shared/test-vectors.json.

SciNumber: nilai = sign × d1,d2d3… × 10^exp  (digits[0] != "0", tanpa nol di belakang)
Format angka Indonesia: koma = desimal, titik = pemisah ribuan.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_THOUSANDS_RE = re.compile(r"^\d{1,3}(\.\d{3})+$")
_DIGITS_RE = re.compile(r"^\d+$")
_OPT_DIGITS_RE = re.compile(r"^\d*$")


@dataclass(frozen=True)
class SciNumber:
    sign: int
    digits: str
    exp: int


@dataclass(frozen=True)
class SplitDecimal:
    sign: int
    int_part: str
    frac_part: str


@dataclass(frozen=True)
class ParsedScientific:
    value: SciNumber
    normalized: bool
    a_value: SciNumber


def _clean(text: object) -> str:
    s = "" if text is None else str(text)
    s = re.sub(r"\s+", "", s)
    return s.replace("−", "-").replace("–", "-")


def split_decimal(text: object, allow_thousands: bool = True) -> SplitDecimal | None:
    s = _clean(text)
    if not s:
        return None
    sign = 1
    if s[0] in "+-":
        if s[0] == "-":
            sign = -1
        s = s[1:]
    if not s:
        return None

    frac_part = ""
    if "," in s:
        parts = s.split(",")
        if len(parts) != 2:
            return None
        int_part, frac_part = parts
        if "." in int_part:
            if not allow_thousands or not _THOUSANDS_RE.match(int_part):
                return None
            int_part = int_part.replace(".", "")
    elif "." in s:
        if allow_thousands and _THOUSANDS_RE.match(s):
            int_part = s.replace(".", "")
        else:
            parts = s.split(".")
            if len(parts) != 2:
                return None
            int_part, frac_part = parts
    else:
        int_part = s
    if int_part == "":
        int_part = "0"
    if not _DIGITS_RE.match(int_part) or not _OPT_DIGITS_RE.match(frac_part):
        return None
    if int_part == "0" and frac_part == "" and s.endswith(","):
        return None
    return SplitDecimal(sign, int_part, frac_part)


def parse_standard(text: object, allow_thousands: bool = True) -> SciNumber | None:
    p = split_decimal(text, allow_thousands)
    if p is None:
        return None
    all_digits = p.int_part + p.frac_part
    m = re.search(r"[1-9]", all_digits)
    if m is None:
        return None
    first = m.start()
    exp = len(p.int_part) - 1 - first
    digits = all_digits[first:].rstrip("0")
    return SciNumber(p.sign, digits, exp)


def parse_scientific(a: object, n: object) -> ParsedScientific | None:
    if isinstance(n, bool):
        return None
    if isinstance(n, int):
        nn = n
    else:
        s = _clean(n)
        if not re.fullmatch(r"[+-]?\d+", s):
            return None
        nn = int(s)
    a_value = parse_standard(a, allow_thousands=False)
    if a_value is None:
        return None
    value = SciNumber(a_value.sign, a_value.digits, a_value.exp + nn)
    return ParsedScientific(value, a_value.exp == 0, a_value)


def format_mantissa(x: SciNumber) -> str:
    m = x.digits[0] + ("," + x.digits[1:] if len(x.digits) > 1 else "")
    return ("-" if x.sign < 0 else "") + m


def to_scientific(x: SciNumber) -> dict:
    return {"a": format_mantissa(x), "n": x.exp}


def group_thousands(int_digits: str) -> str:
    return f"{int(int_digits):,}".replace(",", ".") if int_digits else int_digits


def to_standard(x: SciNumber) -> str:
    d, e = x.digits, x.exp
    if e >= 0:
        if len(d) <= e + 1:
            out = group_thousands(d + "0" * (e + 1 - len(d)))
        else:
            out = group_thousands(d[: e + 1]) + "," + d[e + 1 :]
    else:
        out = "0," + "0" * (-e - 1) + d
    return ("-" if x.sign < 0 else "") + out


def equals_value(x: SciNumber, y: SciNumber) -> bool:
    return x == y


# ---------- Operasi kali / bagi (Modul 7) ----------


def _to_int_form(x: SciNumber) -> tuple[int, int]:
    return int(x.digits) * x.sign, x.exp - (len(x.digits) - 1)


def _from_int_form(m: int, e: int) -> SciNumber | None:
    if m == 0:
        return None
    sign = -1 if m < 0 else 1
    s = str(abs(m))
    trimmed = s.rstrip("0")
    e += len(s) - len(trimmed)
    return SciNumber(sign, trimmed, e + len(trimmed) - 1)


def multiply(x: SciNumber, y: SciNumber) -> SciNumber | None:
    am, ae = _to_int_form(x)
    bm, be = _to_int_form(y)
    return _from_int_form(am * bm, ae + be)


def divide(x: SciNumber, y: SciNumber) -> SciNumber | None:
    """Pembagian dengan 20 digit presisi (dibulatkan menuju nol, sama dengan BigInt JS)."""
    am, ae = _to_int_form(x)
    bm, be = _to_int_form(y)
    scale = 20
    num = am * 10**scale
    q = abs(num) // abs(bm)
    if (num < 0) != (bm < 0):
        q = -q
    return _from_int_form(q, ae - be - scale)
