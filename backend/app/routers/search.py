"""
app/routers/search.py — Global search across meetings and transcript segments
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Meeting, Participant, TranscriptSegment
from app.schemas import MeetingListOut, SearchResult, TranscriptSegmentOut

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResult)
def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    db: Session = Depends(get_db),
):
    # Search meetings by title or participant name
    meeting_stmt = (
        select(Meeting)
        .where(
            or_(
                Meeting.title.ilike(f"%{q}%"),
                Meeting.participants.any(Participant.name.ilike(f"%{q}%")),
            )
        )
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.key_topics),
            selectinload(Meeting.action_items).selectinload(
                Meeting.action_items.property.mapper.class_.assignee  # type: ignore[attr-defined]
            ),
        )
        .order_by(Meeting.date.desc())
        .limit(20)
    )
    meetings = list(db.scalars(meeting_stmt).all())

    # Search transcript segments
    seg_stmt = (
        select(TranscriptSegment)
        .where(TranscriptSegment.text.ilike(f"%{q}%"))
        .options(selectinload(TranscriptSegment.speaker))
        .limit(50)
    )
    segments = list(db.scalars(seg_stmt).all())

    return SearchResult(meetings=meetings, transcript_segments=segments)
