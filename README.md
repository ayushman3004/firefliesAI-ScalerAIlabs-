# Fireflies.ai Clone

A functional clone of the Fireflies.ai meeting-assistant web app. Browse a library of past meetings, view synced transcripts with a media player, read AI-generated summaries and action items, and manage all meeting content via full CRUD.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.12), Uvicorn |
| ORM | SQLAlchemy 2.0 (typed `Mapped[]` style) |
| Migrations | Alembic |
| Database | SQLite (`fireflies.db`) |
| LLM | Google Gemini API via OpenAI SDK (`base_url` override) |

---

## Architecture

```
Next.js frontend (port 3000)
        │  HTTP/JSON
        ▼
FastAPI backend (port 8000)
        │  SQLAlchemy
        ▼
    SQLite (backend/fireflies.db)
```

Two independently-running processes connected only by HTTP. The frontend never touches the database directly.

---

## Setup Instructions

### 1. Backend

```bash
# Requires Python 3.12 (not 3.13+ due to pydantic-core wheels)
cd backend

# Create venv with Python 3.12
python3.12 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Seed the database with demo data
python -m app.seed

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api (already set)

# Start the dev server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Database Schema

7 tables with the following relationships:

```
participants
  id, name, email (unique, nullable)

meetings
  id, title, date, duration_seconds, media_url, created_at, updated_at

meeting_participants  ← many-to-many join table (no extra columns)
  meeting_id (FK→meetings CASCADE)
  participant_id (FK→participants CASCADE)

transcript_segments
  id, meeting_id (CASCADE), speaker_id (SET NULL), 
  start_time_seconds, end_time_seconds, text, order_index

summaries  ← 1:1 with meetings (UNIQUE constraint on meeting_id)
  id, meeting_id (CASCADE), overview_text, generated_by, created_at

key_topics
  id, meeting_id (CASCADE), topic, order_index

action_items
  id, meeting_id (CASCADE), assignee_id (SET NULL),
  text, is_completed, created_at
```

**Key design decisions:**
- `PRAGMA foreign_keys=ON` enforced via SQLAlchemy event listener (SQLite defaults to off)
- `ON DELETE CASCADE` for all meeting-scoped children (data is meaningless without the meeting)
- `ON DELETE SET NULL` for `speaker_id`/`assignee_id` (deleting a person shouldn't destroy history)
- `order_index` is separate from `start_time_seconds` to handle overlapping timestamps (crosstalk)
- `UNIQUE(meeting_id)` on `summaries` enforces 1:1 at the DB level

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meetings` | List meetings (search, sort) |
| POST | `/api/meetings` | Create meeting |
| GET | `/api/meetings/{id}` | Get single meeting |
| PATCH | `/api/meetings/{id}` | Update meeting |
| DELETE | `/api/meetings/{id}` | Delete meeting |
| GET | `/api/meetings/{id}/transcript` | Get transcript segments |
| POST | `/api/meetings/{id}/transcript/upload` | Upload .txt/.vtt/.json transcript |
| GET | `/api/meetings/{id}/summary` | Get summary |
| POST | `/api/meetings/{id}/summary/generate` | Generate AI summary |
| POST | `/api/meetings/{id}/chat` | Ask a question (LLM) |
| GET | `/api/meetings/{id}/topics` | Get key topics |
| GET | `/api/meetings/{id}/action-items` | List action items |
| POST | `/api/meetings/{id}/action-items` | Create action item |
| PATCH | `/api/action-items/{id}` | Update action item |
| DELETE | `/api/action-items/{id}` | Delete action item |
| GET | `/api/participants` | List participants |
| POST | `/api/participants` | Create participant |
| GET | `/api/search?q=` | Global search |
| GET | `/api/meetings/{id}/export?format=pdf\|md\|txt` | Export |

Interactive API docs: http://localhost:8000/docs

---

## Features

### Core
- ✅ Meetings library: list, search (title/participant), sort by recency
- ✅ Meeting detail: transcript with speaker + timestamp
- ✅ Media player with custom controls (play, pause, skip ±10s, volume)
- ✅ Bidirectional player ↔ transcript sync:
  - Click any transcript segment → player seeks to that timestamp
  - Player `timeupdate` → highlights + auto-scrolls active segment
- ✅ In-transcript search with match highlighting
- ✅ AI summary (seeded or Gemini-generated)
- ✅ Key topics (color-coded badges)
- ✅ Action items: add, toggle complete, delete, assign to participant
- ✅ Full CRUD: create (manual/paste/upload), edit metadata, delete
- ✅ Toast notifications on all mutations

### Bonus
- ✅ Global search across meetings and transcript segments
- ✅ Export as Markdown, Plain Text, or PDF
- ✅ Ask-a-question chat about a meeting (full transcript context stuffed into Gemini prompt)
- ✅ "Coming Soon" placeholders: live bot, real STT, integrations, team sharing, auth

---

## Assumptions Made

1. **No real authentication**: A single hardcoded admin user is assumed. Adding real auth (JWT, sessions) would require 1-2 additional tables and middleware.

2. **No RAG**: A single meeting transcript (3,000–8,000 words) fits in one Gemini context window, so summary/chat uses direct context stuffing. RAG would only be needed for cross-meeting queries.

3. **No real STT**: Transcripts are seeded or uploaded. Real transcription would require a Whisper/AssemblyAI integration.

4. **SQLite over PostgreSQL**: Required by the spec. For production, swap `DATABASE_URL` to a Postgres connection string — the SQLAlchemy models are 100% compatible.

5. **Sample audio URLs**: Demo meetings use SoundHelix sample MP3s so the player is functional without real recordings.

---

## Project Structure

```
scalerai/
├── backend/
│   ├── app/
│   │   ├── database.py       # Engine, session, PRAGMA FK fix
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── main.py           # FastAPI app + CORS + routers
│   │   ├── seed.py           # Demo data population
│   │   ├── routers/          # One file per resource
│   │   └── services/
│   │       ├── transcript_parser.py  # .txt/.vtt/.json → segments
│   │       └── llm_client.py         # Gemini API wrapper
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx          # Meetings library
    │   ├── meetings/[id]/page.tsx  # Meeting detail
    │   └── settings/page.tsx       # Coming Soon
    ├── components/
    │   ├── shared/           # Navbar, Toast
    │   ├── library/          # MeetingCard, MeetingList, etc.
    │   └── detail/           # MediaPlayer, TranscriptPanel, etc.
    ├── lib/
    │   ├── api-client.ts     # Typed fetch wrappers
    │   ├── types.ts          # TypeScript interfaces
    │   └── hooks.ts          # useDebounce
    └── .env.local.example
```
