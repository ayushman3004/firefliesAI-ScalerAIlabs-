"""
app/routers/topics.py — GET key topics for a meeting
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import KeyTopic, Meeting
from app.schemas import KeyTopicOut

router = APIRouter(prefix="/meetings", tags=["topics"])


@router.get("/{meeting_id}/topics", response_model=List[KeyTopicOut])
def get_topics(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return db.scalars(
        select(KeyTopic)
        .where(KeyTopic.meeting_id == meeting_id)
        .order_by(KeyTopic.order_index)
    ).all()
