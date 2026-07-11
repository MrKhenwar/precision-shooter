# Precision Shooter API — FastAPI + PostgreSQL + Redis

## Prerequisites
- PostgreSQL 16 with role `ps_app` / db `precision_shooter`
- Redis running on `127.0.0.1:6379`

Config lives in `.env` (DATABASE_URL, REDIS_URL, SECRET_KEY, DEBUG).

## Install
```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

## One-time data migration (SQLite -> Postgres)
Copies all rows from the old `db.sqlite3`, preserving IDs and Django PBKDF2
password hashes (so existing logins keep working). Safe to re-run (truncates first).
```bash
python migrate_data.py
```

## Run
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Tables are auto-created on startup (`Base.metadata.create_all`).
Interactive docs: http://127.0.0.1:8000/docs — health: `/api/health/`.

## Layout
- `app/main.py` — app + router wiring (`/api/...` contract, CORS, device-mismatch handler)
- `app/models.py` — SQLAlchemy models (mirror the old Django schema/table names)
- `app/serializers.py` — response shapes matching the old DRF serializers
- `app/core/` — config, async engine/session, security (PBKDF2 + JWT), redis cache, deps
- `app/routers/` — auth, athletes, coaching, performance, training, academy, billing
