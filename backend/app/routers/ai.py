"""Asisten Belajar (Groq) — hanya untuk siswa yang masuk lewat server sekolah.

GET  /ai/status : apakah asisten tersedia + sisa kuota hari ini
POST /ai/chat   : satu giliran percakapan tentang soal latihan yang sedang dikerjakan

Kunci Groq hanya di backend/.env; respons tidak pernah memuat kunci atau detail galat penyedia.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..ai.groq_client import GroqClient
from ..ai.guardrails import MAX_USER_CHARS
from ..ai.tutor import ChatClient, DailyLimiter, ModelCheck, QuestionContext, respond
from ..core.config import Settings, settings
from ..core.deps import api_error, require_role
from ..models import User

router = APIRouter(prefix="/ai", tags=["asisten belajar"])

_limiter = DailyLimiter()
_model_check = ModelCheck()


def get_ai_settings() -> Settings:
    return settings


@lru_cache(maxsize=4)
def _client_for(api_key: str, model: str) -> GroqClient:
    return GroqClient(api_key, model)


def get_ai_client(cfg: Settings = Depends(get_ai_settings)) -> ChatClient | None:
    if not cfg.ai_enabled or not cfg.groq_api_key or not cfg.groq_model:
        return None
    return _client_for(cfg.groq_api_key, cfg.groq_model)


def get_limiter() -> DailyLimiter:
    return _limiter


def get_model_check() -> ModelCheck:
    return _model_check


class VisualOption(BaseModel):
    """Visual contoh serupa yang dibuat & dihitung aplikasi (frontend lib/assistantVisuals.js). AI hanya memilih id."""

    id: str = Field(..., pattern=r"^[a-z-]{2,24}$")
    summary: str = Field(..., min_length=1, max_length=400)


class AIContext(BaseModel):
    """Teks soal yang sedang dikerjakan (bukan data pribadi). `key_texts` hanya dipakai untuk menyaring
    balasan agar kunci jawaban tidak bocor — tidak pernah dikirim ke penyedia AI."""

    text: str = Field(..., min_length=1, max_length=1500)
    skill: str | None = Field(None, max_length=40)
    guide: str | None = Field(None, max_length=300)
    rule: str | None = Field(None, max_length=400)
    # 25 Nov 2026: topik + "maksud soal" dalam bahasa sehari-hari (frontend content/assistantTasks.js, tanpa kunci)
    topic: str | None = Field(None, max_length=200)
    task: str | None = Field(None, max_length=400)
    key_texts: list[str] = Field(default_factory=list, max_length=8)
    visuals: list[VisualOption] = Field(default_factory=list, max_length=6)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)  # balasan asisten bisa memuat tabel kecil
    # 26 Nov 2026: asal balasan asisten sebelumnya ("fallback" = pesan otomatis aplikasi, ditandai untuk model)
    source: Literal["ai", "fallback"] | None = None


class ChatIn(BaseModel):
    context: AIContext
    # 26 Nov 2026: dulu maks. 20 → pertanyaan ke-11 selalu gagal (422). Server memotong ke jendela MAX_HISTORY.
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=200)


class ChatOut(BaseModel):
    reply: str
    visual: str | None = None  # id visual yang ditampilkan aplikasi di bawah balasan (bila ada)
    source: Literal["ai", "fallback"]
    remaining: int


class StatusOut(BaseModel):
    available: bool
    daily_limit: int
    remaining: int


def _unavailable(cfg: Settings, client: ChatClient | None, check: ModelCheck) -> bool:
    return client is None or check.problem(client) is not None


@router.get("/status", response_model=StatusOut)
def status(
    student: User = Depends(require_role("student")),
    cfg: Settings = Depends(get_ai_settings),
    client: ChatClient | None = Depends(get_ai_client),
    limiter: DailyLimiter = Depends(get_limiter),
    check: ModelCheck = Depends(get_model_check),
) -> StatusOut:
    available = not _unavailable(cfg, client, check)
    remaining = max(0, cfg.ai_daily_limit - limiter.used(student.id))
    return StatusOut(available=available, daily_limit=cfg.ai_daily_limit, remaining=remaining)


@router.post("/chat", response_model=ChatOut)
def chat(
    body: ChatIn,
    student: User = Depends(require_role("student")),
    cfg: Settings = Depends(get_ai_settings),
    client: ChatClient | None = Depends(get_ai_client),
    limiter: DailyLimiter = Depends(get_limiter),
    check: ModelCheck = Depends(get_model_check),
) -> ChatOut:
    if _unavailable(cfg, client, check):
        raise api_error(503, "AI_DISABLED", "Asisten Belajar belum diaktifkan di server sekolah.")
    last = body.messages[-1]
    if last.role != "user":
        raise api_error(422, "VALIDATION_ERROR", "Tulis pertanyaanmu dulu, ya.")
    if len(last.content.strip()) > MAX_USER_CHARS:
        raise api_error(422, "VALIDATION_ERROR", f"Pesan terlalu panjang (maksimal {MAX_USER_CHARS} karakter).")
    remaining = limiter.take(student.id, cfg.ai_daily_limit)
    if remaining is None:
        raise api_error(429, "AI_LIMIT", "Kuota bertanya ke Asisten hari ini sudah habis. Coba lagi besok, ya.")
    ctx = QuestionContext(
        text=body.context.text,
        skill=body.context.skill,
        guide=body.context.guide,
        rule=body.context.rule,
        topic=body.context.topic,
        task=body.context.task,
        key_texts=tuple(body.context.key_texts),
        visuals=tuple((v.id, v.summary) for v in body.context.visuals),
    )
    result = respond(client, ctx, [m.model_dump() for m in body.messages])  # type: ignore[arg-type]
    return ChatOut(reply=result.reply, visual=result.visual, source=result.source, remaining=remaining)
