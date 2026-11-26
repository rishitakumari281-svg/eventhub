import { Link } from 'react-router-dom'
import EventCover from './EventCover'
import StatusBadge from './StatusBadge'
import { categories, formatDate, formatTime, seatsLeft } from '../data/events'

export default function EventCard({ event }) {
  const cat = event.categoryName || categories.find(c => c.id === event.category)?.name
  const left = seatsLeft(event)
  return (
    <article className="card">
      <Link to={`/events/${event.id}`} className="card__media" tabIndex={-1} aria-hidden="true">
        <EventCover event={event} />
        <span className="card__date"><b>{formatDate(event.date, { day: 'numeric' })}</b>{formatDate(event.date, { month: 'short' })}</span>
      </Link>
      <div className="card__body">
        <p className="eyebrow">{cat} · {event.type}</p>
        <h3><Link to={`/events/${event.id}`}>{event.title}</Link></h3>
        <p className="card__meta">{formatTime(event.time)} · {event.venue}</p>
        <div className="card__foot">
          <StatusBadge event={event} />
          <span className="card__seats">{left > 0 ? `${left} seats left` : 'No seats left'}</span>
        </div>
      </div>
    </article>
  )
}
