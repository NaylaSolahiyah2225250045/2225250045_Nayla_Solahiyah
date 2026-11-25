"""Asisten Belajar (Groq): pengaman, klien HTTP, dan endpoint — TANPA memanggil Groq sungguhan.

Klien Groq diuji dengan httpx.MockTransport; endpoint diuji dengan klien tiruan lewat dependency_overrides.
"""

from __future__ import annotations

import dataclasses
import itertools
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.ai.groq_client import AIProviderError, GroqClient
from app.ai.guardrails import check_reply, extract_visual, leaks_key, number_tokens, scrub_personal
from app.ai.tutor import DailyLimiter, ModelCheck, QuestionContext, respond
from app.core.config import Settings, settings

API = "/api/v1"
FAKE_KEY = "gsk_FAKE_TEST_KEY_123456"
_seq = itertools.count()


# ---------------------------------------------------------------- pengaman
def test_sensor_data_pribadi_tanpa_merusak_bilangan() -> None:
    text = "Emailku rani@contoh.com, HP 0812-3456-7890 atau +62 812 3456 7890. Soalnya 4.500.000 dan 0,0812."
    out = scrub_personal(text)
    assert "rani@contoh.com" not in out and "0812-3456-7890" not in out and "812 3456 7890" not in out
    assert "[email disembunyikan]" in out and "[nomor disembunyikan]" in out
    assert "4.500.000" in out and "0,0812" in out


def test_angka_kanonik_termasuk_pangkat_superskrip() -> None:
    assert number_tokens("4.500.000 = 4,5 × 10⁶") == {"45", "1", "6"}
    assert number_tokens("0,00032 dan 3,2 × 10⁻⁴") == {"32", "1", "4"}


def test_balasan_dengan_angka_baru_ditolak() -> None:
    soal = "Tulis dalam bentuk baku: 4.500.000"
    ok = check_reply("Coba cari angka bukan nol pertama dari 4.500.000. Angka berapa itu?", allowed_sources=[soal], key_texts=[])
    assert ok.ok
    # pangkat kunci (6) tidak boleh dibocorkan dalam bentuk apa pun
    bad = check_reply("Koma melompat 6 kali, jadi pangkatnya 6.", allowed_sources=[soal], key_texts=["4,5 × 10^6"])
    assert not bad.ok and bad.reason == "number"
    # angka hasil hitungan yang tidak terverifikasi tetap ditolak
    assert check_reply("Hasil kalinya kira-kira 4.725, ya.", allowed_sources=[soal], key_texts=[]).reason == "number"


def test_contoh_buatan_ai_boleh_bila_persamaannya_benar() -> None:
    soal = "Tulis dalam bentuk baku: 0,05"
    keys = ["5 × 10^-2", "5 × 10⁻²"]
    good = (
        "Iya, bentuk baku memakai perkalian dengan 10 berpangkat. Coba lihat 67.000.\n"
        "67.000 = 6,7 × 10.000\nKarena 10.000 = 10⁴, maka 67.000 = 6,7 × 10⁴.\n"
        "Bagaimana membuktikan 45.000 menjadi 4,5 × 10⁴ bernilai sama?"
    )
    assert check_reply(good, allowed_sources=[soal], key_texts=keys).ok
    table = "Lihat jumlah nolnya.\n| Pangkat | Nilai | Sebutan |\n| :--- | :--- | :--- |\n| 10³ | 1.000 | seribu |\n| 10⁶ | 1.000.000 | satu juta |\n| 10⁹ | 1.000.000.000 | satu miliar |\nMenurutmu 10¹² disebut apa?"
    assert check_reply(table, allowed_sources=["Bilangan 10⁹ dibaca …"], key_texts=[]).ok
    # persamaan salah → ditolak (kekeliruan model pada uji 23 Nov 2026)
    assert check_reply("Misalnya 10⁻¹ = 0,01. Paham?", allowed_sources=[soal], key_texts=keys).reason == "wrong_math"
    # baris tabel konversi yang tidak setara → hitungan salah (sejak 25 Nov 2026)
    assert check_reply("| 10³ | 4.725 |", allowed_sources=[soal], key_texts=[]).reason == "wrong_math"


def test_pemeriksa_persamaan() -> None:
    from app.ai.mathcheck import check_math, evaluate, normalize

    assert evaluate(normalize("(3 × 10²) × (4 × 10⁵)")) == evaluate(normalize("1,2 × 10⁸"))
    assert evaluate(normalize("12 × 10²⁺⁵")) == 120_000_000
    assert evaluate(normalize("10⁻² ")) == evaluate("1 : 100")
    assert check_math("−4 − (−6) = 2").wrong == []
    assert check_math("2 × 3 = 7 ya").wrong == ["2 × 3 = 7 salah (yang benar: 2 × 3 = 6)"]
    # potongan kalimat tidak dinilai salah
    assert check_math("10⁹ = 1 diikuti 9 nol").wrong == []
    assert check_math("45 dikali 10 = 450").wrong == []
    # langkah geser koma memakai panah, bukan kesamaan nilai
    assert check_math("4,7 → 47 → 470 → 4.700").wrong == []
    assert check_math(r"\(6{,}7 \times 10^{4}\) = 67.000").wrong == []


def test_tabel_dan_diagram_tidak_dihitung_sebagai_kata_tetapi_dibatasi() -> None:
    rows = "\n".join(f"| 10^{i} | x |" for i in range(13))
    assert check_reply("Lihat tabel.\n" + rows, allowed_sources=[], key_texts=[]).reason == "long"


def test_kunci_jawaban_dalam_berbagai_bentuk_ditolak() -> None:
    keys = ["4,5 × 10^6", "4.500.000"]
    for reply in ["Jawabannya 4,5 × 10⁶.", "jadi 4,5x10^6 ya", "hasilnya 4500000", "4,5 · 10⁶"]:
        assert leaks_key(reply, keys), reply
    assert not leaks_key("Coba hitung lompatan komanya.", keys)
    assert not leaks_key("Pangkatnya negatif.", ["negatif"])  # kunci tanpa angka tidak disaring kata per kata


def test_balasan_kosong_atau_terlalu_panjang_ditolak() -> None:
    assert check_reply("  ", allowed_sources=[], key_texts=[]).reason == "empty"
    assert check_reply("kata " * 160, allowed_sources=[], key_texts=[]).reason == "long"


# ---------------------------------------------------------------- klien Groq (MockTransport)
def _transport(handler):  # type: ignore[no-untyped-def]
    return httpx.MockTransport(handler)


