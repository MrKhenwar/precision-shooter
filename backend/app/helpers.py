"""Async helpers: lazy get-or-create persona profiles and name lookups."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import AthleteProfile, CoachProfile, ExpertProfile, ParentProfile, User


async def _get_or_create(db: AsyncSession, model, user_id: int):
    obj = (await db.execute(select(model).where(model.user_id == user_id))).scalar_one_or_none()
    if obj is None:
        obj = model(user_id=user_id)
        db.add(obj)
        await db.commit()
        await db.refresh(obj)
    return obj


async def get_athlete(db, user_id): return await _get_or_create(db, AthleteProfile, user_id)
async def get_coach(db, user_id): return await _get_or_create(db, CoachProfile, user_id)
async def get_parent(db, user_id): return await _get_or_create(db, ParentProfile, user_id)
async def get_expert(db, user_id): return await _get_or_create(db, ExpertProfile, user_id)


async def user_full_name(db: AsyncSession, user_id: int) -> str:
    u = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    return u.full_name if u else ""


async def athlete_display(db: AsyncSession, athlete_id: int) -> str:
    """Full name for an athlete profile id."""
    row = (await db.execute(
        select(User.first_name, User.last_name)
        .join(AthleteProfile, AthleteProfile.user_id == User.id)
        .where(AthleteProfile.id == athlete_id)
    )).first()
    return f"{row[0]} {row[1]}".strip() if row else ""


async def coach_display(db: AsyncSession, coach_id: int | None) -> str:
    if not coach_id:
        return ""
    row = (await db.execute(
        select(User.first_name, User.last_name)
        .join(CoachProfile, CoachProfile.user_id == User.id)
        .where(CoachProfile.id == coach_id)
    )).first()
    return f"{row[0]} {row[1]}".strip() if row else ""
