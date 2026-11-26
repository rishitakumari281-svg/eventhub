import { getStatus } from '../data/events'

export default function StatusBadge({ event }) {
  const s = getStatus(event)
  return <span className={`badge badge--${s.key}`}><i aria-hidden="true" />{s.label}</span>
}
