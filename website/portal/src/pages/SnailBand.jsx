import { useState } from 'react'
import { Link } from 'react-router-dom'
import beetleArt from '../assets/beetle-percussion.png'
import { recordReturnState } from '../returnState.js'

const instruments = [
  ['Bark slabs', 'Low woody tones settle heavy resonance.'],
  ['Rhythm log', 'A pulse like distant thunder wakes an old pathway.'],
  ['Leaf cymbals', 'The forest breath enters the measure.'],
  ['Stone chimes', 'Presence density peaks; the clearing answers.']
]

export default function SnailBand() {
  const [beat, setBeat] = useState(0)
  const [name, detail] = instruments[beat]
  function play(index) {
    setBeat(index)
    recordReturnState('Snail Band Clearing', name, `${instruments[index][1]} The traveler syncs to the Old Forest hum.`)
  }
  return <main className="snail-band">
    <div className="band-canopy" aria-hidden="true" />
    <section className="band-copy">
      <p>Old Forest · Snail’s Domain</p>
      <h1>The band is how the forest speaks.</h1>
      <p>The Snail gives orientation. The Beetle keeps time. Here Absence rests instead of collapsing the traveler.</p>
      <div className="band-instruments">{instruments.map(([label], index) => <button className={index === beat ? 'is-active' : ''} type="button" onClick={() => play(index)} key={label}>{label}</button>)}</div>
      <aside><strong>{name}</strong><p>{detail}</p></aside>
      <p className="band-note">The Beetle plays from the center outward and never repeats a pattern. It pauses for the Shadow-Cat; it resumes only when the traveler’s stance is true.</p>
      <nav><Link to="/motion">Follow an awakened pathway</Link><Link to="/quiet-grove">Enter the Quiet Grove</Link><Link to="/">Return to the Portal</Link></nav>
    </section>
    <figure className="band-beetle"><img src={beetleArt} alt="The Beetle playing percussion in its forest nest" /><figcaption>Alignment in motion.</figcaption></figure>
  </main>
}
