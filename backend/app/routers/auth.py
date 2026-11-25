"""Auth & profil: /auth/register/student, /auth/register/teacher, /auth/login, /me."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.deps import current_user
from ..db import get_db
from ..models import User
from ..schemas import AuthOut, LoginIn, MePatch, StudentRegister, TeacherRegister, UserOut
from ..services import accounts, classes

router = APIRouter(tags=["auth"])


@router.post("/auth/register/student", response_model=AuthOut, status_code=201)
def register_student(body: StudentRegister, db: Session = Depends(get_db)) -> AuthOut:
    user = accounts.register_student(db, body)
    if body.class_code:
        classes.join_class(db, user, body.class_code)
    db.commit()
    return accounts.auth_out(user)


@router.post("/auth/register/teacher", response_model=AuthOut, status_code=201)
def register_teacher(body: TeacherRegister, db: Session = Depends(get_db)) -> AuthOut:
    user = accounts.register_teacher(db, body)
    db.commit()
    return accounts.auth_out(user)


@router.post("/auth/login", response_model=AuthOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> AuthOut:
    return accounts.auth_out(accounts.authenticate(db, body.login, body.password))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)) -> UserOut:
    return accounts.user_out(user)


@router.patch("/me", response_model=UserOut)
def patch_me(body: MePatch, user: User = Depends(current_user), db: Session = Depends(get_db)) -> UserOut:
    accounts.update_me(db, user, body)
    db.commit()
    return accounts.user_out(user)
