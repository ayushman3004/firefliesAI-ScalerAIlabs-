"""
app/routers/transcript.py — GET + upload transcript segments
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Meeting, TranscriptSegment
from app.schemas import TranscriptSegmentOut
from app.services.transcript_parser import parse_transcript

router = APIRouter(prefix="/meetings", tags=["transcript"])


@router.get("/{meeting_id}/transcript", response_model=List[TranscriptSegmentOut])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    stmt = (
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id)
        .options(selectinload(TranscriptSegment.speaker))
        .order_by(TranscriptSegment.order_index)
    )
    return db.scalars(stmt).all()


@router.post("/{meeting_id}/transcript/upload", response_model=List[TranscriptSegmentOut], status_code=201)
async def upload_transcript(
    meeting_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    content = await file.read()
    filename = file.filename or ""

    try:
        segments_data = parse_transcript(content.decode("utf-8"), filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse transcript: {e}")

    # Clear existing segments
    existing = db.scalars(
        select(TranscriptSegment).where(TranscriptSegment.meeting_id == meeting_id)
    ).all()
    for seg in existing:
        db.delete(seg)
    db.flush()

    # Insert new segments
    new_segments = []
    for i, seg_data in enumerate(segments_data):
        seg = TranscriptSegment(
            meeting_id=meeting_id,
            text=seg_data["text"],
            start_time_seconds=seg_data.get("start_time_seconds", float(i * 10)),
            end_time_seconds=seg_data.get("end_time_seconds", float(i * 10 + 9)),
            order_index=seg_data.get("order_index", i),
            speaker_id=seg_data.get("speaker_id"),
        )
        db.add(seg)
        new_segments.append(seg)

    db.commit()

    stmt = (
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id)
        .options(selectinload(TranscriptSegment.speaker))
        .order_by(TranscriptSegment.order_index)
    )
    return db.scalars(stmt).all()
