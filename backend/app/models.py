"""Model data peran Guru & kelas (lihat docs/DATABASE.md §1, bagian yang sudah dibangun).

Skema hanya diubah lewat migrasi Alembic (backend/alembic/versions).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    role: Mapped[str] = mapped_column(String(10), index=True)  # student | teacher | admin
    display_name: Mapped[str] = mapped_column(String(80))
    username: Mapped[str | None] = mapped_column(String(40), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)  # guru/admin saja
    password_hash: Mapped[str] = mapped_column(String(200))
    school: Mapped[str | None] = mapped_column(String(120), nullable=True)  # guru: sekolah/instansi
    status: Mapped[str] = mapped_column(String(10), default="active")  # active | pending
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    # Preferensi tampilan per pengguna (migrasi 0002): music, sfx, volume, tourDone — lihat schemas.Preferences
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    classes: Mapped[list[Class]] = relationship(back_populates="teacher")


class Class(Base):
    __tablename__ = "classes"
    __table_args__ = (UniqueConstraint("teacher_id", "name", name="uq_classes_teacher_name"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    teacher_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(10))  # VIII-A … VIII-E
    grade: Mapped[str] = mapped_column(String(4), default="VIII")
    academic_year: Mapped[str | None] = mapped_column(String(9), nullable=True)
    join_code: Mapped[str] = mapped_column(String(8), unique=True)
    join_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    teacher: Mapped[User] = relationship(back_populates="classes")
    members: Mapped[list[ClassMember]] = relationship(back_populates="klass", cascade="all, delete-orphan")


class ClassMember(Base):
    __tablename__ = "class_members"

    class_id: Mapped[str] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    klass: Mapped[Class] = relationship(back_populates="members")
    student: Mapped[User] = relationship()


class LearnerSnapshot(Base):
    """Ringkasan belajar terbaru seorang siswa (progres, riwayat, aktivitas) yang dikirim aplikasinya.

    Aplikasi siswa bekerja offline-first di perangkat; ringkasan ini disinkronkan agar guru kelasnya
    bisa memantau. Hanya data belajar — tanpa data pribadi tambahan.
    """

    __tablename__ = "learner_snapshots"

    student_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    data: Mapped[dict] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
