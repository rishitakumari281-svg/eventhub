import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import * as api from '../api'
import { useAsync } from '../lib/useAsync'

export default function Footer() {
  const { pathname } = useLocation()
  // Retries on navigation if an earlier load failed (successful loads are cached, so no extra requests).
  const { data } = useAsync(() => api.categories.list(), [], [pathname])
  const categories = data || [] // footer stays quiet if categories fail to load
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo light />
          <p className="footer__tag">One home for everything happening on campus.</p>
        </div>
        <div>
          <h4>Explore</h4>
          {categories.slice(0, 4).map(c => <Link key={c.id} to={`/explore?category=${c.id}`}>{c.name}</Link>)}
        </div>
        <div>
          <h4>Platform</h4>
          <Link to="/explore">All events</Link>
          <Link to="/signup">Create account</Link>
          <Link to="/login">Organizer login</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <a href="mailto:hello@eventhub.example">hello@eventhub.example</a>
          <span>Student Activities Office</span>
        </div>
      </div>
      <div className="container footer__base">© 2026 EventHub. Built for campus life.</div>
    </footer>
  )
}
