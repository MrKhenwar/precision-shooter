# Precision Shooter API — FastAPI + PostgreSQL + Redis
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY migrate_data.py .

# Render injects $PORT; default to 8000 for local docker runs.
# --workers 1: pin a single worker (WEB_CONCURRENCY>1 caused workers with
# unmaterialized lazy route tables to serve plain 404s).
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
