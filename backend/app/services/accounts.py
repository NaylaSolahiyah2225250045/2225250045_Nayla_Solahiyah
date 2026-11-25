"""Logika akun: pendaftaran siswa/guru, masuk, dan ubah profil."""

from __future__ import annotations

import re

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.deps import api_error
from ..core.security import create_access_token, hash_password, verify_password
from ..models import User
from ..schemas import AuthOut, MePatch, StudentRegister, TeacherRegister, UserOut

USERNAME_RE = re.compile(r"^[a-z0-9_.]{3,20}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$")


def normalize_login(raw: str) -> str:
    return raw.strip().lower()


def user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        role=user.role,  # type: ignore[arg-type]
        display_name=user.display_name,
        username=user.username,
        email=user.email,
        school=user.school,
        status=user.status,  # type: ignore[arg-type]
        preferences=user.preferences or {},
    )


def auth_out(user: User) -> AuthOut:
    return AuthOut(user=user_out(user), access_token=create_access_token(user.id, user.role))


def _find_by_login(db: Session, login: str) -> User | None:
    column = User.email if "@" in login else User.username
    return db.scalar(select(User).where(column == login))


def _validation(field: str, message: str) -> HTTPException:
    """Galat isian; `field` dipakai aplikasi untuk menaruh pesan di bawah kolom yang tepat."""
    return HTTPException(status_code=422, detail={"code": "VALIDATION_ERROR", "field": field, "message": message})


def register_student(db: Session, body: StudentRegister) -> User:
    name = body.display_name.strip()
    username = normalize_login(body.username)
    if not 2 <= len(name) <= 30:
        raise _validation("display_name", "Tulis nama panggilanmu (2–30 huruf).")
    if not USERNAME_RE.fullmatch(username):
        raise _validation("username", "Username 3–20 karakter: huruf kecil, angka, titik, atau garis bawah.")
    if len(body.password) < 6:
        raise _validation("password", "Kata sandi minimal 6 karakter.")
    if _find_by_login(db, username):
        raise api_error(409, "USERNAME_TAKEN", "Username ini sudah dipakai. Coba yang lain, ya.")
    user = User(role="student", display_name=name, username=username, password_hash=hash_password(body.password), status="active")
    db.add(user)
    db.flush()
    return user


def register_teacher(db: Session, body: TeacherRegister) -> User:
    name = body.display_name.strip()
    login = normalize_login(body.login)
    school = body.school.strip()
    if not 3 <= len(name) <= 80:
        raise _validation("display_name", "Tulis nama lengkap (3–80 huruf).")
    is_email = "@" in login
    if is_email and not EMAIL_RE.fullmatch(login):
        raise _validation("login", "Format email belum benar.")
    if not is_email and not USERNAME_RE.fullmatch(login):
        raise _validation("login", "Username 3–20 karakter: huruf kecil, angka, titik, atau garis bawah.")
    if len(body.password) < 8:
        raise _validation("password", "Kata sandi guru minimal 8 karakter.")
    if not 3 <= len(school) <= 120:
        raise _validation("school", "Tulis nama sekolah atau instansi.")
    if _find_by_login(db, login):
        raise api_error(409, "LOGIN_TAKEN", "Email/username ini sudah terdaftar.")
    user = User(
        role="teacher",
        display_name=name,
        email=login if is_email else None,
        username=None if is_email else login,
        school=school,
        password_hash=hash_password(body.password),
        status="pending" if settings.teacher_require_approval else "active",
    )
    db.add(user)
    db.flush()
    return user


def authenticate(db: Session, login_raw: str, password: str) -> User:
    user = _find_by_login(db, normalize_login(login_raw))
    if not user or not verify_password(password, user.password_hash):
        raise api_error(401, "INVALID_CREDENTIALS", "Username/email atau kata sandi belum tepat.")
    if not user.is_active:
        raise api_error(403, "ACCOUNT_DISABLED", "Akun ini sedang dinonaktifkan.")
    return user


def update_me(db: Session, user: User, body: MePatch) -> User:
    if body.display_name is not None:
        name = body.display_name.strip()
        limit = 30 if user.role == "student" else 80
        if not 2 <= len(name) <= limit:
            raise _validation("display_name", f"Nama 2–{limit} huruf.")
        user.display_name = name
    if body.school is not None and user.role == "teacher":
        school = body.school.strip()
        if not 3 <= len(school) <= 120:
            raise _validation("school", "Tulis nama sekolah atau instansi.")
        user.school = school
    if body.preferences is not None:
        patch = body.preferences.model_dump(exclude_none=True)
        user.preferences = {**(user.preferences or {}), **patch}
    if body.new_password is not None:
        if not body.current_password or not verify_password(body.current_password, user.password_hash):
            raise api_error(400, "WRONG_PASSWORD", "Kata sandi lama belum tepat.")
        if len(body.new_password) < (8 if user.role == "teacher" else 6):
            raise _validation("new_password", "Kata sandi baru terlalu pendek.")
        user.password_hash = hash_password(body.new_password)
    db.flush()
    return user
