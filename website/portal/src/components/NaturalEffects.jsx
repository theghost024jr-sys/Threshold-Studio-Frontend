import { useLocation } from 'react-router-dom'

function environmentFor(pathname) {
  if (['/basin', '/basin-falls', '/cabin-of-moss', '/old-forest-trek', '/shimmer'].includes(pathname)) return 'forest'
  if (['/beach', '/ocean', '/deepwater'].includes(pathname)) return 'water'
  return 'field'
}

export default function NaturalEffects() {
  const location = useLocation()
  const environment = environmentFor(location.pathname)

  return (
    <div className={`natural-effects natural-effects--${environment}`} aria-hidden="true">
      <i /><i /><i /><i /><i /><i />
      <span />
    </div>
  )
}
