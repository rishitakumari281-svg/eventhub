import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import EventCard from '../components/EventCard'
import { TODAY } from '../data/events'
import * as api from '../api'
import { useAsync } from '../lib/useAsync'
import { Loading, ErrorState } from '../components/AsyncState'
import { useAuth } from '../context/AuthContext'

const DAY = 864e5

export default function Explore() {
  const { tick } = useAuth() // changes after registering/cancelling, so seat counts refresh
  const ev = useAsync(() => api.events.list(), [], [tick])
  const catReq = useAsync(() => api.categories.list(), [])
  const categories = catReq.data || []
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const cat = params.get('category') || ''
  const [type, setType] = useState('')
  const [when, setWhen] = useState('')
  const [day, setDay] = useState('')
  const [sort, setSort] = useState('upcoming')
  const [view, setView] = useState('grid')
  const [showPast, setShowPast] = useState(false)

  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    v ? next.set(k, v) : next.delete(k)
    setParams(next, { replace: true })
  }

  const inWindow = (e) => {
    const d = new Date(e.date)
    if (when === 'week') return d - TODAY <= 7 * DAY
    if (when === 'month') return d - TODAY <= 30 * DAY
    if (when === 'pick') return !day || e.date === day
    return true
  }

  const results = (ev.data || [])
    .filter(e => showPast || new Date(e.date) >= TODAY)
    .filter(e => !cat || e.category === cat)
    .filter(e => !type || e.type === type)
    .filter(inWindow)
    .filter(e => !q || [e.title, e.venue, e.organizer, e.summary].join(' ').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      sort === 'popular' ? b.registered / b.seats - a.registered / a.seats
      : sort === 'recent' ? new Date(b.addedOn) - new Date(a.addedOn)
      : new Date(a.date) - new Date(b.date))

  const dirty = q || cat || type || when || showPast
  const reset = () => { setParams({}, { replace: true }); setType(''); setWhen(''); setDay(''); setShowPast(false) }

  return (
    <section className="container section">
      <p className="eyebrow">Explore</p>
      <h1 className="display">All events</h1>

      <div className="filters">
        <div className="field field--grow">
          <label htmlFor="q">Search</label>
          <input id="q" type="search" value={q} placeholder="Event name, venue or club"
                 onChange={e => setParam('q', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="cat">Category</label>
          <select id="cat" value={cat} onChange={e => setParam('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="type">Event type</label>
          <select id="type" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Any</option><option>Individual</option><option>Team</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="when">Date</label>
          <select id="when" value={when} onChange={e => setWhen(e.target.value)}>
            <option value="">Any time</option><option value="week">Next 7 days</option>
            <option value="month">Next 30 days</option><option value="pick">Pick a day</option>
          </select>
        </div>
        {when === 'pick' && (
          <div className="field"><label htmlFor="day">Day</label>
            <input id="day" type="date" value={day} onChange={e => setDay(e.target.value)} /></div>
        )}
      </div>

      <div className="toolbar">
        <p className="muted" aria-live="polite">{ev.data ? `${results.length} event${results.length !== 1 ? 's' : ''}` : '\u00a0'}</p>
        <label className="check"><input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} /> Show past events</label>
        {dirty && <button className="link-btn" onClick={reset}>Clear filters</button>}
        <div className="toolbar__right">
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="upcoming">Upcoming</option><option value="popular">Most popular</option><option value="recent">Recently added</option>
          </select>
          <div className="seg" role="group" aria-label="Layout">
            <button className={view === 'grid' ? 'is-active' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')}>Grid</button>
            <button className={view === 'list' ? 'is-active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
          </div>
        </div>
      </div>

      {ev.loading && !ev.data ? <Loading label="Loading events…" />
        : ev.error && !ev.data ? <ErrorState error={ev.error} onRetry={() => { ev.reload(); if (catReq.error) catReq.reload() }} />
        : results.length ? (
        <div className={'grid' + (view === 'list' ? ' is-list' : '')}>{results.map(e => <EventCard key={e.id} event={e} />)}</div>
      ) : (
        <div className="empty"><h3>No events match</h3><p>Try a broader search, or clear your filters.</p>
          {dirty && <button className="btn btn--primary" onClick={reset}>Clear filters</button>}</div>
      )}
    </section>
  )
}
