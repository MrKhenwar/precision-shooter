"""Coach endpoints: profile, link requests, roster, tier, batches, attendance,
expert profile & directory. Roster and attendance summary are Redis-cached."""

from datetime import date, datetime, time, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.audit import audit
from ..core.database import get_db
from ..core.deps import require_coach
from ..core.redis_cache import cache_get, cache_invalidate, cache_set
from ..helpers import athlete_display, get_coach
from ..models import (
    AthleteProfile, AttendanceRecord, Batch, BatchAthlete, CoachAthleteLink,
    CoachProfile, ExpertProfile, TierHistory, User,
)
from ..serializers import attendance_dict, batch_dict, link_dict

router = APIRouter(prefix="/coaching", tags=["coaching"])
PRESENT_LIKE = ("present", "late")
# FR-004 tier ladder.
TIERS = (
    "rookie", "novice", "marksman", "sharpshooter", "district", "state",
    "zone", "national", "trial", "national_team",
)


async def _approved_count(db, coach_id) -> int:
    return (await db.execute(select(func.count(CoachAthleteLink.id)).where(
        CoachAthleteLink.coach_id == coach_id, CoachAthleteLink.status == "approved"))).scalar_one()


@router.get("/profile/")
async def coach_profile(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    return {
        "id": coach.id, "full_name": user.full_name, "license_type": coach.license_type,
        "license_number": coach.license_number, "experience_years": coach.experience_years,
        "bio": coach.bio, "active_athlete_count": await _approved_count(db, coach.id),
    }


@router.get("/link-requests/")
async def pending_links(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    rows = (await db.execute(select(CoachAthleteLink).where(
        CoachAthleteLink.coach_id == coach.id, CoachAthleteLink.status == "pending"
    ).order_by(CoachAthleteLink.requested_at.desc()))).scalars().all()
    out = []
    for l in rows:
        ap = (await db.execute(select(AthleteProfile).where(AthleteProfile.id == l.athlete_id))).scalar_one_or_none()
        name = await athlete_display(db, l.athlete_id)
        out.append(link_dict(l, name, ap.discipline if ap else ""))
    return out


@router.post("/link-requests/{pk}/{action}/")
async def respond_link(pk: int, action: str, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    link = (await db.execute(select(CoachAthleteLink).where(
        CoachAthleteLink.id == pk, CoachAthleteLink.coach_id == coach.id, CoachAthleteLink.status == "pending"
    ))).scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Request not found.")
    link.responded_at = datetime.now(timezone.utc)
    if action == "approve":
        link.status = "approved"
        ap = (await db.execute(select(AthleteProfile).where(AthleteProfile.id == link.athlete_id))).scalar_one()
        ap.coach_id = coach.id
        await db.commit()
        await cache_invalidate(f"roster:{coach.id}")
        return {"message": "Athlete linked."}
    if action == "reject":
        link.status = "rejected"
        await db.commit()
        return {"message": "Request rejected."}
    raise HTTPException(400, "Invalid action.")


@router.get("/roster/")
async def roster(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    cached = await cache_get(f"roster:{coach.id}")
    if cached is not None:
        return cached
    rows = (await db.execute(
        select(AthleteProfile, User.first_name, User.last_name)
        .join(User, User.id == AthleteProfile.user_id)
        .where(AthleteProfile.coach_id == coach.id)
    )).all()
    out = [{
        "id": ap.id, "full_name": f"{fn} {ln}".strip(), "discipline": ap.discipline,
        "current_tier": ap.current_tier, "age_category": ap.age_category,
    } for ap, fn, ln in rows]
    await cache_set(f"roster:{coach.id}", out, ttl=30)
    return out


class TierIn(BaseModel):
    tier: str


@router.post("/athletes/{athlete_id}/tier/")
async def set_tier(athlete_id: int, body: TierIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    ap = (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == athlete_id, AthleteProfile.coach_id == coach.id))).scalar_one_or_none()
    if not ap:
        raise HTTPException(404, "Athlete not linked to you.")
    if body.tier not in TIERS:
        raise HTTPException(400, "Unknown tier.")
    old = ap.current_tier
    ap.current_tier = body.tier
    # FR-004: append-only tier history + NFR-004 audit.
    db.add(TierHistory(athlete_id=ap.id, coach_id=coach.id, old_tier=old, new_tier=body.tier))
    await audit(db, user.id, "tier_change", "athlete", ap.id, f"{old} -> {body.tier}")
    await db.commit()
    await cache_invalidate(f"roster:{coach.id}")
    return {"message": "Tier updated.", "current_tier": ap.current_tier}


@router.get("/athletes/{athlete_id}/tier-history/")
async def tier_history(athlete_id: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    ap = (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == athlete_id, AthleteProfile.coach_id == coach.id))).scalar_one_or_none()
    if not ap:
        raise HTTPException(404, "Athlete not linked to you.")
    rows = (await db.execute(select(TierHistory).where(TierHistory.athlete_id == ap.id)
                             .order_by(TierHistory.created_at.desc()))).scalars().all()
    return [{"id": h.id, "old_tier": h.old_tier, "new_tier": h.new_tier,
             "coach": h.coach_id, "created_at": h.created_at.isoformat()} for h in rows]


# --- Batches ---------------------------------------------------------------
async def _member_count(db, batch_id) -> int:
    return (await db.execute(select(func.count(BatchAthlete.id)).where(BatchAthlete.batch_id == batch_id))).scalar_one()


class BatchIn(BaseModel):
    name: str
    capacity: int = 20
    days: str = ""
    start_time: str | None = None
    end_time: str | None = None


def _parse_time(v):
    if not v:
        return None
    parts = [int(x) for x in str(v).split(":")]
    return time(parts[0], parts[1] if len(parts) > 1 else 0)


@router.get("/batches/")
async def list_batches(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    rows = (await db.execute(select(Batch).where(Batch.coach_id == coach.id).order_by(Batch.name))).scalars().all()
    return [batch_dict(b, await _member_count(db, b.id)) for b in rows]


@router.post("/batches/", status_code=201)
async def create_batch(body: BatchIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    b = Batch(coach_id=coach.id, name=body.name, capacity=body.capacity, days=body.days,
              start_time=_parse_time(body.start_time), end_time=_parse_time(body.end_time))
    db.add(b)
    await db.commit()
    await db.refresh(b)
    return batch_dict(b, 0)


@router.delete("/batches/{pk}/", status_code=204)
async def delete_batch(pk: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    b = (await db.execute(select(Batch).where(Batch.id == pk, Batch.coach_id == coach.id))).scalar_one_or_none()
    if b:
        await db.delete(b)
        await db.commit()


async def _get_batch(db, coach_id, batch_id):
    return (await db.execute(select(Batch).where(Batch.id == batch_id, Batch.coach_id == coach_id))).scalar_one_or_none()


@router.get("/batches/{batch_id}/members/")
async def batch_members(batch_id: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    if not await _get_batch(db, coach.id, batch_id):
        raise HTTPException(404, "Batch not found.")
    rows = (await db.execute(
        select(AthleteProfile, User.first_name, User.last_name)
        .join(BatchAthlete, BatchAthlete.athleteprofile_id == AthleteProfile.id)
        .join(User, User.id == AthleteProfile.user_id)
        .where(BatchAthlete.batch_id == batch_id)
    )).all()
    return [{"id": ap.id, "full_name": f"{fn} {ln}".strip(), "discipline": ap.discipline,
             "current_tier": ap.current_tier} for ap, fn, ln in rows]


class MemberIn(BaseModel):
    athlete_id: int


@router.post("/batches/{batch_id}/members/", status_code=201)
async def add_member(batch_id: int, body: MemberIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    batch = await _get_batch(db, coach.id, batch_id)
    if not batch:
        raise HTTPException(404, "Batch not found.")
    if await _member_count(db, batch_id) >= batch.capacity:
        raise HTTPException(400, "Batch is at full capacity.")
    ap = (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == body.athlete_id, AthleteProfile.coach_id == coach.id))).scalar_one_or_none()
    if not ap:
        raise HTTPException(404, "Athlete not linked to you.")
    exists = (await db.execute(select(BatchAthlete).where(
        BatchAthlete.batch_id == batch_id, BatchAthlete.athleteprofile_id == ap.id))).scalar_one_or_none()
    if not exists:
        db.add(BatchAthlete(batch_id=batch_id, athleteprofile_id=ap.id))
        await db.commit()
    return {"message": "Athlete added to batch.", "member_count": await _member_count(db, batch_id)}


@router.delete("/batches/{batch_id}/members/{athlete_id}/", status_code=204)
async def remove_member(batch_id: int, athlete_id: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    if not await _get_batch(db, coach.id, batch_id):
        raise HTTPException(404, "Batch not found.")
    row = (await db.execute(select(BatchAthlete).where(
        BatchAthlete.batch_id == batch_id, BatchAthlete.athleteprofile_id == athlete_id))).scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()


# --- Attendance ------------------------------------------------------------
@router.get("/batches/{batch_id}/attendance/")
async def get_batch_attendance(batch_id: int, date_q: str | None = Query(None, alias="date"),
                               user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    if not await _get_batch(db, coach.id, batch_id):
        raise HTTPException(404, "Batch not found.")
    d = date.fromisoformat(date_q) if date_q else date.today()
    rows = (await db.execute(select(AttendanceRecord).where(
        AttendanceRecord.batch_id == batch_id, AttendanceRecord.date == d))).scalars().all()
    records = [attendance_dict(r, await athlete_display(db, r.athlete_id)) for r in rows]
    return {"date": d.isoformat(), "records": records}


class MarkIn(BaseModel):
    date: str | None = None
    entries: list[dict]


@router.post("/batches/{batch_id}/attendance/")
async def mark_batch_attendance(batch_id: int, body: MarkIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    if not await _get_batch(db, coach.id, batch_id):
        raise HTTPException(404, "Batch not found.")
    d = date.fromisoformat(body.date) if body.date else date.today()
    member_ids = set((await db.execute(select(BatchAthlete.athleteprofile_id).where(
        BatchAthlete.batch_id == batch_id))).scalars().all())
    saved = 0
    for e in body.entries:
        aid = e.get("athlete_id")
        if aid not in member_ids:
            continue
        st = e.get("status", "present")
        if st not in ("present", "absent", "late", "excused"):
            continue
        rec = (await db.execute(select(AttendanceRecord).where(
            AttendanceRecord.athlete_id == aid, AttendanceRecord.batch_id == batch_id,
            AttendanceRecord.date == d))).scalar_one_or_none()
        if rec:
            rec.status = st
            rec.source = "coach"
        else:
            db.add(AttendanceRecord(athlete_id=aid, batch_id=batch_id, date=d, status=st, source="coach"))
        saved += 1
    await db.commit()
    await cache_invalidate(f"attsum:{coach.id}:today")
    return {"message": f"Attendance saved for {saved} athletes.", "date": d.isoformat()}


@router.get("/attendance/summary/")
async def attendance_summary(period: str = "week", user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    if period == "today":
        cached = await cache_get(f"attsum:{coach.id}:today")
        if cached is not None:
            return cached
    today = date.today()
    start = {"today": today, "week": today - timedelta(days=6), "month": today - timedelta(days=29)}.get(period, today - timedelta(days=6))
    batch_ids = select(Batch.id).where(Batch.coach_id == coach.id).scalar_subquery()
    base = and_(AttendanceRecord.batch_id.in_(batch_ids), AttendanceRecord.date >= start, AttendanceRecord.date <= today)
    async def cnt(cond=None):
        stmt = select(func.count(AttendanceRecord.id)).where(base)
        if cond is not None:
            stmt = stmt.where(cond)
        return (await db.execute(stmt)).scalar_one()
    present = await cnt(AttendanceRecord.status == "present")
    late = await cnt(AttendanceRecord.status == "late")
    absent = await cnt(AttendanceRecord.status == "absent")
    excused = await cnt(AttendanceRecord.status == "excused")
    total = await cnt()
    out = {
        "present": present, "late": late, "absent": absent, "excused": excused, "total": total,
        "attendance_pct": round(100 * (present + late) / total) if total else 0,
        "period": period, "from": start.isoformat(), "to": today.isoformat(),
    }
    if period == "today":
        await cache_set(f"attsum:{coach.id}:today", out, ttl=60)
    return out


@router.get("/attendance/records/")
async def attendance_records(from_q: str | None = Query(None, alias="from"), to_q: str | None = Query(None, alias="to"),
                             user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    stmt = (select(AttendanceRecord, User.first_name, User.last_name, Batch.name)
            .join(AthleteProfile, AthleteProfile.id == AttendanceRecord.athlete_id)
            .join(User, User.id == AthleteProfile.user_id)
            .join(Batch, Batch.id == AttendanceRecord.batch_id)
            .where(Batch.coach_id == coach.id))
    if from_q:
        stmt = stmt.where(AttendanceRecord.date >= date.fromisoformat(from_q))
    if to_q:
        stmt = stmt.where(AttendanceRecord.date <= date.fromisoformat(to_q))
    rows = (await db.execute(stmt.order_by(AttendanceRecord.date))).all()
    return [{
        "id": r.id, "athlete": r.athlete_id, "athlete_name": f"{fn} {ln}".strip(),
        "batch": r.batch_id, "batch_name": bn, "date": r.date.isoformat(), "status": r.status,
    } for r, fn, ln, bn in rows]


# --- Expert ----------------------------------------------------------------
@router.get("/experts/")
async def expert_directory(db: AsyncSession = Depends(get_db), user: User = Depends(require_coach)):
    rows = (await db.execute(
        select(ExpertProfile, User.first_name, User.last_name, User.expert_type)
        .join(User, User.id == ExpertProfile.user_id))).all()
    return [{
        "id": ep.id, "full_name": f"{fn} {ln}".strip(), "expert_type": et, "degree": ep.degree,
        "experience_years": ep.experience_years, "service_history": ep.service_history, "bio": ep.bio,
    } for ep, fn, ln, et in rows]
