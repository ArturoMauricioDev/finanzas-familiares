"""user soft delete status

Revision ID: 007
Revises: 006
Create Date: 2026-11-26 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_status = postgresql.ENUM("activo", "eliminado", name="userstatusenum")
    user_status.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column("estado", user_status, nullable=False, server_default="activo"),
    )
    op.add_column(
        "users",
        sa.Column("fecha_eliminacion", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "fecha_eliminacion")
    op.drop_column("users", "estado")
    op.execute("DROP TYPE IF EXISTS userstatusenum")