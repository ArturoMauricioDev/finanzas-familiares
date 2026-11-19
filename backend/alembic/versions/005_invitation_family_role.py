"""invitation family role

Revision ID: 005
Revises: 004
Create Date: 2026-11-19 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    family_role = postgresql.ENUM(
        "padre", "madre", "hijo", "hija", name="familyroleenum", create_type=False
    )
    op.add_column("invitations", sa.Column("rol_familiar", family_role, nullable=True))
    op.add_column("invitations", sa.Column("parentesco", sa.String(length=80), nullable=True))


def downgrade() -> None:
    op.drop_column("invitations", "parentesco")
    op.drop_column("invitations", "rol_familiar")