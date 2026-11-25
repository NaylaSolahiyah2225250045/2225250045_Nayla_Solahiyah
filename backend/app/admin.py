"""Perintah admin untuk verifikasi akun guru.

    python -m app.admin pending                 # daftar guru yang menunggu verifikasi
    python -m app.admin approve <email/username> # aktifkan akun guru
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from .db import SessionLocal
from .models import User


def pending() -> list[User]:
    with SessionLocal() as db:
        return list(db.scalars(select(User).where(User.role == "teacher", User.status == "pending")))


def approve(login: str) -> bool:
    login = login.strip().lower()
    with SessionLocal() as db:
        column = User.email if "@" in login else User.username
        user = db.scalar(select(User).where(column == login, User.role == "teacher"))
        if not user:
            return False
        user.status = "active"
        db.commit()
        return True


def main(argv: list[str]) -> int:
    if len(argv) >= 1 and argv[0] == "pending":
        for u in pending():
            print(f"{u.email or u.username}\t{u.display_name}\t{u.school}")
        return 0
    if len(argv) == 2 and argv[0] == "approve":
        ok = approve(argv[1])
        print("Akun guru diaktifkan." if ok else "Guru tidak ditemukan.")
        return 0 if ok else 1
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
