import { Link } from 'react-router-dom'

export default function ComingSoon({ title, stage }) {
  return (
    <section className="container stub">
      <p className="eyebrow">{stage ? `Planned for ${stage}` : '404'}</p>
      <h1 className="display">{title}</h1>
      <p>{stage ? 'This page is not built yet.' : 'That page does not exist.'}</p>
      <Link className="btn btn--primary" to="/">Back to home</Link>
    </section>
  )
}
