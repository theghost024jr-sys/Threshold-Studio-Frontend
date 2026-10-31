import { useState } from 'react'
import { Link } from 'react-router-dom'
import cabin from '../assets/cabin-of-moss.png'
import { recordReturnState } from '../returnState.js'

const layers = [
  ['Sound', 'Each possible path carries a distinct signature: rustle, distant call, or shifting leaves.'],
  ['Light', 'The porch torches draw only the beginnings of trails.'],
  ['Movement', 'Small creatures move along paths before the traveler chooses one.'],
  ['Feeling', 'The path reveals its emotional tone: curiosity, danger, nostalgia, challenge, or peace.']
]

export default function CabinOfMoss() {
  const [layer, setLayer] = useState(0)
  const [name, detail] = layers[layer]
  function reveal(index) {
    setLayer(index)
    recordReturnState('Cabin of Moss', name, detail)
  }
  return <main className="moss-cabin">
    <section className="moss-copy">
      <p>Fixed point · living cabin</p><h1>The world is ready when you are.</h1>
      <p>The cabin does not create paths. Its moss reveals their timing honestly, from a porch where the biome stops rearranging itself around your speed.</p>
      <div className="moss-layers">{layers.map(([label], index) => <button type="button" className={index === layer ? 'is-active' : ''} onClick={() => reveal(index)} key={label}>{label}</button>)}</div>
      <aside><strong>{name}</strong><p>{detail}</p></aside>
      <nav><Link to="/snail-band-clearing">Hear the band</Link><Link to="/lanternroot-conservatory">Read the held light</Link><Link to="/old-forest-trek">Take the trek</Link><Link to="/">Return to the Portal</Link></nav>
    </section>
    <figure><img src={cabin} alt="The Cabin of Moss, a stable porch in the forest" /><figcaption>Timing over speed. Intention over momentum.</figcaption></figure>
  </main>
}
