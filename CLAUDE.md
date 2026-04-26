# ClassScore - 班级积分管理系统

## Project Overview

An offline-first class score management system for teachers. Frontend works standalone with localStorage; optional Go backend enables multi-device sync.

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript, Tailwind CSS 4, Zustand 5 (state), TanStack Query, Chart.js
- **Backend:** Go 1.25, SQLite 3, JWT auth, YAML config
- **Deploy:** Docker + Docker Compose, standalone Next.js output

## Project Structure

```
frontend/src/
  app/          # Next.js pages (dashboard, ranking, groups, rules, shop, analysis, tools, timeline, settings)
  components/
    ui/         # Reusable UI (shadcn-style, Radix UI)
    features/   # Business logic components
    layout/     # Sidebar, Header, AppLayout
  store/        # Zustand stores (useStudentStore, useGroupStore, useRuleStore, etc.)
  types/        # TypeScript interfaces
  lib/          # API client (api.ts), utilities (utils.ts)
  hooks/        # Custom hooks (useBackend.ts)

backend/
  main.go                # Entry point, router, CORS
  internal/
    config/config.go     # YAML config loading
    handler/             # HTTP handlers (auth.go, sync.go)
    store/               # Data layer (sqlite.go, file.go)
    model/user.go        # User model
  config.yaml            # Server config (port 8000)
```

## Development Commands

```bash
# Frontend
cd frontend && npm install && npm run dev    # http://localhost:3000
npm run build
npm run lint

# Backend
cd backend && go mod download && go build -o classScore-backend . && ./classScore-backend  # http://localhost:8000

# Docker
docker network create qvqw
docker compose up -d
```

## Code Conventions

- **Stores:** `use[Feature]Store.ts` with Zustand + localStorage persist, key prefix `classScore_`
- **Components:** PascalCase, organized by ui/features/layout
- **Styling:** Tailwind utilities + `cn()` helper (clsx + tailwind-merge)
- **API:** All backend calls via `src/lib/api.ts`, standardized `APIResponse` format
- **Comments:** Chinese (zh-CN) for comments and user-facing strings
- **Path alias:** `@/*` → `./src/*`

## API Endpoints

- `GET /api/health` — health check
- `POST /api/register` / `POST /api/login` — auth
- `GET /api/sync/meta` / `POST /api/sync/upload` / `GET /api/sync/download` — data sync

## Key Patterns

- Offline-first: all data works in localStorage without backend
- Backend is optional, only for multi-device sync
- Zustand stores use `persist` middleware with localStorage
- Backend responses: `{ success, data?, error?, message? }`
- Frontend uses 3-second timeout for backend API calls
