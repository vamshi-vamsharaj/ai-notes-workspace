# AI Notes Workspace

Collaborative AI-powered notes workspace built with **React, TypeScript, FastAPI, PostgreSQL, Supabase, SQLAlchemy, and Gemini AI APIs**.
The platform provides intelligent note management, AI-assisted writing, analytics dashboards, markdown support, and persistent cloud-based storage.

---

# Features

## Authentication

* Supabase Authentication
* JWT-based protected routes
* Persistent login sessions
* Public and protected route handling

## Notes System

* Create, edit, archive, and delete notes
* Autosave with debounce
* Markdown preview
* Tags and filtering
* Shared public notes

## AI Features

* Gemini AI integration
* AI-generated summaries
* AI insights and writing assistance
* Persistent AI history
* AI analytics tracking

## Analytics Dashboard

* Weekly activity charts
* AI usage trends
* Top tags
* Productivity insights
* Dashboard metrics with Recharts

## UI/UX

* Responsive SaaS-style design
* Fixed sidebar layout
* Scrollable AI side panel
* Loading skeletons
* Empty states
* Modern Tailwind UI

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Zustand
* Tailwind CSS
* Recharts
* React Markdown

## Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* Supabase
* Gemini AI APIs
* Pydantic v2

---

# Project Architecture

```txt id="k8m2vp"
Frontend (React + Zustand)
        ↓
REST API (FastAPI)
        ↓
Repository Layer
        ↓
SQLAlchemy ORM
        ↓
PostgreSQL (Supabase)
```

The backend follows a repository-based architecture with SQLAlchemy persistence for scalable and maintainable data handling. AI generations, analytics, notes, tags, and shared content are persisted in PostgreSQL.

---

# Folder Structure

```txt id="x4m7qc"
backend/
 ├── app/
 │    ├── models/
 │    ├── repositories/
 │    ├── routers/
 │    ├── schemas/
 │    ├── services/
 │    ├── middleware/
 │    ├── dependencies.py
 │    ├── database.py
 │    └── main.py

frontend/
 ├── src/
 │    ├── components/
 │    ├── pages/
 │    ├── services/
 │    ├── store/
 │    ├── hooks/
 │    ├── lib/
 │    └── types/
```

---

# Installation

## 1. Clone Repository

```bash id="u1v9pk"
git clone https://github.com/vamshi-vamsharaj/ai-notes-workspace.git

cd ai-notes-workspace
```

---

# Backend Setup

## 1. Navigate to Backend

```bash id="f6x3tm"
cd backend
```

---

## 2. Create Virtual Environment

### Windows

```bash id="z8m4wr"
python -m venv venv

venv\Scripts\activate
```

### Mac/Linux

```bash id="m2x7qc"
python3 -m venv venv

source venv/bin/activate
```

---

## 3. Install Dependencies

```bash id="r5v1pk"
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create:

```txt id="y9m3tw"
backend/.env
```

Example:

```env id="c4x8vk"
DATABASE_URL=your_postgresql_database_url

SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key
```

---

## 5. Run Backend Server

```bash id="g7m2qc"
uvicorn app.main:app --reload
```

Backend runs at:

```txt id="t1v9wr"
http://localhost:8000
```

---

# Frontend Setup

## 1. Navigate to Frontend

```bash id="p3r7tw"
cd frontend
```

---

## 2. Install Dependencies

```bash id="g5x1qm"
npm install
```

---

## 3. Configure Environment Variables

Create:

```txt id="c9m4vp"
frontend/.env
```

Example:

```env id="w4x9tp"
VITE_API_URL=http://localhost:8000

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 4. Run Frontend

```bash id="y7m1qc"
npm run dev
```

Frontend runs at:

```txt id="z2v8rk"
http://localhost:5173
```

---

# Database Setup

This project uses:

* PostgreSQL
* Supabase
* SQLAlchemy ORM

Ensure your PostgreSQL database is configured in:

```env id="w4x9tp"
DATABASE_URL
```

The backend automatically initializes SQLAlchemy models and relationships.

Persisted entities include:

* Notes
* Tags
* AI generations
* Shared notes
* Analytics data

---

# Testing the Application

## Frontend Build Test

```bash id="q4x8tm"
cd frontend

npm run build
```

---

## Backend Test

```bash id="m1v9qc"
cd backend

uvicorn app.main:app --reload
```

Verify:

* notes CRUD works
* AI generation works
* analytics load correctly
* persistence survives backend restart

---

# Key Features Demonstration

## Notes

* Create and edit notes
* Autosave updates
* Archive functionality
* Tag filtering

## AI

* Generate summaries
* AI insights
* Persistent AI history

## Dashboard

* Analytics charts
* Weekly activity
* AI trends
* Productivity metrics

---

# Production Improvements Implemented

* SQLAlchemy PostgreSQL persistence
* Repository architecture
* Async database flow
* Persistent analytics storage
* Persistent AI history
* Scalable backend structure
* Responsive SaaS UI

---

# Future Improvements

* Real-time collaboration
* WebSocket synchronization
* Alembic migrations
* Redis caching
* Team workspaces
* Role-based permissions

---

# License

This project is licensed under the MIT License.

---

# Author

Vamshi Vamsharaj

GitHub Repository:

[ai-notes-workspace Repository](https://github.com/vamshi-vamsharaj/ai-notes-workspace?utm_source=chatgpt.com)

Project structure referenced from uploaded architecture overview. 
