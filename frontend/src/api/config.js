// One switch decides where data comes from:
//   VITE_USE_MOCK=true   -> the in-browser mock (src/lib/store.js + src/data/events.js)
//   anything else        -> the real Spring Boot backend (default)
// Run the mock with `npm run dev:mock` (loads .env.mock).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Empty string = same origin; in dev the Vite proxy forwards /api to http://localhost:8080.
export const API_BASE = import.meta.env.VITE_API_BASE || ''
