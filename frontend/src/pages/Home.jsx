import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import EventCard from '../components/EventCard'
import EventCover from '../components/EventCover'
import StatusBadge from '../components/StatusBadge'
import { formatDate, formatTime, seatsLeft, TODAY } from '../data/events'
import * as api from '../api'
import { useAsync } from '../lib/useAsync'
import { Loading, ErrorState } from '../components/AsyncState'
import { useAuth } from '../context/AuthContext'

// Placeholder artwork for the hero while events load (or if loading fails).
const FALLBACK_A = { id: 0, title: 'Featured event', category: 'tech', pattern: 'grid' }
const FALLBACK_B = { id: 0, title: 'Campus event', category: 'cultural', pattern: 'arcs' }


const steps = [
  ['01', 'Discover', 'Browse everything happening on campus, filtered by what you care about.'],
  ['02', 'Register', 'Sign up solo or build a team in a minute. Seats update as people join.'],
  ['03', 'Get your ticket', 'Every registration gets a unique QR ticket on your phone.'],
  ['04', 'Check in', 'Organizers scan your code at the door. Attendance is recorded instantly.'],
]

export default function Home() {
  const { tick } = useAuth()
  const ev = useAsync(() => api.events.list(), [], [tick])
  const cat = useAsync(() => api.categories.list(), [])
  const events = ev.data || []
  const categories = cat.data || []
  const live = events.filter(e => new Date(e.date) >= TODAY)
  const featured = events.find(e => e.featured)
  const upcoming = live.filter(e => !e.featured).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 6)
  const fillPct = featured ? Math.round((featured.registered / featured.seats) * 100) : 0
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Campus events · Autumn–Winter 2026</p>
            <h1 className="display display--xl">Find your <em>next</em> great night on campus.</h1>
            <p className="lead">Hackathons, concerts, tournaments and talks, all in one place. Register in seconds and walk in with a QR ticket.</p>
            <SearchBar />
            <p className="hero__hint">Popular: <Link to="/explore?q=hack">Hackathons</Link> · <Link to="/explore?category=cultural">Cultural nights</Link> · <Link to="/explore?category=career">Placements</Link></p>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="hero__img hero__img--a"><EventCover event={featured || FALLBACK_A} /></div>
            <div className="hero__img hero__img--b"><EventCover event={events[1] || FALLBACK_B} /></div>
            <div className="stub-ticket">
              <span className="eyebrow">Admit one</span>
              <strong>Hack the Quad</strong>
              <span>12 Dec · 9:00 AM</span>
              <svg viewBox="0 0 7 7" width="56" height="56" shapeRendering="crispEdges">
                {'1110111100101011010101101110111010011001110010101'.split('').map((b, i) => b === '1' && <rect key={i} x={i % 7} y={Math.floor(i / 7)} width="1" height="1" fill="#183D32" />)}
              </svg>
            </div>
          </div>
        </div>
        <div className="container hero__stats">
          <div><b>{ev.data ? live.length : '–'}</b> events live</div>
          <div><b>{cat.data ? categories.length : '–'}</b> categories</div>
          <div><b>1 tap</b> team sign-up</div>
          <div><b>QR</b> check-in</div>
        </div>
      </section>

      {/* FEATURED (only when the featured event is loaded) */}
      {featured && (
      <section className="spotlight" aria-labelledby="spot-h">
        <div className="container spotlight__grid">
          <div className="spotlight__media"><EventCover event={featured} /></div>
          <div className="spotlight__copy">
            <p className="eyebrow eyebrow--light">Featured event</p>
            <h2 id="spot-h" className="display">{featured.title}</h2>
            <p>{featured.summary}</p>
            <dl className="facts">
              <div><dt>Date</dt><dd>{formatDate(featured.date, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
              <div><dt>Time</dt><dd>{formatTime(featured.time)}</dd></div>
              <div><dt>Venue</dt><dd>{featured.venue}</dd></div>
              <div><dt>Format</dt><dd>{featured.type} · up to 4 members</dd></div>
            </dl>
            <div className="meter" role="img" aria-label={`${fillPct}% of seats taken`}>
              <span style={{ width: fillPct + '%' }} />
            </div>
            <p className="meter__label"><StatusBadge event={featured} /> {seatsLeft(featured)} of {featured.seats} seats left</p>
            <Link to={`/events/${featured.id}`} className="btn btn--primary">View event</Link>
          </div>
        </div>
      </section>
      )}

      {/* UPCOMING */}
      <section className="container section" id="upcoming">
        <div className="section__head">
          <div><p className="eyebrow">Coming up</p><h2 className="display">Upcoming events</h2></div>
          <Link to="/explore" className="link-arrow">See all events →</Link>
        </div>
        {ev.loading && !ev.data ? <Loading label="Loading events…" />
          : ev.error && !ev.data ? <ErrorState error={ev.error} onRetry={() => { ev.reload(); if (cat.error) cat.reload() }} />
          : upcoming.length ? <div className="grid">{upcoming.map(e => <EventCard key={e.id} event={e} />)}</div>
          : <div className="empty"><h3>No upcoming events yet</h3><p>Check back soon.</p></div>}
      </section>

      {/* CATEGORIES */}
      <section className="section section--sand" id="categories">
        <div className="container">
          <p className="eyebrow">Browse by interest</p>
          <h2 className="display">Something for everyone</h2>
          {cat.loading && !cat.data && <Loading label="Loading categories…" />}
          {cat.error && !cat.data && <ErrorState error={cat.error} onRetry={cat.reload} />}
          <ul className="cats">
            {categories.map((c, i) => (
              <li key={c.id}>
                <Link to={`/explore?category=${c.id}`}>
                  <span className="cats__n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="cats__name">{c.name}</span>
                  <span className="cats__blurb">{c.blurb}</span>
                  <span className="cats__go" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container section" id="how">
        <p className="eyebrow">How EventHub works</p>
        <h2 className="display">From curious to checked-in</h2>
        <ol className="steps">
          {steps.map(([n, t, d]) => (
            <li key={n}><span className="steps__n">{n}</span><h3>{t}</h3><p>{d}</p></li>
          ))}
        </ol>
      </section>
    </>
  )
}
