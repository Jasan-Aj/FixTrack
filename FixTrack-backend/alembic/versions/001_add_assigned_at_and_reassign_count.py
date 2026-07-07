"""Add assigned_at and reassign_count to complaints

Revision ID: 001
Revises:
Create Date: 2026-07-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("complaints", sa.Column("assigned_at", sa.DateTime(), nullable=True))
    op.add_column(
        "complaints",
        sa.Column("reassign_count", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("complaints", "reassign_count")
    op.drop_column("complaints", "assigned_at")
