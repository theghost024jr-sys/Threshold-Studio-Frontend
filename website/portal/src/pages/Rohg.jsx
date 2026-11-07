import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import rohgReckless from '../assets/rohg.png'
import rohgCalm from '../assets/rohg-calm.png'
import { getReturnState, recordReturnState } from '../returnState.js'

export default function Rohg() {
  const trace = useMemo(getReturnState, [])
  const reckless = Boolean(trace && /collapse|fracture|pressure|spiral|drift|volatile/i.test(`${trace.origin} ${trace.value} ${trace.detail}`))
  const [returned, setReturned] = useState(false)
  const aspect = reckless ? 'Reckless' : 'Calm'
  const portrait = reckless ? rohgReckless : rohgCalm
  const message = reckless
    ? 'You are carrying a confused vector. Rohg meets it with a jolt, not a judgment.'
    : 'The field is quiet enough for Rohg to meet you without force. He stays until the direction returns.'

  function takeBottle() {
    recordReturnState('Rohg', 'Bottle of Return', 'Orientation reset. Confusion cleared. Return to the Hub.')
    setReturned(true)
  }

  return <main className={`rohg-page rohg-${aspect.toLowerCase()}`}>
    <div className="rohg-shadow" aria-hidden="true" />
    <section className="rohg-copy">
      <p>Legacy roamer · earth-aligned anti-drift agent</p>
      <h1>Rohg the {aspect}.</h1>
      <p>{message}</p>
      <p className="rohg-trace">Current trace: {trace ? `${trace.origin} · ${trace.value}` : 'No registered confusion. Rohg is still listening.'}</p>
      <div className="rohg-actions">
        {!returned ? <button type="button" onClick={takeBottle}>Take the Bottle of Return</button> : <Link to="/">Return to the Portal</Link>}
        <Link to="/motion">Continue through Motion</Link>
        <Link to="/glyphs">Read the glyphs</Link>
      </div>
      <aside><strong>{returned ? 'Orientation restored.' : 'It looks like poison.'}</strong><p>{returned ? 'The Bottle has written a clear return trace. The Hub can now receive you.' : 'The Bottle of Return clears confusion, restores orientation, and sends the traveler home. Taking it is your choice.'}</p></aside>
    </section>
    <figure className="rohg-portrait"><img src={portrait} alt={`${aspect} Rohg, the honey badger legacy character`} /><figcaption>Rohg appears where confusion needs a way home.</figcaption></figure>
  </main>
}
