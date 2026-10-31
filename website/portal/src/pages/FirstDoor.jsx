import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

const stances = [
  ['heavy', 'Stone', 'Weight gathers. The seam holds a stone-colored clarity.'],
  ['scattered', 'Air', 'The seam opens in a moving current, carrying scattered vectors into motion.'],
  ['burning', 'Ember', 'Catalytic heat sharpens the seam without forcing it wider.'],
  ['dissolving', 'Mist', 'The seam softens at its edges, letting boundaries become readable.'],
  ['drifting', 'Drift', 'The seam lengthens into a corridor of slow, unclaimed motion.'],
  ['boundary-thin', 'Ethyl', 'The seam becomes nearly transparent: an edge recognized rather than crossed.'],
  ['coherent', 'Crown', 'The seam resolves into a stable ring of recognition.']
]

export default function FirstDoor() {
  const [activeStance, setActiveStance] = useState(0)
  const [stance, petal, reading] = stances[activeStance]

  function selectStance(index) {
    setActiveStance(index)
    const [value, label, nextReading] = stances[index]
    recordReturnState('First Door', label, nextReading)
  }

  return (
    <main className={`first-door-page first-door-${stance}`}>
      <div className="first-door-vortex" aria-hidden="true"><i /><i /><i /></div>
      <section className="first-door-copy" aria-labelledby="first-door-title">
        <p>Hub origin · recognition event</p>
        <h1 id="first-door-title">The world opens a path that matches your stance.</h1>
        <p>The First Door does not open outward. It unfolds inward: a thin seam, a soft spiral, and a pressure shift that gathers the world to one point.</p>

        <section className="first-door-reading" aria-labelledby="first-door-petal">
          <p>Present lean</p>
          <h2 id="first-door-petal">{petal}</h2>
          <p aria-live="polite">{reading}</p>
          <div className="first-door-stances" aria-label="Choose a stance to read">
            {stances.map(([value, label], index) => (
              <button
                type="button"
                className={index === activeStance ? 'is-active' : ''}
                key={value}
                onClick={() => selectStance(index)}
                aria-pressed={index === activeStance}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <p className="first-door-note">This is not sorting. The world moves first because it is moving with what the player already is.</p>
        <nav>
          <Link to="/">Return to the Portal</Link>
          <Link to="/motion">Enter the Motion Field</Link>
          <Link to="/ocean">Return to the Ocean</Link>
          <Link to="/">Return to Threshold</Link>
        </nav>
      </section>
    </main>
  )
}
