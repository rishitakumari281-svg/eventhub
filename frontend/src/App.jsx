import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Explore from './pages/Explore'
import ComingSoon from './pages/ComingSoon'
import EventDetails from './pages/EventDetails'
import AuthForm from './pages/AuthForm'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Scanner from './pages/Scanner'
import MyRegistrations from './pages/MyRegistrations'
import RequireAuth from './components/RequireAuth'
import ModeBanner from './components/ModeBanner'

// Scroll to top on route change, or to the #section for hash links.
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <ModeBanner />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/scanner" element={<RequireAuth><Scanner /></RequireAuth>} />
          <Route path="/registrations" element={<RequireAuth><MyRegistrations /></RequireAuth>} />
          <Route path="*" element={<ComingSoon title="Page not found" />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
