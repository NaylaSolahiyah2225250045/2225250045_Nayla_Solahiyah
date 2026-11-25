"""Sinkronisasi ringkasan belajar siswa & laporan untuk guru.

Guru hanya bisa membaca ringkasan siswa yang tergabung di kelas miliknya sendiri.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.deps import api_error
from ..models import Class, ClassMember, LearnerSnapshot, User
from ..schemas import ClassReport, Overview, StudentDetail, StudentRow
from .classes import class_out, list_classes, owned_class, student_rows

# Bagian ringkasan yang boleh dikirim aplikasi siswa (data belajar saja).
SNAPSHOT_KEYS = {"v", "modules", "history", "days", "bookRead", "updatedAt"}


def save_snapshot(db: Session, student: User, data: dict[str, Any]) -> LearnerSnapshot:
    unknown = set(data) - SNAPSHOT_KEYS
    if unknown:
        raise api_error(422, "VALIDATION_ERROR", f"Bagian ringkasan tidak dikenal: {', '.join(sorted(unknown))}.")
    if not isinstance(data.get("modules", {}), dict) or not isinstance(data.get("history", []), list) or not isinstance(data.get("days", {}), dict):
        raise api_error(422, "VALIDATION_ERROR", "Bentuk ringkasan belajar tidak sesuai.")
    if len(json.dumps(data)) > settings.max_snapshot_bytes:
        raise api_error(413, "TOO_LARGE", "Ringkasan belajar terlalu besar.")
    snap = db.get(LearnerSnapshot, student.id)
    now = datetime.now(timezone.utc)
    if snap:
        snap.data = data
        snap.updated_at = now
    else:
        snap = LearnerSnapshot(student_id=student.id, data=data, updated_at=now)
        db.add(snap)
    db.flush()
    return snap


def class_report(db: Session, teacher: User, class_id: str) -> ClassReport:
    klass = owned_class(db, teacher, class_id)
    return ClassReport(klass=class_out(db, klass), students=student_rows(db, klass, with_snapshot=True))


def overview(db: Session, teacher: User) -> Overview:
    return Overview(classes=[ClassReport(klass=class_out(db, k), students=student_rows(db, k, with_snapshot=True)) for k in list_classes(db, teacher)])


def student_detail(db: Session, teacher: User, student_id: str) -> StudentDetail:
    row = db.execute(
        select(Class, ClassMember.joined_at, User)
        .join(ClassMember, ClassMember.class_id == Class.id)
        .join(User, User.id == ClassMember.student_id)
        .where(ClassMember.student_id == student_id, Class.teacher_id == teacher.id)
    ).first()
    if not row:
        raise api_error(404, "NOT_FOUND", "Siswa tidak ditemukan di kelasmu.")
    klass, joined, student = row
    snap = db.get(LearnerSnapshot, student.id)
    return StudentDetail(
        student=StudentRow(
            id=student.id,
            display_name=student.display_name,
            username=student.username,
            joined_at=joined,
            snapshot=snap.data if snap else None,
            snapshot_at=snap.updated_at if snap else None,
        ),
        class_id=klass.id,
        class_name=klass.name,
    )


__all__ = ["save_snapshot", "class_report", "overview", "student_detail", "owned_class"]
