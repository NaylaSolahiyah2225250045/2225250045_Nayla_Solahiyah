"""Peran guru, kelas VIII-A–E, anggota kelas, ringkasan belajar siswa.

Revision ID: 0001_guru_kelas
Revises:
Create Date: 2026-11-17
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_guru_kelas"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("role", sa.String(10), nullable=False),
        sa.Column("display_name", sa.String(80), nullable=False),
        sa.Column("username", sa.String(40), nullable=True, unique=True),
        sa.Column("email", sa.String(120), nullable=True, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("school", sa.String(120), nullable=True),
        sa.Column("status", sa.String(10), nullable=False, server_default="active"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_role", "users", ["role"])
    op.create_table(
        "classes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("teacher_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(10), nullable=False),
        sa.Column("grade", sa.String(4), nullable=False, server_default="VIII"),
        sa.Column("academic_year", sa.String(9), nullable=True),
        sa.Column("join_code", sa.String(8), nullable=False, unique=True),
        sa.Column("join_enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("teacher_id", "name", name="uq_classes_teacher_name"),
    )
    op.create_index("ix_classes_teacher_id", "classes", ["teacher_id"])
    op.create_table(
        "class_members",
        sa.Column("class_id", sa.String(36), sa.ForeignKey("classes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("student_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_class_members_student_id", "class_members", ["student_id"])
    op.create_table(
        "learner_snapshots",
        sa.Column("student_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("learner_snapshots")
    op.drop_index("ix_class_members_student_id", table_name="class_members")
    op.drop_table("class_members")
    op.drop_index("ix_classes_teacher_id", table_name="classes")
    op.drop_table("classes")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_table("users")
