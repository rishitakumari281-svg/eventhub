// The ONLY module pages should import data functions from. Each function has the same async
// shape in mock mode and real mode, so pages don't care which one is active.
//
// PHASE A STATUS: categories, events and auth use the real backend. Registrations still use
// the browser-only store (no registration endpoints exist yet); they work in both modes.
import { USE_MOCK } from './config'
import * as store from '../lib/store'
import { categories as staticCategories } from '../data/events'
import { request, requestBlob, tokenStore, tokenExpiryMs, ApiError } from './client'
import { mapEvent, mapUser, mapCategory } from './mappers'

/* ---------- categories (cached for the session; a failed load is not cached) ---------- */
let categoryCache = null
export const categories = {
  list() {
    if (USE_MOCK) return Promise.resolve(staticCategories)
    if (!categoryCache) {
      categoryCache = request('/api/categories', { auth: false })
        .then(list => list.map(mapCategory))
        .catch(err => { categoryCache = null; throw err })
    }
    return categoryCache
  },
}

/* ---------- events ---------- */
export const events = {
  async list() {
    if (USE_MOCK) return store.liveEvents()
    return (await request('/api/events', { auth: false })).map(mapEvent)
  },
  async get(id) {
    if (USE_MOCK) {
      const e = store.liveEvent(id)
      if (!e) throw new ApiError(404, 'Event not found.')
      return e
    }
    return mapEvent(await request(`/api/events/${encodeURIComponent(id)}`, { auth: false }))
  },
  async manageList() {
    return (await request('/api/events/mine')).map(mapEvent)
  },
  async create(payload) {
    return mapEvent(await request('/api/events', { method: 'POST', body: payload }))
  },
  async update(id, payload) {
    return mapEvent(await request(`/api/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: payload
    }))
  },
  async archive(id) {
    return request(`/api/events/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  async permanentlyDelete(id) {
    return request(`/api/events/${encodeURIComponent(id)}/permanent`, { method: 'DELETE' })
  },
}

/* ---------- auth ---------- */
const finish = ({ token, user }) => { tokenStore.set(token); return mapUser(user) }

export const auth = {
  /** Called once on page load. Returns the user, or null if not logged in. */
  async restore() {
    if (USE_MOCK) return store.getSession()
    const token = tokenStore.get()
    if (!token) return null
    const exp = tokenExpiryMs(token)
    if (exp && exp <= Date.now()) { tokenStore.clear(); return null } // already expired: skip the network call
    try {
      return mapUser(await request('/api/users/me')) // the server is the judge of whether the token is still valid
    } catch (err) {
      if (err.status === 401) tokenStore.clear()
      throw err
    }
  },
  async login(email, password) {
    if (USE_MOCK) return store.login(email, password)
    return finish(await request('/api/auth/login', { method: 'POST', auth: false, body: { email, password } }))
  },
  async signup({ name, email, password }) {
    if (USE_MOCK) return store.signup({ name, email, password })
    return finish(await request('/api/auth/signup', { method: 'POST', auth: false, body: { name, email, password } }))
  },
  logout() { USE_MOCK ? store.logout() : tokenStore.clear() },
  /** Milliseconds-since-epoch when the current token expires, or null. */
  tokenExpiry() { return USE_MOCK ? null : tokenExpiryMs(tokenStore.get() || '') },
}

/* ---------- registrations ---------- */
export const registrations = {
  async mine(user, eventsList) {
    if (USE_MOCK) {
      const evs = eventsList || await events.list()
      const byId = new Map(evs.map(e => [e.id, e]))
      return store.myRegistrations(user.id)
        .map(r => ({ ...r, event: byId.get(r.eventId) }))
        .filter(r => r.event)
    }
    return request('/api/registrations/mine')
  },

  async active(user, eventId) {
    if (USE_MOCK) return store.activeRegistration(user.id, eventId)
    return request(`/api/registrations/active/${encodeURIComponent(eventId)}`)
  },

  async register(user, event, team) {
    if (USE_MOCK) return store.register(user, event, team)
    return request('/api/registrations', {
      method: 'POST',
      body: {
        eventId: event.id,
        teamName: team?.name || null,
        members: team?.members || []
      }
    })
  },

  async cancel(user, regId) {
    if (USE_MOCK) return store.cancelRegistration(user, regId)
    return request(`/api/registrations/${encodeURIComponent(regId)}`, {
      method: 'DELETE'
    })
  },

  async scan(eventId, ticketId) {
    return request(`/api/registrations/scan/${encodeURIComponent(eventId)}`, {
      method: 'POST',
      body: { ticketId }
    })
  },

  async activity(user) {
    if (USE_MOCK) return store.myActivity(user.id)
    return []
  },
}

// ADMIN DASHBOARD
export const admin = {
  dashboard() {
    return request('/api/admin/dashboard')
  },
  registrations(eventId) {
    return request(`/api/admin/events/${encodeURIComponent(eventId)}/registrations`)
  },

  exportRegistrations(eventId) {
    return requestBlob(`/api/admin/events/${encodeURIComponent(eventId)}/registrations/export`)
  },
  attendance(id, present) {
    return request(`/api/admin/registrations/${encodeURIComponent(id)}/attendance?present=${present}`, {
      method: 'PUT'
    })
  }
}
