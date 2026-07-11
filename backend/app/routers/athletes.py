"""Athlete endpoints: own profile, clubs, coach linkage, self-attendance,
plus parent persona (link + read-only child views)."""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.deps import get_current_user, require_athlete, require_parent
from ..helpers import athlete_display, coach_display, get_athlete, get_coach, get_parent
from ..models import (
    AthleteProfile, AttendanceRecord, Batch, BatchAthlete, Club, CoachAthleteLink,
    CoachProfile, DiaryEntry, Evaluation, ParentChildLink, ParentProfile, User,
)
from ..serializers import athlete_profile_dict, attendance_dict, diary_dict, evaluation_dict, link_dict

router = APIRouter(prefix="/athletes", tags=["athletes"])
PRESENT_LIKE = ("present", "late")


async def _profile_response(db, user, ap):
    return athlete_profile_dict(ap, user.full_name, await coach_display(db, ap.coach_id))


@router.get("/profile/")
async def get_profile(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    return await _profile_response(db, user, ap)


class ProfilePatch(BaseModel):
    shooting_assoc_id: str | None = None
    dob: date | None = None
    gender: str | None = None
    state: str | None = None
    club: int | None = None
    dominant_hand: str | None = None
    dominant_eye: str | None = None
    discipline: str | None = None
    diet_type: str | None = None


@router.patch("/profile/")
async def update_profile(body: ProfilePatch, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    data = body.model_dump(exclude_unset=True)
    if "club" in data:
        ap.club_id = data.pop("club")
    for k, v in data.items():
        setattr(ap, k, v if v is not None else ("" if k != "dob" else None))
    await db.commit()
    await db.refresh(ap)
    return await _profile_response(db, user, ap)


@router.get("/clubs/")
async def clubs(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (await db.execute(select(Club).order_by(Club.state, Club.name))).scalars().all()
    return [{"id": c.id, "name": c.name, "state": c.state} for c in rows]


class CoachLinkIn(BaseModel):
    coach_mobile: str


@router.post("/link-request/", status_code=201)
async def request_coach_link(body: CoachLinkIn, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    coach_user = (await db.execute(select(User).where(
        User.mobile == body.coach_mobile.strip(), User.persona == "coach"))).scalar_one_or_none()
    if not coach_user:
        raise HTTPException(404, "Coach not found.")
    coach = await get_coach(db, coach_user.id)
    ap = await get_athlete(db, user.id)
    existing = (await db.execute(select(CoachAthleteLink).where(
        CoachAthleteLink.athlete_id == ap.id, CoachAthleteLink.coach_id == coach.id,
        CoachAthleteLink.status == "pending"))).scalar_one_or_none()
    created = existing is None
    if created:
        existing = CoachAthleteLink(athlete_id=ap.id, coach_id=coach.id, status="pending")
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
    return {
        "message": "Request sent. Awaiting coach approval.",
        "link": link_dict(existing, user.full_name, ap.discipline),
        "already_pending": not created,
    }


@router.get("/link-requests/")
async def my_link_requests(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(CoachAthleteLink).where(
        CoachAthleteLink.athlete_id == ap.id).order_by(CoachAthleteLink.requested_at.desc()))).scalars().all()
    return [link_dict(l, user.full_name, ap.discipline) for l in rows]


@router.get("/attendance/")
async def my_attendance(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(AttendanceRecord).where(
        AttendanceRecord.athlete_id == ap.id).order_by(AttendanceRecord.date.desc()).limit(60))).scalars().all()
    total = (await db.execute(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.athlete_id == ap.id))).scalar_one()
    present = (await db.execute(select(func.count(AttendanceRecord.id)).where(
        AttendanceRecord.athlete_id == ap.id, AttendanceRecord.status.in_(PRESENT_LIKE)))).scalar_one()
    return {
        "attendance_pct": round(100 * present / total) if total else 0,
        "total_sessions": total,
        "records": [attendance_dict(r, user.full_name) for r in rows],
    }


class SelfCheckIn(BaseModel):
    batch_id: int | None = None
    method: str = "self"


@router.post("/attendance/self/", status_code=201)
async def self_checkin(body: SelfCheckIn, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    source = {"qr": "self_qr", "geofence": "self_geo"}.get(body.method, "self")
    batch_id = None
    if body.batch_id:
        member = (await db.execute(select(BatchAthlete).where(
            BatchAthlete.batch_id == body.batch_id, BatchAthlete.athleteprofile_id == ap.id))).scalar_one_or_none()
        if not member:
            raise HTTPException(404, "You are not a member of that batch.")
        batch_id = body.batch_id
    rec = (await db.execute(select(AttendanceRecord).where(
        AttendanceRecord.athlete_id == ap.id, AttendanceRecord.batch_id == batch_id,
        AttendanceRecord.date == date.today()))).scalar_one_or_none()
    created = rec is None
    if created:
        rec = AttendanceRecord(athlete_id=ap.id, batch_id=batch_id, date=date.today(), status="present", source=source)
        db.add(rec)
    else:
        rec.status = "present"
        rec.source = source
    await db.commit()
    await db.refresh(rec)
    return {"message": "Checked in." if created else "Attendance already marked for today.",
            "record": attendance_dict(rec, user.full_name)}


@router.get("/batches/")
async def my_batches(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(Batch).join(BatchAthlete, BatchAthlete.batch_id == Batch.id)
                             .where(BatchAthlete.athleteprofile_id == ap.id))).scalars().all()
    return [{"id": b.id, "name": b.name, "days": b.day_list} for b in rows]


# --- Athlete responds to parent requests ------------------------------------
@router.get("/parent-requests/")
async def parent_requests(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(ParentChildLink).where(
        ParentChildLink.athlete_id == ap.id, ParentChildLink.status == "pending"))).scalars().all()
    out = []
    for l in rows:
        pu = (await db.execute(select(User).join(ParentProfile, User.id == ParentProfile.user_id)
                               .where(ParentProfile.id == l.parent_id))).scalar_one_or_none()
        out.append({"id": l.id, "parent": l.parent_id, "parent_name": (pu.full_name if pu else "") or "Parent"})
    return out


