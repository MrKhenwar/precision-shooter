"""Precision Shooter API — FastAPI + PostgreSQL + Redis.

Serves the same /api/... contract the mobile app expects (migrated from Django).
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.database import Base, engine
from .core.deps import DeviceMismatch
from .routers import academy, athletes, auth, billing, coaching, performance, training


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Precision Shooter API", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


@app.exception_handler(DeviceMismatch)
async def device_mismatch_handler(request: Request, exc: DeviceMismatch):
    return JSONResponse(
        status_code=401,
        content={"detail": "Session ended: your account was signed in on another device.",
                 "code": "device_mismatch"},
    )


@app.get("/")
async def root():
    return {"service": "precision-shooter-api", "docs": "/docs", "health": "/api/health/",
            "note": "This is the API. The mobile/web app runs on the Expo server (port 8081)."}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return JSONResponse(status_code=204, content=None)


@app.get("/api/health/")
async def health():
    return {"status": "ok", "service": "precision-shooter-api", "stack": "fastapi+postgres+redis"}


for r in (auth, athletes, coaching, performance, training, academy, billing):
    app.include_router(r.router, prefix="/api")
