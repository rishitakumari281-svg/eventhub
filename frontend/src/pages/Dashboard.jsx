import { Link } from 'react-router-dom'
import EventCard from '../components/EventCard'
import EventCover from '../components/EventCover'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import { useAsync } from '../lib/useAsync'
import { Loading, ErrorState } from '../components/AsyncState'
import { isPast } from '../lib/store'
import { formatDate, formatTime, getStatus } from '../data/events'

export default function Dashboard() {
  const { user, tick } = useAuth()
  const { data, loading, error, reload } = useAsync(async () => {
    const evs = await api.events.list()
    const [regs, activity] = await Promise.all([api.registrations.mine(user, evs), api.registrations.activity(user)])
    return { evs, regs, activity }
  }, [user.id], [tick])

  if (loading && !data) return <section className="container section"><Loading label="Loading your dashboard…" /></section>
  if (error && !data) return <section className="container section"><ErrorState error={error} onRetry={reload} /></section>
  return <DashboardView user={user} {...data} />
}

function DashboardView({ user, evs, regs, activity }) {
  const upcoming = regs.filter(r => r.status === 'confirmed' && !isPast(r.event)).sort((a, b) => new Date(a.event.date) - new Date(b.event.date))
  const past = regs.filter(r => r.status === 'confirmed' && isPast(r.event))
  const cancelled = regs.filter(r => r.status === 'cancelled')

  // Recommendations: open upcoming events I'm not registered for, preferring categories I've joined before.
  const joined = new Set(regs.filter(r => r.status === 'confirmed').map(r => r.event.id))
  const likedCats = new Set(regs.map(r => r.event.category))
  const recs = evs
    .filter(e => !isPast(e) && !joined.has(e.id) && ['open', 'filling'].includes(getStatus(e).key))
    .sort((a, b) => (likedCats.has(b.category) - likedCats.has(a.category)) || new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  return (
    <section className="container section">
      <p className="eyebrow">Dashboard</p>
      <h1 className="display">Welcome back, <em>{user.name.split(' ')[0]}</em></h1>

      <div className="stats">
        <div><b>{upcoming.length}</b><span>Upcoming</span></div>
        <div><b>{past.length}</b><span>Past events</span></div>
        <div><b>{cancelled.length}</b><span>Cancelled</span></div>
      </div>

      <div className="dash">
        <div>
          <div className="section__head"><h2 className="h-sm">Your upcoming events</h2><Link to="/registrations" className="link-arrow">All registrations →</Link></div>
          {upcoming.length ? (
            <ul className="mini-list">
              {upcoming.map(r => (
                <li key={r.id}>
                  <div className="mini-list__img"><EventCover event={r.event} /></div>
                  <div><Link to={`/events/${r.event.id}`}><b>{r.event.title}</b></Link>
                    <p className="muted">{formatDate(r.event.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatTime(r.event.time)}</p></div>
                  <Link className="ticket-chip" to="/registrations" title="Open ticket">{r.ticketId}</Link>
                </li>
              ))}
            </ul>
          ) : <div className="empty"><h3>Nothing booked yet</h3><p>Find something worth showing up for.</p><Link className="btn btn--primary" to="/explore">Explore events</Link></div>}
        </div>
        <aside>
          <h2 className="h-sm">Recent activity</h2>
          {activity.length ? <ul className="activity">{activity.map(a => <li key={a.id}>{a.text}<time>{formatDate(a.at)}</time></li>)}</ul> : <p className="muted">No activity yet.</p>}
        </aside>
      </div>

      <h2 className="h-sm" style={{ marginTop: 56 }}>Recommended for you</h2>
      <div className="grid">{recs.map(e => <EventCard key={e.id} event={e} />)}</div>
    </section>
  )
}
