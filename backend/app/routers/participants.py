"""
app/routers/participants.py — CRUD for participants
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Participant
from app.schemas import ParticipantCreate, ParticipantOut

router = APIRouter(prefix="/participants", tags=["participants"])


@router.get("", response_model=List[ParticipantOut])
def list_participants(db: Session = Depends(get_db)):
    return db.scalars(select(Participant).order_by(Participant.name)).all()


@router.post("", response_model=ParticipantOut, status_code=201)
def create_participant(payload: ParticipantCreate, db: Session = Depends(get_db)):
    # Check for duplicate email
    if payload.email:
        existing = db.scalar(
            select(Participant).where(Participant.email == payload.email)
        )
        if existing:
            raise HTTPException(status_code=409, detail="Participant with this email already exists")

    participant = Participant(name=payload.name, email=payload.email)
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.get("/{participant_id}", response_model=ParticipantOut)
def get_participant(participant_id: int, db: Session = Depends(get_db)):
    p = db.get(Participant, participant_id)
    if not p:
        raise HTTPException(status_code=404, detail="Participant not found")
    return p
