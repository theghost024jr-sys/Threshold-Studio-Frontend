import { useState } from 'react'
import { Link } from 'react-router-dom'
import returningImage from '../assets/the-returning.png'
import { recordReturnState } from '../returnState.js'

const readings = {
  quiet: {
    label: 'Deep Quiet',
    title: 'The Grove does not become peaceful. It becomes attentive.',
    body: 'Sound is absorbed. Emotional turbulence settles into a fine, even layer. The world narrows to a single, gentle point.'
  },
  roots: {
    label: 'Root Silence',
    title: 'The roots take in emotional noise.',
    body: 'Memory settles into the roots in thin, delicate layers. Their silence can soften grief and hold attention without asking it to perform.'
  },
  pulse: {
    label: 'Quiet Pulse',
    title: 'A rhythm appears as the absence of sound.',
    body: 'The pulse synchronizes breath and emotional rhythm. Mosslights answer faintly to deep calm; the field becomes quiet coherence.'
  }
}

const waypoints = [
  { label: 'Departure', detail: 'The moment of loss or collapse.' },
  { label: 'Descent', detail: 'The spiral inward, where memory compresses.' },
  { label: 'Emergence', detail: 'Return with altered meaning.' }
]

export default function QuietGrove() {
  const [reading, setReading] = useState('quiet')
  const [waypoint, setWaypoint] = useState(0)
  const current = readings[reading]

  function read(nextReading) {
    setReading(nextReading)
    recordReturnState('Quiet Grove', readings[nextReading].label, readings[nextReading].body)
  }

  function markWaypoint(index) {
    setWaypoint(index)
    const next = waypoints[index]
    recordReturnState('Quiet Grove', `The Returning · ${next.label}`, next.detail)
  }

  return (
    <main className={`quiet-grove quiet-grove--${reading}`}>
      <div className="grove-canopy" aria-hidden="true" />
      <div className="softfall" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="mosslights" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>

      <section className="grove-copy" aria-labelledby="grove-title">
        <p>{current.label} · Quiet-Weight recovery system</p>
        <h1 id="grove-title">{current.title}</h1>
        <p>{current.body}</p>

        <div className="grove-readings" aria-label="Quiet Grove readings">
          <button type="button" className={reading === 'quiet' ? 'is-active' : ''} onClick={() => read('quiet')}>Enter Deep Quiet</button>
          <button type="button" className={reading === 'roots' ? 'is-active' : ''} onClick={() => read('roots')}>Rest at Root Silence</button>
          <button type="button" className={reading === 'pulse' ? 'is-active' : ''} onClick={() => read('pulse')}>Follow Quiet Pulse</button>
        </div>

        <p className="grove-caution">Quiet Grove absorbs fracture, pressure spikes, and resonance overload. Stay oriented: its collapse mode is Quiet-sink, where stillness can become disconnection.</p>
        <nav>
          <Link to="/">Return to the Portal</Link>
          <Link to="/motion">Resume through Motion</Link>
          <Link to="/spiral-grove">Trace Spiral Grove</Link>
          <Link to="/ruins">Re-read Velin</Link>
        </nav>
      </section>

      <aside className="returning" aria-labelledby="returning-title">
        <img src={returningImage} alt="The Returning, a spiral pendant with three return markers" />
        <div>
          <p>Field-bound symbolic piece</p>
          <h2 id="returning-title">The Returning</h2>
          <p>{waypoints[waypoint].detail}</p>
          <div className="returning-waypoints" aria-label="The Returning waypoints">
            {waypoints.map((item, index) => (
              <button type="button" className={waypoint === index ? 'is-active' : ''} key={item.label} onClick={() => markWaypoint(index)}>
                {String(index + 1).padStart(2, '0')} {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </main>
  )
}
