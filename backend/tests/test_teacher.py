"""Peran guru, kelas, bergabung dengan kode, sinkronisasi, dan hak akses laporan."""

from __future__ import annotations

import dataclasses
import itertools

import pytest
from fastapi.testclient import TestClient

API = "/api/v1"
_seq = itertools.count()


def uniq(prefix: str) -> str:
    return f"{prefix}{next(_seq)}"


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def new_teacher(client: TestClient, login: str | None = None) -> str:
    r = client.post(
        f"{API}/auth/register/teacher",
        json={"display_name": "Bu Sari Wulandari", "login": login or f"{uniq('guru')}@sekolah.sch.id", "password": "rahasia123", "school": "SMP Negeri 1"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["user"]["role"] == "teacher"
    return r.json()["access_token"]


def new_student(client: TestClient, code: str | None = None) -> tuple[str, str]:
    body = {"display_name": "Rani", "username": uniq("rani"), "password": "rahasia"}
    if code:
        body["class_code"] = code
    r = client.post(f"{API}/auth/register/student", json=body)
    assert r.status_code == 201, r.text
    return r.json()["access_token"], r.json()["user"]["id"]


def new_class(client: TestClient, token: str, name: str = "VIII-A") -> dict:
    r = client.post(f"{API}/classes", json={"name": name, "academic_year": "2026/2027"}, headers=auth(token))
    assert r.status_code == 201, r.text
    return r.json()


def test_daftar_dan_masuk_mengenali_peran(client: TestClient) -> None:
    email = f"{uniq('guru')}@sekolah.sch.id"
    new_teacher(client, email)
    r = client.post(f"{API}/auth/login", json={"login": email.upper(), "password": "rahasia123"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "teacher"
    assert r.json()["user"]["school"] == "SMP Negeri 1"
    me = client.get(f"{API}/me", headers=auth(r.json()["access_token"])).json()
    assert me["email"] == email and me["status"] == "active"

    username = uniq("dina")
    client.post(f"{API}/auth/register/student", json={"display_name": "Dina", "username": username, "password": "rahasia"})
    r = client.post(f"{API}/auth/login", json={"login": username, "password": "rahasia"})
    assert r.json()["user"]["role"] == "student"
    assert r.json()["user"]["email"] is None  # data siswa minimum


def test_validasi_dan_galat(client: TestClient) -> None:
    r = client.post(f"{API}/auth/register/teacher", json={"display_name": "Pak", "login": "bukan email@", "password": "123", "school": "SMP"})
    assert r.status_code == 422
    assert r.json()["detail"]["code"] == "VALIDATION_ERROR"
    email = f"{uniq('guru')}@x.id"
    new_teacher(client, email)
    r = client.post(f"{API}/auth/register/teacher", json={"display_name": "Bu Ani", "login": email, "password": "rahasia123", "school": "SMP 2"})
    assert r.status_code == 409
    r = client.post(f"{API}/auth/login", json={"login": email, "password": "salah-sekali"})
    assert r.status_code == 401
    assert client.get(f"{API}/classes").status_code == 401


def test_kelas_viii_a_sampai_e_dan_kode_unik(client: TestClient) -> None:
    token = new_teacher(client)
    codes = {new_class(client, token, f"VIII-{h}")["join_code"] for h in "ABCDE"}
    assert len(codes) == 5 and all(len(c) == 6 for c in codes)
    assert client.post(f"{API}/classes", json={"name": "VIII-A"}, headers=auth(token)).status_code == 409
    assert client.post(f"{API}/classes", json={"name": "IX-A"}, headers=auth(token)).status_code == 422
    names = [c["name"] for c in client.get(f"{API}/classes", headers=auth(token)).json()]
    assert names == ["VIII-A", "VIII-B", "VIII-C", "VIII-D", "VIII-E"]


def test_siswa_bergabung_dengan_kode_dan_guru_melihat_daftar(client: TestClient) -> None:
    teacher = new_teacher(client)
    klass = new_class(client, teacher)
    s1, s1_id = new_student(client)
    r = client.post(f"{API}/classes/join", json={"class_code": klass["join_code"].lower()}, headers=auth(s1))
    assert r.status_code == 200 and r.json()["name"] == "VIII-A" and r.json()["teacher_name"] == "Bu Sari Wulandari"
    s2, _ = new_student(client, code=klass["join_code"])  # gabung saat daftar
    assert client.get(f"{API}/classes/{klass['id']}", headers=auth(teacher)).json()["student_count"] == 2
    rows = client.get(f"{API}/classes/{klass['id']}/students", headers=auth(teacher)).json()
    assert len(rows) == 2 and s1_id in {r["id"] for r in rows}
    # kode salah, sudah di kelas lain, kode dinonaktifkan
    assert client.post(f"{API}/classes/join", json={"class_code": "ZZZZZZ"}, headers=auth(s1)).status_code == 404
    other = new_class(client, teacher, "VIII-B")
    assert client.post(f"{API}/classes/join", json={"class_code": other["join_code"]}, headers=auth(s1)).status_code == 409
    client.patch(f"{API}/classes/{other['id']}", json={"join_enabled": False}, headers=auth(teacher))
    s3, _ = new_student(client)
    assert client.post(f"{API}/classes/join", json={"class_code": other["join_code"]}, headers=auth(s3)).status_code == 403
    # kode baru: kode lama tidak berlaku
    old = klass["join_code"]
    new = client.post(f"{API}/classes/{klass['id']}/regenerate-code", headers=auth(teacher)).json()["join_code"]
    assert new != old
    assert client.post(f"{API}/classes/join", json={"class_code": old}, headers=auth(s3)).status_code == 404
    # keluarkan siswa
    assert client.delete(f"{API}/classes/{klass['id']}/students/{s1_id}", headers=auth(teacher)).status_code == 204
    assert client.get(f"{API}/me/classes", headers=auth(s1)).json() == []


def test_sinkronisasi_dan_laporan_hanya_untuk_guru_pemilik(client: TestClient) -> None:
    owner = new_teacher(client)
    stranger = new_teacher(client)
    klass = new_class(client, owner)
    student, sid = new_student(client, code=klass["join_code"])
    data = {"v": 1, "modules": {"t1": {"answered": 5, "correct": 4, "levelUnlocked": 2, "completed": False}}, "history": [], "days": {}, "bookRead": 3}
    assert client.put(f"{API}/sync/me", json={"data": data}, headers=auth(student)).status_code == 200
    assert client.get(f"{API}/sync/me", headers=auth(student)).json()["data"]["bookRead"] == 3

    rep = client.get(f"{API}/reports/classes/{klass['id']}", headers=auth(owner)).json()
    assert rep["students"][0]["snapshot"]["modules"]["t1"]["correct"] == 4
    assert client.get(f"{API}/reports/students/{sid}", headers=auth(owner)).json()["class_name"] == "VIII-A"
    overview = client.get(f"{API}/reports/overview", headers=auth(owner)).json()
    assert overview["classes"][0]["klass"]["student_count"] == 1

    # guru lain: tidak bisa melihat atau mengubah kelas & siswa milik guru lain
    assert client.get(f"{API}/reports/classes/{klass['id']}", headers=auth(stranger)).status_code == 404
    assert client.get(f"{API}/reports/students/{sid}", headers=auth(stranger)).status_code == 404
    assert client.get(f"{API}/classes/{klass['id']}/students", headers=auth(stranger)).status_code == 404
    assert client.delete(f"{API}/classes/{klass['id']}", headers=auth(stranger)).status_code == 404
    assert client.get(f"{API}/reports/overview", headers=auth(stranger)).json()["classes"] == []
    # siswa: tidak bisa memakai fitur guru; guru tidak bisa mengirim ringkasan siswa
    assert client.get(f"{API}/classes", headers=auth(student)).status_code == 403
    assert client.get(f"{API}/reports/students/{sid}", headers=auth(student)).status_code == 403
    assert client.put(f"{API}/sync/me", json={"data": data}, headers=auth(owner)).status_code == 403


def test_ringkasan_ditolak_bila_bentuknya_tidak_dikenal(client: TestClient) -> None:
    student, _ = new_student(client)
    r = client.put(f"{API}/sync/me", json={"data": {"modules": {}, "email": "x@y.id"}}, headers=auth(student))
    assert r.status_code == 422
    big = {"history": [{"title": "x" * 1000}] * 400}
    assert client.put(f"{API}/sync/me", json={"data": big}, headers=auth(student)).status_code == 413


def test_verifikasi_guru(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from app import admin
    from app.services import accounts

    monkeypatch.setattr(accounts, "settings", dataclasses.replace(accounts.settings, teacher_require_approval=True))
    email = f"{uniq('baru')}@sekolah.sch.id"
    token = new_teacher(client, email)
    assert client.get(f"{API}/me", headers=auth(token)).json()["status"] == "pending"
    r = client.post(f"{API}/classes", json={"name": "VIII-C"}, headers=auth(token))
    assert r.status_code == 403 and r.json()["detail"]["code"] == "TEACHER_PENDING"
    assert email in {u.email for u in admin.pending()}
    assert admin.approve(email)
    assert client.post(f"{API}/classes", json={"name": "VIII-C"}, headers=auth(token)).status_code == 201


def test_hapus_kelas_mengeluarkan_siswa(client: TestClient) -> None:
    teacher = new_teacher(client)
    klass = new_class(client, teacher, "VIII-D")
    student, _ = new_student(client, code=klass["join_code"])
    assert client.delete(f"{API}/classes/{klass['id']}", headers=auth(teacher)).status_code == 204
    assert client.get(f"{API}/me/classes", headers=auth(student)).json() == []


def test_preferensi_tersimpan_per_akun(client: TestClient) -> None:
    email = f"{uniq('pref')}@sekolah.sch.id"
    token = new_teacher(client, email)
    assert client.get(f"{API}/me", headers=auth(token)).json()["preferences"] == {}
    r = client.patch(f"{API}/me", json={"preferences": {"music": False, "volume": 40, "tourDone": True}}, headers=auth(token))
    assert r.status_code == 200 and r.json()["preferences"] == {"music": False, "volume": 40, "tourDone": True}
    # sebagian saja: yang lain tetap
    client.patch(f"{API}/me", json={"preferences": {"sfx": False}}, headers=auth(token))
    again = client.post(f"{API}/auth/login", json={"login": email, "password": "rahasia123"}).json()["user"]["preferences"]
    assert again == {"music": False, "volume": 40, "tourDone": True, "sfx": False}
    # nilai tidak sah & kunci asing ditolak
    assert client.patch(f"{API}/me", json={"preferences": {"volume": 150}}, headers=auth(token)).status_code == 422
    assert client.patch(f"{API}/me", json={"preferences": {"email": "x"}}, headers=auth(token)).status_code == 422
