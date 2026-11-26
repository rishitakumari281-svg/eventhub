import { useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import EventCover from '../components/EventCover'
import StatusBadge from '../components/StatusBadge'
import ComingSoon from './ComingSoon'
import { getStatus, seatsLeft, formatDate, formatTime } from '../data/events'
import * as api from '../api'
import { useAsync } from '../lib/useAsync'
import { Loading, ErrorState } from '../components/AsyncState'
import { useAuth } from '../context/AuthContext'

function RegisterPanel({ event }) {
  const { user, bump, tick } = useAuth()
  const location = useLocation()
  const status = getStatus(event)
  const isTeam = event.type === 'Team'
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState([{ name: '', email: '' }])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // Phase A: registrations are browser-only. This looks up whether this user already has one.
  const reg = useAsync(() => (user ? api.registrations.active(user, event.id) : Promise.resolve(null)), [user?.id, event.id], [tick])
  const existing = reg.data

  const setMember = (i, k, v) => setMembers(ms => ms.map((m, j) => j === i ? { ...m, [k]: v } : m))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await api.registrations.register(user, event, isTeam ? { name: teamName, members } : null); bump() }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  if (user && reg.loading && !reg.data) return <div className="panel"><p>Checking your registration…</p></div>

  if (existing) return (
    <div className="panel panel--ok" role="status">
      <h3>You're registered</h3>
      <p>Your ticket ID is <b>{existing.ticketId}</b>.{existing.team && <> Team: <b>{existing.team.name}</b>.</>}</p>
      <Link className="btn btn--primary" to="/registrations">View my registrations</Link>
    </div>
  )
  if (status.key === 'closed') return <div className="panel"><h3>Registration closed</h3><p>The deadline for this event has passed.</p></div>
  if (status.key === 'full') return <div className="panel"><h3>This event is full</h3><p>Every seat is taken. Waitlists are coming in a later update.</p></div>
  if (!user) return (
    <div className="panel">
      <h3>Register for this event</h3>
      <p>Log in with your student account to register.</p>
      <Link className="btn btn--primary" to="/login" state={{ from: location.pathname }}>Log in to register</Link>
      <p className="panel__alt">New here? <Link to="/signup" state={{ from: location.pathname }}>Create an account</Link></p>
    </div>
  )
  return (
    <form className="panel" onSubmit={submit} noValidate>
      <h3>{isTeam ? 'Register your team' : 'Register as an individual'}</h3>
      <p>{isTeam ? `Teams of ${event.teamMin}–${event.teamMax} including you, the team leader.` : `Registering as ${user.name}.`}</p>
      {isTeam && (
        <>
          <div className="field"><label htmlFor="tn">Team name</label>
            <input id="tn" value={teamName} onChange={e => setTeamName(e.target.value)} maxLength={40} /></div>
          <fieldset className="members">
            <legend>Team members <span className="muted">(you are the leader)</span></legend>
            {members.map((m, i) => (
              <div className="member" key={i}>
                <input aria-label={`Member ${i + 1} name`} placeholder="Name" value={m.name} onChange={e => setMember(i, 'name', e.target.value)} />
                <input aria-label={`Member ${i + 1} email`} placeholder="College email" type="email" value={m.email} onChange={e => setMember(i, 'email', e.target.value)} />
                {members.length > 1 && <button type="button" className="link-btn" onClick={() => setMembers(ms => ms.filter((_, j) => j !== i))} aria-label={`Remove member ${i + 1}`}>Remove</button>}
              </div>
            ))}
            {members.length + 1 < event.teamMax &&
              <button type="button" className="link-btn" onClick={() => setMembers(ms => [...ms, { name: '', email: '' }])}>+ Add member</button>}
          </fieldset>
        </>
      )}
      {error && <p className="alert alert--error" role="alert">{error}</p>}
      <button className="btn btn--primary btn--block" type="submit" disabled={busy}>Confirm registration</button>
    </form>
  )
}

export default function EventDetails() {
  const { id } = useParams()
  const { tick } = useAuth() // changes after registering, so seat counts refresh
  const { data: event, loading, error, reload } = useAsync(() => api.events.get(id), [id], [tick])
  const cats = useAsync(() => api.categories.list(), [])
  if (loading && !event) return <section className="container section"><Loading label="Loading event…" /></section>
  if (!event) {
    return error && error.status !== 404 && error.status !== 400
      ? <section className="container section"><ErrorState error={error} onRetry={reload} /></section>
      : <ComingSoon title="Event not found" />
  }
  const cat = event.categoryName || cats.data?.find(c => c.id === event.category)?.name
  const left = seatsLeft(event)
  const pct = Math.round((event.registered / event.seats) * 100)

  return (
    <article>
      <div className="detail__hero"><EventCover event={event} /></div>
      <div className="container detail">
        <div className="detail__main">
          <Link to="/explore" className="back">← All events</Link>
          <p className="eyebrow">{cat} · {event.type}</p>
          <h1 className="display">{event.title}</h1>
          <p className="lead">{event.description}</p>

          <dl className="facts facts--dark">
            <div><dt>Date</dt><dd>{formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
            <div><dt>Time</dt><dd>{formatTime(event.time)}</dd></div>
            <div><dt>Venue</dt><dd>{event.venue}</dd></div>
            <div><dt>Organizer</dt><dd>{event.organizer}</dd></div>
            <div><dt>Eligibility</dt><dd>{event.eligibility}</dd></div>
            <div><dt>Register by</dt><dd>{formatDate(event.deadline, { day: 'numeric', month: 'long' })}</dd></div>
          </dl>

          <h2 className="h-sm">Schedule</h2>
          <ol className="schedule">
            {event.schedule.map(([t, what]) => <li key={t + what}><time>{t.includes(':') ? t : t}</time><span>{what}</span></li>)}
          </ol>
        </div>

        <aside className="detail__side">
          <div className="seats">
            <div className="seats__top"><StatusBadge event={event} /><b>{left}</b> <span>of {event.seats} seats left</span></div>
            <div className="meter meter--dark" role="img" aria-label={`${pct}% of seats taken`}><span style={{ width: pct + '%' }} /></div>
          </div>
          <RegisterPanel event={event} />
        </aside>
      </div>
    </article>
  )
}
