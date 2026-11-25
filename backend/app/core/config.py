"""Konfigurasi dari variabel lingkungan (.env tidak di-commit)."""

from __future__ import annotations

import os
import secrets
import warnings
from dataclasses import dataclass, field
from pathlib import Path

try:  # python-dotenv: memuat backend/.env (rahasia seperti GROQ_API_KEY hanya di file ini, tidak di-commit)
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover — tanpa python-dotenv, variabel tetap bisa diatur lewat lingkungan
    load_dotenv = None

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
# Tes menyetel NOBAKU_SKIP_DOTENV=1 agar kunci sungguhan di .env pengembang tidak pernah ikut terbaca.
if load_dotenv is not None and os.getenv("NOBAKU_SKIP_DOTENV") != "1":
    load_dotenv(ENV_FILE, override=False)


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "ya"}


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if secret:
        return secret
    # Pengembangan lokal: rahasia acak per proses (token tidak berlaku lagi setelah server dimulai ulang).
    warnings.warn("JWT_SECRET belum diatur; memakai rahasia acak sementara (hanya untuk pengembangan).", stacklevel=2)
    return secrets.token_urlsafe(48)


@dataclass(frozen=True)
class Settings:
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./nobaku.db"))
    jwt_secret: str = field(default_factory=_jwt_secret)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = field(default_factory=lambda: int(os.getenv("ACCESS_TOKEN_MINUTES", str(60 * 24 * 7))))
    # Verifikasi akun guru: bila True, guru baru berstatus "pending" dan baru bisa mengelola kelas
    # setelah diaktifkan admin (python -m app.admin approve <email/username>).
    teacher_require_approval: bool = field(default_factory=lambda: _bool("TEACHER_REQUIRE_APPROVAL", False))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:4173").split(",") if o.strip()
        )
    )
    # Batas ukuran ringkasan belajar yang dikirim siswa (byte JSON).
    max_snapshot_bytes: int = 300_000
    # Asisten Belajar (Groq, docs/AI-TUTOR.md). Mati secara bawaan; kunci hanya dari backend/.env.
    ai_enabled: bool = field(default_factory=lambda: _bool("AI_ENABLED", False))
    # repr=False: kunci tidak pernah ikut tercetak bila objek pengaturan dicetak/di-log.
    groq_api_key: str = field(default_factory=lambda: os.getenv("GROQ_API_KEY", "").strip(), repr=False)
    groq_model: str = field(default_factory=lambda: os.getenv("GROQ_MODEL", "openai/gpt-oss-20b").strip())
    # Batas pesan per siswa per hari (disimpan di memori server; kembali ke nol saat server dimulai ulang).
    ai_daily_limit: int = field(default_factory=lambda: int(os.getenv("AI_DAILY_LIMIT", "20")))


settings = Settings()
