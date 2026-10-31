import { Link } from 'react-router-dom'

const categories = [
  ['Directional', 'Flow, intention, and movement. Used in signal mapping and drift diagrams.', 'motion'],
  ['Containment', 'Boundaries, memory, and holding structures. Used in seals and environmental physics.', 'hold'],
  ['Resonance', 'Emotional density, pressure states, and identity curvature.', 'resonance'],
  ['Fracture', 'Instability, drift, and collapse adjacency. Used for early detection.', 'fracture'],
  ['Recursive', 'Loops, spirals, and layered awareness. Used in shimmer, witness, and identity geometry.', 'recursive']
]

export default function GlyphArchive() {
  return <main className="glyph-archive">
    <header>
      <p>Threshold visual language</p>
      <h1>Glyphs are compressed meaning.</h1>
      <p>They are resonance vectors: minimal geometry carrying pressure, intention, structural tension, and signal fragments.</p>
    </header>
    <section className="glyph-category-grid" aria-label="Glyph categories">
      {categories.map(([name, body, className]) => <article className={`glyph-category glyph-${className}`} key={name}>
        <span aria-hidden="true"><i /><i /><i /></span>
        <h2>{name}</h2><p>{body}</p>
        {name === 'Recursive'
          ? <Link to="/glyphs/hourglass">Open the Hourglass Glyph</Link>
          : <p className="glyph-awaiting">Live glyph records are gathering.</p>}
      </article>)}
    </section>
    <nav><Link to="/motion">Return to Motion</Link><Link to="/drift-systems">Read Drift Systems</Link><Link to="/">Return to the Portal</Link></nav>
  </main>
}
