"""Skema Pydantic untuk akun, kelas, sinkronisasi, dan laporan guru."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

CLASS_NAMES = ("VIII-A", "VIII-B", "VIII-C", "VIII-D", "VIII-E")


class Preferences(BaseModel):
    """Preferensi per pengguna; semua opsional (yang tidak dikirim tidak berubah)."""

    model_config = {"extra": "forbid"}

    music: bool | None = None
    sfx: bool | None = None
    volume: int | None = Field(None, ge=0, le=100)
    tourDone: bool | None = None


class UserOut(BaseModel):
    id: str
    role: Literal["student", "teacher", "admin"]
    display_name: str
    username: str | None = None
    email: str | None = None
    school: str | None = None
    status: Literal["active", "pending"] = "active"
    kelas: str = "VIII"
    preferences: dict[str, Any] = Field(default_factory=dict)


class AuthOut(BaseModel):
    user: UserOut
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class StudentRegister(BaseModel):
    display_name: str = Field(..., max_length=30)
    username: str = Field(..., max_length=20)
    password: str = Field(..., max_length=128)
    class_code: str | None = Field(None, max_length=8)


class TeacherRegister(BaseModel):
    display_name: str = Field(..., max_length=80)
    login: str = Field(..., max_length=120, description="Email atau username guru")
    password: str = Field(..., max_length=128)
    school: str = Field(..., max_length=120)


class LoginIn(BaseModel):
    login: str = Field(..., max_length=120)
    password: str = Field(..., max_length=128)


class MePatch(BaseModel):
    display_name: str | None = Field(None, max_length=80)
    school: str | None = Field(None, max_length=120)
    current_password: str | None = Field(None, max_length=128)
    new_password: str | None = Field(None, max_length=128)
    preferences: Preferences | None = None


class ClassCreate(BaseModel):
    name: Literal["VIII-A", "VIII-B", "VIII-C", "VIII-D", "VIII-E"]
    academic_year: str | None = Field(None, max_length=9, pattern=r"^\d{4}/\d{4}$")


class ClassPatch(BaseModel):
    join_enabled: bool | None = None
    academic_year: str | None = Field(None, max_length=9, pattern=r"^\d{4}/\d{4}$")


class ClassOut(BaseModel):
    id: str
    name: str
    grade: str
    academic_year: str | None
    join_code: str
    join_enabled: bool
    student_count: int
    created_at: datetime


class JoinIn(BaseModel):
    class_code: str = Field(..., max_length=8)


class StudentClassOut(BaseModel):
    id: str
    name: str
    teacher_name: str
    school: str | None
    joined_at: datetime


class StudentRow(BaseModel):
    id: str
    display_name: str
    username: str | None
    joined_at: datetime
    snapshot: dict[str, Any] | None = None
    snapshot_at: datetime | None = None


class SnapshotIn(BaseModel):
    data: dict[str, Any]


class SnapshotOut(BaseModel):
    data: dict[str, Any] | None
    updated_at: datetime | None


class StudentDetail(BaseModel):
    student: StudentRow
    class_id: str
    class_name: str


class ClassReport(BaseModel):
    klass: ClassOut
    students: list[StudentRow]


class Overview(BaseModel):
    classes: list[ClassReport]
