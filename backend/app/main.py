"""
app/main.py — FastAPI application entry point.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import (
    action_items,
    export,
    meetings,
    participants,
    search,
    summary,
    topics,
    transcript,
)

# Create all tables (idempotent, uses CREATE TABLE IF NOT EXISTS)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Fireflies.ai Clone API",
    description="Meeting notes & transcription platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# NOTE: allow_credentials=True is incompatible with allow_origins=["*"].
# Using explicit origins instead to satisfy browser CORS policy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.182.169.104:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api"

app.include_router(meetings.router, prefix=API_PREFIX)
app.include_router(transcript.router, prefix=API_PREFIX)
app.include_router(summary.router, prefix=API_PREFIX)
app.include_router(topics.router, prefix=API_PREFIX)
app.include_router(action_items.router, prefix=API_PREFIX)
app.include_router(participants.router, prefix=API_PREFIX)
app.include_router(search.router, prefix=API_PREFIX)
app.include_router(export.router, prefix=API_PREFIX)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "message": "Fireflies.ai Clone API is running"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
