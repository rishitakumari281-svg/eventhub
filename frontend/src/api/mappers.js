// Translate backend JSON into the shapes the UI components already use.
// Keeping this in ONE place means components never need to know the API's field quirks.

export function mapEvent(d) {
  return {
    id: d.id,
    title: d.title,
    summary: d.summary,
    description: d.description,
    category: d.category,            // slug, same ids as the mock ('tech', 'cultural', ...)
    categoryName: d.categoryName,
    type: d.type,                    // 'Team' | 'Individual' (identical to the mock)
    featured: d.featured,
    date: d.date,                    // 'YYYY-MM-DD'
    time: String(d.time || '').slice(0, 5), // API sends '09:00:00'; UI uses 'HH:mm'
    venue: d.venue,
    organizer: d.organizer,
    seats: d.seats,
    registered: d.registered,
    deadline: d.deadline,
    pattern: d.pattern || 'dots',
    addedOn: d.addedOn,
    eligibility: d.eligibility,
    teamMin: d.teamMin,
    teamMax: d.teamMax,
    schedule: (d.schedule || []).map(s => [s.time, s.title]), // API: {time,title}; UI: [time, title]
    serverStatus: d.status,          // OPEN | FILLING | FULL | CLOSED. Kept for Phase B (see note in README).
  }
}

export const mapCategory = (c) => ({ id: c.id, name: c.name, blurb: c.blurb })

// The API sends 'STUDENT' | 'ORGANIZER' | 'ADMIN'; the UI uses lowercase.
export const mapUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: String(u.role || '').toLowerCase() })
