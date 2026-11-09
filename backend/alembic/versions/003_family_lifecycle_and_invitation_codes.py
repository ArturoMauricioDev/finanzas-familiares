"""family lifecycle and invitation codes

Revision ID: 003
Revises: 002
Create Date: 2026-11-06 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    family_status = postgresql.ENUM("activo", "eliminado", name="familystatusenum")
    family_status.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "families",
        sa.Column(
            "estado",
            family_status,
            nullable=False,
            server_default="activo",
        ),
    )
    op.add_column(
        "families",
        sa.Column("fecha_eliminacion", sa.DateTime(timezone=True), nullable=True),
    )
    op.alter_column("invitations", "token", existing_type=sa.String(), nullable=True)
    op.add_column(
        "invitations",
        sa.Column("codigo", sa.String(length=16), nullable=True),
    )
    op.add_column(
        "invitations",
        sa.Column("fecha_uso", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        "UPDATE invitations "
        "SET codigo = upper(substr(md5(random()::text), 1, 8)) "
        "WHERE codigo IS NULL"
    )
    op.alter_column("invitations", "codigo", existing_type=sa.String(length=16), nullable=False)
    op.create_unique_constraint("uq_invitations_codigo", "invitations", ["codigo"])
    op.create_index("ix_invitations_codigo_usado", "invitations", ["codigo", "usado"])


def downgrade() -> None:
    op.drop_index("ix_invitations_codigo_usado", table_name="invitations")
    op.drop_constraint("uq_invitations_codigo", "invitations", type_="unique")
    op.drop_column("invitations", "fecha_uso")
    op.drop_column("invitations", "codigo")
    op.alter_column("invitations", "token", existing_type=sa.String(), nullable=False)
    op.drop_column("families", "fecha_eliminacion")
    op.drop_column("families", "estado")
    op.execute("DROP TYPE IF EXISTS familystatusenum")
