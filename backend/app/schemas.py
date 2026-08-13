"""
app/schemas.py — Pydantic v2 request/response models.
Kept separate from SQLAlchemy models (no ORM leakage).
"""
from __future__ import annotations

import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ── Participant ───────────────────────────────────────────────────────────────
class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantOut(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ── Meeting ───────────────────────────────────────────────────────────────────
class MeetingBase(BaseModel):
    title: str
    date: datetime.datetime
    duration_seconds: int = 0
    media_url: Optional[str] = None


class MeetingCreate(MeetingBase):
    participant_ids: List[int] = []


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[datetime.datetime] = None
    duration_seconds: Optional[int] = None
    media_url: Optional[str] = None
    participant_ids: Optional[List[int]] = None


class MeetingOut(MeetingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    participants: List[ParticipantOut] = []
    summary: Optional["SummaryOut"] = None
    key_topics: List["KeyTopicOut"] = []
    action_items: List["ActionItemOut"] = []


class MeetingListOut(BaseModel):
    """Lighter shape for list view (no transcript segments)."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    date: datetime.datetime
    duration_seconds: int
    media_url: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    participants: List[ParticipantOut] = []
    summary: Optional["SummaryOut"] = None
    key_topics: List["KeyTopicOut"] = []
    action_items: List["ActionItemOut"] = []


# ── TranscriptSegment ─────────────────────────────────────────────────────────
class TranscriptSegmentBase(BaseModel):
    start_time_seconds: float
    end_time_seconds: float
    text: str
    order_index: int
    speaker_id: Optional[int] = None


class TranscriptSegmentCreate(TranscriptSegmentBase):
    pass


class TranscriptSegmentOut(TranscriptSegmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    speaker: Optional[ParticipantOut] = None


# ── Summary ───────────────────────────────────────────────────────────────────
class SummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    overview_text: str
    generated_by: str
    created_at: datetime.datetime


# ── KeyTopic ──────────────────────────────────────────────────────────────────
class KeyTopicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    topic: str
    order_index: int


# ── ActionItem ────────────────────────────────────────────────────────────────
class ActionItemCreate(BaseModel):
    text: str
    assignee_id: Optional[int] = None
    is_completed: bool = False


class ActionItemUpdate(BaseModel):
    text: Optional[str] = None
    assignee_id: Optional[int] = None
    is_completed: Optional[bool] = None


class ActionItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    meeting_id: int
    text: str
    is_completed: bool
    created_at: datetime.datetime
    assignee: Optional[ParticipantOut] = None


# ── Chat / LLM ────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


# ── Search ────────────────────────────────────────────────────────────────────
class SearchResult(BaseModel):
    meetings: List[MeetingListOut]
    transcript_segments: List[TranscriptSegmentOut]


# ── Export ────────────────────────────────────────────────────────────────────
class ExportFormat(BaseModel):
    format: Literal["pdf", "md", "txt"] = "txt"


# Resolve forward references
MeetingOut.model_rebuild()
MeetingListOut.model_rebuild()
