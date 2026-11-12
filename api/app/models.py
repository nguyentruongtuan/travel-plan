from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    address: str | None = None


# ---------- Plans ----------


class PlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    photo_url: str | None = None


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    photo_url: str | None = None


class PlanOut(BaseModel):
    id: str
    name: str
    description: str
    author: str
    author_uid: str
    total_distance_km: float
    total_spent: float
    photo_url: str | None
    item_count: int
    created_at: datetime
    updated_at: datetime


# ---------- Plan items ----------


class PlanItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    planned_stop_time: datetime | None = None
    stopped_time: datetime | None = None
    order: int | None = Field(default=None, ge=0)
    location: Location
    spent_money: float = Field(default=0, ge=0)
    photo_url: str | None = None


class PlanItemUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    planned_stop_time: datetime | None = None
    stopped_time: datetime | None = None
    location: Location | None = None
    spent_money: float | None = Field(default=None, ge=0)
    photo_url: str | None = None


class PlanItemOut(BaseModel):
    id: str
    plan_id: str
    name: str
    author: str
    author_uid: str
    planned_stop_time: datetime | None
    stopped_time: datetime | None
    order: int
    location: Location
    spent_money: float
    photo_url: str | None
    created_at: datetime
    updated_at: datetime


class ReorderRequest(BaseModel):
    item_ids: list[str] = Field(min_length=1)


class PlanDetailOut(PlanOut):
    items: list[PlanItemOut]


class UploadOut(BaseModel):
    url: str


def plan_out(doc: dict[str, Any]) -> PlanOut:
    return PlanOut(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description", ""),
        author=doc["author"],
        author_uid=doc["owner_uid"],
        total_distance_km=doc.get("total_distance_km", 0.0),
        total_spent=doc.get("total_spent", 0.0),
        photo_url=doc.get("photo_url"),
        item_count=doc.get("item_count", 0),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


def item_out(doc: dict[str, Any]) -> PlanItemOut:
    return PlanItemOut(
        id=str(doc["_id"]),
        plan_id=str(doc["plan_id"]),
        name=doc["name"],
        author=doc["author"],
        author_uid=doc["owner_uid"],
        planned_stop_time=doc.get("planned_stop_time"),
        stopped_time=doc.get("stopped_time"),
        order=doc["order"],
        location=Location(**doc["location"]),
        spent_money=doc.get("spent_money", 0.0),
        photo_url=doc.get("photo_url"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )
