import { useEffect, useRef, useState } from 'react'

/**
 * Runs an async function and tracks { data, error, loading }.
 *   deps         = what the data is ABOUT (event id, user id). When these change, old data is cleared,
 *                  so you never see event 3 while event 5 loads, or a stale event after a 404.
 *   refreshDeps  = triggers a quiet refetch (e.g. after registering). Old data stays visible meanwhile.
 * reload() also refetches quietly. Results from a superseded request are ignored.
 */
export function useAsync(fn, deps, refreshDeps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [nonce, setNonce] = useState(0)
  const lastKey = useRef(null)
  const key = JSON.stringify(deps)

  useEffect(() => {
    let cancelled = false
    const sameSubject = lastKey.current === key
    lastKey.current = key
    setState(s => sameSubject ? { ...s, loading: true, error: null } : { data: null, error: null, loading: true })
    fn()
      .then(data => { if (!cancelled) setState({ data, error: null, loading: false }) })
      .catch(error => { if (!cancelled) setState(s => ({ ...s, error, loading: false })) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, ...refreshDeps])

  return { ...state, reload: () => setNonce(n => n + 1) }
}
