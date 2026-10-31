import { useState } from 'react'
import { Link } from 'react-router-dom'
import ruinsImage from '../assets/ruins-of-velin.png'
import ruinCrowsImage from '../assets/ruin-crows.png'
import { recordReturnState } from '../returnState.js'

const readings = {
  arrival: {
    label: 'Stone / Root / Ash',
    title: 'The ruins still hold pressure.',
    body: 'Velin is not a dead structure. Memory, stone, resonance, and collapse residue remain active in its fractured archways and half-buried corridors.'
  },
  fracture: {
    label: 'Pressure inversion',
    title: 'A fracture line is not a path.',
    body: 'The stone carries residue knots and recursive echoes. A pressure inversion pocket is forming where collapse never fully resolved.'
  },
  crows: {
    label: 'Ruin Crows',
    title: 'The flock reads what the stone cannot say.',
    body: 'Ruin Crows track collapse signatures, consume low-grade residue, and map fracture geometry through their drift-aligned flight.'
  },
  echo: {
    label: 'Velin Echo',
    title: 'The echo is not a sound.',
    body: 'A non-auditory resonance event moves through the ruin: stone-borne pressure, memory-dense air, and a shimmer of unresolved meaning.'
  }
}

export default function Ruins() {
  const [reading, setReading] = useState('arrival')
  const current = readings[reading]

  function inspect(nextReading) {
    setReading(nextReading)
    if (nextReading !== 'arrival') {
      recordReturnState('Ruins', readings[nextReading].label, readings[nextReading].body)
    }
  }

  return (
    <main className={`ruins-page ruins-${reading}`}>
      <img className="ruins-image" src={ruinsImage} alt="The Ruins of Velin" />
      <div className="ruins-dust" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="ruins-veil" aria-hidden="true" />
      <img className="ruin-crows" src={ruinCrowsImage} alt="Ruin Crows reading a collapse signature" />

      <section className="ruins-copy" aria-labelledby="ruins-title">
        <p>{current.label} · collapse-adjacent environment</p>
        <h1 id="ruins-title">{current.title}</h1>
        <p>{current.body}</p>

        <div className="ruins-controls" aria-label="Velin readings">
          <button type="button" className={reading === 'fracture' ? 'is-active' : ''} onClick={() => inspect('fracture')}>Read the fracture</button>
          <button type="button" className={reading === 'crows' ? 'is-active' : ''} onClick={() => inspect('crows')}>Observe the flock</button>
          <button type="button" className={reading === 'echo' ? 'is-active' : ''} onClick={() => inspect('echo')}>Receive the echo</button>
        </div>

        <p className="ruins-note">Velin is a teaching environment for collapse physics. It does not erase the residue; it makes pressure, drift, and fracture readable.</p>
        <nav>
          <Link to="/quiet-grove">Find the Quiet Grove</Link>
          <Link to="/">Return to the Portal</Link>
          <Link to="/motion">Enter the Motion Field</Link>
          <Link to="/ocean">Return to the Ocean</Link>
        </nav>
      </section>
    </main>
  )
}
