"""Alur Asisten Belajar: sensor → prompt → Groq → saringan → (cadangan bila perlu).

Tidak ada percakapan yang disimpan di server; tidak ada nama/username/kelas yang dikirim ke penyedia AI.
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Literal, Protocol

from .groq_client import AIProviderError
from .concepts import explain_from_text
from .guardrails import MAX_HISTORY, MAX_USER_CHARS, ReplyCheck, answer_revealed, check_reply, extract_visual, leaks_key, scrub_personal, tidy
from .dialog import CONFUSED, classify_turn, opening, pending_subject, pmstp_stage, preferred_visuals, similarity, turn_note, visuals_used
from .prompts import build_messages

WIB = timezone(timedelta(hours=7))
_DEFAULT_GUIDE = "Bagian mana dari soal ini yang paling membuatmu bingung?"


class ChatClient(Protocol):
    model: str

    def chat(self, messages: list[dict[str, str]]) -> str: ...

    def list_models(self) -> set[str]: ...


@dataclass(frozen=True)
class QuestionContext:
    text: str
    skill: str | None = None
    guide: str | None = None
    rule: str | None = None
    key_texts: tuple[str, ...] = ()
    # 25 Nov 2026: topik & "maksud soal" dalam bahasa sehari-hari (frontend content/assistantTasks.js, tanpa kunci)
    topic: str | None = None
    task: str | None = None
    # (id, ringkasan) visual contoh serupa yang dibuat & dihitung aplikasi (lib/assistantVisuals.js)
    visuals: tuple[tuple[str, str], ...] = ()


@dataclass(frozen=True)
class TutorReply:
    reply: str
    source: Literal["ai", "fallback"]
    reason: str | None = None
    visual: str | None = None


# ------------------------------------------------------------------ cadangan (25–26 Nov 2026)
# Cadangan dipakai bila Groq tidak tersedia atau balasan AI tetap ditolak saringan. Tanpa templat tetap: cadangan
# menanggapi JENIS pertanyaan siswa, mengikuti HAL YANG SEDANG DIBAHAS, menjelaskan dengan "maksud soal" / aturan umum
# RMT / CONTOH yang dihitung aplikasi (ringkasan visual), memakai visual yang belum tampil, dan tidak mengulang isi
# yang sudah muncul di percakapan.
_OPENERS: dict[str, tuple[str, ...]] = {
    "maksud_soal": ("Maksud soalnya kira-kira begini.", "Oke, kita pahami dulu soalnya, ya."),
    "mengapa": ("Alasannya begini.", "Kita uraikan pelan-pelan, ya."),
    "istilah": ("Begini artinya:", "Sederhananya begini:"),
    "bagaimana": ("Caranya bisa kamu lihat pada contoh dengan bilangan lain.", "Kita lihat langkahnya pada contoh lain dulu, ya."),
    "belum_paham": ("Oke, berarti penjelasanku tadi belum pas. Aku coba dari sisi lain, ya.", "Tidak apa-apa, kita pelan-pelan lagi dari awal."),
    "lebih_sederhana": ("Kita buat lebih sederhana, ya.", "Pelan-pelan saja, satu bagian dulu."),
    "contoh_lain": ("Ini contoh lain yang sudah dihitung.", "Coba perhatikan contoh yang berbeda ini."),
    "konfirmasi": ("Coba cek langkahmu dengan aturan ini, ya.", "Kamu bisa memastikannya sendiri dengan aturan ini."),
    "menjawab": ("Terima kasih, coba kita cek bareng dengan aturan ini.", "Kita cocokkan jawabanmu dengan aturan ini, ya."),
    "cek_jawaban": ("Kamu bisa memeriksanya sendiri: ubah lagi jawabanmu ke bentuk biasa lalu bandingkan dengan soal, dan pastikan 1 ≤ a < 10.",),
    "minta_jawaban": ("Jawabannya kamu yang temukan, tapi langkah pertamanya kita kerjakan bareng.", "Aku temani sampai ketemu, ya. Mulai dari sini:"),
    "salah_paham": ("Ada bagian yang perlu dicek lagi. Perhatikan aturan ini:", "Hampir, tapi coba bandingkan dengan aturan ini:"),
    "lain": ("Coba perhatikan aturan ini dulu.", "Nah, ini yang penting:"),
}
_DOWN = ("Asisten lagi sibuk sebentar, jadi aku jelaskan singkat dulu, ya.", "Asisten belum bisa menjawab panjang sekarang, tapi ini bagian pentingnya.")
_ALT_QUESTIONS = (
    "Kalau kamu terapkan cara itu ke soalmu, langkah pertamanya apa?",
    "Coba jelaskan dengan kata-katamu sendiri: apa yang berubah?",
)
# Pertanyaan penutup yang NYAMBUNG dengan isi cadangan (bukan pertanyaan pemandu umum).
_ASK_EXAMPLE = ("Dari contoh itu, bagian mana yang masih bikin bingung?", "Coba lihat contohnya: apa yang berubah dari langkah ke langkah?")
_ASK_MEANING = ("Bagian mana dari kalimat soalnya yang masih terasa asing?", "Kata atau simbol mana di soal yang paling bikin bingung?")
_ASK_CONFUSED = ("Bagian mana yang paling bikin bingung: kalimat soalnya, simbolnya, atau langkahnya?", "Mau kita mulai dari bagian yang paling kecil dulu?")
_PROVIDER_DOWN = ("rate_limit", "timeout", "unavailable", "bad_response", "empty", "auth", "model", "refusal")
_EXAMPLE_INTENTS = ("contoh_lain", "bagaimana", *CONFUSED)


def _assistant_texts(history: list[dict[str, str]]) -> list[str]:
    return [m["content"] for m in history if m["role"] == "assistant"]


def _fresh_visual(ctx: QuestionContext, history: list[dict[str, str]], intent: str = "lain") -> str | None:
    """Visual yang belum tampil, dipilih menurut jenis pertanyaan (langkah → visual bertahap, alasan → struktur)."""
    used = set(visuals_used(history))
    return next((vid for vid in preferred_visuals(intent, [v for v, _ in ctx.visuals], story=_is_story(ctx)) if vid not in used), None)


def _summary(ctx: QuestionContext, vid: str | None) -> str:
    return next((s for v, s in ctx.visuals if v == vid), "") if vid else ""


def _example_line(summary: str) -> str:
    """Ringkasan visual (dihitung aplikasi) sebagai contoh dalam kalimat."""
    s = summary.strip().rstrip(".")
    return f"{s}." if s.lower().startswith("contoh") else f"Contoh dengan bilangan lain: {s}."


def _topic_line(ctx: QuestionContext) -> str:
    if not ctx.topic:
        return ""
    name, _, focus = ctx.topic.partition(" — konsep: ")
    return f"Intinya, soal ini melatih {focus}. Itu yang sedang kita pelajari di {name.split(' · ')[0]}." if focus else f"Soal ini bagian dari {name}."


_CONCEPT_INTENTS = ("mengapa", "istilah", "bagaimana", "konfirmasi", "cek_jawaban", "menjawab", "lain", *CONFUSED)
_ASK_CONCEPT = ("Bagian mana dari langkah-langkah itu yang masih bikin bingung?", "Kalau pangkatnya bertambah satu, menurutmu apa yang berubah?")


def _concept_explanation(ctx: QuestionContext, history: list[dict[str, str]], intent: str) -> str | None:
    """Penjelasan langsung (dihitung mesin, concepts.py) untuk ekspresi yang ditanyakan siswa.

    Pesan siswa terakhir yang memuat ekspresi dipakai (saat "belum paham", ekspresi dari pertanyaan sebelumnya).
    Hasil akhirnya hanya ditulis bila tidak membocorkan jawaban soal yang belum disebut siswa; bila membocorkan,
    langkah terakhir dibiarkan untuk siswa."""
    if intent not in _CONCEPT_INTENTS:
        return None
    users = [m["content"] for m in history if m["role"] == "user"]
    targets = users[-1:] if intent not in CONFUSED else list(reversed(users))
    revealed = answer_revealed(list(ctx.key_texts), " ".join(users))
    for text in targets:
        full = explain_from_text(text, reveal_result=True)
        if not full:
            continue
        if revealed or not leaks_key(full, list(ctx.key_texts)):
            return full
        partial = explain_from_text(text, reveal_result=False)
        return partial if partial and not leaks_key(partial, list(ctx.key_texts)) else None
    return None


def fallback_reply(
    ctx: QuestionContext,
    reason: str | None,
    turn: int = 0,
    intent: str = "lain",
    history: list[dict[str, str]] | None = None,
) -> str:
    """Pesan cadangan yang tetap menjelaskan dan nyambung dengan soal & pertanyaan siswa.

    Isi dipilih menurut hal yang sedang dibahas: maksud soal → `task` lalu topik; minta contoh / cara / belum paham →
    CONTOH yang dihitung aplikasi (ringkasan visual yang belum dipakai) lalu aturan; lainnya → aturan umum RMT.
    Tidak mengulang isi yang sudah tampil. Pertanyaan penutup berhubungan dengan isi itu."""
    history = history or []
    said = " ".join(_assistant_texts(history))
    fresh = _fresh_visual(ctx, history, intent)
    subject = (pending_subject(history) if intent in CONFUSED else None) or intent
    if reason in _PROVIDER_DOWN:
        opener = _DOWN[turn % len(_DOWN)]
    else:
        options = _OPENERS.get(intent, _OPENERS["lain"])
        opener = options[turn % len(options)]
    example = _example_line(_summary(ctx, fresh)) if fresh else ""
    topic_line = _topic_line(ctx)
    concept = _concept_explanation(ctx, history, intent)
    if concept and concept not in said:
        # 26 Nov 2026: pertanyaan konsep dijawab LANGSUNG (dihitung mesin), bukan diganti contoh lain atau aturan umum.
        candidates = [concept]
    elif subject == "maksud_soal":
        candidates = [ctx.task, topic_line, example, ctx.rule]
    elif intent in _EXAMPLE_INTENTS:
        candidates = [example, ctx.rule, ctx.task, topic_line]
    else:
        candidates = [ctx.rule, ctx.task, example, topic_line]
    body = next((c for c in candidates if c and c not in said), "")
    if not body and (ctx.rule or ctx.task):
        # Semua sudah pernah tampil: ambil satu kalimat saja, sebagai langkah kecil (bukan paragraf yang sama).
        first = (ctx.rule or ctx.task or "").split(". ")[0].rstrip(".")
        body = f"Kita ambil satu bagian kecil dulu: {first}."
    guide = ctx.guide or _DEFAULT_GUIDE
    if concept and body == concept:
        pool: tuple[str, ...] = _ASK_CONCEPT
    elif body == example and example:
        pool = _ASK_EXAMPLE
    elif subject == "maksud_soal":
        pool = _ASK_MEANING
    elif intent in CONFUSED:
        pool = _ASK_CONFUSED
    elif intent in ("mengapa", "istilah", "contoh_lain", "bagaimana") or guide in said:
        pool = _ALT_QUESTIONS
    else:
        pool = (guide,)
    rotated = pool[turn % len(pool) :] + pool[: turn % len(pool)]
    question = next((q for q in (*rotated, *_ASK_CONFUSED) if q not in said), rotated[0])
    return "\n\n".join(p for p in (opener, body, question) if p)


def _fallback(
    ctx: QuestionContext,
    reason: str | None,
    turn: int,
    intent: str = "lain",
    history: list[dict[str, str]] | None = None,
) -> TutorReply:
    """Cadangan + visual yang BELUM tampil (bila ada), agar siswa mendapat sudut pandang baru."""
    history = history or []
    return TutorReply(fallback_reply(ctx, reason, turn, intent, history), "fallback", reason, _fresh_visual(ctx, history, intent))


FALLBACK_MARK = "«pesan otomatis aplikasi»"
_VISUAL_TAG = re.compile(r"\[\[\s*visual\s*:\s*([a-z-]{2,24})\s*\]\]", re.IGNORECASE)


def prepare_history(
    messages: list[dict[str, str]],
    visuals: tuple[tuple[str, str], ...] = (),
) -> list[dict[str, str]]:
    """Riwayat untuk model (26 Nov 2026).

    - Jendela MAX_HISTORY pesan terakhir, selalu dimulai dari pesan siswa (riwayat panjang tidak lagi ditolak).
    - Pesan siswa: sensor data pribadi + dipotong.
    - Balasan cadangan (`source: "fallback"`) ditandai «pesan otomatis aplikasi» agar model tidak meniru gayanya.
    - Penanda [[visual:id]] tetap ada (untuk `visuals_used`) dan diberi ringkasan isinya, agar model tahu apa yang
      sudah dilihat siswa (dulu hanya id-nya, jadi model tidak tahu maksud "contoh di bawah")."""
    window = messages[-MAX_HISTORY:]
    while window and window[0]["role"] != "user":
        window = window[1:]
    summaries = dict(visuals)
    out: list[dict[str, str]] = []
    for m in window:
        content = m["content"].strip()
        if m["role"] == "user":
            content = scrub_personal(content[:MAX_USER_CHARS])
        else:
            content = _VISUAL_TAG.sub(
                lambda t: f"[[visual:{t.group(1)}]]" + (f" (visual yang tampil ke siswa: {summaries[t.group(1)]})" if t.group(1) in summaries else ""),
                content,
            )
            if m.get("source") == "fallback":
                content = f"{FALLBACK_MARK} {content}"
        out.append({"role": m["role"], "content": content})
    return out


# Permintaan tulis ulang bila balasan ditolak saringan. Tidak pernah memuat kunci jawaban.
_RETRY_HINT = {
    # 26 Nov 2026: tidak lagi menyuruh "pakai contoh bilangan LAIN" — itu membuat model mengganti pertanyaan siswa
    # (ditanya 10³, menjawab 10⁵). Kini: tetap jawab pertanyaannya, hanya hentikan sebelum jawaban akhir soal.
    "key": "Balasanmu tadi menyebut jawaban akhir soal latihan yang belum disebut siswa, jadi tidak ditampilkan. Tulis ulang: tetap jawab pertanyaan siswa dan jelaskan konsep/prosesnya, tetapi berhenti satu langkah sebelum hasil akhir soal dan biarkan siswa menyelesaikannya.",
    "number": "Balasanmu tadi memuat angka yang tidak bisa diperiksa atau bagian jawaban akhir. Tulis ulang: tetap jawab pertanyaan siswa; tulis setiap hitungan lengkap sebagai persamaan yang benar (mis. 10 × 10 = 100), dan jangan menyebut hasil akhir soal yang belum disebut siswa.",
    "computes": "Balasanmu tadi mengerjakan soal latihan sampai hasil yang belum disebut siswa. Tulis ulang: jelaskan konsep dan langkahnya (boleh memakai bilangan yang ditanyakan siswa), tetapi biarkan siswa sendiri yang menghitung langkah yang menghasilkan jawaban soal. Contoh bilangan lain hanya sebagai penguatan.",
    "format": "Ada bilangan soal yang salah tulis: {detail}. Tulis ulang dengan bilangan persis seperti di soal.",
    "wrong_math": "Ada hitungan yang salah di balasanmu: {detail}. Tulis ulang dengan hitungan yang benar (pakai nilai yang benar dari mesin itu) dan sederhana.",
    "long": "Balasanmu tadi terlalu panjang. Tulis ulang: paling banyak sekitar 120 kata di luar tabel/diagram, satu ide, paling banyak satu pertanyaan.",
    "repeat": "Balasanmu hampir sama dengan penjelasanmu sebelumnya, padahal siswa butuh cara lain. Tulis ulang dengan PENDEKATAN BERBEDA (bilangan lebih kecil, langkah lebih kecil, tabel/garis bilangan, atau perbandingan dua bentuk) dan kalimat pembuka yang berbeda.",
    "opening": "Kalimat pembukamu sama dengan balasan sebelumnya. Tulis ulang isi yang sama dengan kalimat pembuka yang berbeda dan alami.",
}
_REPEAT_THRESHOLD = 0.5
MAX_REWRITES = 2  # kualitas lebih penting daripada kuota (keputusan pengembang, 26 Nov 2026)
_OWN_VISUAL = re.compile(r"^\s*\|.*\|\s*$|^\s*```", re.MULTILINE)
_POINTS_BELOW = re.compile(r"\b(di bawah|gambar|visual|tabel berikut|diagram berikut)\b", re.IGNORECASE)


def _is_story(ctx: QuestionContext) -> bool:
    return ctx.skill == "cerita" or bool(ctx.topic and ctx.topic.startswith("Topik 5"))


def respond(client: ChatClient, ctx: QuestionContext, messages: list[dict[str, str]]) -> TutorReply:
    history = prepare_history(messages, ctx.visuals)
    turn = sum(1 for m in history if m["role"] == "assistant")
    intent = classify_turn(history)
    ids = [vid for vid, _ in ctx.visuals]
    student_text = "\n".join(m["content"] for m in history if m["role"] == "user")
    revealed = answer_revealed(list(ctx.key_texts), student_text)
    # Catatan giliran diletakkan SETELAH riwayat (paling diperhatikan model): jawab pesan terakhir sesuai konteksnya.
    payload = [
        *build_messages(ctx.text, ctx.skill, ctx.guide, ctx.rule, history, ctx.visuals, ctx.topic, ctx.task),
        {"role": "system", "content": turn_note(intent, history, ids, story=_is_story(ctx), revealed=revealed)},
    ]
    # Angka contoh di ringkasan visual sudah dihitung mesin, jadi boleh disebut AI.
    allowed_sources = [
        ctx.text,
        ctx.guide or "",
        ctx.rule or "",
        ctx.task or "",
        ctx.topic or "",
        *(summary for _, summary in ctx.visuals),
        *(m["content"] for m in history if m["role"] == "user"),
    ]
    previous = _assistant_texts(history)
    last_opening = opening(previous[-1]) if previous else ""

    def attempt(msgs: list[dict[str, str]]) -> tuple[str, str | None, ReplyCheck]:
        try:
            raw = client.chat(msgs)
        except AIProviderError as err:
            if err.kind == "truncated":  # jawaban terpotong: minta ditulis ulang lebih ringkas, bukan ditampilkan
                return "", None, ReplyCheck(False, "long")
            raise
        reply, vis = extract_visual(tidy(raw), ids)
        check = check_reply(reply, allowed_sources=allowed_sources, key_texts=list(ctx.key_texts), question=ctx.text, student_text=student_text)
        if check.ok and any(similarity(reply, p) >= _REPEAT_THRESHOLD for p in previous):
            check = ReplyCheck(False, "repeat")
        elif check.ok and last_opening and opening(reply) == last_opening:
            check = ReplyCheck(False, "opening")
        return reply, vis, check

    try:
        reply, visual, check = attempt(payload)
        msgs = payload
        for _ in range(MAX_REWRITES):
            if check.ok or check.reason not in _RETRY_HINT:
                break
            # Kesempatan menulis ulang (dengan alasan penolakannya), agar siswa tetap mendapat penjelasan AI.
            msgs = [*msgs, {"role": "system", "content": _RETRY_HINT[check.reason].format(detail=check.detail or "")}]
            reply, visual, check = attempt(msgs)
    except AIProviderError as err:
        return _fallback(ctx, err.kind, turn, intent, history)
    if not check.ok and check.reason == "opening":
        check = ReplyCheck(True)  # pembuka sama tidak cukup alasan untuk membuang penjelasan yang benar
    if not check.ok:
        return _fallback(ctx, check.reason, turn, intent, history)
    used = visuals_used(history)
    if visual is not None and visual in used:
        visual = None  # visual yang sudah tampil tidak diulang (beban kognitif)
    own_visual = bool(_OWN_VISUAL.search(reply))
    if visual is None and ctx.visuals and not own_visual:
        # CLT: visual aplikasi dipasang otomatis hanya bila AI tidak membuat tabel/diagram sendiri, dan bila
        # percakapan belum punya visual, siswa belum paham / minta contoh, atau balasan menunjuk "contoh di bawah".
        if not used or intent in _EXAMPLE_INTENTS or _POINTS_BELOW.search(reply):
            visual = _fresh_visual(ctx, history, intent)
    if visual in _OPERATION_VISUALS and _is_story(ctx) and pmstp_stage(history) in ("Pahami", "Modelkan"):
        # Soal cerita: diagram operasi menunjukkan kali/bagi, padahal memilih operasi adalah langkah siswa.
        visual = "pmstp" if "pmstp" in ids and "pmstp" not in used else None
    return TutorReply(reply, "ai", None, visual)


_OPERATION_VISUALS = ("kali-bagi", "tambah-kurang")


class DailyLimiter:
    """Batas pesan per siswa per hari (WIB), disimpan di memori server.
    Kembali ke nol bila server dimulai ulang (keputusan uji coba, 21 Nov 2026)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counts: dict[str, int] = {}
        self._day = ""

    @staticmethod
    def _today() -> str:
        return datetime.now(WIB).date().isoformat()

    def _roll(self) -> None:
        today = self._today()
        if today != self._day:
            self._day, self._counts = today, {}

    def used(self, user_id: str) -> int:
        with self._lock:
            self._roll()
            return self._counts.get(user_id, 0)

    def take(self, user_id: str, limit: int) -> int | None:
        """Pakai satu kuota. Kembalikan sisa kuota, atau None bila sudah habis."""
        with self._lock:
            self._roll()
            n = self._counts.get(user_id, 0)
            if n >= limit:
                return None
            self._counts[user_id] = n + 1
            return limit - n - 1


class ModelCheck:
    """Memastikan GROQ_MODEL tersedia untuk kunci ini (GET /models), disimpan ±1 jam."""

    TTL_SECONDS = 3600

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._cache: dict[str, tuple[str | None, float]] = {}

    def problem(self, client: ChatClient) -> str | None:
        """None bila model siap; selain itu jenis masalah ('model', 'auth', …)."""
        now = time.monotonic()
        with self._lock:
            hit = self._cache.get(client.model)
            if hit and now - hit[1] < self.TTL_SECONDS:
                return hit[0]
        try:
            result: str | None = None if client.model in client.list_models() else "model"
        except AIProviderError as err:
            # Gangguan jaringan sesaat tidak menutup fitur (percakapan akan memakai cadangan); kunci salah menutupnya.
            result = err.kind if err.kind in ("auth", "model") else None
        with self._lock:
            self._cache[client.model] = (result, now)
        return result
