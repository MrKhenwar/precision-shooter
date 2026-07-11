"""Training endpoints: course plans + session assignment (coach); daily plan +
mark-complete (athlete)."""

from datetime import date, datetime, timezone
from datetime import date as DateT  # alias for annotations on fields named `date`

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import require_athlete, require_coach
from ..helpers import athlete_display, get_athlete, get_coach
from ..models import AthleteProfile, CoursePlan, TrainingSession, User
from ..serializers import course_plan_dict, session_dict

router = APIRouter(prefix="/training", tags=["training"])


async def _session_count(db, plan_id) -> int:
    return (await db.execute(select(func.count(TrainingSession.id)).where(
        TrainingSession.course_plan_id == plan_id))).scalar_one()


class CoursePlanIn(BaseModel):
    title: str
    cycle: str = "meso"
    themes: str = ""
    start_date: date | None = None
    end_date: date | None = None


@router.get("/course-plans/")
async def list_plans(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    rows = (await db.execute(select(CoursePlan).where(CoursePlan.coach_id == coach.id)
                             .order_by(CoursePlan.created_at.desc()))).scalars().all()
    return [course_plan_dict(p, await _session_count(db, p.id)) for p in rows]


@router.post("/course-plans/", status_code=201)
async def create_plan(body: CoursePlanIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    p = CoursePlan(coach_id=coach.id, title=body.title, cycle=body.cycle, themes=body.themes,
                   start_date=body.start_date, end_date=body.end_date)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return course_plan_dict(p, 0)


@router.delete("/course-plans/{pk}/", status_code=204)
async def delete_plan(pk: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    p = (await db.execute(select(CoursePlan).where(CoursePlan.id == pk, CoursePlan.coach_id == coach.id))).scalar_one_or_none()
    if p:
        await db.delete(p)
        await db.commit()


class SessionIn(BaseModel):
    athlete: int
    title: str
    drills: str = ""
    date: DateT | None = None
    course_plan: int | None = None


@router.get("/sessions/")
async def list_sessions(athlete: int | None = Query(None), user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    stmt = select(TrainingSession).where(TrainingSession.coach_id == coach.id)
    if athlete:
        stmt = stmt.where(TrainingSession.athlete_id == athlete)
    rows = (await db.execute(stmt.order_by(TrainingSession.date.desc()))).scalars().all()
    out = []
    for s in rows:
        out.append(session_dict(s, await athlete_display(db, s.athlete_id)))
    return out


@router.post("/sessions/", status_code=201)
async def create_session(body: SessionIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    ap = (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == body.athlete, AthleteProfile.coach_id == coach.id))).scalar_one_or_none()
    if not ap:
        raise HTTPException(404, "Athlete not linked to you.")
    s = TrainingSession(coach_id=coach.id, athlete_id=ap.id, title=body.title, drills=body.drills,
                        date=body.date or date.today(), course_plan_id=body.course_plan)
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return session_dict(s, await athlete_display(db, ap.id))


@router.get("/my-sessions/")
async def my_sessions(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(TrainingSession).where(TrainingSession.athlete_id == ap.id)
                             .order_by(TrainingSession.date.desc()))).scalars().all()
    return [session_dict(s, user.full_name) for s in rows]


class CompleteIn(BaseModel):
    completed: bool = True


@router.post("/my-sessions/{pk}/complete/")
async def complete_session(pk: int, body: CompleteIn, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    s = (await db.execute(select(TrainingSession).where(
        TrainingSession.id == pk, TrainingSession.athlete_id == ap.id))).scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Session not found.")
    s.completed = body.completed
    s.completed_at = datetime.now(timezone.utc) if body.completed else None
    await db.commit()
    await db.refresh(s)
    return session_dict(s, user.full_name)
