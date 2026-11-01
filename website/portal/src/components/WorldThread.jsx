import { Link } from 'react-router-dom'

const places = [
  ['basin', 'Basin', '/basin'],
  ['cabin', 'Cabin', '/cabin-of-moss'],
  ['forest', 'Old Forest', '/old-forest-trek']
]

export default function WorldThread({ active }) {
  return (
    <nav className="world-thread" aria-label="Basin world thread">
      {places.map(([id, label, route], index) => (
        <Link key={id} className={id === active ? 'is-active' : ''} to={route} aria-current={id === active ? 'page' : undefined}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          {label}
        </Link>
      ))}
    </nav>
  )
}
