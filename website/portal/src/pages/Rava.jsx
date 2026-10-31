import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

const states = [
  ['Hold', 'Rava remembers the pressure that formed the stone. The terrain resists change.'],
  ['Reshape', 'Fault-lines articulate. A ridge shifts; water finds a new path; a cave opens from inside the mountain.'],
  ['Listen', 'Rava does not stop erosion. He lets the stone forget him and remembers each phase of its change.']
]

export default function Rava() {
  const [state, setState] = useState(0)
  const [label, detail] = states[state]
  function choose(index) {
    setState(index)
    recordReturnState('Rava', states[index][0], states[index][1])
  }
  return <main className={`rava-page rava-state-${state}`}>
    <div className="rava-caldera" aria-hidden="true"><i /><i /><i /><b /></div>
    <section className="rava-copy">
      <p>The Sixth Guest · Gravemarrow</p>
      <h1>Rava, the Stone-Mover.</h1>
      <p>Rava is the force that makes stone remember it can move. Not a builder or sculptor: an earthquake wearing a body.</p>
      <div className="rava-actions">{states.map(([name], index) => <button className={index === state ? 'is-active' : ''} onClick={() => choose(index)} type="button" key={name}>{name}</button>)}</div>
      <aside><strong>{label}</strong><p>{detail}</p></aside>
      <blockquote>“Weight is not permanence. It’s participation.”</blockquote>
      <nav><Link to="/drift-systems">Follow the drift</Link><Link to="/glyphs/hourglass">Read time under tension</Link><Link to="/">Return to the Portal</Link></nav>
    </section>
  </main>
}
