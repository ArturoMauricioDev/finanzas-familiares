"""membership family role

Revision ID: 004
Revises: 003
Create Date: 2026-11-17 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    family_role = postgresql.ENUM("padre", "madre", "hijo", "hija", name="familyroleenum")
    family_role.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "memberships",
        sa.Column("rol_familiar", family_role, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("memberships", "rol_familiar")
    op.execute("DROP TYPE IF EXISTS familyroleenum")
