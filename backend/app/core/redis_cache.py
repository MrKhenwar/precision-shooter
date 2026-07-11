"""Redis helpers: JSON cache (KPIs/roster, NFR-002) and OTP resend counting."""
from __future__ import annotations

import json

import redis.asyncio as aioredis

from .config import settings

redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def cache_get(key: str):
    raw = await redis_client.get(key)
    return json.loads(raw) if raw else None


async def cache_set(key: str, value, ttl: int) -> None:
    await redis_client.set(key, json.dumps(value, default=str), ex=ttl)


async def cache_invalidate(*keys: str) -> None:
    if keys:
        await redis_client.delete(*keys)


async def incr_with_expiry(key: str, ttl: int) -> int:
    """Increment a counter, setting the TTL on first use (rate limiting)."""
    n = await redis_client.incr(key)
    if n == 1:
        await redis_client.expire(key, ttl)
    return n
