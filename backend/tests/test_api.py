from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_convert_roundtrip():
    r = client.post("/api/v1/sci/to-scientific", json={"value": "0,00032"})
    assert r.json() == {"a": "3,2", "n": -4}
    r = client.post("/api/v1/sci/to-standard", json={"a": "3,2", "n": -4})
    assert r.json() == {"value": "0,00032", "normalized": True}


def test_convert_invalid():
    r = client.post("/api/v1/sci/to-scientific", json={"value": "0"})
    assert r.status_code == 400


def test_check_to_scientific():
    r = client.post(
        "/api/v1/sci/check",
        json={"type": "to_scientific", "question": "0,0000075", "answer": {"a": "7,5", "n": 6}},
    )
    assert r.json() == {"correct": False, "error_code": "E-TANDA"}


def test_check_to_standard():
    r = client.post(
        "/api/v1/sci/check",
        json={"type": "to_standard", "question": {"a": "2,5", "n": 8}, "answer": "250.000.000"},
    )
    assert r.json() == {"correct": True, "error_code": None}


def test_check_type_mismatch():
    r = client.post(
        "/api/v1/sci/check",
        json={"type": "to_scientific", "question": {"a": "2,5", "n": 8}, "answer": "1"},
    )
    assert r.status_code == 400
