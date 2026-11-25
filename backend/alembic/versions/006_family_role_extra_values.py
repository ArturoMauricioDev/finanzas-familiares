"""family role extra values

Revision ID: 006
Revises: 005
Create Date: 2026-11-20 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL 12+ allows ALTER TYPE ... ADD VALUE inside a transaction.
    op.execute("ALTER TYPE familyroleenum ADD VALUE IF NOT EXISTS 'tio'")
    op.execute("ALTER TYPE familyroleenum ADD VALUE IF NOT EXISTS 'abuelo'")
    op.execute("ALTER TYPE familyroleenum ADD VALUE IF NOT EXISTS 'otro'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from an enum type without
    # recreating it. Dropping values that may already be in use would fail or
    # corrupt data, so the added values are intentionally left in place.
    pass
