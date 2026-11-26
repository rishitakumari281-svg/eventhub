# EventHub frontend

React 18 + Vite. Plain CSS.

## Run

    npm install

| Command | What it does |
|---|---|
| `npm run dev` | **Live mode (default).** Talks to the Spring Boot backend. Start the backend first (see `../backend/README.md`). The Vite dev server proxies `/api` to `http://localhost:8080`. |
| `npm run dev:mock` | **Mock mode.** Everything lives in this browser (localStorage). No backend needed. Demo login: `demo@student.edu` / `Student@123`. |
| `npm run build` / `npm run build:mock` | Production builds for each mode (`dist/`, `dist-mock/`). |

The mode is a build-time switch: `VITE_USE_MOCK=true` (set by `.env.mock`). A slim banner at the top always says which mode is active.
To point at a backend elsewhere, copy `.env.example` to `.env.local` and set `VITE_API_BASE`.

## Integration status (Phase A)

| Area | Live mode source |
|---|---|
| Events (list, details) | Real API |
| Categories | Real API (cached for the session) |
| Signup, login, session restore, logout | Real API |
| **Registrations** (register, cancel, My Registrations, dashboard counts, activity) | **Browser only.** No registration endpoints exist yet (Stage 5). Stored under separate keys (`eh_api_*`) so they never mix with mock data. Seat counts do **not** change when you register in live mode. |

All data access goes through `src/api/index.js`. Pages never talk to `fetch` or the mock store directly.

## Login token storage: localStorage (documented trade-off)

The JWT is kept in `localStorage` (`eh_token`). **Risk:** any script running on the page (an XSS bug, a malicious npm package) can read it. An httpOnly cookie avoids that but requires backend changes and CSRF protection.
**Accepted for the hackathon** because: tokens expire after 2 hours; React escapes all rendered text and the app renders no user-supplied HTML; the server re-checks the token and the user's role on every request.
**Revisit before real deployment.**

Session behaviour: on load the token is validated with `GET /api/users/me`. The app logs out (with a notice on the login page) when the token expires (timer), when the server answers 401, or if the saved token is already expired. If the server is merely unreachable, the saved token is kept.

## Known limitations
- Live mode uses the browser's local date for "past/upcoming"; the server's `status` field is mapped (`serverStatus`) but not yet used. Phase B switches to it once registrations are server-side.
- Dates are formatted in the viewer's timezone from UTC-midnight values; a viewer far west of UTC could see a date shown one day early (pre-existing, not changed in Phase A).
- Registrations whose event no longer exists on the server are hidden in the browser-only lists.
