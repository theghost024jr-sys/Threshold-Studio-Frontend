import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

const readings = [
  ['Gather', 'The roots brighten around what has not yet been named. Do not rush to fill the space; let it become distinct.'],
  ['Keep', 'A warm filament holds beneath the heel. Some weight is not burden. It is a thing you are already carrying well.'],
  ['Release', 'The light unthreads itself and returns to the soil. What settles here was never required to become a path.']
]

export default function LanternrootConservatory() {
  const [reading, setReading] = useState(0)
  const [name, detail] = readings[reading]

  function readRoots(index) {
    const [nextName, nextDetail] = readings[index]
    setReading(index)
    recordReturnState('Lanternroot Conservatory', nextName, nextDetail)
  }

  return (
    <main className="lanternroot" style={{ '--reading': reading }}>
      <div className="lanternroot-field" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <section className="lanternroot-copy">
        <p>Transition biome · root-lit field</p>
        <h1>Light waits beneath the path.</h1>
        <p className="lanternroot-intro">Between the Herb Room and the Old Forest, the roots have learned to keep what daylight leaves behind. They become visible only when you stop trying to make them lead.</p>
        <div className="lanternroot-readings" aria-label="Rootlight readings">
          {readings.map(([label], index) => <button className={index === reading ? 'is-active' : ''} type="button" onClick={() => readRoots(index)} key={label}>{label}</button>)}
        </div>
        <aside aria-live="polite"><strong>{name}</strong><p>{detail}</p></aside>
        <nav><Link to="/old-forest-trek">Carry the reading into the forest</Link><Link to="/cabin-of-moss">Return to the Cabin of Moss</Link><Link to="/">Return to the Portal</Link></nav>
      </section>
      <p className="lanternroot-mark" aria-hidden="true">⌁</p>
    </main>
  )
}
