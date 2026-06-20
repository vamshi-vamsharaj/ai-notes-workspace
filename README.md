<div align="center">

# AI Notes Workspace

**A collaborative, AI-powered notes workspace with real-time insights and analytics.**

Built with React, TypeScript, FastAPI, PostgreSQL, and the Gemini API.

[**Live Demo →**](https://ai-notes-workspace-pi.vercel.app/)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API](#-api-overview)

</div>

---

## Overview

AI Notes Workspace is a full-stack notes application that pairs a fast, distraction-free writing experience with on-demand AI assistance. Every note can be summarized, restructured into study material, turned into flashcards or a quiz, or analyzed for action items — all powered by Google's Gemini API and backed by a persistent PostgreSQL database via Supabase.

The backend follows a clean repository-based architecture (FastAPI + SQLAlchemy), and the frontend is a responsive, SaaS-style single-page app (React + Zustand + Tailwind) with a fixed sidebar, AI side panel, and a live analytics dashboard.

---

## Features

### 📝 Notes
- Create, edit, archive, and delete notes
- Debounced **autosave** — no manual save button needed
- Full markdown support with a live preview mode
- Tagging system with custom colors and filtering
- Public note sharing via a unique, revocable link — no login required to view

### 🤖 AI Assistant
Powered by **Gemini**, accessible from a resizable side panel (`⌘J`) on every note:

| Action | What it does |
|---|---|
| Summarize | Condenses the note into a short paragraph |
| Extract Action Items | Pulls out tasks as a checklist |
| Generate Title | Suggests a concise, descriptive title |
| Suggest Tags | Recommends relevant tags |
| Improve Writing | Fixes grammar and tightens clarity |
| Simplify | Rewrites in plain language |
| Convert to Study Notes | Restructures into headings + bullet points |
| Generate Flashcards | Produces flip-to-reveal Q&A cards |
| Generate Quiz | Builds multiple-choice questions |
| Explain | Breaks down complex content in plain terms |

Every generation is persisted, rate-limited (20 requests/min per user), and viewable in a per-note history tab.

### 📊 Analytics Dashboard
- Weekly activity chart (notes created / edited / AI generations)
- 30-day cumulative note growth
- AI usage trends by action type (14-day window)
- Top tags, writing streaks, and word-count insights
- All computed via SQL aggregates — no client-side iteration over full datasets

### 🔐 Auth & Security
- Supabase-backed authentication with JWT verification
- Protected routes on the frontend, dependency-injected auth checks on the backend
- Row-level security policies on AI generation and usage tables

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Zustand for state management
- Tailwind CSS for styling
- Recharts for data visualization
- React Markdown + remark-gfm for note previews
- Framer Motion for UI animation

**Backend**
- FastAPI (fully async)
- SQLAlchemy (async ORM) + asyncpg
- PostgreSQL via Supabase
- Pydantic v2 for request/response validation
- Google Generative AI SDK (Gemini)

**Infrastructure**
- Supabase (managed Postgres + Auth)
- Vercel (frontend + backend deployment)

---

## Architecture

```
Frontend (React + Zustand)
        ↓
REST API (FastAPI)
        ↓
Repository Layer
        ↓
SQLAlchemy ORM (async)
        ↓
PostgreSQL (Supabase)
```

The backend uses a **repository pattern**: routers never touch the database directly — all queries live in `repositories/`, keeping route handlers thin and the persistence layer swappable. AI generations, analytics, notes, tags, and shared-note state are all fully persisted (no in-memory stores), so data survives restarts.

```
backend/
 └── app/
      ├── models/        # SQLAlchemy ORM models
      ├── repositories/   # All DB queries live here
      ├── routers/        # Thin FastAPI route handlers
      ├── schemas/        # Pydantic request/response models
      ├── services/       # Gemini integration, prompt templates
      ├── middleware/      # Request logging
      ├── dependencies.py # Auth + DB session injection
      └── main.py

frontend/
 └── src/
      ├── components/     # UI components (notes, AI panel, layout, modals)
      ├── pages/          # Route-level views
      ├── services/       # Axios API clients
      ├── store/          # Zustand stores (notes, AI, auth, analytics, UI)
      ├── hooks/          # useAutosave, useDebounce
      ├── lib/            # Supabase client, utils
      └── types/          # Shared TypeScript types
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://ai.google.dev/)

### 1. Clone the repository

```bash
git clone https://github.com/vamshi-vamsharaj/ai-notes-workspace.git
cd ai-notes-workspace
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=your_postgresql_database_url
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Run the SQL in `backend/app/database/ai_schema.sql` in your Supabase SQL editor to provision the AI tables, then start the server:

```bash
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 4. Verify it's working
- Sign up for an account
- Create a note, write something, and confirm autosave kicks in
- Open the AI panel (`⌘J`) and try **Summarize**
- Check `/analytics` to see the dashboard populate

---

## API Overview

All endpoints (except `/shared/{token}`) require a `Bearer` JWT issued by Supabase.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup`, `/auth/login` | Account creation / login |
| `GET` | `/notes/` | List notes (search, tag filter, sort, pagination) |
| `POST` | `/notes/` | Create a note |
| `PATCH` | `/notes/{id}` | Update title, content, archive state, or tags |
| `POST` / `DELETE` | `/notes/{id}/share` | Enable / disable public sharing |
| `GET` | `/shared/{token}` | Public, unauthenticated note view |
| `POST` | `/ai/generate` | Run an AI action against a note |
| `GET` | `/ai/history/{note_id}` | Past AI generations for a note |
| `GET` | `/analytics/summary` `/weekly` `/growth` `/ai-trends` | Dashboard data |

---


## License

MIT © [Vamshi Vamsharaj](https://github.com/vamshi-vamsharaj)
