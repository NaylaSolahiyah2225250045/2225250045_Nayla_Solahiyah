"""Sinkronisasi ringkasan belajar (siswa) & laporan guru."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.deps import require_active_teacher, require_role
from ..db import get_db
from ..models import LearnerSnapshot, User
from ..schemas import ClassReport, Overview, SnapshotIn, SnapshotOut, StudentDetail
from ..services import reports as svc

router = APIRouter(tags=["progres & laporan"])


@router.put("/sync/me", response_model=SnapshotOut)
def put_snapshot(body: SnapshotIn, student: User = Depends(require_role("student")), db: Session = Depends(get_db)) -> SnapshotOut:
    snap = svc.save_snapshot(db, student, body.data)
    db.commit()
    return SnapshotOut(data=snap.data, updated_at=snap.updated_at)


@router.get("/sync/me", response_model=SnapshotOut)
def get_snapshot(student: User = Depends(require_role("student")), db: Session = Depends(get_db)) -> SnapshotOut:
    snap = db.get(LearnerSnapshot, student.id)
    return SnapshotOut(data=snap.data if snap else None, updated_at=snap.updated_at if snap else None)


@router.get("/reports/overview", response_model=Overview)
def overview(teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> Overview:
    return svc.overview(db, teacher)


@router.get("/reports/classes/{class_id}", response_model=ClassReport)
def class_report(class_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> ClassReport:
    return svc.class_report(db, teacher, class_id)


@router.get("/reports/students/{student_id}", response_model=StudentDetail)
def student_detail(student_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> StudentDetail:
    return svc.student_detail(db, teacher, student_id)
