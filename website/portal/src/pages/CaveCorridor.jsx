import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './CaveCorridor.css'
import { deriveCaveCorridorState } from './CaveCorridorState.js'
import {
  lookDirectionAtAngle,
  observeBendSeverance,
  travelerPositionAtProgress,
} from './CaveCorridorGeometry.js'
import CaveCorridorViewport from './CaveCorridorViewport.jsx'

const MEADOW_ALIGNMENT = { x: -0.9, y: 0.1 }
const RESOLVED_AT = 0.86
const KEY_STEP = 0.1
const TRAVEL_STEP = 0.055

const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value))

function measureResolve(look, target) {
  const distance = Math.hypot(look.x - target.x, look.y - target.y)
  return clamp(1 - distance / 1.1, 0, 1)
}

export default function CaveCorridor() {
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const [look, setLook] = useState({ x: 0.5, y: 0 })
  const [progress, setProgress] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const corridor = useMemo(() => deriveCaveCorridorState(progress), [progress])
  const travelerPosition = useMemo(() => travelerPositionAtProgress(progress), [progress])
  const lookDirection = useMemo(
    () => lookDirectionAtAngle(look.x * Math.PI),
    [look.x],
  )
  const bendSeverance = useMemo(() => {
    return observeBendSeverance({ position: travelerPosition, lookDirection })
  }, [lookDirection, travelerPosition])

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined

    const walkthrough = {
      getTravelerPosition: () => travelerPosition,
      getLookDirection: () => lookDirection,
      getSeveranceObservation: () => bendSeverance,
      setProgressForTest: (value) => setProgress(clamp(value, 0, 1)),
      resetWalkthrough: () => {
        setProgress(0)
        setLook({ x: 0.5, y: 0 })
      },
    }
    window.__caveCorridorWalkthrough = walkthrough

    return () => {
      if (window.__caveCorridorWalkthrough === walkthrough) delete window.__caveCorridorWalkthrough
    }
  }, [bendSeverance, lookDirection, travelerPosition])

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

  const meadowResolve = reducedMotion ? 1 : measureResolve(look, MEADOW_ALIGNMENT)
  const meadowResolved = meadowResolve >= RESOLVED_AT
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
    if (event.pointerType === 'touch') {
      const drag = dragRef.current
      if (!drag || drag.id !== event.pointerId) return
      const box = stageRef.current.getBoundingClientRect()
      setLook({
        x: clamp(drag.look.x + ((event.clientX - drag.x) / box.width) * 2.4),
        y: drag.look.y,
      })
      setProgress((current) => clamp(current - ((event.clientY - drag.y) / box.height) * 0.65, 0, 1))
      return
    }
    if (!reducedMotion) setLook(lookFromPointer(event))
  }

  const onPointerEnd = (event) => {
    if (dragRef.current?.id === event.pointerId) dragRef.current = null
  }

  const onKeyDown = (event) => {
    const lookStep = {
      ArrowLeft: [-KEY_STEP, 0],
      ArrowRight: [KEY_STEP, 0],
    }[event.key]
    if (lookStep) {
      event.preventDefault()
      setLook((current) => ({ x: clamp(current.x + lookStep[0]), y: clamp(current.y + lookStep[1]) }))
      return
    }

    const travelStep = {
      w: TRAVEL_STEP,
      W: TRAVEL_STEP,
      ArrowUp: TRAVEL_STEP,
      PageDown: TRAVEL_STEP,
      s: -TRAVEL_STEP,
      S: -TRAVEL_STEP,
      ArrowDown: -TRAVEL_STEP,
      PageUp: -TRAVEL_STEP,
    }[event.key]
    if (travelStep) {
      event.preventDefault()
      setProgress((current) => clamp(current + travelStep, 0, 1))
    }

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault()
      setProgress(0)
      setLook({ x: 0.5, y: 0 })
    }
  }

  return (
    <main className="cave-page">
      <div
        ref={stageRef}
        className={`cave-stage${reducedMotion ? ' is-still' : ''}`}
        tabIndex={0}
        role="group"
        aria-label="Cave Corridor"
        aria-describedby="cave-instructions cave-condition"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <p id="cave-instructions" className="cave-status">Move forward with W or Arrow Up, back with S or Arrow Down, look with the pointer or left and right arrows, and reset with R.</p>
        <p id="cave-condition" className="cave-status" aria-live="polite">
          {`${corridor.meaning}. House and Garden: ${bendSeverance.visibility}.`}
        </p>
        <CaveCorridorViewport
          position={travelerPosition}
          lookDirection={lookDirection}
          lookPitch={reducedMotion ? 0 : look.y * 0.45}
        />
      </div>

      <nav className="cave-nav" aria-label="Cave corridor passages">
        <a className="cave-nav__retreat" href="/housegarden.html">Back to House &amp; Garden</a>
        {meadowResolved && <a className="cave-nav__meadow" href="/wildflower-drift.html">Toward the wildflower field</a>}
        <Link className="cave-nav__prototype" to="/cave-corridor-prototype">Follow the older seam</Link>
        {corridor.progress >= 0.98 && <Link className="cave-nav__forward" to="/canyon">Cross into Canyon</Link>}
      </nav>
    </main>
  )
}
