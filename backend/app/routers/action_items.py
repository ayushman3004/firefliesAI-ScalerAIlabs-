"""
app/routers/action_items.py — CRUD for action items
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import ActionItem, Meeting
from app.schemas import ActionItemCreate, ActionItemOut, ActionItemUpdate

router = APIRouter(tags=["action-items"])


@router.get("/meetings/{meeting_id}/action-items", response_model=List[ActionItemOut])
def list_action_items(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return db.scalars(
        select(ActionItem)
        .where(ActionItem.meeting_id == meeting_id)
        .options(selectinload(ActionItem.assignee))
    ).all()


@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemOut, status_code=201)
def create_action_item(
    meeting_id: int, payload: ActionItemCreate, db: Session = Depends(get_db)
):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    item = ActionItem(
        meeting_id=meeting_id,
        text=payload.text,
        assignee_id=payload.assignee_id,
        is_completed=payload.is_completed,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return db.scalar(
        select(ActionItem)
        .where(ActionItem.id == item.id)
        .options(selectinload(ActionItem.assignee))
    )


@router.patch("/action-items/{item_id}", response_model=ActionItemOut)
def update_action_item(
    item_id: int, payload: ActionItemUpdate, db: Session = Depends(get_db)
):
    item = db.get(ActionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return db.scalar(
        select(ActionItem)
        .where(ActionItem.id == item.id)
        .options(selectinload(ActionItem.assignee))
    )


@router.delete("/action-items/{item_id}", status_code=204)
def delete_action_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(ActionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    db.delete(item)
    db.commit()
