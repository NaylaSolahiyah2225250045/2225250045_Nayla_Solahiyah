"""Preferensi akun (musik, volume, efek suara, status panduan) — disimpan per pengguna.

Revision ID: 0002_preferensi
Revises: 0001_guru_kelas
Create Date: 2026-11-21
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_preferensi"
down_revision = "0001_guru_kelas"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("preferences", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("preferences")
