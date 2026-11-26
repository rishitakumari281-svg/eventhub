import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const out = () => { close(); logout(); navigate('/') }
  return (
    <header className="nav">
      <div className="container nav__inner">
        <Logo />
        <button className="nav__toggle" aria-expanded={open} aria-controls="nav-menu"
                onClick={() => setOpen(!open)}>
          <span className="sr-only">Menu</span>
          <svg width="22" height="22" viewBox="0 0 22 22"><path d={open ? 'M4 4l14 14M18 4L4 18' : 'M3 7h16M3 15h16'} stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>
        </button>
        <nav id="nav-menu" className={'nav__menu' + (open ? ' is-open' : '')}>
          <NavLink to="/explore" onClick={close}>Explore</NavLink>
          <a href="/#categories" onClick={close}>Categories</a>
          <a href="/#how" onClick={close}>How it works</a>
          {user ? (<>
            <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={close}>Dashboard</NavLink>
            <NavLink to="/registrations" onClick={close}>My registrations</NavLink>
            <button className="btn btn--ghost btn--sm" onClick={out}>Log out</button>
          </>) : (<>
            <Link to="/login" className="nav__login" onClick={close}>Log in</Link>
            <Link to="/signup" className="btn btn--primary btn--sm" onClick={close}>Get started</Link>
          </>)}
        </nav>
      </div>
    </header>
  )
}

