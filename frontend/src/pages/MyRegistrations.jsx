import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import { useAsync } from '../lib/useAsync'
import { Loading, ErrorState } from '../components/AsyncState'
import { isPast } from '../lib/store'
import { formatDate, formatTime } from '../data/events'

const TABS = [['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled']]

export default function MyRegistrations() {
  const { user, bump, tick } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const [error, setError] = useState('')
  const { data, loading, error: loadError, reload } = useAsync(() => api.registrations.mine(user), [user.id], [tick])
  const regs = data || []
  const groups = {
    upcoming: regs.filter(r => r.status === 'confirmed' && !isPast(r.event)),
    past: regs.filter(r => r.status === 'confirmed' && isPast(r.event)),
    cancelled: regs.filter(r => r.status === 'cancelled'),
  }
  const cancel = async (r) => {
    if (!window.confirm(`Cancel your registration for ${r.event.title}?`)) return
    try { await api.registrations.cancel(user, r.id); bump() } catch (e) { setError(e.message) }
  }

  return (
    <section className="container section">
      <p className="eyebrow">Your account</p>
      <h1 className="display">My registrations</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'is-active' : ''} onClick={() => setTab(k)}>
            {label} <span>{groups[k].length}</span>
          </button>
        ))}
      </div>
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {loading && !data ? <Loading label="Loading your registrations…" />
        : loadError && !data ? <ErrorState error={loadError} onRetry={reload} />
        : groups[tab].length ? (
        <ul className="regs">
          {groups[tab].map(r => (
            <li key={r.id}>
              <div>
                <p className="eyebrow">{r.type === 'team' ? `Team · ${r.team.name}` : 'Individual'}</p>
                <Link to={`/events/${r.event.id}`}><h3>{r.event.title}</h3></Link>
                <p className="muted">{formatDate(r.event.date, { weekday: 'short', day: 'numeric', month: 'long' })} · {formatTime(r.event.time)} · {r.event.venue}</p>
                {r.team && <p className="muted">Members: {[r.team.leader + ' (leader)', ...r.team.members.map(m => m.name)].join(', ')}</p>}
              </div>
              <div className="regs__side">
                <span className={'badge badge--' + (r.status === 'cancelled' ? 'closed' : tab === 'past' ? 'closed' : 'open')}><i />{r.status === 'cancelled' ? 'Cancelled' : tab === 'past' ? 'Completed' : 'Confirmed'}</span>
                <span className="ticket-chip">{r.ticketId}</span>
                {tab === 'upcoming' && <button className="link-btn link-btn--danger" onClick={() => cancel(r)}>Cancel</button>}
              </div>
            </li>
          ))}
        </ul>
      ) : <div className="empty"><h3>Nothing here</h3><p>{tab === 'upcoming' ? 'You have no upcoming registrations.' : tab === 'past' ? 'Past events will appear here.' : 'No cancelled registrations.'}</p>
        {tab === 'upcoming' && <Link className="btn btn--primary" to="/explore">Explore events</Link>}</div>}
      <p className="muted note">QR tickets and check-in arrive in Stage 5. The ticket ID above is what the QR code will carry.</p>
    </section>
  )
}
