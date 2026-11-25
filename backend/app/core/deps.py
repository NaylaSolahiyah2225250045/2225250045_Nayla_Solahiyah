"""Dependensi FastAPI: pengguna yang sedang masuk & pemeriksaan peran."""

from __future__ import annotations

from collections.abc import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from .security import decode_token

_bearer = HTTPBearer(auto_error=False)


def api_error(status: int, code: str, message: str) -> HTTPException:
    """Format galat sesuai docs/API-SPEC.md §1 (pesan dalam Bahasa Indonesia)."""
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def current_user(creds: HTTPAuthorizationCredentials | None = Depends(_bearer), db: Session = Depends(get_db)) -> User:
    payload = decode_token(creds.credentials) if creds else None
    user = db.get(User, payload["sub"]) if payload and payload.get("sub") else None
    if not user or not user.is_active:
        raise api_error(401, "UNAUTHORIZED", "Sesi berakhir. Silakan masuk lagi.")
    return user


def require_role(role: str) -> Callable[..., User]:
    def dep(user: User = Depends(current_user)) -> User:
        if user.role != role:
            raise api_error(403, "FORBIDDEN", "Fitur ini tidak tersedia untuk jenis akunmu.")
        return user

    return dep


def require_active_teacher(user: User = Depends(require_role("teacher"))) -> User:
    if user.status != "active":
        raise api_error(403, "TEACHER_PENDING", "Akun guru masih menunggu verifikasi. Pengelolaan kelas terbuka setelah akun diaktifkan.")
    return user
