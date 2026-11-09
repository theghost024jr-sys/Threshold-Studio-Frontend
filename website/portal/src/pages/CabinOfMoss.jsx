import { useState } from 'react'
import { Link } from 'react-router-dom'
import cabin from '../assets/cabin-of-moss.png'
import { recordReturnState } from '../returnState.js'
import WorldThread from '../components/WorldThread.jsx'

const layers = [
  ['Moss', 'Memory layer. Thick moss marks what has endured; bare wood does not claim a path is ready.'],
  ['Porch', 'Perception interface. From here, timing can become visible without the world forcing a choice.'],
  ['Torches', 'Attention layer. They illuminate only what is relevant, not every possible future.']
]

export default function CabinOfMoss() {
  const [layer, setLayer] = useState(0)
  const [name, detail] = layers[layer]
  function reveal(index) {
    const [nextName, nextDetail] = layers[index]
    setLayer(index)
    recordReturnState('Cabin of Moss', nextName, nextDetail)
  }

  function lookDown(event) {
    event.preventDefault()
    const overlook = document.getElementById('basin-lookdown')
    if (!overlook) {
      console.error('Cabin Basin overlook is unavailable.')
      return
    }

    window.history.pushState(null, '', '#basin-lookdown')
    overlook.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return <main className="moss-cabin">
    <section className="moss-cabin__porch">
      <WorldThread active="cabin" />
      <figure className="moss-cabin-image">
        <img src={cabin} alt="The Cabin of Moss, a stable porch in the forest" />
        <div className="moss-cabin-image__veil" />
        <figcaption>A place where timing can become legible.</figcaption>
      </figure>
      <section className="moss-copy">
        <p>Cabin of Moss / adaptive clarity</p><h1>What has waited can be seen.</h1>
        <p>The Cabin does not make paths or decide them. Its moss carries the residue of time; its porch holds a stable view while the forest stays itself.</p>
        <div className="moss-layers">{layers.map(([label], index) => <button type="button" className={index === layer ? 'is-active' : ''} onClick={() => reveal(index)} key={label}>{label}</button>)}</div>
        <aside className="moss-reading"><strong>{name}</strong><p>{detail}</p></aside>
        <nav><a href="#basin-lookdown" onClick={lookDown}>Look down toward the Basin</a><Link to="/old-forest-trek">Continue into the forest</Link><Link to="/">Return to the Portal</Link></nav>
      </section>
    </section>
    <section className="moss-overlook" id="basin-lookdown">
      <svg className="moss-overlook__section" viewBox="0 0 760 1180" aria-hidden="true">
        <path className="moss-overlook__ground" d="M92 48 C220 132 318 258 374 418 C442 613 538 772 682 1096" />
        <path className="moss-overlook__water" d="M136 76 C270 206 306 348 375 466 C458 610 526 781 618 1080" />
        <path className="moss-overlook__stairs" d="M212 198 l48 20 -20 36 50 20 -20 36 50 20 -20 36 50 20" />
        <circle className="moss-overlook__wheel" cx="468" cy="694" r="52" />
        <path className="moss-overlook__spokes" d="M416 694 H520 M468 642 V746 M431 657 l74 74 M505 657 l-74 74" />
        <ellipse className="moss-overlook__pond" cx="638" cy="1056" rx="100" ry="38" />
      </svg>
      <span className="moss-overlook__aqueduct-label">aqueduct</span>
      <div className="moss-overlook__copy">
        <p>Porch / downhill view</p>
        <h2>The Basin holds the lower works.</h2>
        <p>Below the Cabin, water gathers through the aqueduct and turns the wheel. The Warden collects water power here; the porch remains only a place to see the whole system.</p>
        <dl>
          <div><dt>01</dt><dd>Porch and recovered stairs</dd></div>
          <div><dt>02</dt><dd>Aqueduct and wheel</dd></div>
          <div><dt>03</dt><dd>Pond at Basin floor</dd></div>
        </dl>
        <Link to="/basin">Descend to the Basin</Link>
      </div>
    </section>
  </main>
}
