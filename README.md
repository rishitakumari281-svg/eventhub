# EventHub
Campus event management platform.

| Part | Tech | Status |
|---|---|---|
| `frontend/` | React + Vite, custom CSS | Stages 2-3 done. Phase A: events, categories and auth use the **real API**; registrations are still browser-only. See `frontend/README.md`. |
| `backend/`  | Spring Boot 3.3, Spring Security (JWT), JPA, MySQL | Stage 4 written; **verify it on your machine** (see `backend/README.md`). |

## Run the frontend
    cd frontend
    npm install
    npm run dev          # http://localhost:5173 (needs the backend running)
    npm run dev:mock     # no backend needed (in-browser mock)

## Run the backend
See `backend/README.md`.
