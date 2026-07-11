"""Response dict builders matching the original DRF serializer output shapes."""
from __future__ import annotations


def iso(v):
    return v.isoformat() if v is not None else None


def user_dict(u) -> dict:
    return {
        "id": u.id, "email": u.email, "mobile": u.mobile,
        "first_name": u.first_name, "last_name": u.last_name, "full_name": u.full_name,
        "persona": u.persona, "expert_type": u.expert_type,
        "is_verified": u.is_verified, "date_joined": iso(u.date_joined),
    }


def athlete_profile_dict(p, full_name: str, coach_name: str) -> dict:
    return {
        "id": p.id, "full_name": full_name, "shooting_assoc_id": p.shooting_assoc_id,
        "dob": iso(p.dob), "gender": p.gender, "age_category": p.age_category,
        "state": p.state, "club": p.club_id, "dominant_hand": p.dominant_hand,
        "dominant_eye": p.dominant_eye, "discipline": p.discipline, "diet_type": p.diet_type,
        "current_tier": p.current_tier, "coach": p.coach_id, "coach_name": coach_name,
        "is_coached": p.is_coached, "trial_end_date": iso(p.trial_end_date),
        "registered_on": iso(p.registered_on),
    }


def link_dict(l, athlete_name: str, discipline: str) -> dict:
    return {
        "id": l.id, "athlete": l.athlete_id, "athlete_name": athlete_name,
        "athlete_discipline": discipline, "coach": l.coach_id, "status": l.status,
        "requested_at": iso(l.requested_at), "responded_at": iso(l.responded_at),
    }


def batch_dict(b, member_count: int) -> dict:
    return {
        "id": b.id, "name": b.name, "capacity": b.capacity, "days": b.days,
        "start_time": iso(b.start_time), "end_time": iso(b.end_time),
        "member_count": member_count, "is_full": member_count >= b.capacity,
        "created_at": iso(b.created_at),
    }


def attendance_dict(r, athlete_name: str) -> dict:
    return {
        "id": r.id, "athlete": r.athlete_id, "athlete_name": athlete_name,
        "batch": r.batch_id, "date": iso(r.date), "status": r.status, "source": r.source,
    }


def evaluation_dict(e, athlete_name: str = "") -> dict:
    return {
        "id": e.id, "athlete": e.athlete_id, "athlete_name": athlete_name, "kind": e.kind,
        "date": iso(e.date), "hold_stability": e.hold_stability, "trigger_timing": e.trigger_timing,
        "approach": e.approach, "follow_through": e.follow_through, "core_strength": e.core_strength,
        "cardio_endurance": e.cardio_endurance, "balance_index": e.balance_index,
        # FR-008 subtotals (0-100) + weighted overall + 7-axis radar payload.
        "shooting_subtotal": e.shooting_subtotal, "sc_subtotal": e.sc_subtotal,
        "overall_score": e.overall_score, "radar": e.radar,
        "shooting_score": e.shooting_score, "sc_score": e.sc_score,  # back-compat
        "notes": e.notes, "created_at": iso(e.created_at),
    }


def shooting_dict(r) -> dict:
    return {
        "id": r.id, "date": iso(r.date), "total_shots": r.total_shots, "inner_tens": r.inner_tens,
        "inner_ten_pct": r.inner_ten_pct, "grouping_mm": float(r.grouping_mm) if r.grouping_mm is not None else None,
        "total_score": float(r.total_score) if r.total_score is not None else None,
        "notes": r.notes, "created_at": iso(r.created_at),
    }


def diary_dict(d) -> dict:
    return {
        "id": d.id, "date": iso(d.date), "sleep_quality": d.sleep_quality, "resting_hr": d.resting_hr,
        "stress_level": d.stress_level, "notes": d.notes, "created_at": iso(d.created_at),
    }


def course_plan_dict(p, session_count: int) -> dict:
    return {
        "id": p.id, "title": p.title, "cycle": p.cycle, "start_date": iso(p.start_date),
        "end_date": iso(p.end_date), "themes": p.themes, "session_count": session_count,
        "created_at": iso(p.created_at),
    }


def session_dict(s, athlete_name: str = "") -> dict:
    return {
        "id": s.id, "athlete": s.athlete_id, "athlete_name": athlete_name, "course_plan": s.course_plan_id,
        "date": iso(s.date), "title": s.title, "drills": s.drills, "completed": s.completed,
        "completed_at": iso(s.completed_at), "created_at": iso(s.created_at),
    }


def fee_dict(f, athlete_name: str = "") -> dict:
    return {
        "id": f.id, "athlete": f.athlete_id, "athlete_name": athlete_name, "period": f.period,
        "amount": str(f.amount), "status": f.status, "due_date": iso(f.due_date),
        "paid_on": iso(f.paid_on), "created_at": iso(f.created_at),
    }


def inventory_dict(it, assigned_name: str = "") -> dict:
    return {
        "id": it.id, "category": it.category, "name": it.name, "serial_number": it.serial_number,
        "assigned_to": it.assigned_to_id, "assigned_to_name": assigned_name,
        "cylinder_expiry": iso(it.cylinder_expiry), "days_to_expiry": it.days_to_expiry,
        "expiry_alert": it.expiry_alert, "notes": it.notes, "created_at": iso(it.created_at),
    }
