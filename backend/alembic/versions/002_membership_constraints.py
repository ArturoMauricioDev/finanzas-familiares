"""membership and invitation constraints

Revision ID: 002
Revises: 001
Create Date: 2026-10-29 10:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "uq_memberships_active_user",
        "memberships",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("estado = 'activo'"),
    )
    op.create_index(
        "ix_memberships_family_estado",
        "memberships",
        ["family_id", "estado"],
    )
    op.create_index(
        "ix_memberships_user_estado",
        "memberships",
        ["user_id", "estado"],
    )
    op.create_index(
        "ix_invitations_family_usado",
        "invitations",
        ["family_id", "usado"],
    )


def downgrade() -> None:
    op.drop_index("ix_invitations_family_usado", table_name="invitations")
    op.drop_index("ix_memberships_user_estado", table_name="memberships")
    op.drop_index("ix_memberships_family_estado", table_name="memberships")
    op.drop_index("uq_memberships_active_user", table_name="memberships")