def test_klien_mengirim_header_dan_parameter_gpt_oss() -> None:
    seen: dict = {}

    def handler(req: httpx.Request) -> httpx.Response:
        seen["url"] = str(req.url)
        seen["auth"] = req.headers["authorization"]
        seen["body"] = json.loads(req.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": "Halo!"}}]})

    c = GroqClient(FAKE_KEY, "openai/gpt-oss-20b", transport=_transport(handler))
    assert c.chat([{"role": "user", "content": "hai"}]) == "Halo!"
    assert seen["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert seen["auth"] == f"Bearer {FAKE_KEY}"
    assert seen["body"]["reasoning_effort"] == "low" and seen["body"]["include_reasoning"] is False
    assert seen["body"]["model"] == "openai/gpt-oss-20b"

    c2 = GroqClient(FAKE_KEY, "model-lain", transport=_transport(handler))
    c2.chat([{"role": "user", "content": "hai"}])
    assert "reasoning_effort" not in seen["body"]


@pytest.mark.parametrize(("status", "kind"), [(401, "auth"), (429, "rate_limit"), (404, "model"), (500, "unavailable")])
def test_galat_penyedia_tanpa_membocorkan_kunci(status: int, kind: str) -> None:
    c = GroqClient(FAKE_KEY, "openai/gpt-oss-20b", transport=_transport(lambda r: httpx.Response(status, json={"error": FAKE_KEY})))
    with pytest.raises(AIProviderError) as exc:
        c.chat([{"role": "user", "content": "hai"}])
    assert exc.value.kind == kind
    assert FAKE_KEY not in str(exc.value) and FAKE_KEY not in repr(exc.value)
    assert FAKE_KEY not in repr(c)


def test_daftar_model() -> None:
    c = GroqClient(FAKE_KEY, "openai/gpt-oss-20b", transport=_transport(lambda r: httpx.Response(200, json={"data": [{"id": "openai/gpt-oss-20b"}]})))
    assert c.list_models() == {"openai/gpt-oss-20b"}


def test_pengaturan_tidak_mencetak_kunci_dan_bawaan_mati(monkeypatch: pytest.MonkeyPatch) -> None:
    cfg = dataclasses.replace(settings, groq_api_key=FAKE_KEY)
    assert FAKE_KEY not in repr(cfg)
    monkeypatch.delenv("AI_ENABLED", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    fresh = Settings()
    assert fresh.ai_enabled is False and fresh.groq_api_key == ""


# ---------------------------------------------------------------- alur tutor
class FakeClient:
    def __init__(self, reply: str = "Coba lihat angka bukan nol pertama. Angka berapa itu?", model: str = "openai/gpt-oss-20b", fail: str | None = None) -> None:
        self.reply = reply
        self.model = model
        self.fail = fail
        self.calls: list[list[dict[str, str]]] = []

    def chat(self, messages: list[dict[str, str]]) -> str:
        self.calls.append(messages)
        if self.fail:
            raise AIProviderError(self.fail)  # type: ignore[arg-type]
        return self.reply

    def list_models(self) -> set[str]:
        return {"openai/gpt-oss-20b"}


CTX = QuestionContext(
    text="Tulis dalam bentuk baku: 4.500.000",
    skill="keBaku",
    guide="Di mana angka bukan nol pertamanya? Bilangan ini 10 atau lebih, atau kurang dari 1?",
    rule="Setiap bilangan positif dapat ditulis a × 10ⁿ dengan 1 ≤ a < 10.",
    key_texts=("4,5 × 10^6",),
)


def test_respond_menyensor_dan_tidak_mengirim_kunci_jawaban() -> None:
    fake = FakeClient()
    out = respond(fake, CTX, [{"role": "user", "content": "Aku bingung. HP-ku 081234567890"}])
    assert out.source == "ai"
    sent = json.dumps(fake.calls[0], ensure_ascii=False)
    assert "081234567890" not in sent and "[nomor disembunyikan]" in sent
    assert "4,5 × 10^6" not in sent  # kunci hanya untuk saringan, tidak dikirim ke penyedia
    assert "RMT" in fake.calls[0][0]["content"] or "Rigorous" in fake.calls[0][0]["content"]


def test_respond_cadangan_saat_bocor_atau_gagal() -> None:
    leak = respond(FakeClient(reply="Jawabannya 4,5 × 10⁶."), CTX, [{"role": "user", "content": "apa jawabannya?"}])
    assert leak.source == "fallback" and leak.reason == "key" and CTX.guide in leak.reply
    busy = respond(FakeClient(fail="rate_limit"), CTX, [{"role": "user", "content": "halo"}])
    assert busy.source == "fallback" and CTX.guide in busy.reply


def test_batas_harian() -> None:
    lim = DailyLimiter()
    assert [lim.take("u", 2), lim.take("u", 2), lim.take("u", 2)] == [1, 0, None]
    assert lim.take("lain", 2) == 1


# ---------------------------------------------------------------- endpoint
def _student(client: TestClient) -> tuple[str, str]:
    username = f"siswa_ai{next(_seq)}"
    r = client.post(f"{API}/auth/register/student", json={"display_name": "Rani", "username": username, "password": "rahasia"})
    assert r.status_code == 201, r.text
    return r.json()["access_token"], username


def _teacher(client: TestClient) -> str:
    r = client.post(
        f"{API}/auth/register/teacher",
        json={"display_name": "Bu Sari", "login": f"guru_ai{next(_seq)}@sekolah.sch.id", "password": "rahasia123", "school": "SMP Uji"},
    )
    assert r.status_code == 201, r.text
    return r.json()["access_token"]


def _h(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


BODY = {
    "context": {"text": CTX.text, "skill": CTX.skill, "guide": CTX.guide, "rule": CTX.rule, "key_texts": list(CTX.key_texts)},
    "messages": [{"role": "user", "content": "Aku bingung mulai dari mana."}],
}


@pytest.fixture()
def ai_on(client: TestClient):  # type: ignore[no-untyped-def]
    from app.main import app
    from app.routers import ai as ai_router

    fake = FakeClient()
    cfg: Settings = dataclasses.replace(settings, ai_enabled=True, groq_api_key=FAKE_KEY, ai_daily_limit=3)
    app.dependency_overrides[ai_router.get_ai_settings] = lambda: cfg
    app.dependency_overrides[ai_router.get_ai_client] = lambda: fake
    limiter = DailyLimiter()  # limiter baru per tes
    app.dependency_overrides[ai_router.get_limiter] = lambda: limiter
    app.dependency_overrides[ai_router.get_model_check] = lambda: ModelCheck()
    yield fake
    app.dependency_overrides.clear()


def test_bawaan_mati(client: TestClient) -> None:
    token, _ = _student(client)
    r = client.get(f"{API}/ai/status", headers=_h(token))
    assert r.status_code == 200 and r.json()["available"] is False
    r = client.post(f"{API}/ai/chat", headers=_h(token), json=BODY)
    assert r.status_code == 503 and r.json()["detail"]["code"] == "AI_DISABLED"


def test_akses_hanya_siswa(client: TestClient, ai_on: FakeClient) -> None:
    assert client.get(f"{API}/ai/status").status_code == 401
    assert client.post(f"{API}/ai/chat", headers=_h(_teacher(client)), json=BODY).status_code == 403


def test_chat_siswa_berhasil_tanpa_data_pribadi(client: TestClient, ai_on: FakeClient) -> None:
    token, username = _student(client)
    st = client.get(f"{API}/ai/status", headers=_h(token)).json()
    assert st == {"available": True, "daily_limit": 3, "remaining": 3}
    r = client.post(f"{API}/ai/chat", headers=_h(token), json=BODY)
    assert r.status_code == 200, r.text
    assert r.json()["source"] == "ai" and r.json()["remaining"] == 2
    sent = json.dumps(ai_on.calls[-1], ensure_ascii=False)
    assert username not in sent and "Rani" not in sent  # nama & username tidak dikirim ke penyedia
    assert FAKE_KEY not in r.text


def test_kuota_harian_habis(client: TestClient, ai_on: FakeClient) -> None:
    token, _ = _student(client)
    for _ in range(3):
        assert client.post(f"{API}/ai/chat", headers=_h(token), json=BODY).status_code == 200
    r = client.post(f"{API}/ai/chat", headers=_h(token), json=BODY)
    assert r.status_code == 429 and r.json()["detail"]["code"] == "AI_LIMIT"


def test_validasi_pesan(client: TestClient, ai_on: FakeClient) -> None:
    token, _ = _student(client)
    bad = {**BODY, "messages": [{"role": "assistant", "content": "Halo"}]}
    assert client.post(f"{API}/ai/chat", headers=_h(token), json=bad).status_code == 422
    long = {**BODY, "messages": [{"role": "user", "content": "a" * 301}]}
    assert client.post(f"{API}/ai/chat", headers=_h(token), json=long).status_code == 422


def test_model_tidak_tersedia_menutup_fitur(client: TestClient, ai_on: FakeClient) -> None:
    ai_on.model = "model-yang-sudah-dihentikan"
    token, _ = _student(client)
    assert client.get(f"{API}/ai/status", headers=_h(token)).json()["available"] is False


# ---------------------------------------------------------------- RMT + visual (23 Nov 2026)
VIS = (
    ("geser-koma", "67.000 → 6,7 × 10⁴: koma melompat 4 kali ke kiri, jadi pangkatnya 4."),
    ("ubah-bentuk", "Contoh langkah: Cari angka bukan nol pertama: 6; Tulis bentuk baku: 6,7 × 10⁴."),
)
CTX_VIS = dataclasses.replace(CTX, visuals=VIS)


def test_penanda_visual_dipisah_dan_hanya_id_yang_dikirim_klien() -> None:
    text, vid = extract_visual("Lihat contoh serupa di bawah.\n[[visual:geser-koma]]", ["geser-koma"])
    assert text == "Lihat contoh serupa di bawah." and vid == "geser-koma"
    text, vid = extract_visual("Lihat ini [[visual:gambar-bebas]]", ["geser-koma"])
    assert vid is None and "[[" not in text


def test_kunci_bilangan_dicocokkan_utuh() -> None:
    assert not leaks_key("Contohnya 10⁵ = 100.000.", ["1.000"])
    assert leaks_key("Hasilnya 1.000, ya.", ["1.000"])
    assert not leaks_key("Bandingkan 10² dan 10³.", ["10"])  # basis 10 bukan bilangan 10


def test_prompt_memuat_unsur_rmt_dan_daftar_visual() -> None:
    fake = FakeClient()
    respond(fake, CTX_VIS, [{"role": "user", "content": "pangkat itu apa sih?"}])
    system = fake.calls[0][0]["content"]
    for word in ("Input", "Elaborasi", "Output", "Representasi", "Manipulasi", "Validasi", "Intensionalitas", "Transendensi", "Pemberian Makna", "PMSTP", "[[visual:ID]]"):
        assert word in system, word
    assert "geser-koma: 67.000" in system


def test_balasan_boleh_memakai_angka_contoh_visual() -> None:
    reply = "Perhatikan contoh: 67.000 menjadi 6,7 × 10⁴ karena koma melompat 4 kali. Di soalmu, angka bukan nol pertamanya apa?\n[[visual:geser-koma]]"
    out = respond(FakeClient(reply=reply), CTX_VIS, [{"role": "user", "content": "caranya gimana?"}])
    assert out.source == "ai" and out.visual == "geser-koma" and "[[" not in out.reply


def test_cadangan_bervariasi_dan_membawa_visual() -> None:
    leak = "Jawabannya 4,5 × 10⁶."
    first = respond(FakeClient(reply=leak), CTX_VIS, [{"role": "user", "content": "jawabannya?"}])
    later = respond(
        FakeClient(reply=leak),
        CTX_VIS,
        [{"role": "user", "content": "jawabannya?"}, {"role": "assistant", "content": "Kita cari bersama."}, {"role": "user", "content": "kasih tahu dong"}],
    )
    assert first.source == later.source == "fallback"
    assert first.visual == "geser-koma" and first.reply != later.reply and CTX.guide in later.reply


def test_endpoint_mengembalikan_visual(client: TestClient, ai_on: FakeClient) -> None:
    ai_on.reply = "Lihat contoh serupa di bawah. Bilangan di soalmu lebih dari 10 atau kurang dari 1?\n[[visual:geser-koma]]"
    token, _ = _student(client)
    body = {**BODY, "context": {**BODY["context"], "visuals": [{"id": v, "summary": s} for v, s in VIS]}}
    r = client.post(f"{API}/ai/chat", headers=_h(token), json=body)
    assert r.status_code == 200, r.text
    assert r.json()["visual"] == "geser-koma" and "[[" not in r.json()["reply"]
    bad = {**BODY, "context": {**BODY["context"], "visuals": [{"id": "<script>", "summary": "x"}]}}
    assert client.post(f"{API}/ai/chat", headers=_h(token), json=bad).status_code == 422


def test_visual_otomatis_hanya_bila_percakapan_belum_punya_visual() -> None:
    plain = "Bilangan di soalmu lebih dari 10 atau kurang dari 1?"
    first = respond(FakeClient(reply=plain), CTX_VIS, [{"role": "user", "content": "bingung"}])
    assert first.source == "ai" and first.visual == "geser-koma"
    later = respond(
        FakeClient(reply=plain),
        CTX_VIS,
        [{"role": "user", "content": "bingung"}, {"role": "assistant", "content": "Lihat contoh.\n[[visual:geser-koma]]"}, {"role": "user", "content": "lalu?"}],
    )
    assert later.visual is None
    assert respond(FakeClient(reply=plain), CTX, [{"role": "user", "content": "bingung"}]).visual is None  # tanpa daftar visual


def test_visual_yang_sama_tidak_diulang_berturut_turut() -> None:
    again = "Perhatikan lagi contohnya. Komamu sekarang di mana?\n[[visual:geser-koma]]"
    hist = [{"role": "user", "content": "bingung"}, {"role": "assistant", "content": "Lihat contoh.\n[[visual:geser-koma]]"}, {"role": "user", "content": "terus?"}]
    assert respond(FakeClient(reply=again), CTX_VIS, hist).visual is None
    other = again.replace("geser-koma", "ubah-bentuk")
    assert respond(FakeClient(reply=other), CTX_VIS, hist).visual == "ubah-bentuk"


def test_penanda_salah_tulis_tidak_tampil() -> None:
    text, vid = extract_visual("Coba tebak pangkatnya? [[visual:1]]", ["geser-koma"])
    assert text == "Coba tebak pangkatnya?" and vid is None


# ---------------------------------------------------------------- penjelasan lebih kaya (25 Nov 2026)
def test_ai_tidak_boleh_menghitung_bilangan_soal() -> None:
    q = "Sebuah provinsi berpenduduk 4,5 × 10⁷ jiwa dengan luas 9 × 10⁴ km²."
    assert check_reply("Bagi pangkatnya: 10⁷ : 10⁴ = 10³. Lalu?", allowed_sources=[q], key_texts=["5 × 10^2"], question=q).reason == "computes"
    # contoh dengan bilangan lain tetap boleh
    assert check_reply("Contoh lain: 10⁵ : 10² = 10³. Sekarang pangkat soalmu?", allowed_sources=[q], key_texts=["5 × 10^2"], question=q).ok


class SeqClient(FakeClient):
    """Mengembalikan balasan berurutan (untuk menguji tulis ulang)."""

    def __init__(self, replies: list[str]) -> None:
        super().__init__()
        self.replies = list(replies)

    def chat(self, messages: list[dict[str, str]]) -> str:
        self.calls.append(messages)
        return self.replies.pop(0)


def test_balasan_ditolak_ditulis_ulang_sekali_tanpa_mengirim_kunci() -> None:
    seq = SeqClient(["Jawabannya 4,5 × 10⁶.", "Bentuk baku memakai perkalian dengan 10 berpangkat. Contoh: 67.000 = 6,7 × 10⁴. Di soalmu, angka bukan nol pertamanya apa?"])
    out = respond(seq, CTX_VIS, [{"role": "user", "content": "kenapa harus dikali?"}])
    assert out.source == "ai" and "67.000" in out.reply and len(seq.calls) == 2
    retry = seq.calls[1][-1]
    assert retry["role"] == "system" and "Tulis ulang" in retry["content"]
    assert "4,5" not in json.dumps(seq.calls[1], ensure_ascii=False)  # kunci & balasan bocor tidak dikirim balik
    # bila dua kali tulis ulang juga gagal → cadangan, tanpa panggilan keempat (26 Nov 2026: dulu sekali tulis ulang)
    seq2 = SeqClient(["Jawabannya 4,5 × 10⁶.", "Tetap 4,5 × 10⁶.", "Ya, 4,5 × 10⁶."])
    assert respond(seq2, CTX_VIS, [{"role": "user", "content": "jawabannya?"}]).source == "fallback" and len(seq2.calls) == 3


def test_persamaan_salah_diminta_diperbaiki() -> None:
    seq = SeqClient(["Misalnya 10⁻¹ = 0,01.", "Misalnya 10⁻¹ = 0,1. Bilangan di soalmu lebih dari 1 atau kurang?"])
    out = respond(seq, CTX, [{"role": "user", "content": "pangkat negatif apa?"}])
    assert out.source == "ai" and "10⁻¹ = 0,01 salah (yang benar: 10⁻¹ = 0,1)" in seq.calls[1][-1]["content"]


def test_label_sisa_dibersihkan() -> None:
    from app.ai.guardrails import tidy

    assert tidy("Langkah dulu.\n(pertanyaan)\nPertanyaan pemandu\nBerapa lompatannya?") == "Langkah dulu.\n\nBerapa lompatannya?"


# ---------------------------------------------------------------- mengikuti alur percakapan (25 Nov 2026)
from app.ai.dialog import classify_intent, similarity  # noqa: E402


@pytest.mark.parametrize(
    ("text", "intent"),
    [
        ("Kenapa harus pakai perkalian 10?", "mengapa"),
        ("Aku masih belum paham konsepnya", "belum_paham"),
        ("bisa pake bahasa yang lebih sederhana?", "lebih_sederhana"),
        ("kasih contoh lain dong", "contoh_lain"),
        ("bukannya 10⁻⁵ soalnya nolnya ada 5?", "salah_paham"),
        ("langkah keduanya gimana?", "bagaimana"),
        ("apa itu pangkat?", "istilah"),
        ("aku pilih a, bener ga?", "cek_jawaban"),
        ("kasih tau aja jawabannya", "minta_jawaban"),
    ],
)
def test_jenis_pertanyaan_dikenali(text: str, intent: str) -> None:
    assert classify_intent(text) == intent


def test_contoh_bertahap_dengan_kalimat_lolos_pengaman() -> None:
    reply = (
        "Oke, kita coba dari angka yang lebih sederhana, ya.\nKalau 6,7 dikalikan 10, hasilnya menjadi 67.\n"
        "Kalau dikalikan 100, hasilnya menjadi 670.\nKalau dikalikan 10.000, hasilnya menjadi 67.000.\n"
        "Sampai sini, apakah kamu mulai melihat hubungan antara 6,7 dan 67.000?"
    )
    q = "Manakah yang sudah ditulis dalam bentuk baku?"
    assert check_reply(reply, allowed_sources=[q], key_texts=["2,5 × 10⁹"], question=q).ok
    # kalimat aritmetika yang salah tetap tertangkap
    assert check_reply("Kalau 6,7 dikalikan 10, hasilnya 670.", allowed_sources=[q], key_texts=[], question=q).reason == "wrong_math"


def test_catatan_giliran_setelah_riwayat_dan_menyesuaikan_pertanyaan() -> None:
    fake = FakeClient(reply="Kita coba dari bilangan yang lebih kecil: 3 × 10 = 30. Kelihatan polanya?")
    hist = [
        {"role": "user", "content": "kenapa harus dikali 10?"},
        {"role": "assistant", "content": "Bentuk baku memakai perkalian dengan 10 berpangkat.\n[[visual:geser-koma]]"},
        {"role": "user", "content": "aku masih belum paham"},
    ]
    out = respond(fake, CTX_VIS, hist)
    last = fake.calls[0][-1]
    assert last["role"] == "system" and "BELUM PAHAM" in last["content"] and "ubah-bentuk" in last["content"]
    assert fake.calls[0][-2]["content"] == "aku masih belum paham"  # catatan tepat setelah pesan terakhir siswa
    assert out.visual == "ubah-bentuk"  # belum paham → visual yang belum dipakai


def test_balasan_yang_mengulang_diminta_ditulis_ulang() -> None:
    old = "Bentuk baku memakai perkalian dengan 10 berpangkat supaya bilangan besar ditulis ringkas."
    seq = SeqClient([old + " Paham?", "Kita pakai bilangan kecil: 2 × 10 = 20, lalu 2 × 100 = 200. Nol bertambah satu tiap dikali 10."])
    hist = [{"role": "user", "content": "kenapa dikali?"}, {"role": "assistant", "content": old}, {"role": "user", "content": "masih belum ngerti"}]
    out = respond(seq, CTX_VIS, hist)
    assert len(seq.calls) == 2 and "PENDEKATAN BERBEDA" in seq.calls[1][-1]["content"]
    assert out.source == "ai" and "2 × 10 = 20" in out.reply
    assert similarity(old, old + " Paham?") > 0.5 and similarity(old, out.reply) < 0.5


def test_cadangan_tidak_berpola_templat_dan_tidak_mengulang() -> None:
    leak = "Jawabannya 4,5 × 10⁶."
    first = respond(SeqClient([leak, leak, leak]), CTX_VIS, [{"role": "user", "content": "kenapa harus dikali 10?"}])
    assert first.source == "fallback" and "Aku tidak memberi jawabannya" not in first.reply
    assert CTX_VIS.rule in first.reply  # tetap menjelaskan konsep
    hist = [
        {"role": "user", "content": "kenapa harus dikali 10?"},
        {"role": "assistant", "content": first.reply + "\n[[visual:geser-koma]]"},
        {"role": "user", "content": "aku belum paham"},
    ]
    second = respond(SeqClient([leak, leak, leak]), CTX_VIS, hist)
    assert second.reply != first.reply and CTX_VIS.rule not in second.reply  # aturan tidak diulang
    assert second.visual == "ubah-bentuk"  # sudut pandang baru


# ---------------------------------------------------------------- salah tangkap & kebocoran yang ditemukan uji 25 Nov 2026
def test_penanda_daftar_bukan_tanda_minus() -> None:
    from app.ai.mathcheck import check_math

    assert check_math("- 10¹ = 10\n- 10² = 100\n• 0,0001 = 10⁻⁴\n1. 10³ = 1.000").wrong == []


def test_pemisah_ribuan_spasi_tidak_meloloskan_persamaan_salah() -> None:
    for sp in (" ", " ", " "):
        text = f"Jadi 6,7 × 10⁴ = 6{sp}700{sp}000."
        assert check_reply(text, allowed_sources=[], key_texts=[]).reason == "wrong_math", repr(sp)


def test_kunci_dikenali_menurut_nilainya() -> None:
    keys = ["5 × 10⁻²", "5 × 10^-2"]
    assert leaks_key("0,05 → 5,0 × 10⁻²", keys)  # nol tambahan tetap kunci yang sama
    assert not leaks_key("Perhatikan dulu bilangan 0,05 di soal.", keys)  # bilangan soal bukan kebocoran


def test_contoh_dengan_digit_sama_bukan_menghitung_soal() -> None:
    q = "(5 × 10³) × (4 × 10²)"
    ok = check_reply("Contoh: (2 × 10²) × (3 × 10³) = 6 × 10⁵. Pangkatnya dijumlah.", allowed_sources=[q], key_texts=["2 × 10⁶"], question=q)
    assert ok.ok
    assert check_reply("Pangkatnya: 10³ × 10² = 10⁵.", allowed_sources=[q], key_texts=["2 × 10⁶"], question=q).reason == "computes"


def test_contoh_pergeseran_koma_boleh_tanpa_tanda_sama_dengan() -> None:
    q = "Manakah yang sudah ditulis dalam bentuk baku?"
    ok = check_reply("Contoh: 0,0045. Angka bukan nol pertama 4, taruh koma: 4,5. Lalu 56 → 5,6.", allowed_sources=[q], key_texts=["2,5 × 10⁹"], question=q)
    assert ok.ok
    s = "Tulis dalam bentuk baku: 0,05"
    assert check_reply("0,05 → 5 lalu 5 × 10⁻²", allowed_sources=[s], key_texts=["5 × 10⁻²"], question=s).reason == "key"


def test_panah_menuju_bentuk_baku_harus_bernilai_sama() -> None:
    from app.ai.mathcheck import check_math

    assert check_math("6.700.000  →  6,7 × 10⁴").wrong  # klaim konversi yang salah (uji 25 Nov 2026)
    assert check_math("6.700.000 → 6,7 × 10⁶").wrong == []
    assert check_math("4,7 → 47 → 470 → 4.700").wrong == []  # langkah geser koma tetap boleh
    assert check_math("0,0005 menjadi 5 × 10⁻⁴").wrong == []


def test_tanda_baca_di_tepi_tidak_meloloskan_persamaan_salah() -> None:
    from app.ai.mathcheck import check_math

    assert check_math("Jadi, 123 000 = 1,23 × 10³.").wrong  # temuan uji browser 25 Nov 2026
    assert check_math("Jadi, **123 000 = 1,23 × 10³**.").wrong
    assert check_math("Jadi, 123.000 = 1,23 × 10⁵.").wrong == []


def test_klaim_dalam_kalimat_dan_tabel_konversi_diperiksa() -> None:
    from app.ai.mathcheck import check_math

    assert check_math("kalau 6 700 000 ditulis 6,7 × 10⁴, apa yang berubah?").wrong  # temuan uji browser
    assert check_math("| 5 200 | 1 kali ke kiri | 5,2 × 10¹ |").wrong
    assert check_math("| 0,0048 | 3 kali ke kanan | 4,8 × 10⁻³ |").wrong == []
    assert check_math("| 2 | 10² | 100 |").wrong == []  # kolom pangkat (bilangan kecil) bukan klaim konversi
    assert check_math("4,7 jadi 47 jadi 470").wrong == []  # langkah geser koma


# ---------------------------------------------------------------- maksud soal & "gak jelas" (25 Nov 2026)
TASK = "Soal ini minta kamu menulis ulang bilangan itu dalam bentuk baku, yaitu a × 10ⁿ. Nilai bilangannya tidak berubah."
CTX_TASK = dataclasses.replace(CTX, topic="Topik 3 · Mengubah Bentuk Biasa dan Bentuk Baku", task=TASK)


@pytest.mark.parametrize(
    ("text", "intent"),
    [
        ("Maksud dari soal ini tuh apa?", "maksud_soal"),
        ("Aku bingung maksud soalnya", "maksud_soal"),  # tombol pembuka di panel asisten
        ("soal ini nyuruh apa sih", "maksud_soal"),
        ("ini disuruh ngapain?", "maksud_soal"),
        ("Hah, gak jelas.", "belum_paham"),
        ("hah?", "belum_paham"),
        ("aku bingung", "belum_paham"),
        ("jelasin ulang dong", "belum_paham"),
        ("apaan sih", "belum_paham"),
        ("apa itu basis?", "istilah"),
    ],
)
def test_maksud_soal_dan_kebingungan_dikenali(text: str, intent: str) -> None:
    assert classify_intent(text) == intent


def test_konteks_membawa_topik_dan_maksud_soal() -> None:
    fake = FakeClient(reply="Soal ini minta kamu menuliskannya dengan cara yang lebih ringkas.")
    respond(fake, CTX_TASK, [{"role": "user", "content": "Maksud dari soal ini tuh apa?"}])
    system = fake.calls[0][0]["content"]
    assert "Topik latihan: Topik 3" in system and f"Maksud soal (bahasa sehari-hari" in system and TASK in system
    note = fake.calls[0][-1]["content"]
    assert "MAKSUD SOAL" in note and "jangan menyuruh siswa menjelaskan ulang" in note.lower()


def test_gak_jelas_setelah_maksud_soal_menjelaskan_ulang_hal_yang_sama() -> None:
    from app.ai.dialog import turn_note

    hist = [
        {"role": "user", "content": "Maksud dari soal ini tuh apa?"},
        {"role": "assistant", "content": "Soal ini minta bentuk baku."},
        {"role": "user", "content": "Hah, gak jelas."},
    ]
    note = turn_note(classify_intent(hist[-1]["content"]), hist, [])
    assert "Yang belum dipahami siswa: penjelasanmu tentang MAKSUD SOAL" in note
    assert "jangan langsung bertanya balik" in note.lower() and "pertanyaan pemandu cadangan" in note
    hist += [{"role": "assistant", "content": "Oke, coba begini."}, {"role": "user", "content": "masih bingung"}]
    assert "beberapa kali belum paham" in turn_note("belum_paham", hist, [])


def test_cadangan_maksud_soal_tetap_menjelaskan_soalnya() -> None:
    first = respond(FakeClient(fail="timeout"), CTX_TASK, [{"role": "user", "content": "Maksud dari soal ini tuh apa?"}])
    assert first.source == "fallback" and TASK in first.reply and CTX.guide not in first.reply
    assert "kalimat soal" in first.reply or "simbol" in first.reply  # pertanyaan penutup tentang soalnya
    hist = [
        {"role": "user", "content": "Maksud dari soal ini tuh apa?"},
        {"role": "assistant", "content": first.reply},
        {"role": "user", "content": "Hah, gak jelas."},
    ]
    second = respond(FakeClient(reply="Jawabannya 4,5 × 10⁶."), CTX_TASK, hist)
    assert second.source == "fallback" and second.reason == "key"
    assert TASK not in second.reply and "Topik 3" in second.reply  # tetap soal yang sama, isi berbeda
    assert "Bagian mana dari contoh itu" not in second.reply  # tidak menanyakan contoh yang tidak ada
    assert "4,5" not in second.reply


def test_angka_depan_contoh_boleh_tetapi_angka_depan_kunci_tidak() -> None:
    q = "Tulis dalam bentuk baku:\n4.050"
    keys = ["4,05 × 10³", "4,05 × 10^3"]
    ok = "Angka depannya (a) harus di antara 1 dan 10, misalnya 2,5 atau 7. Contoh lain: 3,2 × 10⁵."
    assert check_reply(ok, allowed_sources=[q], key_texts=keys, question=q).ok
    assert check_reply("Jadi a-nya 4,05.", allowed_sources=[q], key_texts=keys, question=q).reason == "key"
    assert check_reply("4,05 × 1.000 = 4.050", allowed_sources=[q], key_texts=keys, question=q).reason == "key"
    assert check_reply("Jadi a-nya 4,5 ya.", allowed_sources=[q], key_texts=keys, question=q).reason == "number"  # potongan bilangan soal
    assert check_reply("misalnya 8,25 itu", allowed_sources=[q], key_texts=keys, question=q).ok  # contoh berpenanda (26 Nov 2026)
    assert check_reply("a-nya jadi 8,25", allowed_sources=[q], key_texts=keys, question=q).reason == "number"  # klaim tanpa penanda contoh


def test_endpoint_menerima_topik_dan_maksud_soal(client: TestClient, ai_on: FakeClient) -> None:
    token, _ = _student(client)
    body = {**BODY, "context": {**BODY["context"], "topic": "Topik 3 · Mengubah Bentuk", "task": TASK}}
    r = client.post(f"{API}/ai/chat", headers=_h(token), json=body)
    assert r.status_code == 200
    assert TASK in ai_on.calls[-1][0]["content"]


@pytest.mark.parametrize(
    ("sentence", "wrong"),
    [
        ("2,3 × 10⁻⁴ → geser koma 4 tempat ke kanan → 0,00023", True),  # temuan eval 25 Nov 2026
        ("5,7 × 10⁻³ berarti geser koma tiga tempat ke kanan.", True),  # temuan eval 25 Nov 2026
        ("67.000 → koma digeser 4 kali ke kanan", True),
        ("4,5 × 10³ → koma ke kiri 3 kali → 0,0045", True),
        ("Di 67.000, koma melompat 4 kali ke kiri.", False),
        ("Pada 0,0045, koma digeser ke kanan sampai setelah angka 4.", False),
        ("Untuk 6,7 × 10⁴, koma digeser 4 tempat ke kanan.", False),
        ("Supaya jadi 7 × 10⁻⁴, koma pada 0,0007 digeser ke kanan.", False),  # bilangan tujuan disebut dulu
        ("Kalikan dengan 10, koma geser ke kanan.", False),
        ("Andi menggeser koma 3,07 × 10⁻⁵ ke kanan, padahal harus ke kiri.", False),  # membahas kesalahan
        ("Bilangan kurang dari 1 → koma digeser ke KANAN, pangkat negatif (0,0007 = 7 × 10⁻⁴).", False),
        ("Pangkat −3 artinya koma bergeser 3 kali ke kiri.", False),
    ],
)
def test_arah_geser_koma_dalam_kalimat_diperiksa(sentence: str, wrong: bool) -> None:
    from app.ai.mathcheck import check_math

    assert bool(check_math(sentence).wrong) == wrong


def test_bilangan_soal_tidak_diubah_bentuknya_dan_tidak_salah_tulis() -> None:
    q = "Bilangan 2,3 × 10⁻⁴ terletak di antara …\na. 0,001 dan 0,01\nb. 0,0001 dan 0,001"
    assert check_reply("Coba ubah dulu (misalnya 2,3 × 10⁻⁴ = 0,00023).", allowed_sources=[q], key_texts=[], question=q).reason == "computes"
    assert check_reply("2,3 × 10⁻⁴ → geser koma 4 tempat ke kiri → 0,00023", allowed_sources=[q], key_texts=[], question=q).reason == "computes"
    assert check_reply("Contoh lain: 5,7 × 10⁻³ = 0,0057.", allowed_sources=[q], key_texts=[], question=q).ok
    q1 = "Berapa nilai angka 7 pada bilangan ini?\n3.725"
    bad = check_reply("Soal ini menanyakan nilai angka 7 di bilangan 3,725.", allowed_sources=[q1], key_texts=["700"], question=q1)
    assert bad.reason == "format" and "3.725" in (bad.detail or "")
    assert check_reply("Angka 7 pada 3.725 nilainya 7 × 100.", allowed_sources=[q1], key_texts=["700", "7 × 100"], question=q1).reason == "key"


def test_kunci_sepuluh_tidak_menolak_frasa_aturan_umum() -> None:
    keys = ["1 × 10¹", "1 × 10^1", "10"]  # soal semut: 5 × 10⁻³ m × 2 × 10³ = 10 m
    for ok in ("angka depan harus di antara 1 dan 10", "1 ≤ a < 10", "bilangan 10 atau lebih", "6,7 × 10 = 67", "10 × 10 = 100"):
        assert not leaks_key(ok, keys), ok
    for bad in ("panjangnya 10 m", "hasilnya 10", "jadi 1 × 10¹ m"):
        assert leaks_key(bad, keys), bad


# ---------------------------------------------------------------- riwayat, konteks, RMT/PMSTP, cadangan (26 Nov 2026)
def _long_history(n_turns: int) -> list[dict[str, str]]:
    msgs: list[dict[str, str]] = []
    for i in range(n_turns):
        msgs.append({"role": "user", "content": f"pertanyaan {i}"})
        msgs.append({"role": "assistant", "content": f"Penjelasan {i}."})
    msgs.append({"role": "user", "content": "aku belum paham"})
    return msgs


def test_endpoint_menerima_percakapan_panjang(client: TestClient, ai_on: FakeClient) -> None:
    """Dulu pesan ke-11 selalu ditolak (422) karena server membatasi 20 pesan."""
    token, _ = _student(client)
    r = client.post(f"{API}/ai/chat", headers=_h(token), json={**BODY, "messages": _long_history(15)})
    assert r.status_code == 200, r.text
    sent = [m for m in ai_on.calls[-1] if m["role"] != "system"]
    assert len(sent) <= 16 and sent[0]["role"] == "user" and sent[-1]["content"] == "aku belum paham"


def test_riwayat_menandai_cadangan_dan_isi_visual() -> None:
    from app.ai.tutor import FALLBACK_MARK, prepare_history

    hist = prepare_history(
        [
            {"role": "user", "content": "kenapa?"},
            {"role": "assistant", "content": "Asisten lagi sibuk.\n[[visual:geser-koma]]", "source": "fallback"},
            {"role": "user", "content": "hah?"},
        ],
        VIS,
    )
    assert hist[1]["content"].startswith(FALLBACK_MARK)
    assert "[[visual:geser-koma]] (visual yang tampil ke siswa: 67.000 → 6,7 × 10⁴" in hist[1]["content"]
    note = respond(fake := FakeClient(), CTX_VIS, [*hist[:2], hist[2]]) and fake.calls[0][-1]["content"]
    assert "bukan tulisanmu" in note


def test_jawaban_singkat_dikenali_sebagai_menjawab_pertanyaan_asisten() -> None:
    from app.ai.dialog import classify_turn, turn_note

    hist = [
        {"role": "user", "content": "gimana caranya?"},
        {"role": "assistant", "content": "Lihat 67.000. Komanya digeser ke mana supaya tinggal satu angka di depan?"},
        {"role": "user", "content": "ke kiri"},
    ]
    assert classify_turn(hist) == "menjawab"
    note = turn_note("menjawab", hist, [])
    assert "MENJAWAB" in note and "«Komanya digeser ke mana supaya tinggal satu angka di depan?»" in note
    assert classify_intent("oh, jadi aku harus lihat angka 7 itu ada di tempat apa?") == "konfirmasi"
    assert classify_intent("jadi pakai kali atau bagi?") == "bagaimana"
    assert classify_intent("jadi hasilnya 6 × 10⁷ ya?") == "cek_jawaban"


def test_soal_cerita_membawa_tahap_pmstp() -> None:
    from app.ai.dialog import pmstp_stage

    assert pmstp_stage([{"role": "user", "content": "maksud soalnya apa"}]) == "Pahami"
    assert pmstp_stage([{"role": "user", "content": "jadi pakai kali atau bagi?"}]) == "Modelkan"
    assert pmstp_stage([{"role": "user", "content": "terus pangkatnya diapain?"}]) == "Selesaikan"
    story = dataclasses.replace(CTX, skill="cerita", topic="Topik 5 · Penerapan Bentuk Baku")
    fake = FakeClient()
    respond(fake, story, [{"role": "user", "content": "jadi pakai kali atau bagi?"}])
    assert "tahap PMSTP yang sedang dibahas: Modelkan" in fake.calls[0][-1]["content"]
    respond(fake2 := FakeClient(), CTX, [{"role": "user", "content": "jadi pakai kali atau bagi?"}])
    assert "PMSTP" not in fake2.calls[0][-1]["content"]  # bukan soal cerita


def test_visual_dipilih_menurut_jenis_pertanyaan() -> None:
    from app.ai.dialog import preferred_visuals

    ids = ["geser-koma", "ubah-bentuk", "nilai-tempat"]
    assert preferred_visuals("bagaimana", ids)[0] == "ubah-bentuk"  # proses → visual bertahap
    assert preferred_visuals("mengapa", ids)[0] == "nilai-tempat"  # alasan → struktur
    assert preferred_visuals("lain", ids) == ids


def test_beban_kognitif_tidak_menumpuk_visual_di_atas_tabel_sendiri() -> None:
    table = "Coba lihat pola ini.\n| 10³ | 1.000 |\n| 10⁴ | 10.000 |\nApa yang berubah?"
    out = respond(FakeClient(reply=table), CTX_VIS, [{"role": "user", "content": "aku belum paham"}])
    assert out.source == "ai" and out.visual is None
    plain = respond(FakeClient(reply="Coba lihat contoh di bawah, lalu perhatikan komanya."), CTX_VIS, [{"role": "user", "content": "aku belum paham"}])
    assert plain.visual is not None


def test_pembuka_sama_diminta_diganti_tetapi_tidak_dibuang() -> None:
    hist = [{"role": "user", "content": "kenapa?"}, {"role": "assistant", "content": "Coba perhatikan aturan ini dulu: pangkat positif."}, {"role": "user", "content": "terus?"}]
    same = "Coba perhatikan aturan ini lagi: bilangan 10 atau lebih berpangkat positif."
    seq = SeqClient([same, same, same])
    out = respond(seq, CTX, hist)
    assert out.source == "ai" and "pembuka" in seq.calls[1][-1]["content"]


def test_cadangan_contoh_lain_memberi_contoh_hitungan_aplikasi() -> None:
    out = respond(FakeClient(fail="rate_limit"), CTX_VIS, [{"role": "user", "content": "kasih contoh lain dong"}])
    # contoh langkah (visual bertahap) lebih dulu untuk "contoh lain"; isinya ikut ditulis di pesan
    assert out.source == "fallback" and "Contoh langkah: Cari angka bukan nol pertama: 6" in out.reply and out.visual == "ubah-bentuk"
    assert "contoh" in out.reply.split("\n\n")[-1].lower()  # pertanyaan penutup tentang contoh itu


def test_contoh_bilangan_berpenanda_boleh_tanpa_persamaan() -> None:
    q = "Berapa nilai angka 7 pada bilangan ini?\n3.725"
    ok = "Pikirkan bilangan 12.400. Angka 4 di tempat ratusan, nilainya 4 × 10² = 400. Kalau di puluhan (misalnya 1.240), nilainya 4 × 10¹ = 40."
    assert check_reply(ok, allowed_sources=[q], key_texts=["700", "7 × 100"], question=q).ok
    assert check_reply("Misalnya 372, angka 7 di puluhan.", allowed_sources=[q], key_texts=["700"], question=q).reason == "number"  # potongan soal
    assert check_reply("jadi nilainya 4.381", allowed_sources=[q], key_texts=["700"], question=q).reason == "number"  # klaim hasil


def test_soal_cerita_tidak_membocorkan_operasi_lewat_visual() -> None:
    from app.ai.dialog import preferred_visuals

    assert preferred_visuals("bagaimana", ["kali-bagi", "pmstp"], story=True)[0] == "pmstp"
    story = dataclasses.replace(CTX, skill="cerita", visuals=(("pmstp", "Tabel PMSTP: Pahami, Modelkan, Selesaikan, Tafsirkan, Periksa."), ("kali-bagi", "Contoh perkalian: (3 × 10²) × (4 × 10⁵) = 1,2 × 10⁸.")))
    out = respond(FakeClient(fail="rate_limit"), story, [{"role": "user", "content": "jadi pakai kali atau bagi?"}])
    assert out.visual == "pmstp" and "perkalian" not in out.reply


def test_visual_operasi_ditahan_saat_siswa_masih_memodelkan() -> None:
    story = dataclasses.replace(CTX, skill="cerita", visuals=(("pmstp", "Tabel PMSTP."), ("kali-bagi", "Contoh perkalian: (3 × 10²) × (4 × 10⁵) = 1,2 × 10⁸.")))
    out = respond(FakeClient(reply="Coba baca lagi ceritanya: yang diketahui apa saja?\n[[visual:kali-bagi]]"), story, [{"role": "user", "content": "jadi pakai kali atau bagi?"}])
    assert out.source == "ai" and out.visual == "pmstp"
    later = respond(FakeClient(reply="Angka depannya dikalikan dulu, ya.\n[[visual:kali-bagi]]"), story, [{"role": "user", "content": "angka depannya dihitung gimana?"}])
    assert later.visual == "kali-bagi"  # tahap Selesaikan: boleh


def test_alasan_berhenti_diperiksa_dan_jawaban_terpotong_ditulis_ulang() -> None:
    def make(finish: str):  # type: ignore[no-untyped-def]
        return GroqClient(FAKE_KEY, "openai/gpt-oss-20b", transport=_transport(lambda r: httpx.Response(200, json={"choices": [{"message": {"content": "Jadi kita ge"}, "finish_reason": finish}]})))

    for finish, kind in (("length", "truncated"), ("content_filter", "refusal")):
        with pytest.raises(AIProviderError) as exc:
            make(finish).chat([{"role": "user", "content": "hai"}])
        assert exc.value.kind == kind

    class CutThenOk(FakeClient):
        def chat(self, messages: list[dict[str, str]]) -> str:
            self.calls.append(messages)
            if len(self.calls) == 1:
                raise AIProviderError("truncated")
            return "Coba lihat angka bukan nol pertama di soal. Angka berapa itu?"

    fake = CutThenOk()
    out = respond(fake, CTX, [{"role": "user", "content": "gimana mulainya?"}])
    assert out.source == "ai" and len(fake.calls) == 2 and "terlalu panjang" in fake.calls[1][-1]["content"]


# ---------------------------------------------------------------- konsep ≠ jawaban akhir (26 Nov 2026)
CTX_POW = QuestionContext(
    text="Tulis dalam bentuk biasa:\n10³",
    skill="pangkat10",
    guide="Bagaimana tanda pangkat berhubungan dengan bilangan yang lebih dari 1 atau kurang dari 1?",
    rule="10ⁿ dengan n positif ditulis angka 1 diikuti n angka nol.",
    key_texts=("1.000",),
)
DIRECT = (
    "10³ artinya 10 dikalikan tiga kali: 10 × 10 × 10. Pertama 10 × 10 = 100, lalu 100 × 10 = 1.000. "
    "Jadi 10³ = 1.000. Pangkat 3 menunjukkan banyaknya faktor 10 yang dikalikan."
)
WHY = "Kenapa 10 pangkat 3 hasilnya 1000?"


@pytest.mark.parametrize(
    ("text", "intent"),
    [
        (WHY, "mengapa"),  # pertanyaan konsep
        ("kenapa 10⁻² itu 0,01?", "mengapa"),
        ("kasih contoh lain dong", "contoh_lain"),  # permintaan contoh
        ("ada contoh yang lain?", "contoh_lain"),
        ("jawabannya apa?", "minta_jawaban"),  # permintaan jawaban akhir
        ("kasih tau aja jawabannya", "minta_jawaban"),
        ("aku jawab 1000, bener ga?", "cek_jawaban"),  # siswa menyebut hasilnya
    ],
)
def test_konsep_contoh_dan_jawaban_akhir_dibedakan(text: str, intent: str) -> None:
    assert classify_intent(text) == intent


def test_catatan_giliran_berbeda_untuk_konsep_contoh_dan_jawaban_akhir() -> None:
    from app.ai.dialog import turn_note

    why = turn_note("mengapa", [{"role": "user", "content": WHY}], [])
    assert "Jawab LANGSUNG" in why and "Jangan mengganti pertanyaannya dengan contoh bilangan lain" in why
    example = turn_note("contoh_lain", [{"role": "user", "content": "kasih contoh lain dong"}], [])
    assert "CONTOH LAIN" in example and "Jawab LANGSUNG" not in example
    final = turn_note("minta_jawaban", [{"role": "user", "content": "jawabannya apa?"}], [])
    assert "Jangan berikan jawabannya" in final and "bimbing bertahap" in final


def test_kenapa_10_pangkat_3_dijawab_langsung_tanpa_tulis_ulang() -> None:
    """Kasus pengembang: dulu ditolak sebagai bocoran lalu diganti contoh 10⁵ = 100.000."""
    fake = FakeClient(reply=DIRECT)
    out = respond(fake, CTX_POW, [{"role": "user", "content": WHY}])
    assert out.source == "ai" and "100 × 10 = 1.000" in out.reply and len(fake.calls) == 1
    assert "SUDAH menyebut hasil akhirnya sendiri" in fake.calls[0][-1]["content"]


def test_jawaban_akhir_yang_belum_disebut_siswa_tetap_dijaga() -> None:
    # Siswa bertanya konsep tanpa menyebut hasil → AI tidak boleh menyebut 1.000 (kunci) ...
    asked = [{"role": "user", "content": "kenapa 10 pangkat 3 itu besar?"}]
    assert check_reply(DIRECT, allowed_sources=[CTX_POW.text], key_texts=["1.000"], question=CTX_POW.text, student_text=asked[0]["content"]).reason == "key"
    # ... petunjuk tulis ulang tetap meminta menjawab pertanyaan, bukan "pakai bilangan LAIN"
    seq = SeqClient([DIRECT, DIRECT, DIRECT])
    out = respond(seq, CTX_POW, asked)
    hint = seq.calls[1][-1]["content"]
    assert "tetap jawab pertanyaan siswa" in hint and "bilangan LAIN" not in hint
    # ... dan cadangannya menjelaskan langkahnya sampai sebelum hasil akhir
    assert out.source == "fallback" and "10 × 10 = 100" in out.reply and "1.000" not in out.reply
    # Permintaan jawaban akhir → tetap dibimbing, tanpa kunci
    final = respond(SeqClient(["Jawabannya 1.000."] * 3), CTX_POW, [{"role": "user", "content": "jawabannya apa?"}])
    assert final.source == "fallback" and "1.000" not in final.reply


def test_cadangan_menjawab_pertanyaan_konsep_secara_langsung() -> None:
    out = respond(FakeClient(fail="rate_limit"), CTX_POW, [{"role": "user", "content": WHY}])
    assert out.source == "fallback"
    for part in ("10³ = 10 × 10 × 10", "10 × 10 = 100", "100 × 10 = 1.000", "banyaknya faktor 10"):
        assert part in out.reply, part


def test_hasil_yang_disebut_siswa_boleh_diperiksa_dan_dijelaskan() -> None:
    ok = "Benar. 10³ = 10 × 10 × 10: 10 × 10 = 100, lalu 100 × 10 = 1.000."
    said = "aku jawab 1000, kenapa benar?"
    assert check_reply(ok, allowed_sources=[CTX_POW.text, said], key_texts=["1.000"], question=CTX_POW.text, student_text=said).ok
    wrong = "aku jawab 10.000, bener ga?"
    leak = "Belum tepat, seharusnya 1.000."
    assert check_reply(leak, allowed_sources=[CTX_POW.text, wrong], key_texts=["1.000"], question=CTX_POW.text, student_text=wrong).reason == "key"


def test_ekspresi_yang_ditanyakan_siswa_boleh_dihitung_tetapi_soal_tidak() -> None:
    q = "Hitung, lalu tulis hasilnya dalam bentuk baku:\n(2 × 10³) × (3 × 10⁴)"
    keys = ["6 × 10⁷", "6 × 10^7"]
    reply = "Karena 10³ × 10⁴ = 10⁷: banyaknya faktor 10 dijumlahkan, 3 + 4 = 7."
    asked = "kenapa 10³ × 10⁴ jadi 10⁷?"
    assert check_reply(reply, allowed_sources=[q, asked], key_texts=keys, question=q, student_text=asked).ok
    assert check_reply(reply, allowed_sources=[q, "gimana?"], key_texts=keys, question=q, student_text="gimana?").reason == "computes"
    # angka depan kunci bulat (3 untuk 3 × 10³) tidak lagi membuat "pangkat 3" ditolak
    q3 = "Tulis dalam bentuk baku:\n3.000"
    assert check_reply("Pangkat 3 menunjukkan banyaknya faktor 10.", allowed_sources=[q3, WHY], key_texts=["3 × 10³"], question=q3, student_text=WHY).ok


@pytest.mark.parametrize("n", [n for n in range(-6, 10) if n])
def test_penjelasan_konsep_mesin_selalu_benar(n: int) -> None:
    from app.ai.concepts import explain_power
    from app.ai.mathcheck import check_math

    for reveal in (True, False):
        text = explain_power(n, reveal_result=reveal)
        assert text and not check_math(text).wrong, text


def test_penjelasan_konsep_mengenali_cara_siswa_menulis() -> None:
    from app.ai.concepts import explain_from_text

    assert "10 × 10 = 100" in (explain_from_text(WHY) or "")
    assert "10⁵ = 10 × 10 × 10 × 10 × 10" in (explain_from_text("kenapa 10^5 nolnya 5?") or "")
    assert "0,001" in (explain_from_text("10 pangkat min 3 itu berapa") or "")
    assert "2,5 × 1.000 = 2.500" in (explain_from_text("kenapa 2,5 × 10³ jadi 2.500?") or "")
    assert explain_from_text("aku bingung") is None


def test_titik_dua_tanda_baca_bukan_pembagian() -> None:
    from app.ai.mathcheck import check_math

    assert check_math("10³ = 10 × 10 × 10: 10 × 10 = 100").wrong == []
    assert check_math("Contoh: 10 × 10 = 101").wrong  # hitungan salah tetap tertangkap
    assert check_math("6 : 2 = 4").wrong and check_math("6:2 = 3").wrong == []  # pembagian tetap dihitung
