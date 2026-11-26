import { USE_MOCK } from '../api/config'

// Always-visible honesty strip so nobody mistakes browser-only data for server data.
export default function ModeBanner() {
  return (
    <div className="mode-banner" role="note">
      {USE_MOCK
        ? 'Demo mode: all data is stored in this browser only.'
        : 'Live backend: accounts and events are real. Registrations are still saved in this browser only (server registrations arrive in Stage 5).'}
    </div>
  )
}
