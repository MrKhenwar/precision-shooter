"""Fees & inventory endpoints (coach manage; athlete view + pay own fees)."""

import io
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.audit import audit
from ..core.database import get_db
from ..core.deps import require_athlete, require_coach
from ..helpers import athlete_display, get_athlete, get_coach
from ..models import AthleteProfile, FeeRecord, InventoryAssignment, InventoryItem, User
from ..serializers import fee_dict, inventory_dict

router = APIRouter(prefix="/academy", tags=["academy"])


def _is_overdue(f) -> bool:
    """FR-012: a pending fee is overdue once past the 5th of its period month."""
    if f.status != "pending":
        return False
    try:
        y, m = (int(x) for x in f.period.split("-")[:2])
    except (ValueError, AttributeError):
        return False
    return date.today() > date(y, m, 5)


async def _apply_overdue(db, fees: list) -> None:
    changed = False
    for f in fees:
        if _is_overdue(f):
            f.status = "overdue"
            changed = True
    if changed:
        await db.commit()


# --- Fees (coach) ----------------------------------------------------------
class FeeIn(BaseModel):
    athlete: int
    period: str
    amount: float
    status: str = "pending"
    due_date: date | None = None


@router.get("/fees/")
async def list_fees(status: str | None = Query(None), user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    all_rows = (await db.execute(select(FeeRecord).where(FeeRecord.coach_id == coach.id))).scalars().all()
    await _apply_overdue(db, all_rows)  # FR-012 auto-transition
    rows = [f for f in all_rows if not status or f.status == status]
    rows.sort(key=lambda f: f.period, reverse=True)
    return [fee_dict(f, await athlete_display(db, f.athlete_id)) for f in rows]


@router.get("/fees/export/")
async def export_fees(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    """FR-012: export the monthly fee ledger as an .xlsx (openpyxl)."""
    from openpyxl import Workbook
    coach = await get_coach(db, user.id)
    rows = (await db.execute(select(FeeRecord).where(FeeRecord.coach_id == coach.id))).scalars().all()
    await _apply_overdue(db, rows)
    wb = Workbook()
    ws = wb.active
    ws.title = "Fees"
    ws.append(["Athlete", "Period", "Amount", "Status", "Due Date", "Paid On"])
    for f in sorted(rows, key=lambda x: x.period, reverse=True):
        name = await athlete_display(db, f.athlete_id)
        ws.append([name, f.period, float(f.amount), f.status,
                   f.due_date.isoformat() if f.due_date else "",
                   f.paid_on.isoformat() if f.paid_on else ""])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=fee_ledger.xlsx"},
    )


@router.post("/fees/", status_code=201)
async def create_fee(body: FeeIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    ap = (await db.execute(select(AthleteProfile).where(
        AthleteProfile.id == body.athlete, AthleteProfile.coach_id == coach.id))).scalar_one_or_none()
    if not ap:
        raise HTTPException(404, "Athlete not linked to you.")
    f = FeeRecord(coach_id=coach.id, athlete_id=ap.id, period=body.period, amount=body.amount,
                  status=body.status, due_date=body.due_date)
    db.add(f)
    await db.flush()
    await audit(db, user.id, "create", "fee", f.id, f"athlete={ap.id} amount={body.amount} period={body.period}")
    await db.commit()
    await db.refresh(f)
    return fee_dict(f, await athlete_display(db, ap.id))


class FeePatch(BaseModel):
    status: str | None = None
    amount: float | None = None
    paid_on: date | None = None


@router.patch("/fees/{pk}/")
async def update_fee(pk: int, body: FeePatch, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    f = (await db.execute(select(FeeRecord).where(FeeRecord.id == pk, FeeRecord.coach_id == coach.id))).scalar_one_or_none()
    if not f:
        raise HTTPException(404, "Fee not found.")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(f, k, v)
    await audit(db, user.id, "update", "fee", f.id, f"status={f.status}")
    await db.commit()
    await db.refresh(f)
    return fee_dict(f, await athlete_display(db, f.athlete_id))


# --- Fees (athlete) --------------------------------------------------------
@router.get("/my-fees/")
async def my_fees(user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    rows = (await db.execute(select(FeeRecord).where(FeeRecord.athlete_id == ap.id)
                             .order_by(FeeRecord.period.desc()))).scalars().all()
    return [fee_dict(f, user.full_name) for f in rows]


@router.post("/my-fees/{pk}/pay/")
async def pay_fee(pk: int, user: User = Depends(require_athlete), db: AsyncSession = Depends(get_db)):
    ap = await get_athlete(db, user.id)
    f = (await db.execute(select(FeeRecord).where(FeeRecord.id == pk, FeeRecord.athlete_id == ap.id))).scalar_one_or_none()
    if not f:
        raise HTTPException(404, "Fee not found.")
    if f.status == "paid":
        raise HTTPException(400, "This fee is already paid.")
    f.status = "paid"
    f.paid_on = date.today()
    await db.commit()
    await db.refresh(f)
    return fee_dict(f, user.full_name)


# --- Inventory (coach) -----------------------------------------------------
class InventoryIn(BaseModel):
    category: str
    name: str
    serial_number: str = ""
    assigned_to: int | None = None
    cylinder_expiry: date | None = None
    notes: str = ""


@router.get("/inventory/")
async def list_inventory(category: str | None = Query(None), user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    stmt = select(InventoryItem).where(InventoryItem.coach_id == coach.id)
    if category:
        stmt = stmt.where(InventoryItem.category == category)
    rows = (await db.execute(stmt.order_by(InventoryItem.category, InventoryItem.name))).scalars().all()
    out = []
    for it in rows:
        name = await athlete_display(db, it.assigned_to_id) if it.assigned_to_id else ""
        out.append(inventory_dict(it, name))
    return out


@router.post("/inventory/", status_code=201)
async def create_inventory(body: InventoryIn, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    it = InventoryItem(coach_id=coach.id, category=body.category, name=body.name, serial_number=body.serial_number,
                       assigned_to_id=body.assigned_to, cylinder_expiry=body.cylinder_expiry, notes=body.notes)
    db.add(it)
    await db.flush()
    if it.assigned_to_id:  # FR-013 assignment log
        db.add(InventoryAssignment(item_id=it.id, athlete_id=it.assigned_to_id, action="assign"))
    await db.commit()
    await db.refresh(it)
    return inventory_dict(it)


@router.patch("/inventory/{pk}/")
async def update_inventory(pk: int, body: dict, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    it = (await db.execute(select(InventoryItem).where(InventoryItem.id == pk, InventoryItem.coach_id == coach.id))).scalar_one_or_none()
    if not it:
        raise HTTPException(404, "Item not found.")
    for k in ("category", "name", "serial_number", "notes"):
        if k in body:
            setattr(it, k, body[k])
    if "assigned_to" in body:
        new_assignee = body["assigned_to"]
        if new_assignee != it.assigned_to_id:  # FR-013 log the change
            if it.assigned_to_id:
                db.add(InventoryAssignment(item_id=it.id, athlete_id=it.assigned_to_id, action="unassign"))
            if new_assignee:
                db.add(InventoryAssignment(item_id=it.id, athlete_id=new_assignee, action="assign"))
            it.assigned_to_id = new_assignee
    if "cylinder_expiry" in body:
        it.cylinder_expiry = date.fromisoformat(body["cylinder_expiry"]) if body["cylinder_expiry"] else None
    await db.commit()
    await db.refresh(it)
    return inventory_dict(it)


@router.delete("/inventory/{pk}/", status_code=204)
async def delete_inventory(pk: int, user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    it = (await db.execute(select(InventoryItem).where(InventoryItem.id == pk, InventoryItem.coach_id == coach.id))).scalar_one_or_none()
    if it:
        await db.delete(it)
        await db.commit()


@router.get("/inventory/expiring/")
async def expiring(user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)):
    coach = await get_coach(db, user.id)
    rows = (await db.execute(select(InventoryItem).where(
        InventoryItem.coach_id == coach.id, InventoryItem.category == "cylinder"))).scalars().all()
    return [inventory_dict(it) for it in rows if it.expiry_alert]
