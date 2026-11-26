import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../api'
import { setUnauthorizedHandler } from '../api/client'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

// `tick` changes whenever data changes; pages list it in their useAsync deps so they refetch.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false) // false until we know whether a saved login is still valid
  const [tick, setTick] = useState(0)
  const [notice, setNotice] = useState('')  // e.g. "Your session has expired", shown on the login page
  const bump = () => setTick(t => t + 1)

  const expire = () => {
    api.auth.logout()
    setUser(null)
    setNotice('Your session has expired. Please log in again.')
  }

  // On first load: react to server 401s, then try to restore a saved session.
  useEffect(() => {
    let alive = true
    setUnauthorizedHandler(() => { if (alive) expire() })
    api.auth.restore()
      .then(u => { if (alive) setUser(u) })
      .catch(() => { /* server unreachable: show logged-out UI; a saved token is kept for the next load */ })
      .finally(() => { if (alive) setReady(true) })
    return () => { alive = false; setUnauthorizedHandler(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Log out at the moment the token runs out (the server enforces expiry regardless; this is just UX).
  useEffect(() => {
    if (!user) return undefined
    const exp = api.auth.tokenExpiry()
    if (!exp) return undefined
    const ms = exp - Date.now()
    if (ms <= 0) { expire(); return undefined }
    const t = setTimeout(expire, Math.min(ms, 2 ** 31 - 1))
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const value = {
    user, tick, bump, notice, ready,
    login: async (email, password) => { const u = await api.auth.login(email, password); setUser(u); setNotice(''); return u },
    signup: async (data) => { const u = await api.auth.signup(data); setUser(u); setNotice(''); return u },
    logout: () => { api.auth.logout(); setUser(null) },
  }

  if (!ready) return <p className="async async--loading app-boot" role="status">Loading…</p>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
