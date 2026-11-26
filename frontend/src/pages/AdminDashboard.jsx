import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'

const emptyForm = (name = '') => ({
  title: '',
  summary: '',
  description: '',
  category: '',
  type: 'INDIVIDUAL',
  date: '',
  time: '09:00',
  venue: '',
  organizerName: name,
  seats: 100,
  registrationDeadline: '',
  eligibility: '',
  teamMin: 2,
  teamMax: 4,
  featured: false,
  schedule: []
})

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState('')
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(null)

  const [managedEvents, setManagedEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm(user?.name))
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formSaving, setFormSaving] = useState(false)

  async function loadDashboard() {
    setError('')
    try {
      const result = await api.admin.dashboard()
      setData(result)
      setSelected(current => current || String(result.events[0]?.eventId || ''))
    } catch (e) {
      setError(e.message || 'Could not load admin dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function loadManagedEvents() {
    try {
      setManagedEvents(await api.events.manageList())
    } catch (e) {
      setError(e.message || 'Could not load events.')
    }
  }

  async function loadCategories() {
    try {
      setCategories(await api.categories.list())
    } catch (e) {
      setError(e.message || 'Could not load categories.')
    }
  }

  async function loadPeople(eventId) {
    if (!eventId) {
      setPeople([])
      return
    }
    try {
      setPeople(await api.admin.registrations(eventId))
    } catch (e) {
      setError(e.message || 'Could not load registrations.')
    }
  }

  useEffect(() => {
    loadDashboard()
    loadManagedEvents()
    loadCategories()
  }, [])

  useEffect(() => {
    loadPeople(selected)
  }, [selected])

  async function toggleAttendance(person) {
    setSaving(person.id)
    setError('')
    try {
      await api.admin.attendance(person.id, !person.present)
      await Promise.all([loadPeople(selected), loadDashboard()])
    } catch (e) {
      setError(e.message || 'Could not update attendance.')
    } finally {
      setSaving(null)
    }
  }

  function openCreateForm() {
    setEditingId(null)
    setForm(emptyForm(user?.name))
    setFormOpen(true)
  }

  function openEditForm(event) {
    setEditingId(event.id)
    setForm({
      title: event.title || '',
      summary: event.summary || '',
      description: event.description || '',
      category: event.category || '',
      type: event.type === 'Team' ? 'TEAM' : 'INDIVIDUAL',
      date: event.date || '',
      time: event.time || '09:00',
      venue: event.venue || '',
      organizerName: event.organizer || user?.name || '',
      seats: event.seats || 100,
      registrationDeadline: event.deadline || '',
      eligibility: event.eligibility || '',
      teamMin: event.teamMin || 2,
      teamMax: event.teamMax || 4,
      featured: Boolean(event.featured),
      schedule: (event.schedule || []).map(([time, title]) => ({ time, title }))
    })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm(user?.name))
  }

  function updateField(e) {
    const { name, value, type, checked } = e.target
    setForm(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  async function submitEvent(e) {
    e.preventDefault()
    setFormSaving(true)
    setError('')

    const payload = {
      ...form,
      seats: Number(form.seats),
      teamMin: Number(form.teamMin),
      teamMax: Number(form.teamMax),
      type: form.type,
      schedule: form.schedule || []
    }

    try {
      if (editingId) {
        await api.events.update(editingId, payload)
      } else {
        await api.events.create(payload)
      }

      closeForm()
      await Promise.all([loadManagedEvents(), loadDashboard()])
    } catch (e) {
      setError(e.message || 'Could not save event.')
    } finally {
      setFormSaving(false)
    }
  }

  async function archiveEvent(event) {
    if (!window.confirm(`Archive "${event.title}"? It will disappear from public listings, but registration history will be preserved.`)) return

    setError('')
    try {
      await api.events.archive(event.id)
      await Promise.all([loadManagedEvents(), loadDashboard()])
    } catch (e) {
      setError(e.message || 'Could not archive event.')
    }
  }

  async function deleteEvent(event) {
    if (!window.confirm(`Permanently delete "${event.title}"? This cannot be undone. Events with registration history cannot be deleted.`)) return

    setError('')
    try {
      await api.events.permanentlyDelete(event.id)
      await Promise.all([loadManagedEvents(), loadDashboard()])
    } catch (e) {
      setError(e.message || 'Could not permanently delete event.')
    }
  }

  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  if (loading) return <section className="container section"><p>Loading admin dashboard...</p></section>

  return (
    <section className="container section admin">
      <p className="eyebrow">EVENTHUB MANAGEMENT</p>
      <h1 className="display">Admin <em>Dashboard</em></h1>
      <p className="muted">Manage events, registrations and attendance.</p>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="admin-section">
        <div className="admin-heading-row">
          <div>
            <h2 className="h-sm">Manage events</h2>
            <p className="muted">Create, edit and archive campus events.</p>
          </div>
          <button className="btn btn--primary" onClick={openCreateForm}>
            + Add event
          </button>
        </div>

        {formOpen && (
          <form className="admin-event-form" onSubmit={submitEvent}>
            <h3 className="h-sm">{editingId ? 'Edit event' : 'Create new event'}</h3>

            <div className="admin-form-grid">
              <div className="field">
                <label>Event title *</label>
                <input name="title" value={form.title} onChange={updateField} required maxLength="150" />
              </div>

              <div className="field">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={updateField} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Short summary *</label>
                <input name="summary" value={form.summary} onChange={updateField} required maxLength="300" />
              </div>

              <div className="field">
                <label>Event type *</label>
                <select name="type" value={form.type} onChange={updateField}>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="TEAM">Team</option>
                </select>
              </div>

              <div className="field">
                <label>Date *</label>
                <input type="date" name="date" value={form.date} onChange={updateField} required />
              </div>

              <div className="field">
                <label>Time *</label>
                <input type="time" name="time" value={form.time} onChange={updateField} required />
              </div>

              <div className="field">
                <label>Venue *</label>
                <input name="venue" value={form.venue} onChange={updateField} required maxLength="150" />
              </div>

              <div className="field">
                <label>Organizer name *</label>
                <input name="organizerName" value={form.organizerName} onChange={updateField} required maxLength="120" />
              </div>

              <div className="field">
                <label>Total seats *</label>
                <input type="number" name="seats" min="1" max="100000" value={form.seats} onChange={updateField} required />
              </div>

              <div className="field">
                <label>Registration deadline *</label>
                <input type="date" name="registrationDeadline" value={form.registrationDeadline} onChange={updateField} required />
              </div>

              <div className="field">
                <label>Eligibility</label>
                <input name="eligibility" value={form.eligibility} onChange={updateField} maxLength="300" />
              </div>

              {form.type === 'TEAM' && <>
                <div className="field">
                  <label>Minimum team size</label>
                  <input type="number" name="teamMin" min="2" value={form.teamMin} onChange={updateField} />
                </div>
                <div className="field">
                  <label>Maximum team size</label>
                  <input type="number" name="teamMax" min={form.teamMin} value={form.teamMax} onChange={updateField} />
                </div>
              </>}
            </div>

            <div className="field">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={updateField} rows="4" maxLength="4000" />
            </div>

            <label className="admin-checkbox">
              <input type="checkbox" name="featured" checked={form.featured} onChange={updateField} />
              Feature this event
            </label>

            <div className="admin-form-actions">
              <button className="btn btn--primary" type="submit" disabled={formSaving}>
                {formSaving ? 'Saving...' : editingId ? 'Save changes' : 'Create event'}
              </button>
              <button className="btn btn--ghost" type="button" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {managedEvents.map(event => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>
                    <span className={event.visibility === 'ARCHIVED' ? 'attendance-absent' : 'attendance-present'}>
                      {event.visibility || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    {event.visibility !== 'ARCHIVED' ? (
                      <>
                        <button className="btn btn--ghost admin-action" onClick={() => openEditForm(event)}>Edit</button>
                        <button className="btn btn--ghost admin-action" onClick={() => archiveEvent(event)}>Archive</button>
                      </>
                    ) : <span className="muted">Archived</span>}
                    <button className="btn btn--danger admin-action" onClick={() => deleteEvent(event)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!managedEvents.length && (
                <tr><td colSpan="4">No events created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && <>
        <div className="admin-stats">
          {[
            ['Total users', data.totalUsers],
            ['Total events', data.totalEvents],
            ['Registrations', data.totalRegistrations],
            ['Attendance', data.totalAttendance],
            ['Attendance rate', `${data.attendancePercentage}%`]
          ].map(([label, value]) => (
            <article className="admin-stat" key={label}>
              <span>{label}</span>
              <strong>{value ?? 0}</strong>
            </article>
          ))}
        </div>

        <div className="admin-section">
          <h2 className="h-sm">Event reports</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Registrations</th>
                  <th>Present</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {data.events.map(event => (
                  <tr key={event.eventId}>
                    <td>{event.eventTitle}</td>
                    <td>{event.registrations}</td>
                    <td>{event.attended}</td>
                    <td>{event.attendancePercentage}%</td>
                  </tr>
                ))}
                {!data.events.length && <tr><td colSpan="4">No events available.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h2 className="h-sm">Attendance management</h2>

          <div className="field admin-select">
            <label htmlFor="admin-event">Select event</label>
            <select id="admin-event" value={selected}
              onChange={e => setSelected(e.target.value)}>
              <option value="">Choose an event</option>
              {data.events.map(event => (
                <option key={event.eventId} value={event.eventId}>
                  {event.eventTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Ticket ID</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {people.map(person => (
                  <tr key={person.id}>
                    <td>{person.name}</td>
                    <td>{person.email}</td>
                    <td>{person.ticketId}</td>
                    <td>
                      <span className={person.present ? 'attendance-present' : 'attendance-absent'}>
                        {person.present ? 'Present' : 'Absent'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn--ghost admin-action"
                        disabled={saving === person.id}
                        onClick={() => toggleAttendance(person)}>
                        {saving === person.id ? 'Saving...' : person.present ? 'Mark absent' : 'Mark present'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!people.length && (
                  <tr><td colSpan="5">No registrations for this event.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>}
    </section>
  )
}


