from pymongo import ASCENDING, AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from .config import get_settings

_client: AsyncMongoClient | None = None


def get_db() -> AsyncDatabase:
    global _client
    settings = get_settings()
    if _client is None:
        _client = AsyncMongoClient(settings.mongo_uri, tz_aware=True)
    return _client[settings.mongo_db]


async def init_indexes() -> None:
    db = get_db()
    await db.plans.create_index([("owner_uid", ASCENDING), ("created_at", ASCENDING)])
    await db.plan_items.create_index([("plan_id", ASCENDING), ("order", ASCENDING)])
    await db.plan_items.create_index([("owner_uid", ASCENDING)])


async def close_db() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None
