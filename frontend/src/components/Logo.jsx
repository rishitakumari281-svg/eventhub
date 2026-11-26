import { Link } from 'react-router-dom'

// Wordmark: serif "Event" + italic terracotta "Hub" with a ticket-notch mark.
export default function Logo({ light = false }) {
  return (
    <Link to="/" className={'logo' + (light ? ' logo--light' : '')} aria-label="EventHub home">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <path d="M2 5h22v5a3 3 0 0 0 0 6v5H2v-5a3 3 0 0 0 0-6z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="13" cy="13" r="2.4" fill="#C66B4E" />
      </svg>
      <span>Event<em>Hub</em></span>
    </Link>
  )
}
