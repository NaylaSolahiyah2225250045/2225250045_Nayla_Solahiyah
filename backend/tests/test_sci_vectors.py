"""Uji logika notasi ilmiah dengan kasus bersama (shared/test-vectors.json)."""

import json
from pathlib import Path

import pytest

from app import sci

VECTORS = json.loads((Path(__file__).resolve().parents[2] / "shared" / "test-vectors.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("case", VECTORS["conversions"], ids=lambda c: c["standard"])
def test_to_scientific(case):
    x = sci.parse_standard(case["standard"])
    assert sci.to_scientific(x) == {"a": case["a"], "n": case["n"]}


@pytest.mark.parametrize("case", VECTORS["conversions"], ids=lambda c: c["standard"])
def test_to_standard_roundtrip(case):
    p = sci.parse_scientific(case["a"], case["n"])
    assert p is not None and p.normalized
    assert sci.to_standard(p.value) == case["standard"]


@pytest.mark.parametrize("case", VECTORS["parse_equivalents"], ids=lambda c: c["input"])
def test_parse_equivalents(case):
    assert sci.parse_standard(case["input"]) == sci.parse_standard(case["same_as"])


@pytest.mark.parametrize("text", VECTORS["parse_invalid"])
def test_parse_invalid(text):
    assert sci.parse_standard(text) is None


@pytest.mark.parametrize("case", VECTORS["diagnosis_to_scientific"], ids=lambda c: f'{c["question"]}|{c["answer"]}')
def test_diagnose_to_scientific(case):
    d = sci.diagnose_to_scientific(case["question"], case["answer"]["a"], case["answer"]["n"])
    assert d.error_code == case["expected"]
    assert d.correct is (case["expected"] is None)


@pytest.mark.parametrize("case", VECTORS["diagnosis_to_standard"], ids=lambda c: c["answer"])
def test_diagnose_to_standard(case):
    d = sci.diagnose_to_standard(case["a"], case["n"], case["answer"])
    assert d.error_code == case["expected"]


@pytest.mark.parametrize("case", VECTORS["operations"], ids=lambda c: f'{c["op"]}-{c["x"]}-{c["y"]}')
def test_operations(case):
    x = sci.parse_scientific(case["x"]["a"], case["x"]["n"]).value
    y = sci.parse_scientific(case["y"]["a"], case["y"]["n"]).value
    r = sci.multiply(x, y) if case["op"] == "mul" else sci.divide(x, y)
    assert sci.to_scientific(r) == case["result"]


def test_large_and_small_precision():
    big = sci.parse_scientific("1,234567890123", 30).value
    small = sci.parse_scientific("9,87654321", -30).value
    assert sci.to_scientific(big) == {"a": "1,234567890123", "n": 30}
    assert sci.to_standard(small).startswith("0," + "0" * 29 + "987654321")


def test_power_of_ten():
    assert sci.diagnose_power_of_ten("0,001", "-3").correct
    assert sci.diagnose_power_of_ten("0,001", "3").error_code == "E-TANDA"
    assert sci.diagnose_power_of_ten("1.000.000", "5").error_code == "E-PANGKAT"
    assert sci.diagnose_power_of_ten("1.000.000", "x").error_code == "E-FORMAT"
