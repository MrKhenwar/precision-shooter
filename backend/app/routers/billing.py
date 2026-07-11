"""Athlete subscription (trial / coached / AI) — plan derived from trial window
+ coach linkage + AI opt-in."""

from datetime import datetime, timezone

from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.database import get_db
from ..core.deps import require_athlete
from ..helpers import get_athlete
from ..models import Subscription, User

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_LABEL = {"trial": "Free Trial", "coached": "Coached (Rs 10/mo)", "ai": "AI Coaching (Rs 50/mo)", "lapsed": "Lapsed"}
PLAN_PRICE = {"trial": 0, "coached": 10, "ai": 50, "lapsed": 0}


async def _get_sub(db, ap):
    sub = (await db.execute(select(Subscription).where(Subscription.athlete_id == ap.id))).scalar_one_or_none()
    if sub is None:
        sub = Subscription(athlete_id=ap.id)
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
    return sub


def _serialize(sub, ap):
    end = ap.trial_end_date
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    in_trial = now <= end
    days_left = max((end - now).days, 0)
    if in_trial:
        plan = "trial"
    elif ap.is_coached:
        plan = "coached"
    elif sub.ai_opted:
        plan = "ai"
    else:
        plan = "lapsed"
    return {
        "plan": plan, "plan_label": PLAN_LABEL[plan], "price": PLAN_PRICE[plan],
        "in_trial": in_trial, "trial_days_left": days_left, "trial_end_date": end.date().isoformat(),
        "is_coached": ap.is_coached, "ai_opted": sub.ai_opted,
        "show_trial_nudge": in_trial and days_left <= (settings.TRIAL_PERIOD_DAYS - settings.TRIAL_NUDGE_DAY),
        "options": [
            {"plan": "coached", "price": PLAN_PRICE["coached"], "available": ap.is_coached, "note": "Link with a coach to unlock"},
            {"plan": "ai", "price": PLAN_PRICE["ai"], "available": True, "note": "Independent AI-guided training"},
        ],
    }


@router.get("/subscription/")
async def subscription(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    return _serialize(await _get_sub(db, ap), ap)


@router.post("/subscription/choose-ai/")
async def choose_ai(ai_opted: bool = Body(True, embed=True), user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    sub = await _get_sub(db, ap)
    sub.ai_opted = ai_opted
    await db.commit()
    await db.refresh(sub)
    return _serialize(sub, ap)
