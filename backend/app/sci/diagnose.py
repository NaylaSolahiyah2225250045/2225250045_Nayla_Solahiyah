"""Diagnosis kesalahan (cermin frontend/src/lib/sci/diagnose.js)."""

from __future__ import annotations

import re
from dataclasses import dataclass

from .core import SciNumber, parse_scientific, parse_standard

MAX_EXP_DIFF = 2


@dataclass(frozen=True)
class Diagnosis:
    correct: bool
    error_code: str | None


def _strip_zeros(s: str) -> str:
    return s.replace("0", "")


def _classify(key: SciNumber, ans: SciNumber) -> str:
    if ans.digits != key.digits and "0" in key.digits and _strip_zeros(ans.digits) == _strip_zeros(key.digits):
        return "E-NOL"
    if ans.digits == key.digits and ans.sign == key.sign:
        if key.exp != 0 and ans.exp == -key.exp:
            return "E-TANDA"
        if abs(ans.exp - key.exp) <= MAX_EXP_DIFF:
            return "E-PANGKAT"
    return "E-LAIN"


def diagnose_to_scientific(question: str, a: object, n: object) -> Diagnosis:
    key = parse_standard(question)
    if key is None:
        raise ValueError(f"Soal tidak valid: {question}")
    parsed = parse_scientific(a, n)
    if parsed is None:
        return Diagnosis(False, "E-FORMAT")
    if parsed.value == key:
        return Diagnosis(True, None) if parsed.normalized else Diagnosis(False, "E-KOMA")
    if not parsed.normalized:
        code = "E-KOMA" if parsed.a_value.digits == key.digits else _classify(key, parsed.value)
        return Diagnosis(False, code)
    return Diagnosis(False, _classify(key, parsed.value))


def diagnose_to_standard(a: object, n: object, answer: str) -> Diagnosis:
    q = parse_scientific(a, n)
    if q is None:
        raise ValueError("Soal tidak valid")
    ans = parse_standard(answer)
    if ans is None:
        return Diagnosis(False, "E-FORMAT")
    if ans == q.value:
        return Diagnosis(True, None)
    return Diagnosis(False, _classify(q.value, ans))


def diagnose_power_of_ten(question: str, n: object) -> Diagnosis:
    key = parse_standard(question)
    if key is None:
        raise ValueError(f"Soal tidak valid: {question}")
    s = re.sub(r"\s+", "", str(n if n is not None else "")).replace("−", "-")
    if not re.fullmatch(r"[+-]?\d+", s):
        return Diagnosis(False, "E-FORMAT")
    nn = int(s)
    if nn == key.exp:
        return Diagnosis(True, None)
    if key.exp != 0 and nn == -key.exp:
        return Diagnosis(False, "E-TANDA")
    if abs(nn - key.exp) <= MAX_EXP_DIFF:
        return Diagnosis(False, "E-PANGKAT")
    return Diagnosis(False, "E-LAIN")
