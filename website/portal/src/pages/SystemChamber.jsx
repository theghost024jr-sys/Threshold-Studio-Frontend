import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

const chambers = {
  drift: {
    label: 'Motion architecture',
    title: 'Drift is a field, not a mistake.',
    body: 'Drift forms through pressure gradients, resonance curvature, instability pockets, corridor geometry, symbolic meaning, and chamber scoring.',
    modes: [
      ['Pressure lane', 'Pressure-driven drift routes through warm lanes and corridor pockets.'],
      ['Harmonic line', 'Resonance-driven drift follows tone-flow curvature and harmonic pathways.'],
      ['Instability pocket', 'Instability-driven drift opens turbulence, inversion, and collapse-adjacent motion.']
    ],
    next: '/drift-chamber',
    nextLabel: 'Enter the Drift Chamber'
  },
  'drift-chamber': {
    label: 'Motion-intelligence organ',
    title: 'The Chamber does not push. It guides.',
    body: 'Drift Chamber reads pressure, resonance, tension fibers, collapse adjacency, corridors, slit signals, Frontier signals, and ethos deltas to tint movement.',
    modes: [
      ['Coherent drift', 'Strong resonance, aligned fibers, and smooth pressure reinforce anchor and reduce collapse.'],
      ['Volatile drift', 'Pressure spikes, resonance fractures, and weakening fibers raise collapse likelihood.'],
      ['Migratory drift', 'Rising slit pressure and Frontier instability bias motion toward migration.']
    ],
    next: '/collapse-chamber',
    nextLabel: 'Enter the Collapse Chamber'
  },
  'collapse-chamber': {
    label: 'Failure-intelligence organ',
    title: 'Collapse is interpreted, not erased.',
    body: 'Collapse Chamber tints, amplifies, redirects, contains, or resolves collapse according to pressure, tension, resonance, ethos, and geometry.',
    modes: [
      ['Containment', 'Small collapse pockets can be held when resonance density is high and tension fibers are strong.'],
      ['Redirection', 'Intersecting fractures, corridors, slit turbulence, and Frontier instability bend collapse geometry.'],
      ['Resolution', 'Collapse resolves into drift, anchor, or migration. Its final state changes what can happen next.']
    ],
    next: '/motion',
    nextLabel: 'Return through Motion'
  }
}

export default function SystemChamber() {
  const { pathname } = useLocation()
  const chamber = pathname.split('/').filter(Boolean).pop()
  const current = chambers[chamber] || chambers.drift
  const [mode, setMode] = useState(0)
  const [name, detail] = current.modes[mode]

  function choose(index) {
    setMode(index)
    const [selected, description] = current.modes[index]
    recordReturnState(current.title.startsWith('Drift is') ? 'Drift Systems' : current.title.startsWith('The Chamber') ? 'Drift Chamber' : 'Collapse Chamber', selected, description)
  }

  return (
    <main className={`system-chamber system-${chamber}`}>
      <div className="system-grid" aria-hidden="true" />
      <div className="system-orbits" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="system-copy" aria-labelledby="system-title">
        <p>{current.label} · active field reading</p>
        <h1 id="system-title">{current.title}</h1>
        <p>{current.body}</p>
        <div className="system-modes" aria-label="System modes">
          {current.modes.map(([label], index) => (
            <button type="button" className={index === mode ? 'is-active' : ''} onClick={() => choose(index)} key={label}>{label}</button>
          ))}
        </div>
        <div className="system-reading" aria-live="polite">
          <strong>{name}</strong>
          <p>{detail}</p>
        </div>
        <nav>
          <Link to={current.next}>{current.nextLabel}</Link>
          <Link to="/">Return to the Portal</Link>
          <Link to="/doug">Ask Doug for help</Link>
        </nav>
      </section>
    </main>
  )
}
