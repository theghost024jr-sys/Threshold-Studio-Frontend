import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

export default function OldForestTrek() {
  const [world, setWorld] = useState({ actualDepth: 0, state: 'arrival', pathVisibility: 0, coherence: 0 })
  const [audioOn, setAudioOn] = useState(false)
  const audioRef = useRef(null)
  const signalsRef = useRef({ lastY: 0, lastAt: performance.now(), stillness: 0, pointerVelocity: 0, pointerX: 0 })

  useEffect(() => {
    let frame
    function update() {
      const current = signalsRef.current
      const now = performance.now()
      current.stillness += 16
      const inputDepth = Math.min(1, window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight))
      setWorld((previous) => {
        const rushing = Math.abs(current.lastY) > 1.4 || current.pointerVelocity > 1.5
        let actualDepth = previous.actualDepth
        let state = previous.state
        let pathVisibility = previous.pathVisibility
        let coherence = previous.coherence
        if (state !== 'passage') actualDepth = Math.min(0.72, Math.max(actualDepth, inputDepth * 0.95))
        else actualDepth = Math.max(actualDepth, inputDepth)
        if (actualDepth > 0.12 && state === 'arrival') state = 'descent'
        if (actualDepth > 0.42 && state === 'descent') state = 'disturbance'
        if (actualDepth >= 0.69 && state !== 'passage') state = 'lost'
        if (state === 'lost' && current.stillness > 900) {
          state = 'listening'
          coherence = Math.max(coherence, audioOn ? 0.28 : 0.2)
        }
        if (state === 'listening' && current.pointerX > 0.42 && current.pointerX < 0.63 && current.stillness > 1350) {
          state = 'revelation'
          pathVisibility = 0.45
          coherence = Math.max(coherence, 0.52)
        }
        if (state === 'revelation' && !rushing && current.pointerX > 0.46 && current.pointerX < 0.58 && current.stillness > 2300) {
          state = 'alignment'
          pathVisibility = 1
          coherence = 1
        }
        if (state === 'alignment' && current.stillness > 2900) {
          state = 'passage'
          recordReturnState('Old Forest Trek', 'Passage', 'The forest synchronized around demonstrated perception; the existing path became actionable.')
        }
        if (rushing && state !== 'passage') pathVisibility = Math.max(0, pathVisibility - 0.04)
        return { actualDepth, state, pathVisibility, coherence }
      })
      frame = requestAnimationFrame(update)
    }
    function onScroll() {
      const now = performance.now()
      const delta = window.scrollY - signalsRef.current.lastY
      signalsRef.current.lastY = window.scrollY
      signalsRef.current.lastAt = now
      signalsRef.current.stillness = 0
      signalsRef.current.scrollVelocity = Math.abs(delta)
    }
    function onPointerMove(event) {
      const previousX = signalsRef.current.pointerX
      signalsRef.current.pointerX = event.clientX / window.innerWidth
      signalsRef.current.pointerVelocity = Math.abs(signalsRef.current.pointerX - previousX) * 60
      signalsRef.current.stillness = 0
    }
    frame = requestAnimationFrame(update)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
      audioRef.current?.close()
    }
  }, [audioOn])

  useEffect(() => {
    if (!audioOn) {
      audioRef.current?.close()
      audioRef.current = null
      return
    }
    const context = new AudioContext()
    const master = context.createGain()
    master.gain.value = 0.035
    master.connect(context.destination)
    const hum = context.createOscillator()
    hum.type = 'sine'
    hum.frequency.value = 54 + world.actualDepth * 32 + world.coherence * 18
    hum.connect(master)
    hum.start()
    const beat = window.setInterval(() => {
      const hit = context.createOscillator()
      const gain = context.createGain()
      hit.type = 'triangle'
      hit.frequency.value = 110 - world.actualDepth * 48
      gain.gain.setValueAtTime(0.0001, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.008, 0.045 - world.actualDepth * 0.035), context.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32)
      hit.connect(gain).connect(master)
      hit.start()
      hit.stop(context.currentTime + 0.35)
    }, 1100 - world.actualDepth * 500)
    audioRef.current = context
    return () => {
      window.clearInterval(beat)
      context.close()
      audioRef.current = null
    }
  }, [audioOn, world.actualDepth, world.coherence])

  return <main className="old-forest-trek" style={{ '--trek-depth': world.actualDepth, '--path-visibility': world.pathVisibility, '--coherence': world.coherence }}>
    <div className="trek-sticky">
      <div className="trek-canopy" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className={`trek-path trek-${world.state}`} aria-hidden="true" />
      <header className="trek-intro">
        <p>Old Forest · trek</p>
        <h1>{world.state === 'passage' ? 'The forest recognizes your pace.' : world.state === 'lost' ? 'The path is here. It is not forward.' : 'Walk until walking stops working.'}</h1>
        <p>{world.state === 'passage' ? 'Scrolling follows the path now. The forest did not yield; you became compatible with it.' : world.state === 'lost' ? 'The same branch returns. The same stone returns. Do not force it.' : 'Scroll to move deeper. Pause to let the forest answer.'}</p>
      </header>
      <div className="trek-controls">
        <button type="button" className={audioOn ? 'is-active' : ''} onClick={() => setAudioOn((on) => !on)}>{audioOn ? 'Mute forest evidence' : 'Listen to the clearing'}</button>
      </div>
      <nav><Link to="/cabin-of-moss">Return to the porch</Link>{world.state === 'passage' && <Link to="/snail-band-clearing">Follow the Beetle’s time</Link>}<Link to="/">Return to the Portal</Link></nav>
    </div>
  </main>
}
