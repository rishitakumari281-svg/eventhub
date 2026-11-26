import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Entry point to discovery: sends the query to /explore?q=...
export default function SearchBar({ initial = '', placeholder = 'Search events, clubs, venues' }) {
  const [q, setQ] = useState(initial)
  const navigate = useNavigate()
  const submit = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore')
  }
  return (
    <form className="search" onSubmit={submit} role="search">
      <label className="sr-only" htmlFor="hero-search">Search events</label>
      <input id="hero-search" value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} />
      <button className="btn btn--primary" type="submit">Find events</button>
    </form>
  )
}
