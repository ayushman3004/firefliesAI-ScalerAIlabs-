"""
app/routers/meetings.py — CRUD for /meetings
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Meeting, Participant, meeting_participants
from app.schemas import MeetingCreate, MeetingListOut, MeetingOut, MeetingUpdate

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _load_meeting(db: Session, meeting_id: int) -> Meeting:
    stmt = (
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.key_topics),
            selectinload(Meeting.action_items).selectinload(
                Meeting.action_items.property.mapper.class_.assignee  # type: ignore[attr-defined]
            ),
        )
    )
    meeting = db.scalar(stmt)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("", response_model=List[MeetingListOut])
def list_meetings(
    search: Optional[str] = Query(None, description="Filter by title or participant name"),
    participant: Optional[str] = Query(None, description="Filter by participant name"),
    sort: Optional[str] = Query("recent", description="Sort: recent | oldest | title"),
    db: Session = Depends(get_db),
):
    stmt = select(Meeting).options(
        selectinload(Meeting.participants),
        selectinload(Meeting.summary),
        selectinload(Meeting.key_topics),
        selectinload(Meeting.action_items).selectinload(
            Meeting.action_items.property.mapper.class_.assignee  # type: ignore[attr-defined]
        ),
    )

    if search:
        stmt = stmt.where(
            or_(
                Meeting.title.ilike(f"%{search}%"),
                Meeting.participants.any(Participant.name.ilike(f"%{search}%")),
            )
        )
    if participant:
        stmt = stmt.where(
            Meeting.participants.any(Participant.name.ilike(f"%{participant}%"))
        )

    if sort == "oldest":
        stmt = stmt.order_by(Meeting.date.asc())
    elif sort == "title":
        stmt = stmt.order_by(Meeting.title.asc())
    else:  # recent
        stmt = stmt.order_by(Meeting.date.desc())

    return db.scalars(stmt).all()


@router.post("", response_model=MeetingOut, status_code=201)
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    meeting = Meeting(
        title=payload.title,
        date=payload.date,
        duration_seconds=payload.duration_seconds,
        media_url=payload.media_url,
    )
    if payload.participant_ids:
        participants = db.scalars(
            select(Participant).where(Participant.id.in_(payload.participant_ids))
        ).all()
        meeting.participants = list(participants)

    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return _load_meeting(db, meeting.id)


@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    return _load_meeting(db, meeting_id)


@router.patch("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)
):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "participant_ids" in update_data:
        pids = update_data.pop("participant_ids")
        participants = db.scalars(
            select(Participant).where(Participant.id.in_(pids))
        ).all()
        meeting.participants = list(participants)

    for key, value in update_data.items():
        setattr(meeting, key, value)

    db.commit()
    db.refresh(meeting)
    return _load_meeting(db, meeting.id)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
