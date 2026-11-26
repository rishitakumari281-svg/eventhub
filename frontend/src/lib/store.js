// MOCK BACKEND (Stage 3). Everything is saved in the browser's localStorage so the
// app feels real during development. In Stage 4 each function here becomes a call to
// the Spring Boot REST API; the rules below are re-enforced there on the server.
// NOTE: passwords are stored in plain text HERE ONLY because this is a throw-away mock.
// The real backend hashes them with BCrypt.
import { events, getEvent, getStatus, TODAY } from '../data/events'
import { USE_MOCK } from '../api/config'

// Separate storage keys per mode, so browser-only registrations made against the real backend
// can never mix with the demo data of mock mode.
const P = USE_MOCK ? 'eh_' : 'eh_api_'
const K = { users: P + 'users', regs: P + 'regs', session: P + 'session', log: P + 'log' }
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => Math.random().toString(36).slice(2, 10)
const ticketId = () => 'EH-' + Math.random().toString(36).slice(2, 8).toUpperCase()
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const norm = (s) => s.trim().toLowerCase()

export const isEmail = (s) => EMAIL.test(s.trim())

function addLog(userId, text) {
  write(K.log, [{ id: uid(), userId, text, at: new Date().toISOString() }, ...read(K.log, [])].slice(0, 50))
}

// Seed one demo student so the app is usable immediately.
function seed() {
  const users = read(K.users, [])
  if (users.some(u => u.email === 'demo@student.edu')) return
  const demo = { id: 'u_demo', name: 'Aarav Sharma', email: 'demo@student.edu', password: 'Student@123', role: 'student' }
  write(K.users, [...users, demo])
  const mk = (eventId, daysAgo) => ({
    id: uid(), ticketId: ticketId(), userId: demo.id, eventId, status: 'confirmed', type: 'individual',
    team: null, createdAt: new Date(TODAY.getTime() - daysAgo * 864e5).toISOString(),
  })
  write(K.regs, [...read(K.regs, []), mk(2, 3), { ...mk(9, 12), type: 'team', team: { name: 'Quiz Wizards', leader: demo.name, members: [{ name: 'Riya Mehta', email: 'riya@student.edu' }, { name: 'Kabir Jain', email: 'kabir@student.edu' }] } }])
  addLog(demo.id, 'Registered for Raag & Rhythm Night')
}
// Demo accounts/registrations exist only in mock mode.
if (USE_MOCK) seed()

/* ---------- auth ---------- */
export function getSession() {
  const id = read(K.session, null)
  const u = read(K.users, []).find(x => x.id === id)
  return u ? publicUser(u) : null
}
const publicUser = ({ password, ...u }) => u

export function signup({ name, email, password }) {
  const users = read(K.users, [])
  if (users.some(u => u.email === norm(email))) throw new Error('An account with this email already exists.')
  const u = { id: 'u_' + uid(), name: name.trim(), email: norm(email), password, role: 'student' }
  write(K.users, [...users, u]); write(K.session, u.id)
  return publicUser(u)
}
export function login(email, password) {
  const u = read(K.users, []).find(x => x.email === norm(email))
  if (!u || u.password !== password) throw new Error('Incorrect email or password.')
  write(K.session, u.id)
  return publicUser(u)
}
export const logout = () => localStorage.removeItem(K.session)

/* ---------- events with live seat counts ---------- */
const seatsUsed = (r) => 1 + (r.team?.members.length || 0)
export function liveEvents() {
  const regs = read(K.regs, []).filter(r => r.status === 'confirmed')
  return events.map(e => ({
    ...e, registered: e.registered + regs.filter(r => r.eventId === e.id).reduce((n, r) => n + seatsUsed(r), 0),
  }))
}
export function liveEvent(id) {
  const base = getEvent(id)
  if (!base) return null
  return { ...base, registered: liveEvents().find(e => e.id === base.id).registered }
}

/* ---------- registrations ---------- */
// Returns the raw records; src/api/index.js attaches each event (from mock OR the real API).
export function myRegistrations(userId) {
  return read(K.regs, []).filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
export const activeRegistration = (userId, eventId) =>
  read(K.regs, []).find(r => r.userId === userId && r.eventId === eventId && r.status === 'confirmed')
export const myActivity = (userId) => read(K.log, []).filter(l => l.userId === userId).slice(0, 5)

// `ev` is the event object the page is showing (mock or API), so the rules below apply to what the user saw.
export function register(user, ev, team = null) {
  if (!ev) throw new Error('Event not found.')
  const status = getStatus(ev).key
  if (status === 'closed') throw new Error('Registration for this event has closed.')
  if (status === 'full') throw new Error('This event is full.')
  if (activeRegistration(user.id, ev.id)) throw new Error('You are already registered for this event.')

  const regs = read(K.regs, []).filter(r => r.eventId === ev.id && r.status === 'confirmed')
  let seats = 1
  if (ev.type === 'Team') {
    if (!team?.name?.trim()) throw new Error('Please enter a team name.')
    const members = (team.members || []).filter(m => m.name.trim() || m.email.trim())
    const size = members.length + 1
    if (size < ev.teamMin || size > ev.teamMax)
      throw new Error(`Team size must be between ${ev.teamMin} and ${ev.teamMax} including you.`)
    for (const m of members) {
      if (!m.name.trim() || !isEmail(m.email)) throw new Error('Every team member needs a name and a valid email.')
    }
    const emails = [user.email, ...members.map(m => norm(m.email))]
    if (new Set(emails).size !== emails.length) throw new Error('Each team member must be a different person.')
    if (regs.some(r => r.team && norm(r.team.name) === norm(team.name))) throw new Error('That team name is already taken for this event.')
    const taken = emails.find(em => regs.some(r => r.team && r.team.members.some(m => norm(m.email) === em)))
    if (taken) throw new Error(`${taken} is already on another team for this event.`)
    seats = size
    team = { name: team.name.trim(), leader: user.name, members: members.map(m => ({ name: m.name.trim(), email: norm(m.email) })) }
  } else team = null
  if (ev.registered + seats > ev.seats) throw new Error('Not enough seats left for a team of this size.')

  const reg = { id: uid(), ticketId: ticketId(), userId: user.id, eventId: ev.id, eventTitle: ev.title, status: 'confirmed',
    type: team ? 'team' : 'individual', team, createdAt: new Date().toISOString() }
  write(K.regs, [...read(K.regs, []), reg])
  addLog(user.id, `Registered for ${ev.title}`)
  return reg
}

export function cancelRegistration(user, regId) {
  const all = read(K.regs, [])
  const r = all.find(x => x.id === regId && x.userId === user.id)
  if (!r || r.status !== 'confirmed') throw new Error('Registration not found.')
  r.status = 'cancelled'; r.cancelledAt = new Date().toISOString()
  write(K.regs, all)
  addLog(user.id, `Cancelled ${r.eventTitle || getEvent(r.eventId)?.title || 'an event'}`)
}

export const isPast = (e) => new Date(e.date) < TODAY