@router.post("/parent-requests/{pk}/{action}/")
async def respond_parent(pk: int, action: str, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    link = (await db.execute(select(ParentChildLink).where(
        ParentChildLink.id == pk, ParentChildLink.athlete_id == ap.id, ParentChildLink.status == "pending"))).scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Request not found.")
    link.responded_at = datetime.now(timezone.utc)
    if action == "approve":
        link.status = "approved"
        ap.parent_id = link.parent_id
        await db.commit()
        return {"message": "Parent access granted."}
    if action == "reject":
        link.status = "rejected"
        await db.commit()
        return {"message": "Request rejected."}
    raise HTTPException(400, "Invalid action.")


# --- Parent persona ---------------------------------------------------------
async def _child_summary(db, ap, user_name, coach_name) -> dict:
    total = (await db.execute(select(func.count(AttendanceRecord.id)).where(AttendanceRecord.athlete_id == ap.id))).scalar_one()
    present = (await db.execute(select(func.count(AttendanceRecord.id)).where(
        AttendanceRecord.athlete_id == ap.id, AttendanceRecord.status.in_(PRESENT_LIKE)))).scalar_one()
    return {"id": ap.id, "full_name": user_name, "discipline": ap.discipline, "current_tier": ap.current_tier,
            "age_category": ap.age_category, "coach_name": coach_name,
            "attendance_pct": round(100 * present / total) if total else 0}


class ParentLinkIn(BaseModel):
    athlete_mobile: str


@router.post("/parent/link-request/", status_code=201)
async def parent_link(body: ParentLinkIn, user: User = Depends(require_parent), db: AsyncSession = Depends(get_db)):
    au = (await db.execute(select(User).where(User.mobile == body.athlete_mobile.strip(), User.persona == "athlete"))).scalar_one_or_none()
    if not au:
        raise HTTPException(404, "Athlete not found.")
    ap = await get_athlete(db, au.id)
    parent = await get_parent(db, user.id)
    existing = (await db.execute(select(ParentChildLink).where(
        ParentChildLink.parent_id == parent.id, ParentChildLink.athlete_id == ap.id,
        ParentChildLink.status == "pending"))).scalar_one_or_none()
    created = existing is None
    if created:
        db.add(ParentChildLink(parent_id=parent.id, athlete_id=ap.id, status="pending"))
        await db.commit()
    return {"message": "Request sent. Awaiting your child's approval.", "already_pending": not created}


@router.get("/parent/children/")
async def my_children(user: User = Depends(require_parent), db: AsyncSession = Depends(get_db)):
    parent = await get_parent(db, user.id)
    rows = (await db.execute(select(AthleteProfile).where(AthleteProfile.parent_id == parent.id))).scalars().all()
    out = []
    for ap in rows:
        out.append(await _child_summary(db, ap, await athlete_display(db, ap.id), await coach_display(db, ap.coach_id)))
    return out


@router.get("/parent/children/{athlete_id}/")
async def child_detail(athlete_id: int, user: User = Depends(require_parent), db: AsyncSession = Depends(get_db)):
    parent = await get_parent(db, user.id)
    ap = (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == athlete_id, AthleteProfile.parent_id == parent.id))).scalar_one_or_none()
    if not ap:
        raise HTTPException(404, "Child not linked to you.")
    name = await athlete_display(db, ap.id)
    att = (await db.execute(select(AttendanceRecord).where(AttendanceRecord.athlete_id == ap.id)
                            .order_by(AttendanceRecord.date.desc()).limit(30))).scalars().all()
    evals = (await db.execute(select(Evaluation).where(Evaluation.athlete_id == ap.id)
                              .order_by(Evaluation.date.desc()))).scalars().all()
    diary = (await db.execute(select(DiaryEntry).where(DiaryEntry.athlete_id == ap.id)
                              .order_by(DiaryEntry.date.desc()).limit(30))).scalars().all()
    # FR-014: parents see sleep/RHR/stress only — training notes are hidden.
    parent_diary = [{**diary_dict(d), "notes": None} for d in diary]
    return {
        "summary": await _child_summary(db, ap, name, await coach_display(db, ap.coach_id)),
        "attendance": [attendance_dict(r, name) for r in att],
        "evaluations": [evaluation_dict(e, name) for e in evals],
        "diary": parent_diary,
    }
