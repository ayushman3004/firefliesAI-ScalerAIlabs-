"""
app/routers/summary.py — GET + AI generate summary
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Meeting, Summary, TranscriptSegment
from app.schemas import ChatRequest, ChatResponse, SummaryOut
from app.services.llm_client import generate_summary, answer_question

router = APIRouter(prefix="/meetings", tags=["summary"])


@router.get("/{meeting_id}/summary", response_model=SummaryOut)
def get_summary(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    summary = db.scalar(select(Summary).where(Summary.meeting_id == meeting_id))
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary


@router.post("/{meeting_id}/summary/generate", response_model=SummaryOut)
def generate_meeting_summary(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Build transcript text
    segments = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.order_index)
    ).all()

    if not segments:
        raise HTTPException(status_code=422, detail="No transcript to summarize")

    transcript_text = "\n".join(
        f"[{seg.start_time_seconds:.1f}s] {seg.text}" for seg in segments
    )

    overview = generate_summary(transcript_text, meeting.title)

    # Upsert summary
    existing = db.scalar(select(Summary).where(Summary.meeting_id == meeting_id))
    if existing:
        existing.overview_text = overview
        existing.generated_by = "llm"
        db.commit()
        db.refresh(existing)
        return existing
    else:
        summary = Summary(
            meeting_id=meeting_id,
            overview_text=overview,
            generated_by="llm",
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return summary


@router.post("/{meeting_id}/chat", response_model=ChatResponse)
def chat_about_meeting(
    meeting_id: int, request: ChatRequest, db: Session = Depends(get_db)
):
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.order_index)
    ).all()

    if not segments:
        raise HTTPException(status_code=422, detail="No transcript available")

    transcript_text = "\n".join(
        f"[{seg.start_time_seconds:.1f}s] {seg.text}" for seg in segments
    )

    answer = answer_question(transcript_text, request.question, meeting.title)
    return ChatResponse(answer=answer)
