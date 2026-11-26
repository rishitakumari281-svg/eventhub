import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isEmail } from '../lib/store'
import { USE_MOCK } from '../api/config'

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup'
  const { login, signup, notice } = useAuth()
  const navigate = useNavigate()
  const from = useLocation().state?.from || '/dashboard'
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const validate = () => {
    const er = {}
    if (isSignup && f.name.trim().length < 2) er.name = 'Enter your full name.'
    if (!isEmail(f.email)) er.email = 'Enter a valid college email.'
    if (isSignup) {
      if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) er.password = 'Use 8+ characters with letters and numbers.'
      if (f.confirm !== f.password) er.confirm = 'Passwords do not match.'
    } else if (!f.password) er.password = 'Enter your password.'
    return er
  }

  const submit = async (e) => {
    e.preventDefault(); setFormError('')
    const er = validate(); setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { isSignup ? await signup(f) : await login(f.email, f.password); navigate(from, { replace: true }) }
    catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors) // server-side validation messages, shown under the right field
      setFormError(err.message)
    } finally { setBusy(false) }
  }

  const Field = ({ k, label, type = 'text', auto }) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} type={type} value={f[k]} onChange={set(k)} autoComplete={auto}
             aria-invalid={!!errors[k]} aria-describedby={errors[k] ? k + '-e' : undefined} />
      {errors[k] && <span className="field__err" id={k + '-e'}>{errors[k]}</span>}
    </div>
  )

  return (
    <section className="auth">
      <div className="auth__side">
        <p className="eyebrow eyebrow--light">{isSignup ? 'Join EventHub' : 'Welcome back'}</p>
        <h1 className="display">{isSignup ? <>Your campus, <em>one</em> account.</> : <>Good to see you <em>again.</em></>}</h1>
        <p>Register for events, build teams and keep every ticket in one place.</p>
      </div>
      <form className="auth__form" onSubmit={submit} noValidate>
        <h2>{isSignup ? 'Create your account' : 'Log in'}</h2>
        {isSignup && Field({ k: 'name', label: 'Full name', auto: 'name' })}
        {Field({ k: 'email', label: 'College email', type: 'email', auto: 'email' })}
        {Field({ k: 'password', label: 'Password', type: 'password', auto: isSignup ? 'new-password' : 'current-password' })}
        {isSignup && Field({ k: 'confirm', label: 'Confirm password', type: 'password', auto: 'new-password' })}
        {notice && !formError && <p className="alert alert--error" role="status">{notice}</p>}
        {formError && <p className="alert alert--error" role="alert">{formError}</p>}
        <button className="btn btn--primary btn--block" type="submit" disabled={busy}>{isSignup ? 'Create account' : 'Log in'}</button>
        <p className="panel__alt">{isSignup ? <>Have an account? <Link to="/login">Log in</Link></> : <>New to EventHub? <Link to="/signup">Create an account</Link></>}</p>
        {!isSignup && USE_MOCK && <p className="demo-hint"><b>Demo student:</b> demo@student.edu / Student@123</p>}
      </form>
    </section>
  )
}
