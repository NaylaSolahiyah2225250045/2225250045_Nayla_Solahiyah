"""Database uji: berkas SQLite sementara yang dibuat lewat migrasi Alembic (bukan create_all),
sehingga tes sekaligus memastikan migrasi cocok dengan model."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="nobaku-test-"))
os.environ.setdefault("DATABASE_URL", f"sqlite:///{(_TMP / 'test.db').as_posix()}")
os.environ.setdefault("JWT_SECRET", "rahasia-uji")
# Jangan pernah membaca backend/.env pengembang (berisi kunci Groq sungguhan) saat tes; tes memakai klien tiruan.
os.environ["NOBAKU_SKIP_DOTENV"] = "1"

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

BACKEND = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session", autouse=True)
def _migrated_db() -> None:
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND / "alembic"))
    command.upgrade(cfg, "head")


@pytest.fixture()
def client() -> TestClient:
    from app.main import app

    return TestClient(app)
