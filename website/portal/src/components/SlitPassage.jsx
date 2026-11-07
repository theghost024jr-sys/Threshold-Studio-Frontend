import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SlitNavigationContext } from './SlitNavigationContext.js'

const routes = new Set([
  '/', '/dashboard', '/basin', '/basin-falls', '/beach', '/canyon', '/cave-corridor', '/deepwater', '/doug', '/ethos',
  '/plasma-bloom-meadow',
  '/first-door', '/motion', '/ocean', '/quiet-grove', '/ruins', '/shimmer',
  '/spiral-grove', '/drift-systems', '/drift-chamber', '/collapse-chamber',
  '/glyphs', '/glyphs/hourglass', '/rohg', '/snail-band-clearing',
  '/cabin-of-moss', '/lanternroot-conservatory', '/old-forest-trek', '/rava',
  '/world', '/world/map', '/world/garden', '/world/ella', '/world/chambers'
])

const initialState = {
  phase: 'stable',
  source: null,
  destination: null,
  direction: null,
  error: null
}

function isPortalRoute(pathname) {
  return routes.has(pathname)
    || pathname.startsWith('/branches/')
    || pathname.startsWith('/world/chambers/')
}

function transition(state, event) {
  switch (event.type) {
    case 'ROUTE_REQUESTED':
      return state.phase === 'stable'
        ? { phase: 'intent', source: event.source, destination: event.destination, direction: event.direction, error: null }
        : state
    case 'DESTINATION_VERIFIED':
      return state.phase === 'intent' ? { ...state, phase: 'preform' } : state
    case 'PASSAGE_STARTED':
      return state.phase === 'preform' ? { ...state, phase: 'slit' } : state
    case 'FORM_STARTED':
      return state.phase === 'slit' ? { ...state, phase: 'forming' } : state
    case 'FORM_SUCCEEDED':
      return state.phase === 'forming' ? { ...state, phase: 'postform' } : state
    case 'FORM_FAILED':
      return ['intent', 'preform', 'slit', 'forming'].includes(state.phase)
        ? { ...state, phase: 'aborting', error: event.error }
        : state
    case 'SETTLED':
    case 'ABORT_SETTLED':
      return initialState
    default:
      return state
  }
}

function sameLocation(left, right) {
  return left.pathname === right.pathname
    && (left.search || '') === (right.search || '')
    && (left.hash || '') === (right.hash || '')
}

function destinationLabel(pathname) {
  return pathname === '/' ? 'Portal' : pathname.slice(1).replaceAll('-', ' ')
}

export default function SlitPassage({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const timers = useRef([])
  const [state, dispatch] = useReducer(transition, initialState)

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }, [])

  const schedule = useCallback((callback, delay) => {
    timers.current.push(window.setTimeout(callback, delay))
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const abortPassage = useCallback((error) => {
    if (!state.source || !['intent', 'preform', 'slit', 'forming'].includes(state.phase)) return

    clearTimers()
    dispatch({ type: 'FORM_FAILED', error: error instanceof Error ? error.message : 'The destination could not be formed.' })
    navigate(state.source, { replace: true })
    schedule(() => dispatch({ type: 'ABORT_SETTLED' }), 420)
  }, [clearTimers, navigate, schedule, state.phase, state.source])

  const requestPassage = useCallback((target, direction = 'outbound') => {
    const destination = typeof target === 'string' ? { pathname: target } : target
    const destinationPath = destination.pathname || '/'
    const source = { pathname: location.pathname, search: location.search, hash: location.hash }

    if (!isPortalRoute(destinationPath) || sameLocation(source, destination)) return false

    clearTimers()
    dispatch({ type: 'ROUTE_REQUESTED', source, destination, direction })
    schedule(() => dispatch({ type: 'DESTINATION_VERIFIED' }), 80)
    schedule(() => dispatch({ type: 'PASSAGE_STARTED' }), 260)
    schedule(() => {
      dispatch({ type: 'FORM_STARTED' })
      navigate(destination)
    }, 600)
    return true
  }, [clearTimers, location, navigate, schedule])

  const reportFormSuccess = useCallback((formedLocation) => {
    if (
      state.phase !== 'forming'
      || !state.destination
      || !sameLocation(state.destination, formedLocation)
    ) return

    dispatch({ type: 'FORM_SUCCEEDED' })
    clearTimers()
    schedule(() => dispatch({ type: 'SETTLED' }), 420)
  }, [clearTimers, schedule, state.destination, state.phase])

  function interceptPortalLink(event) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.altKey
      || event.ctrlKey
      || event.shiftKey
    ) return

    const anchor = event.target.closest('a[href]')
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return

    const url = new URL(anchor.href)
    const basename = window.location.pathname.startsWith('/portal') ? '/portal' : ''
    if (
      url.origin !== window.location.origin
      || (url.pathname !== basename && !url.pathname.startsWith(`${basename}/`))
    ) return

    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return

    const pathname = url.pathname.slice(basename.length) || '/'
    if (!isPortalRoute(pathname)) return

    event.preventDefault()
    requestPassage({ pathname, search: url.search, hash: url.hash }, anchor.dataset.direction || 'outbound')
  }

  const phaseLabel = {
    intent: 'Route intent recorded. The current surface still owns the experience.',
    preform: 'Pre-form: the destination is sensed, not yet present.',
    slit: 'Slit: neither surface completely owns this passage.',
    forming: 'Forming: the destination is resolving.',
    postform: 'Post-form: residual presentation is settling.',
    aborting: 'Unable to form the destination. Restoring the current route.'
  }

  const isPassing = state.phase !== 'stable'

  return (
    <SlitNavigationContext.Provider value={{ requestPassage, reportFormSuccess, abortPassage, phase: state.phase }}>
      <div className={`slit-navigation slit-navigation--${state.phase}`} onClickCapture={interceptPortalLink}>
        {children}
      </div>
      {isPassing && (
        <aside className={`slit-passage slit-passage--${state.phase}`} aria-live="assertive" aria-label="Route passage in progress">
          <div className="slit-passage__source">{destinationLabel(state.source.pathname)}</div>
          <div className="slit-passage__field" aria-hidden="true">
            <i />
            <i />
            <span />
            <i />
            <i />
          </div>
          <div className="slit-passage__destination">{destinationLabel(state.destination.pathname)}</div>
          <p>{phaseLabel[state.phase]}</p>
        </aside>
      )}
      {state.error && <p className="slit-passage-error" role="alert">{state.error}</p>}
    </SlitNavigationContext.Provider>
  )
}
