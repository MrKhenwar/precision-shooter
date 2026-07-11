"""NFR-004 audit logging helper — records write operations on evaluations,
tier changes, and fee records with the acting user id + timestamp."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import AuditLog


async def audit(db: AsyncSession, user_id: int | None, action: str, entity: str,
                entity_id: int | None = None, detail: str = "") -> None:
    db.add(AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, detail=detail))
    # Caller commits alongside its own write so the audit row is atomic with it.
