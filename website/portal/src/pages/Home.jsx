import { useState } from 'react'
import { Link } from 'react-router-dom'
import cabinImage from '../assets/cabin.png'
import ethosImage from '../assets/ethos-field.png'

const crossings = [
  {
    id: 'world',
    kind: 'First Warden / information',
    title: 'A place of respite',
    copy: 'The Cabin, aqueduct, and wheel are familiar before their making can be explained.',
    route: '/shimmer',
    action: 'Approach the Cabin',
    image: cabinImage
  },
  {
    id: 'field',
    kind: 'System reading',
    title: 'Ethos field',
    copy: 'A force can become readable before it becomes a rule or a destination.',
    route: '/ethos',
    action: 'Read Ethos',
    image: ethosImage
  },
  {
    id: 'work',
    kind: 'Working trace',
    title: 'Doug’s desk',
    copy: 'A problem can move into practical attention without being turned into a world event.',
    route: '/doug',
    action: 'Find Doug',
    image: null
  }
]

export default function Home() {
  const [activeId, setActiveId] = useState('world')
  const active = crossings.find((crossing) => crossing.id === activeId) || crossings[0]

  return (
    <main className="portal-slit">
      <header className="portal-slit-header">
        <p>Threshold / Portal</p>
        <span>Cross-reference surface</span>
      </header>

      <section className="portal-slit-stage" aria-labelledby="portal-title">
        <div className="portal-slit-atmosphere portal-slit-atmosphere--left" />
        <div className="portal-slit-atmosphere portal-slit-atmosphere--right" />
        <div className="portal-slit-orbit portal-slit-orbit--one" aria-hidden="true" />
        <div className="portal-slit-orbit portal-slit-orbit--two" aria-hidden="true" />

        <div className="portal-slit-intro">
          <p>Not the Hub</p>
          <h1 id="portal-title">A place for<br />passing through.</h1>
          <p>The Portal does not gather the world. It lets things become traversable across it.</p>
        </div>

        <div className="portal-slit-line" aria-hidden="true">
          <i />
          <span>slit</span>
          <i />
        </div>

        <article className="portal-slit-reading" aria-live="polite">
          {active.image && <img src={active.image} alt="" />}
          <div className="portal-slit-reading-veil" />
          <div className="portal-slit-reading-copy">
            <p>{active.kind}</p>
            <h2>{active.title}</h2>
            <span>{active.copy}</span>
            <Link to={active.route}>{active.action} <b>→</b></Link>
          </div>
        </article>
      </section>

      <nav className="portal-slit-crossings" aria-label="Portal crossings">
        {crossings.map((crossing, index) => (
          <button
            type="button"
            className={crossing.id === active.id ? 'is-active' : ''}
            key={crossing.id}
            onFocus={() => setActiveId(crossing.id)}
            onMouseEnter={() => setActiveId(crossing.id)}
            onClick={() => setActiveId(crossing.id)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{crossing.kind}</strong>
            <small>{crossing.title}</small>
          </button>
        ))}
        <a className="portal-slit-world-exit" href="/hub.html">
          <span>04</span>
          <strong>Canonical return</strong>
          <small>Threshold Hub →</small>
        </a>
      </nav>

      <footer className="portal-slit-footer">
        <span>World ↔ experiment</span>
        <span>evidence ↔ reading</span>
        <span>question ↔ next movement</span>
      </footer>
    </main>
  )
}