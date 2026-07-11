"""Performance endpoints: athlete shooting records & diary & own evaluations;
coach creates evaluations and reads a linked athlete's data."""

from datetime import date
from datetime import date as DateT  # alias for annotations on fields named `date`

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.audit import audit
from ..core.database import get_db
from ..core.deps import require_athlete, require_coach
from ..helpers import athlete_display, get_athlete, get_coach
from ..models import AthleteProfile, DiaryEntry, Evaluation, ShootingRecord, User
from ..serializers import diary_dict, evaluation_dict, shooting_dict

router = APIRouter(prefix="/performance", tags=["performance"])


async def _linked(db, coach_id, athlete_id):
    return (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == athlete_id, AthleteProfile.coach_id == coach_id))).scalar_one_or_none()


# --- Athlete: shooting records ---------------------------------------------
class ShootingIn(BaseModel):
    date: DateT | None = None
    total_shots: int = 0
    inner_tens: int = 0
    grouping_mm: float | None = None
    total_score: float | None = None
    notes: str = ""


@router.get("/shooting-records/")
async def my_shooting(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(ShootingRecord).where(ShootingRecord.athlete_id == ap.id)
                             .order_by(ShootingRecord.date.desc()))).scalars().all()
    return [shooting_dict(r) for r in rows]


@router.post("/shooting-records/", status_code=201)
async def add_shooting(body: ShootingIn, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    r = ShootingRecord(athlete_id=ap.id, date=body.date or date.today(), total_shots=body.total_shots,
                       inner_tens=body.inner_tens, grouping_mm=body.grouping_mm, total_score=body.total_score,
                       notes=body.notes)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return shooting_dict(r)


# --- Athlete: diary (upsert per day) ---------------------------------------
class DiaryIn(BaseModel):
    date: DateT | None = None
    sleep_quality: int = 0
    resting_hr: int | None = None
    stress_level: int = 0
    notes: str = ""


@router.get("/diary/")
async def my_diary(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(DiaryEntry).where(DiaryEntry.athlete_id == ap.id)
                             .order_by(DiaryEntry.date.desc()))).scalars().all()
    return [diary_dict(d) for d in rows]


@router.post("/diary/")
async def add_diary(body: DiaryIn, response: Response, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    d = body.date or date.today()
    entry = (await db.execute(select(DiaryEntry).where(
        DiaryEntry.athlete_id == ap.id, DiaryEntry.date == d))).scalar_one_or_none()
    created = entry is None
    if created:
        entry = DiaryEntry(athlete_id=ap.id, date=d)
        db.add(entry)
    entry.sleep_quality = body.sleep_quality
    entry.resting_hr = body.resting_hr
    entry.stress_level = body.stress_level
    entry.notes = body.notes
    await db.commit()
    await db.refresh(entry)
    response.status_code = 201 if created else 200
    return diary_dict(entry)


@router.get("/evaluations/")
async def my_evaluations(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(Evaluation).where(Evaluation.athlete_id == ap.id)
                             .order_by(Evaluation.date.desc()))).scalars().all()
    return [evaluation_dict(e, user.full_name) for e in rows]


# --- Coach: create evaluation ----------------------------------------------
# FR-008 scales: shooting metrics 0-25, S&C core/cardio 0-33, balance 0-34.
class EvaluationIn(BaseModel):
    athlete_id: int
    kind: str = "periodic"
    hold_stability: int = Field(0, ge=0, le=25)
    trigger_timing: int = Field(0, ge=0, le=25)
    approach: int = Field(0, ge=0, le=25)
    follow_through: int = Field(0, ge=0, le=25)
    core_strength: int = Field(0, ge=0, le=33)
    cardio_endurance: int = Field(0, ge=0, le=33)
    balance_index: int = Field(0, ge=0, le=34)
    notes: str = ""


@router.post("/evaluations/create/", status_code=201)
async def create_evaluation(body: EvaluationIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    ap = await _linked(db, coach.id, body.athlete_id)
    if not ap:
        raise HTTPException(404, "Athlete not linked to you.")
    if body.kind not in ("initial", "periodic"):
        raise HTTPException(400, "kind must be 'initial' or 'periodic'.")
    e = Evaluation(athlete_id=ap.id, coach_id=coach.id, kind=body.kind, hold_stability=body.hold_stability,
                   trigger_timing=body.trigger_timing, approach=body.approach, follow_through=body.follow_through,
                   core_strength=body.core_strength, cardio_endurance=body.cardio_endurance,
                   balance_index=body.balance_index, notes=body.notes)
    db.add(e)
    await db.flush()
    await audit(db, user.id, "create", "evaluation", e.id, f"athlete={ap.id} overall={e.overall_score}")
    await db.commit()
    await db.refresh(e)
    return evaluation_dict(e, await athlete_display(db, ap.id))


# --- Coach: read a linked athlete's data -----------------------------------
async def _coach_scope(db, user, athlete_id):
    coach = await get_coach(db, user.id)
    ap = await _linked(db, coach.id, athlete_id)
    return ap


@router.get("/athletes/{athlete_id}/evaluations/")
async def athlete_evaluations(athlete_id: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    ap = await _coach_scope(db, user, athlete_id)
    if not ap:
        return []
    name = await athlete_display(db, ap.id)
    rows = (await db.execute(select(Evaluation).where(Evaluation.athlete_id == ap.id)
                             .order_by(Evaluation.date.desc()))).scalars().all()
    return [evaluation_dict(e, name) for e in rows]


@router.get("/athletes/{athlete_id}/shooting-records/")
async def athlete_shooting(athlete_id: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    ap = await _coach_scope(db, user, athlete_id)
    if not ap:
        return []
    rows = (await db.execute(select(ShootingRecord).where(ShootingRecord.athlete_id == ap.id)
                             .order_by(ShootingRecord.date.desc()))).scalars().all()
    return [shooting_dict(r) for r in rows]


@router.get("/athletes/{athlete_id}/diary/")
async def athlete_diary(athlete_id: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    ap = await _coach_scope(db, user, athlete_id)
    if not ap:
        return []
    rows = (await db.execute(select(DiaryEntry).where(DiaryEntry.athlete_id == ap.id)
                             .order_by(DiaryEntry.date.desc()))).scalars().all()
    return [diary_dict(d) for d in rows]
