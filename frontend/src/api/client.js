import { API_BASE } from './config'

/* ---------------------------------------------------------------------------------------
 * TOKEN STORAGE: localStorage  (decision recorded for Phase A)
 *
 * Trade-off: any JavaScript running on this page (for example through an XSS bug or a
 * compromised npm package) can read localStorage, and so could steal the login token.
 * An httpOnly cookie cannot be read by JavaScript, but needs backend changes plus CSRF
 * protection. We accept localStorage for the hackathon. Mitigations in place: tokens expire
 * after 2 hours, React escapes rendered text, and there is no user-supplied HTML anywhere.
 * Revisit before any real deployment. See frontend/README.md.
 * ------------------------------------------------------------------------------------- */
const TOKEN_KEY = 'eh_token'
export const tokenStore = {
  get() { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set(t) { try { localStorage.setItem(TOKEN_KEY, t) } catch { /* storage unavailable: user stays logged in for this tab only */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

/** Reads the `exp` claim so the UI can log out on time. UX only: the SERVER is what really enforces expiry. */
export function tokenExpiryMs(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    return typeof exp === 'number' ? exp * 1000 : null
  } catch { return null }
}

/** status 0 = could not reach the server at all. */
export class ApiError extends Error {
  constructor(status, message, fieldErrors = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

let onUnauthorized = null
/** AuthContext registers a callback here: called when the server rejects a token we sent. */
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

/**
 * Every call to the backend goes through here: adds the token header, turns the server's
 * { status, message, fieldErrors } error body into an ApiError, and reacts to 401s.
 * `auth: false` = do not send the token (login, signup and public reads).
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  const token = tokenStore.get()
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(API_BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the backend is running and try again.")
  }
  if (res.status === 204) return null

  let data = null
  try { data = await res.json() } catch { /* not JSON (e.g. a proxy error page) */ }

  if (!res.ok) {
    if (res.status === 401 && auth && token && onUnauthorized) onUnauthorized()
    if (!data && res.status >= 500) throw new ApiError(res.status, "The server isn't responding. Please try again shortly.")
    throw new ApiError(res.status, data?.message || 'Something went wrong. Please try again.', data?.fieldErrors || null)
  }
  return data
}
