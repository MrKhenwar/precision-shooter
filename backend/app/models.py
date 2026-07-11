"""SQLAlchemy models — mirror the original Django schema (same table/column
names) so data migrates 1:1. Business-rule constants live in app/enums.py.
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from .core.database import Base

TRIAL_PERIOD_DAYS = 90
EXPIRY_WARN_DAYS = 90


class User(Base):
    __tablename__ = "accounts_user"
    id: Mapped[int] = mapped_column(primary_key=True)
    password: Mapped[str] = mapped_column(String(128), default="")
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    email: Mapped[str | None] = mapped_column(String(254), unique=True, nullable=True)
    mobile: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    first_name: Mapped[str] = mapped_column(String(50), default="")
    last_name: Mapped[str] = mapped_column(String(50), default="")
    persona: Mapped[str] = mapped_column(String(20))
    expert_type: Mapped[str] = mapped_column(String(20), default="")
    active_device_id: Mapped[str] = mapped_column(String(255), default="")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)
    date_joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    # NFR-004 compliance
    pii_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def identifier(self) -> str:
        return self.email or self.mobile or f"user#{self.id}"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class OTPCode(Base):
    __tablename__ = "accounts_otpcode"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("accounts_user.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(6))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Club(Base):
    __tablename__ = "athletes_club"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(80))


class AthleteProfile(Base):
    __tablename__ = "athletes_athleteprofile"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("accounts_user.id", ondelete="CASCADE"), unique=True)
    shooting_assoc_id: Mapped[str] = mapped_column(String(50), default="")
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(10), default="")
    state: Mapped[str] = mapped_column(String(80), default="")
    club_id: Mapped[int | None] = mapped_column(ForeignKey("athletes_club.id"), nullable=True)
    dominant_hand: Mapped[str] = mapped_column(String(2), default="")
    dominant_eye: Mapped[str] = mapped_column(String(10), default="")
    discipline: Mapped[str] = mapped_column(String(20), default="")
    diet_type: Mapped[str] = mapped_column(String(20), default="")
    current_tier: Mapped[str] = mapped_column(String(20), default="rookie")
    coach_id: Mapped[int | None] = mapped_column(ForeignKey("coaching_coachprofile.id"), nullable=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("coaching_parentprofile.id"), nullable=True)
    registered_on: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    @property
    def age_category(self) -> str:
        if not self.dob:
            return ""
        today = date.today()
        age = today.year - self.dob.year - ((today.month, today.day) < (self.dob.month, self.dob.day))
        if age <= 14:
            return "Sub-Youth"
        if age <= 17:
            return "Youth"
        if age <= 20:
            return "Junior"
        return "Senior"

    @property
    def is_coached(self) -> bool:
        return self.coach_id is not None

    @property
    def is_minor(self) -> bool:
        # NFR-004: flag parent-linkable minors (under 18) for extra protection.
        if not self.dob:
            return False
        today = date.today()
        age = today.year - self.dob.year - ((today.month, today.day) < (self.dob.month, self.dob.day))
        return age < 18

    @property
    def trial_end_date(self) -> datetime:
        return self.registered_on + timedelta(days=TRIAL_PERIOD_DAYS)


class CoachAthleteLink(Base):
    __tablename__ = "athletes_coachathletelink"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaching_coachprofile.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(10), default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ParentChildLink(Base):
    __tablename__ = "athletes_parentchildlink"
    id: Mapped[int] = mapped_column(primary_key=True)
    parent_id: Mapped[int] = mapped_column(ForeignKey("coaching_parentprofile.id", ondelete="CASCADE"))
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(10), default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CoachProfile(Base):
    __tablename__ = "coaching_coachprofile"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("accounts_user.id", ondelete="CASCADE"), unique=True)
    license_type: Mapped[str] = mapped_column(String(50), default="")
    license_number: Mapped[str] = mapped_column(String(100), default="")
    license_document: Mapped[str | None] = mapped_column(String(200), nullable=True)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    bio: Mapped[str] = mapped_column(Text, default="")


class ParentProfile(Base):
    __tablename__ = "coaching_parentprofile"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("accounts_user.id", ondelete="CASCADE"), unique=True)


class ExpertProfile(Base):
    __tablename__ = "coaching_expertprofile"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("accounts_user.id", ondelete="CASCADE"), unique=True)
    degree: Mapped[str] = mapped_column(String(120), default="")
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    service_history: Mapped[str] = mapped_column(Text, default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    credential_document: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Batch(Base):
    __tablename__ = "coaching_batch"
    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaching_coachprofile.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(80))
    capacity: Mapped[int] = mapped_column(Integer, default=20)
    days: Mapped[str] = mapped_column(String(40), default="")
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    @property
    def day_list(self) -> list[str]:
        return [d for d in self.days.split(",") if d]


class BatchAthlete(Base):
    __tablename__ = "coaching_batch_athletes"
    id: Mapped[int] = mapped_column(primary_key=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("coaching_batch.id", ondelete="CASCADE"))
    athleteprofile_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))


class AttendanceRecord(Base):
    __tablename__ = "coaching_attendancerecord"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    batch_id: Mapped[int | None] = mapped_column(ForeignKey("coaching_batch.id", ondelete="CASCADE"), nullable=True)
    date: Mapped[date] = mapped_column(Date, default=date.today)
    status: Mapped[str] = mapped_column(String(10), default="present")
    source: Mapped[str] = mapped_column(String(10), default="coach")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class Evaluation(Base):
    __tablename__ = "performance_evaluation"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    coach_id: Mapped[int | None] = mapped_column(ForeignKey("coaching_coachprofile.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(10))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    hold_stability: Mapped[int] = mapped_column(Integer, default=0)
    trigger_timing: Mapped[int] = mapped_column(Integer, default=0)
    approach: Mapped[int] = mapped_column(Integer, default=0)
    follow_through: Mapped[int] = mapped_column(Integer, default=0)
    core_strength: Mapped[int] = mapped_column(Integer, default=0)
    cardio_endurance: Mapped[int] = mapped_column(Integer, default=0)
    balance_index: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    # FR-008: shooting metrics 0-25 (sum 0-100); S&C 0-33/0-33/0-34 (sum 0-100).
    @property
    def shooting_subtotal(self) -> int:
        return self.hold_stability + self.trigger_timing + self.approach + self.follow_through

    @property
    def sc_subtotal(self) -> int:
        return self.core_strength + self.cardio_endurance + self.balance_index

    @property
    def overall_score(self) -> float:
        # Weighted: shooting 60%, S&C 40% (FR-008).
        return round(self.shooting_subtotal * 0.6 + self.sc_subtotal * 0.4, 1)

    @property
    def radar(self) -> dict:
        """7-axis radar payload for the frontend chart (FR-008)."""
        return {
            "hold_stability": self.hold_stability, "trigger_timing": self.trigger_timing,
            "approach": self.approach, "followthrough": self.follow_through,
            "core_strength": self.core_strength, "cardio_endurance": self.cardio_endurance,
            "balance": self.balance_index,
        }

    # Back-compat aliases (older frontend keys).
    @property
    def shooting_score(self) -> int:
        return self.shooting_subtotal

    @property
    def sc_score(self) -> int:
        return self.sc_subtotal


class ShootingRecord(Base):
    __tablename__ = "performance_shootingrecord"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    total_shots: Mapped[int] = mapped_column(Integer, default=0)
    inner_tens: Mapped[int] = mapped_column(Integer, default=0)
    grouping_mm: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    total_score: Mapped[float | None] = mapped_column(Numeric, nullable=True)
    target_file: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    @property
    def inner_ten_pct(self) -> int:
        return round(100 * self.inner_tens / self.total_shots) if self.total_shots else 0


class DiaryEntry(Base):
    __tablename__ = "performance_diaryentry"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    date: Mapped[date] = mapped_column(Date, default=date.today)
    sleep_quality: Mapped[int] = mapped_column(Integer, default=0)
    resting_hr: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stress_level: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class CoursePlan(Base):
    __tablename__ = "training_courseplan"
    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaching_coachprofile.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(120))
    cycle: Mapped[str] = mapped_column(String(10), default="meso")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    themes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class TrainingSession(Base):
    __tablename__ = "training_trainingsession"
    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaching_coachprofile.id", ondelete="CASCADE"))
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    course_plan_id: Mapped[int | None] = mapped_column(ForeignKey("training_courseplan.id"), nullable=True)
    date: Mapped[date] = mapped_column(Date, default=date.today)
    title: Mapped[str] = mapped_column(String(120))
    drills: Mapped[str] = mapped_column(Text, default="")
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class FeeRecord(Base):
    __tablename__ = "academy_feerecord"
    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaching_coachprofile.id", ondelete="CASCADE"))
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    period: Mapped[str] = mapped_column(String(7))
    amount: Mapped[float] = mapped_column(Numeric(8, 2), default=0)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class InventoryItem(Base):
    __tablename__ = "academy_inventoryitem"
    id: Mapped[int] = mapped_column(primary_key=True)
    coach_id: Mapped[int] = mapped_column(ForeignKey("coaching_coachprofile.id", ondelete="CASCADE"))
    category: Mapped[str] = mapped_column(String(12))
    name: Mapped[str] = mapped_column(String(120))
    serial_number: Mapped[str] = mapped_column(String(120), default="")
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("athletes_athleteprofile.id"), nullable=True)
    cylinder_expiry: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())

    @property
    def days_to_expiry(self):
        if not self.cylinder_expiry:
            return None
        return (self.cylinder_expiry - date.today()).days

    @property
    def expiry_alert(self) -> bool:
        d = self.days_to_expiry
        return d is not None and d <= EXPIRY_WARN_DAYS


class Subscription(Base):
    __tablename__ = "billing_subscription"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"), unique=True)
    ai_opted: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class TierHistory(Base):
    """FR-004: append-only log of tier changes (athlete, coach, timestamp)."""
    __tablename__ = "athletes_tierhistory"
    id: Mapped[int] = mapped_column(primary_key=True)
    athlete_id: Mapped[int] = mapped_column(ForeignKey("athletes_athleteprofile.id", ondelete="CASCADE"))
    coach_id: Mapped[int | None] = mapped_column(ForeignKey("coaching_coachprofile.id"), nullable=True)
    old_tier: Mapped[str] = mapped_column(String(30), default="")
    new_tier: Mapped[str] = mapped_column(String(30), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class InventoryAssignment(Base):
    """FR-013: timestamped assign/unassign audit for inventory items."""
    __tablename__ = "academy_inventoryassignment"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("academy_inventoryitem.id", ondelete="CASCADE"))
    athlete_id: Mapped[int | None] = mapped_column(ForeignKey("athletes_athleteprofile.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(10))  # assign | unassign
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


class AuditLog(Base):
    """NFR-004: write-audit for evaluations, tier changes, and fee records."""
    __tablename__ = "core_auditlog"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("accounts_user.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(40))
    entity: Mapped[str] = mapped_column(String(40))
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
