"""Logika kelas: guru membuat & mengelola kelas VIII-A … VIII-E, siswa bergabung dengan kode.

Hak akses: setiap fungsi untuk guru memeriksa `classes.teacher_id == guru.id`. Kelas milik guru lain
dilaporkan "tidak ditemukan" (404) agar keberadaannya tidak bocor.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..core.deps import api_error
from ..models import Class, ClassMember, LearnerSnapshot, User
from ..schemas import ClassCreate, ClassOut, ClassPatch, StudentClassOut, StudentRow

# Tanpa huruf/angka yang mirip (O/0, I/1/L) agar mudah didiktekan di kelas.
CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6


def new_join_code(db: Session) -> str:
    for _ in range(20):
        code = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))
        if not db.scalar(select(Class.id).where(Class.join_code == code)):
            return code
    raise api_error(500, "CODE_FAILED", "Gagal membuat kode kelas. Coba lagi.")


def normalize_code(raw: str) -> str:
    return raw.strip().upper().replace(" ", "").replace("-", "")


def student_count(db: Session, class_id: str) -> int:
    return db.scalar(select(func.count()).select_from(ClassMember).where(ClassMember.class_id == class_id)) or 0


def class_out(db: Session, klass: Class) -> ClassOut:
    return ClassOut(
        id=klass.id,
        name=klass.name,
        grade=klass.grade,
        academic_year=klass.academic_year,
        join_code=klass.join_code,
        join_enabled=klass.join_enabled,
        student_count=student_count(db, klass.id),
        created_at=klass.created_at,
    )


def list_classes(db: Session, teacher: User) -> list[Class]:
    return list(db.scalars(select(Class).where(Class.teacher_id == teacher.id).order_by(Class.name)))


def owned_class(db: Session, teacher: User, class_id: str) -> Class:
    klass = db.get(Class, class_id)
    if not klass or klass.teacher_id != teacher.id:
        raise api_error(404, "NOT_FOUND", "Kelas tidak ditemukan.")
    return klass


def create_class(db: Session, teacher: User, body: ClassCreate) -> Class:
    if db.scalar(select(Class.id).where(Class.teacher_id == teacher.id, Class.name == body.name)):
        raise api_error(409, "CLASS_EXISTS", f"Kelas {body.name} sudah kamu buat.")
    klass = Class(teacher_id=teacher.id, name=body.name, grade="VIII", academic_year=body.academic_year, join_code=new_join_code(db))
    db.add(klass)
    try:
        db.flush()
    except IntegrityError as exc:  # balapan dua permintaan sekaligus
        db.rollback()
        raise api_error(409, "CLASS_EXISTS", f"Kelas {body.name} sudah kamu buat.") from exc
    return klass


def update_class(db: Session, klass: Class, body: ClassPatch) -> Class:
    if body.join_enabled is not None:
        klass.join_enabled = body.join_enabled
    if body.academic_year is not None:
        klass.academic_year = body.academic_year
    db.flush()
    return klass


def regenerate_code(db: Session, klass: Class) -> Class:
    klass.join_code = new_join_code(db)
    db.flush()
    return klass


def delete_class(db: Session, klass: Class) -> None:
    db.delete(klass)
    db.flush()


def student_rows(db: Session, klass: Class, with_snapshot: bool = False) -> list[StudentRow]:
    rows = db.execute(
        select(User, ClassMember.joined_at)
        .join(ClassMember, ClassMember.student_id == User.id)
        .where(ClassMember.class_id == klass.id)
        .order_by(User.display_name)
    ).all()
    snaps: dict[str, LearnerSnapshot] = {}
    if with_snapshot and rows:
        ids = [u.id for u, _ in rows]
        snaps = {s.student_id: s for s in db.scalars(select(LearnerSnapshot).where(LearnerSnapshot.student_id.in_(ids)))}
    return [
        StudentRow(
            id=u.id,
            display_name=u.display_name,
            username=u.username,
            joined_at=joined,
            snapshot=snaps[u.id].data if u.id in snaps else None,
            snapshot_at=snaps[u.id].updated_at if u.id in snaps else None,
        )
        for u, joined in rows
    ]


def remove_student(db: Session, klass: Class, student_id: str) -> None:
    member = db.get(ClassMember, (klass.id, student_id))
    if not member:
        raise api_error(404, "NOT_FOUND", "Siswa tidak ada di kelas ini.")
    db.delete(member)
    db.flush()


def membership(db: Session, student: User) -> ClassMember | None:
    return db.scalar(select(ClassMember).where(ClassMember.student_id == student.id))


def join_class(db: Session, student: User, raw_code: str) -> Class:
    code = normalize_code(raw_code)
    klass = db.scalar(select(Class).where(Class.join_code == code)) if len(code) == CODE_LENGTH else None
    if not klass:
        raise api_error(404, "CLASS_CODE_INVALID", "Kode kelas tidak ditemukan. Periksa lagi kodenya, ya.")
    if not klass.join_enabled:
        raise api_error(403, "CLASS_CLOSED", "Kelas ini sedang tidak menerima siswa baru. Tanyakan ke gurumu.")
    current = membership(db, student)
    if current and current.class_id == klass.id:
        return klass
    if current:
        raise api_error(409, "ALREADY_IN_CLASS", "Kamu sudah tergabung di kelas lain. Keluar dulu dari kelas itu.")
    db.add(ClassMember(class_id=klass.id, student_id=student.id, joined_at=datetime.now(timezone.utc)))
    db.flush()
    return klass


def leave_class(db: Session, student: User, class_id: str) -> None:
    member = db.get(ClassMember, (class_id, student.id))
    if not member:
        raise api_error(404, "NOT_FOUND", "Kamu tidak tergabung di kelas ini.")
    db.delete(member)
    db.flush()


def student_classes(db: Session, student: User) -> list[StudentClassOut]:
    rows = db.execute(
        select(Class, ClassMember.joined_at, User)
        .join(ClassMember, ClassMember.class_id == Class.id)
        .join(User, User.id == Class.teacher_id)
        .where(ClassMember.student_id == student.id)
    ).all()
    return [StudentClassOut(id=c.id, name=c.name, teacher_name=t.display_name, school=t.school, joined_at=j) for c, j, t in rows]
