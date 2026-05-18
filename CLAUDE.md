# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DonatKZ** is a real-time donation tracking system for Kaspi (Kazakhstan payment service). It consists of three interconnected applications:

- **Backend** (`donatkz-backend/`) — Spring Boot 3.5.7 / Java 17 REST API + WebSocket server, PostgreSQL
- **Frontend** (`donatkz-frontend/`) — React 19 / TypeScript / Vite web dashboard
- **Desktop** (`donatkz-desktop/`) — Python Tkinter app that captures Windows Phone Link notifications and forwards donations to the backend

## Commands

### Backend (Maven)
```bash
cd donatkz-backend
./mvnw spring-boot:run       # start dev server
./mvnw clean package         # build JAR
./mvnw test                  # run all tests
```

### Frontend (npm)
```bash
cd donatkz-frontend
npm run dev      # Vite dev server
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview prod build
```

### Desktop (Python)
```bash
cd donatkz-desktop
pip install -r requirements.txt
python src/main.py                       # run app
python -m pytest tests/ -v               # all tests
python -m pytest tests/test_parser.py -v # single test file
```

## Architecture

### Data Flow
```
Windows Phone Link notification
  → Desktop app parses & deduplicates donation
  → HTTP POST /api/donations (JWT auth)
  → Backend persists to PostgreSQL
  → Backend broadcasts via WebSocket STOMP to /topic/donations/{userId}
  → Frontend receives update, refreshes charts/stats in real time
```

### Authentication
Two separate auth systems:
- **Frontend users**: email/password → JWT access + refresh tokens (stored in localStorage)
- **Desktop app**: 6-digit device pairing code → JWT tokens stored locally via `keyring`

Both use `JwtAuthenticationFilter` on the backend. Widget endpoints authenticate via API key in the URL path (`/api/goals/widget/{apiKey}`), not JWT.

### Public vs Protected Endpoints (Backend)
- Public: `/api/auth/**`, `/api/news`, `/api/faq`, `/ws/**`
- Protected: everything else (requires `Authorization: Bearer <token>`)

### WebSocket (STOMP)
- Endpoint: `/ws` (with SockJS fallback)
- Subscription topic per user: `/topic/donations/{userId}`
- Frontend connects via `@stomp/stompjs` + `sockjs-client`

### Frontend Structure
- `src/api/` — Axios client modules, one per backend resource
- `src/context/` — `AuthContext` wraps the app; provides user state and token management
- `src/pages/` — Route-level components (Auth, Dashboard, Widgets)
- `src/components/` — Reusable UI pieces
- `src/types/` — Shared TypeScript interfaces

### Desktop App Key Modules
- `notification/` — Windows SDK listener + Kaspi SMS parser
- `utils/` — Deduplication logic (60-second window) and encryption helpers
- `database/` — SQLite for local donation history
- `api/` — `aiohttp`-based async client to backend
- `config.py` — Central config: API URL, mock mode toggle, donation limits (100₸–2,000,000₸)

## Environment Configuration

**Frontend** (`.env` in `donatkz-frontend/`):
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080/ws
VITE_ENV=development
```

**Desktop** (`src/config.py`): API base URL defaults to `http://localhost:8080`; set `MOCK_API=True` to run without a live backend.

**Backend**: Requires a running PostgreSQL instance; connection configured via Spring `application.properties`.
