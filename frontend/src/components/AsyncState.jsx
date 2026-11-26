// Shared loading / error blocks so every page handles slow or failing requests the same way.
export function Loading({ label = 'Loading…' }) {
  return <p className="async async--loading" role="status">{label}</p>
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="async async--error" role="alert">
      <h3>We couldn't load this</h3>
      <p>{error?.message || 'Something went wrong.'}</p>
      {onRetry && <button className="btn btn--primary btn--sm" onClick={onRetry}>Try again</button>}
    </div>
  )
}
