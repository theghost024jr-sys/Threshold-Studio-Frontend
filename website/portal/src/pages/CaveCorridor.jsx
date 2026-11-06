import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './CaveCorridor.css'

const ALIGNMENT = { x: 0.42, y: -0.12 }
const REVEAL_START = 0.45
const RESOLVED_AT = 0.86
const KEY_STEP = 0.1

const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value))

function measureResolve(look) {
  const distance = Math.hypot(look.x - ALIGNMENT.x, look.y - ALIGNMENT.y)
  return clamp(1 - distance / 1.1, 0, 1)
}

function buildCrystals() {
  const crystals = []
  for (let index = 0; index < 18; index += 1) {
    const side = index % 2 === 0 ? -1 : 1
    const depth = 0.25 + ((index * 37) % 100) / 100 * 0.75
    crystals.push({
      key: index,
      depth,
      left: 50 + side * (14 + ((index * 53) % 36)),
      top: 8 + ((index * 29) % 74),
      height: 10 + ((index * 17) % 26) * depth,
      tilt: side * (6 + ((index * 11) % 24)),
    })
  }
  return crystals
}

export default function CaveCorridor() {
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const [look, setLook] = useState({ x: -0.5, y: 0.1 })
  const [reducedMotion, setReducedMotion] = useState(false)
  const crystals = useMemo(() => buildCrystals(), [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true })
  }, [])

  const resolve = reducedMotion ? 1 : measureResolve(look)
  const resolved = resolve >= RESOLVED_AT

  const lookFromPointer = useCallback((event) => {
    const box = stageRef.current.getBoundingClientRect()
    return {
      x: clamp(((event.clientX - box.left) / box.width) * 2 - 1),
      y: clamp(((event.clientY - box.top) / box.height) * 2 - 1),
    }
  }, [])

  const onPointerDown = (event) => {
    if (event.pointerType !== 'touch') return
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, look }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (reducedMotion) return
    if (event.pointerType === 'touch') {
      const drag = dragRef.current
      if (!drag || drag.id !== event.pointerId) return
      const box = stageRef.current.getBoundingClientRect()
      setLook({
        x: clamp(drag.look.x + ((event.clientX - drag.x) / box.width) * 2.4),
        y: clamp(drag.look.y + ((event.clientY - drag.y) / box.height) * 2.4),
      })
      return
    }
    setLook(lookFromPointer(event))
  }

  const onPointerEnd = (event) => {
    if (dragRef.current?.id === event.pointerId) dragRef.current = null
  }

  const onKeyDown = (event) => {
    const step = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    }[event.key]
    if (!step) return
    event.preventDefault()
    setLook((current) => ({ x: clamp(current.x + step[0]), y: clamp(current.y + step[1]) }))
  }

  const openingPresence = reducedMotion
    ? 1
    : clamp((resolve - REVEAL_START) / (RESOLVED_AT - REVEAL_START), 0, 1)

  return (
    <main className="cave-page">
      <div
        ref={stageRef}
        className={`cave-stage${resolved ? ' is-resolved' : ''}${reducedMotion ? ' is-still' : ''}`}
        style={{
          '--lx': reducedMotion ? 0 : look.x,
          '--ly': reducedMotion ? 0 : look.y,
          '--resolve': resolve,
          '--opening': openingPresence,
        }}
        tabIndex={0}
        role="group"
        aria-label="Cave corridor. Move, drag, or use the arrow keys to change where you look."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <div className="cave-walls" aria-hidden="true" />
        <div className="cave-opening" aria-hidden="true" />
        <div className="cave-crystals" aria-hidden="true">
          {crystals.map((crystal) => (
            <i
              key={crystal.key}
              style={{
                '--depth': crystal.depth,
                '--tilt': `${crystal.tilt}deg`,
                left: `${crystal.left}%`,
                top: `${crystal.top}%`,
                height: `${crystal.height}vmin`,
              }}
            />
          ))}
        </div>
        <div className="cave-fractures" aria-hidden="true">
          <b style={{ '--angle': '-24deg' }} />
          <b style={{ '--angle': '17deg' }} />
          <b style={{ '--angle': '-9deg' }} />
          <b style={{ '--angle': '31deg' }} />
        </div>
        <div className="cave-vignette" aria-hidden="true" />
      </div>

      <nav className="cave-nav" aria-label="Cave corridor passages">
        <a className="cave-nav__retreat" href="/housegarden.html">Back to House &amp; Garden</a>
        {resolved && <Link className="cave-nav__forward" to="/canyon">Enter the Canyon</Link>}
      </nav>
    </main>
  )
}
