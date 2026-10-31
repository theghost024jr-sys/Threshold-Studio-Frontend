import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import ethosField from '../assets/ethos-field.png'

const principles = [
  'Unknown is not zero',
  'Observation is not structure',
  'Repeated observation is not persistent identity',
  'The system does not lie to itself',
]

export default function Ethos() {
  const pageRef = useRef(null)

  useEffect(() => {
    const page = pageRef.current
    if (!page) return undefined

    const updatePointer = (event) => {
      page.style.setProperty('--pointer-x', `${(event.clientX / window.innerWidth * 100).toFixed(1)}%`)
      page.style.setProperty('--pointer-y', `${(event.clientY / window.innerHeight * 100).toFixed(1)}%`)
    }

    window.addEventListener('pointermove', updatePointer, { passive: true })
    return () => window.removeEventListener('pointermove', updatePointer)
  }, [])

  return (
    <main className="ethos-page" ref={pageRef}>
      <img className="ethos-artwork" src={ethosField} alt="" aria-hidden="true" />
      <div className="ethos-field" aria-hidden="true">
        <span className="ethos-orbit ethos-orbit--one" />
        <span className="ethos-orbit ethos-orbit--two" />
        <span className="ethos-orbit ethos-orbit--three" />
        <span className="ethos-core" />
      </div>
      <section className="ethos-introduction">
        <p className="ethos-coordinate">Threshold Studio · Ethos</p>
        <h1>Behavior generates gravity</h1>
        <p className="ethos-lead">
          The behavioral physics of participation
        </p>
        <p className="ethos-invitation">Scroll slowly</p>
      </section>

      <section className="ethos-principles" aria-label="Ethos principles">
        {principles.map((principle, index) => (
          <article className="ethos-principle" key={principle}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{principle}</p>
            <i aria-hidden="true" />
          </article>
        ))}
      </section>

      <section className="ethos-force" aria-labelledby="ethos-alignment-title">
        <p>Fib 5 / Ethos force</p>
        <h2 id="ethos-alignment-title">Alignment</h2>
        <p>Measures whether a node&apos;s behavior matches the Flower it is orbiting.</p>
        <ul>
          <li>High alignment strengthens the anchor.</li>
          <li>Low alignment creates drift.</li>
          <li>Zero alignment triggers collapse.</li>
        </ul>
        <a href="/ethos.html?node=alignment&fib=5&trail=ethos">Open Alignment</a>
      </section>

      <section className="ethos-return">
        <div className="ethos-slit" aria-hidden="true" />
        <p>Whatever passes through the slit returns as pressure, drift, or anchor</p>
        <Link className="back-link" to="/">Portal home</Link>
      </section>
    </main>
  )
}
