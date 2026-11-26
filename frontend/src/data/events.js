import { USE_MOCK } from '../api/config'

// SAMPLE DATA (Stage 2). Replaced by REST API calls to Spring Boot in Stage 4.
// Shape mirrors the future Event entity/DTO so the swap is easy.

export const categories = [
  { id: 'tech', name: 'Technology', blurb: 'Hackathons, workshops, talks' },
  { id: 'cultural', name: 'Cultural', blurb: 'Music, dance, drama, art' },
  { id: 'sports', name: 'Sports', blurb: 'Tournaments and meets' },
  { id: 'academic', name: 'Academic', blurb: 'Seminars and symposiums' },
  { id: 'career', name: 'Career', blurb: 'Placements and networking' },
  { id: 'social', name: 'Community', blurb: 'Clubs, service, social' },
]

export const events = [
  {
    id: 1, title: 'Hack the Quad 2026', category: 'tech', type: 'Team', featured: true,
    date: '2026-12-12', time: '09:00', venue: 'Innovation Centre, Block C',
    organizer: 'Computer Science Society', seats: 120, registered: 104,
    deadline: '2026-12-09', pattern: 'grid', addedOn: '2026-11-02',
    summary: 'A 24-hour build marathon. Form a team of up to four and ship a working prototype.',
  },
  {
    id: 2, title: 'Raag & Rhythm Night', category: 'cultural', type: 'Individual',
    date: '2026-12-05', time: '18:30', venue: 'Open Air Amphitheatre',
    organizer: 'Cultural Committee', seats: 400, registered: 212,
    deadline: '2026-12-04', pattern: 'arcs', addedOn: '2026-11-10',
    summary: 'An evening of classical, fusion and indie performances by students.',
  },
  {
    id: 3, title: 'Inter-Department Cricket Cup', category: 'sports', type: 'Team',
    date: '2026-12-08', time: '08:00', venue: 'Main Sports Ground',
    organizer: 'Sports Council', seats: 160, registered: 160,
    deadline: '2026-12-01', pattern: 'stripes', addedOn: '2026-10-28',
    summary: 'Eight departments, one trophy. Knockout format over three days.',
  },
  {
    id: 4, title: 'Placement Prep Bootcamp', category: 'career', type: 'Individual',
    date: '2026-12-15', time: '10:00', venue: 'Seminar Hall 2',
    organizer: 'Training & Placement Cell', seats: 200, registered: 87,
    deadline: '2026-12-13', pattern: 'dots', addedOn: '2026-11-15',
    summary: 'Resume clinics, mock interviews and aptitude strategy from recruiters.',
  },
  {
    id: 5, title: 'Research Symposium: Climate & Cities', category: 'academic', type: 'Individual',
    date: '2026-12-18', time: '11:00', venue: 'Central Library Auditorium',
    organizer: 'School of Sciences', seats: 150, registered: 64,
    deadline: '2026-12-16', pattern: 'arcs', addedOn: '2026-11-12',
    summary: 'Faculty and student researchers present work on sustainable campuses.',
  },
  {
    id: 6, title: 'Open Mic & Poetry Circle', category: 'cultural', type: 'Individual',
    date: '2026-11-28', time: '17:00', venue: 'Courtyard Café',
    organizer: 'Literary Club', seats: 60, registered: 41,
    deadline: '2026-11-27', pattern: 'dots', addedOn: '2026-11-18',
    summary: 'Sign up to perform or simply listen. Chai included.',
  },
  {
    id: 7, title: 'Campus Clean-Up & Tree Drive', category: 'social', type: 'Individual',
    date: '2026-12-02', time: '07:30', venue: 'North Gate Lawns',
    organizer: 'Green Campus Club', seats: 100, registered: 96,
    deadline: '2026-12-01', pattern: 'stripes', addedOn: '2026-11-05',
    summary: 'Plant saplings and tidy shared spaces. Gloves and breakfast provided.',
  },
  {
    id: 8, title: 'Web Dev Workshop: React in a Day', category: 'tech', type: 'Individual',
    date: '2026-11-25', time: '10:00', venue: 'Computer Lab 4',
    organizer: 'Developer Student Club', seats: 40, registered: 40,
    deadline: '2026-11-22', pattern: 'grid', addedOn: '2026-11-08',
    summary: 'Hands-on session building and deploying a small React app.',
  },
  {
    id: 9, title: "Freshers' Quiz Night", category: 'social', type: 'Team',
    date: '2026-11-10', time: '18:00', venue: 'Student Union Hall',
    organizer: 'Quiz Club', seats: 80, registered: 80,
    deadline: '2026-11-08', pattern: 'dots', addedOn: '2026-10-20',
    summary: 'Teams of three battle through six rounds of trivia.',
  },
]

// Mock mode keeps the fixed demo date so its sample data stays consistent. With the real backend,
// events are dated relative to the real day, so "today" must be real too. Built from the LOCAL
// calendar date but parsed as UTC midnight, the same way event dates ('YYYY-MM-DD') are parsed.
export const TODAY = USE_MOCK
  ? new Date('2026-11-20')
  : new Date(new Date().toLocaleDateString('en-CA'))

export function getStatus(e) {
  const left = e.seats - e.registered
  if (new Date(e.deadline) < TODAY) return { key: 'closed', label: 'Registration Closed' }
  if (left <= 0) return { key: 'full', label: 'Full · Waitlist' }
  if (left / e.seats <= 0.2) return { key: 'filling', label: 'Filling Fast' }
  return { key: 'open', label: 'Open' }
}

export const seatsLeft = (e) => Math.max(e.seats - e.registered, 0)

export function formatDate(iso, opts = { day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString('en-IN', opts)
}

export function formatTime(t) {
  const [h, m] = t.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

// ---- Extra detail fields used only on the event page ----
const extras = {
  1: { teamMin: 2, teamMax: 4, eligibility: 'All undergraduate and postgraduate students',
       description: 'Build something real in 24 hours. Mentors from industry will be on hand, and the top three teams win prizes and internship interviews. Bring a laptop and an idea.',
       schedule: [['09:00', 'Check-in & team formation'], ['10:00', 'Opening keynote'], ['11:00', 'Hacking begins'], ['09:00 +1', 'Submissions close'], ['11:00 +1', 'Demos and judging'], ['14:00 +1', 'Awards']] },
  2: { eligibility: 'Open to all students and staff',
       description: 'Student bands, classical soloists and a closing fusion jam under the open sky. Bring a mat and a friend.',
       schedule: [['18:30', 'Doors open'], ['19:00', 'Classical showcase'], ['20:00', 'Indie & fusion sets'], ['21:15', 'Closing jam']] },
  3: { teamMin: 11, teamMax: 15, eligibility: 'Department teams only' },
  8: { eligibility: 'First- and second-year students' },
  9: { teamMin: 3, teamMax: 3, eligibility: 'Open to all students' },
}
const TEAM_DEFAULT = { teamMin: 2, teamMax: 4 }

export function getEvent(id) {
  const e = events.find(x => x.id === Number(id))
  if (!e) return null
  const x = extras[e.id] || {}
  return {
    ...e,
    teamMin: 1, teamMax: 1,
    ...(e.type === 'Team' ? TEAM_DEFAULT : {}),
    eligibility: 'Open to all enrolled students',
    description: e.summary + ' Check the schedule below and register before the deadline.',
    schedule: [[e.time, 'Doors open & check-in'], ['+30 min', 'Main programme'], ['+2 hrs', 'Wrap-up']],
    ...x,
  }
}
