// Generative cover art: no external images needed, always on-palette.
const THEMES = {
  tech: ['#183D32', '#A8B5A0', '#C66B4E'],
  cultural: ['#C66B4E', '#F7F4EC', '#183D32'],
  sports: ['#252923', '#C66B4E', '#E8E0D2'],
  academic: ['#A8B5A0', '#183D32', '#F7F4EC'],
  career: ['#E8E0D2', '#183D32', '#C66B4E'],
  social: ['#183D32', '#E8E0D2', '#A8B5A0'],
}

function Pattern({ kind, fg, accent }) {
  switch (kind) {
    case 'grid':
      return (<g stroke={fg} strokeOpacity=".35" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => <line key={'v' + i} x1={i * 50} y1="0" x2={i * 50} y2="300" />)}
        {Array.from({ length: 7 }, (_, i) => <line key={'h' + i} x1="0" y1={i * 50} x2="400" y2={i * 50} />)}
        <rect x="150" y="100" width="100" height="100" fill={accent} stroke="none" />
      </g>)
    case 'arcs':
      return (<g fill="none" stroke={fg} strokeOpacity=".5" strokeWidth="2">
        {[60, 100, 140, 180, 220].map(r => <circle key={r} cx="300" cy="260" r={r} />)}
        <circle cx="300" cy="260" r="40" fill={accent} stroke="none" />
      </g>)
    case 'stripes':
      return (<g>
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 40 - 40} y="-20" width="14" height="360" fill={fg} fillOpacity=".3" transform="rotate(20 200 150)" />)}
        <circle cx="110" cy="210" r="46" fill={accent} />
      </g>)
    default:
      return (<g fill={fg} fillOpacity=".4">
        {Array.from({ length: 8 }, (_, r) => Array.from({ length: 12 }, (_, c) =>
          <circle key={r + '-' + c} cx={c * 36 + 20} cy={r * 38 + 20} r="4" />))}
        <circle cx="290" cy="90" r="50" fill={accent} fillOpacity="1" />
      </g>)
  }
}

export default function EventCover({ event, className = '' }) {
  const [bg, fg, accent] = THEMES[event.category] || THEMES.tech
  return (
    <svg className={'cover ' + className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"
         role="img" aria-label={`Cover artwork for ${event.title}`}>
      <rect width="400" height="300" fill={bg} />
      <Pattern kind={event.pattern} fg={fg} accent={accent} />
    </svg>
  )
}
