"""
app/models.py — SQLAlchemy 2.0 ORM models (typed Mapped[] style).

Seven tables:
  participants, meetings, meeting_participants (assoc),
  transcript_segments, summaries, key_topics, action_items
"""
from __future__ import annotations

import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# ── Association table (no extra columns) ─────────────────────────────────────
meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column(
        "meeting_id",
        Integer,
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "participant_id",
        Integer,
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


# ── participants ──────────────────────────────────────────────────────────────
class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, unique=True)

    # Relationships (back-references)
    meetings: Mapped[List[Meeting]] = relationship(
        "Meeting",
        secondary=meeting_participants,
        back_populates="participants",
    )
    transcript_segments: Mapped[List[TranscriptSegment]] = relationship(
        "TranscriptSegment",
        back_populates="speaker",
        foreign_keys="TranscriptSegment.speaker_id",
    )
    action_items: Mapped[List[ActionItem]] = relationship(
        "ActionItem",
        back_populates="assignee",
        foreign_keys="ActionItem.assignee_id",
    )


# ── meetings ──────────────────────────────────────────────────────────────────
class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    date: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, default=func.now()
    )
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    media_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    participants: Mapped[List[Participant]] = relationship(
        "Participant",
        secondary=meeting_participants,
        back_populates="meetings",
    )
    transcript_segments: Mapped[List[TranscriptSegment]] = relationship(
        "TranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.order_index",
    )
    summary: Mapped[Optional[Summary]] = relationship(
        "Summary",
        back_populates="meeting",
        cascade="all, delete-orphan",
        uselist=False,
    )
    key_topics: Mapped[List[KeyTopic]] = relationship(
        "KeyTopic",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="KeyTopic.order_index",
    )
    action_items: Mapped[List[ActionItem]] = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
    )


# ── transcript_segments ───────────────────────────────────────────────────────
class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    speaker_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="SET NULL"), nullable=True
    )
    start_time_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    end_time_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="transcript_segments")
    speaker: Mapped[Optional[Participant]] = relationship(
        "Participant",
        back_populates="transcript_segments",
        foreign_keys=[speaker_id],
    )


# ── summaries (1:1 with meetings) ─────────────────────────────────────────────
class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = (UniqueConstraint("meeting_id", name="uq_summaries_meeting_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    overview_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_by: Mapped[str] = mapped_column(
        String(50), nullable=False, default="seeded"
    )  # "seeded" | "llm"
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Relationship
    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="summary")


# ── key_topics ────────────────────────────────────────────────────────────────
class KeyTopic(Base):
    __tablename__ = "key_topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationship
    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="key_topics")


# ── action_items ──────────────────────────────────────────────────────────────
class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assignee_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="SET NULL"), nullable=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Relationships
    meeting: Mapped[Meeting] = relationship("Meeting", back_populates="action_items")
    assignee: Mapped[Optional[Participant]] = relationship(
        "Participant",
        back_populates="action_items",
        foreign_keys=[assignee_id],
    )
