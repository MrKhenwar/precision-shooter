# Precision Shooter API — FastAPI + PostgreSQL + Redis
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY migrate_data.py .

# Render injects $PORT; default to 8000 for local docker runs.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
