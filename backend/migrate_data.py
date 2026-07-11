"""One-off data migration: copy all rows from the old Django SQLite DB into
PostgreSQL, preserving primary keys and password hashes (so logins keep working).

Run once after the Postgres DB/role exist:
    python migrate_data.py
"""
from __future__ import annotations

import sqlite3
from datetime import date, datetime, time

from sqlalchemy import Boolean, Date, DateTime, Time, create_engine, insert, text

from app.core.config import settings
from app.core.database import Base
from app.models import (
    AthleteProfile, AttendanceRecord, Batch, BatchAthlete, Club, CoachAthleteLink,
    CoachProfile, CoursePlan, DiaryEntry, Evaluation, ExpertProfile, FeeRecord,
    InventoryItem, OTPCode, ParentChildLink, ParentProfile, ShootingRecord,
    Subscription, TrainingSession, User,
)

# Insert order respects foreign keys.
ORDER = [
    User, Club, CoachProfile, ParentProfile, ExpertProfile, AthleteProfile,
    CoachAthleteLink, ParentChildLink, Batch, BatchAthlete, AttendanceRecord,
    Evaluation, ShootingRecord, DiaryEntry, CoursePlan, TrainingSession,
    FeeRecord, InventoryItem, Subscription, OTPCode,
]


def convert(col_type, val):
    if val is None:
        return None
    if isinstance(col_type, DateTime):
        return datetime.fromisoformat(val.replace("Z", "+00:00")) if isinstance(val, str) else val
    if isinstance(col_type, Date):
        return date.fromisoformat(val[:10]) if isinstance(val, str) else val
    if isinstance(col_type, Time):
        return time.fromisoformat(val) if isinstance(val, str) else val
    if isinstance(col_type, Boolean):
        return bool(val)
    return val


def main():
    src = sqlite3.connect("db.sqlite3")
    src.row_factory = sqlite3.Row
    engine = create_engine(settings.DATABASE_URL)  # sync (psycopg3)

    Base.metadata.create_all(engine)

    with engine.begin() as conn:
        # Clean slate (safe to re-run).
        tables = ", ".join(m.__tablename__ for m in ORDER)
        conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))

        for model in ORDER:
            table = model.__table__
            cols = [c.name for c in table.columns]
            try:
                rows = src.execute(f"SELECT {', '.join(cols)} FROM {table.name}").fetchall()
            except sqlite3.OperationalError:
                print(f"  skip {table.name} (not in source)")
                continue
            data = [{c: convert(table.columns[c].type, r[c]) for c in cols} for r in rows]
            if data:
                conn.execute(insert(table), data)
            # Reset the id sequence to max(id).
            conn.execute(text(
                f"SELECT setval(pg_get_serial_sequence('{table.name}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table.name}), 1), true)"
            ))
            print(f"  {table.name}: {len(data)} rows")

    src.close()
    print("Migration complete.")


if __name__ == "__main__":
    main()
