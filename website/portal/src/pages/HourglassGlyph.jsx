import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

const readings = [
  ['Read the throat', 'The central constriction is the collapse vector: narrower means greater temporal pressure.'],
  ['Read the lobes', 'The upper and lower chambers show pre- and post-collapse states. Their balance reveals inversion.'],
  ['Read the rotation', 'Internal flow marks recursion direction. Repetition deepens the memory loop.']
]

export default function HourglassGlyph() {
  const [reading, setReading] = useState(0)
  const [title, detail] = readings[reading]
  function select(index) {
    setReading(index)
    recordReturnState('Hourglass Glyph', readings[index][0], readings[index][1])
  }
  return <main className="glyph-page">
    <div className="glyph-stars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
    <div className={`hourglass-sigil reading-${reading}`} aria-hidden="true">
      <span className="glyph-lobe glyph-lobe-top" /><span className="glyph-lobe glyph-lobe-bottom" />
      <span className="glyph-throat" /><span className="glyph-flow glyph-flow-a" /><span className="glyph-flow glyph-flow-b" />
    </div>
    <section className="glyph-copy">
      <p>Environmental signal · recursive glyph</p>
      <h1>Hourglass Glyph</h1>
      <p>The compressed form of temporal pressure, collapse geometry, inversion symmetry, and reversible flow.</p>
      <div className="glyph-readings">
        {readings.map(([label], index) => <button type="button" className={index === reading ? 'is-active' : ''} onClick={() => select(index)} key={label}>{label}</button>)}
      </div>
      <aside><strong>{title}</strong><p>{detail}</p></aside>
      <nav><Link to="/collapse-chamber">Follow collapse intelligence</Link><Link to="/drift-systems">Return to drift</Link><Link to="/">Return to the Portal</Link></nav>
    </section>
  </main>
}
