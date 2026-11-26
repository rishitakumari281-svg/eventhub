import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server on 5173. In Stage 4 we'll proxy /api to Spring Boot (port 8080).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward /api calls to Spring Boot (used from Stage 5 when the frontend switches off the mock store).
    proxy: { '/api': 'http://localhost:8080' },
  },
})
