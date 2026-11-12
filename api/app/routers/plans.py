from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo import ASCENDING, DESCENDING, ReturnDocument
from pymongo.asynchronous.database import AsyncDatabase

from ..auth import CurrentUser, get_current_user
from ..db import get_db
from ..geo import route_distance_km
from ..models import (
    PlanCreate,
    PlanDetailOut,
    PlanItemCreate,
    PlanItemOut,
    PlanItemUpdate,
    PlanOut,
    PlanUpdate,
    ReorderRequest,
    item_out,
    plan_out,
)

router = APIRouter(prefix="/api", tags=["plans"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=404, detail="Not found")


async def _get_owned_plan(db: AsyncDatabase, plan_id: str, user: CurrentUser) -> dict[str, Any]:
    plan = await db.plans.find_one({"_id": _oid(plan_id), "owner_uid": user.uid})
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


async def _recompute_totals(db: AsyncDatabase, plan_id: ObjectId) -> None:
    """Keep the denormalised totals on the plan in sync with its items."""
    items = await db.plan_items.find({"plan_id": plan_id}).sort("order", ASCENDING).to_list()
    distance = route_distance_km((i["location"]["lat"], i["location"]["lng"]) for i in items)
    spent = round(sum(float(i.get("spent_money", 0)) for i in items), 2)
    await db.plans.update_one(
        {"_id": plan_id},
        {
            "$set": {
                "total_distance_km": distance,
                "total_spent": spent,
                "item_count": len(items),
                "updated_at": _now(),
            }
        },
    )


async def _normalise_order(db: AsyncDatabase, plan_id: ObjectId) -> None:
    items = await db.plan_items.find({"plan_id": plan_id}, {"_id": 1}).sort("order", ASCENDING).to_list()
    for idx, it in enumerate(items):
        await db.plan_items.update_one({"_id": it["_id"]}, {"$set": {"order": idx}})


# ---------------- Plans ----------------


@router.get("/plans", response_model=list[PlanOut])
async def list_plans(user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    docs = await db.plans.find({"owner_uid": user.uid}).sort("created_at", DESCENDING).to_list()
    return [plan_out(d) for d in docs]


@router.post("/plans", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
async def create_plan(body: PlanCreate, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    now = _now()
    doc = {
        **body.model_dump(),
        "author": user.name,
        "owner_uid": user.uid,
        "total_distance_km": 0.0,
        "total_spent": 0.0,
        "item_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    res = await db.plans.insert_one(doc)
    doc["_id"] = res.inserted_id
    return plan_out(doc)


@router.get("/plans/{plan_id}", response_model=PlanDetailOut)
async def get_plan(plan_id: str, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    items = await db.plan_items.find({"plan_id": plan["_id"]}).sort("order", ASCENDING).to_list()
    return PlanDetailOut(**plan_out(plan).model_dump(), items=[item_out(i) for i in items])


@router.patch("/plans/{plan_id}", response_model=PlanOut)
async def update_plan(plan_id: str, body: PlanUpdate, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    changes = body.model_dump(exclude_unset=True)
    if not changes:
        return plan_out(plan)
    changes["updated_at"] = _now()
    updated = await db.plans.find_one_and_update(
        {"_id": plan["_id"]}, {"$set": changes}, return_document=ReturnDocument.AFTER
    )
    return plan_out(updated)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(plan_id: str, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    await db.plan_items.delete_many({"plan_id": plan["_id"]})
    await db.plans.delete_one({"_id": plan["_id"]})
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------------- Plan items ----------------


@router.get("/items", response_model=list[PlanItemOut])
async def list_all_items(user: CurrentUser = Depends(get_current_user)):
    """All stops across the user's plans (used by the map page)."""
    db = get_db()
    docs = await db.plan_items.find({"owner_uid": user.uid}).sort(
        [("plan_id", ASCENDING), ("order", ASCENDING)]
    ).to_list()
    return [item_out(d) for d in docs]


@router.get("/plans/{plan_id}/items", response_model=list[PlanItemOut])
async def list_items(plan_id: str, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    docs = await db.plan_items.find({"plan_id": plan["_id"]}).sort("order", ASCENDING).to_list()
    return [item_out(d) for d in docs]


@router.post("/plans/{plan_id}/items", response_model=PlanItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(plan_id: str, body: PlanItemCreate, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    count = await db.plan_items.count_documents({"plan_id": plan["_id"]})
    order = count if body.order is None else min(body.order, count)

    # Make room when inserting in the middle.
    if order < count:
        await db.plan_items.update_many(
            {"plan_id": plan["_id"], "order": {"$gte": order}}, {"$inc": {"order": 1}}
        )

    now = _now()
    data = body.model_dump()
    data["order"] = order
    doc = {
        **data,
        "plan_id": plan["_id"],
        "author": user.name,
        "owner_uid": user.uid,
        "created_at": now,
        "updated_at": now,
    }
    res = await db.plan_items.insert_one(doc)
    doc["_id"] = res.inserted_id
    await _recompute_totals(db, plan["_id"])
    return item_out(doc)


@router.patch("/plans/{plan_id}/items/{item_id}", response_model=PlanItemOut)
async def update_item(
    plan_id: str, item_id: str, body: PlanItemUpdate, user: CurrentUser = Depends(get_current_user)
):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    changes = body.model_dump(exclude_unset=True)
    changes["updated_at"] = _now()
    updated = await db.plan_items.find_one_and_update(
        {"_id": _oid(item_id), "plan_id": plan["_id"]},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Item not found")
    await _recompute_totals(db, plan["_id"])
    return item_out(updated)


@router.delete("/plans/{plan_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(plan_id: str, item_id: str, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    res = await db.plan_items.delete_one({"_id": _oid(item_id), "plan_id": plan["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    await _normalise_order(db, plan["_id"])
    await _recompute_totals(db, plan["_id"])
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/plans/{plan_id}/items/order", response_model=list[PlanItemOut])
async def reorder_items(plan_id: str, body: ReorderRequest, user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    plan = await _get_owned_plan(db, plan_id, user)
    existing = await db.plan_items.find({"plan_id": plan["_id"]}, {"_id": 1}).to_list()
    existing_ids = {str(d["_id"]) for d in existing}
    if set(body.item_ids) != existing_ids or len(body.item_ids) != len(existing_ids):
        raise HTTPException(status_code=400, detail="item_ids must list every item in the plan exactly once")

    for idx, iid in enumerate(body.item_ids):
        await db.plan_items.update_one({"_id": ObjectId(iid)}, {"$set": {"order": idx, "updated_at": _now()}})
    await _recompute_totals(db, plan["_id"])
    docs = await db.plan_items.find({"plan_id": plan["_id"]}).sort("order", ASCENDING).to_list()
    return [item_out(d) for d in docs]
