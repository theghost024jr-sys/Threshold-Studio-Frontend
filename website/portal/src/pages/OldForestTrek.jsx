import { useState } from 'react'
import { Link } from 'react-router-dom'
import WorldThread from '../components/WorldThread.jsx'
import { getVaultDocument, vaultNumberedSection, vaultSummary } from '../modules/vault.js'

const forestRecord = getVaultDocument('old-forest')
const forestSummary = vaultSummary(forestRecord)
const phenomena = vaultNumberedSection(forestRecord, 'Phenomena', 'Flora & Fauna')

export default function OldForestTrek() {
  const [active, setActive] = useState(0)
  const { name: title, detail } = phenomena[active]

  return (
    <main className="old-forest-trek">
      <div className="trek-sticky">
        <WorldThread active="forest" />
        <div className="trek-canopy" aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <div className="trek-dust" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <section className="trek-intro">
          <p>{forestRecord.title} / temporal biome</p>
          <h1>The forest is not overgrown.<br />It is overremembered.</h1>
          <p>{forestSummary}</p>
        </section>
        <aside className="trek-reading" aria-live="polite">
          <p>Readable phenomenon</p>
          <strong>{title}</strong>
          <span>{detail}</span>
        </aside>
        <div className="trek-phenomena" aria-label="Old Forest phenomena">
          {phenomena.map(({ number, name }, index) => (
            <button type="button" className={index === active ? 'is-active' : ''} key={name} onClick={() => setActive(index)}>
              <span>{number.padStart(2, '0')}</span>{name}
            </button>
          ))}
        </div>
        <nav>
          <Link to="/cabin-of-moss">Return to the porch</Link>
          <Link to="/basin">Look back through the Basin</Link>
          <Link to="/">Return to the Portal</Link>
        </nav>
      </div>
    </main>
  )
}
