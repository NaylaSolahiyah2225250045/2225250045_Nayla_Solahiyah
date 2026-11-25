"""Kelas (guru pemilik) & bergabung ke kelas (siswa)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ..core.deps import require_active_teacher, require_role
from ..db import get_db
from ..models import User
from ..schemas import ClassCreate, ClassOut, ClassPatch, JoinIn, StudentClassOut, StudentRow
from ..services import classes as svc

router = APIRouter(tags=["kelas"])


@router.get("/classes", response_model=list[ClassOut])
def list_classes(teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> list[ClassOut]:
    return [svc.class_out(db, k) for k in svc.list_classes(db, teacher)]


@router.post("/classes", response_model=ClassOut, status_code=201)
def create_class(body: ClassCreate, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> ClassOut:
    klass = svc.create_class(db, teacher, body)
    db.commit()
    return svc.class_out(db, klass)


@router.get("/classes/{class_id}", response_model=ClassOut)
def get_class(class_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> ClassOut:
    return svc.class_out(db, svc.owned_class(db, teacher, class_id))


@router.patch("/classes/{class_id}", response_model=ClassOut)
def patch_class(class_id: str, body: ClassPatch, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> ClassOut:
    klass = svc.update_class(db, svc.owned_class(db, teacher, class_id), body)
    db.commit()
    return svc.class_out(db, klass)


@router.post("/classes/{class_id}/regenerate-code", response_model=ClassOut)
def regenerate_code(class_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> ClassOut:
    klass = svc.regenerate_code(db, svc.owned_class(db, teacher, class_id))
    db.commit()
    return svc.class_out(db, klass)


@router.delete("/classes/{class_id}", status_code=204)
def delete_class(class_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> Response:
    svc.delete_class(db, svc.owned_class(db, teacher, class_id))
    db.commit()
    return Response(status_code=204)


@router.get("/classes/{class_id}/students", response_model=list[StudentRow])
def class_students(class_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> list[StudentRow]:
    return svc.student_rows(db, svc.owned_class(db, teacher, class_id))


@router.delete("/classes/{class_id}/students/{student_id}", status_code=204)
def remove_student(class_id: str, student_id: str, teacher: User = Depends(require_active_teacher), db: Session = Depends(get_db)) -> Response:
    svc.remove_student(db, svc.owned_class(db, teacher, class_id), student_id)
    db.commit()
    return Response(status_code=204)


@router.post("/classes/join", response_model=StudentClassOut)
def join(body: JoinIn, student: User = Depends(require_role("student")), db: Session = Depends(get_db)) -> StudentClassOut:
    klass = svc.join_class(db, student, body.class_code)
    db.commit()
    return next(c for c in svc.student_classes(db, student) if c.id == klass.id)


@router.get("/me/classes", response_model=list[StudentClassOut])
def my_classes(student: User = Depends(require_role("student")), db: Session = Depends(get_db)) -> list[StudentClassOut]:
    return svc.student_classes(db, student)


@router.delete("/me/classes/{class_id}", status_code=204)
def leave(class_id: str, student: User = Depends(require_role("student")), db: Session = Depends(get_db)) -> Response:
    svc.leave_class(db, student, class_id)
    db.commit()
    return Response(status_code=204)
