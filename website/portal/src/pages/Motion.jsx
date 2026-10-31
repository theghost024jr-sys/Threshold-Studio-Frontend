import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import beachImage from '../assets/abeach.png'
import cabinImage from '../assets/cabin.png'
import oceanImage from '../assets/universebeach.png'
import raftImage from '../assets/raft.png'
import { getReturnState, recordReturnState } from '../returnState.js'

const fields = [
  {
    name: 'Mountain',
    verb: 'holds',
    body: 'Resistance reveals structure. Mountain motion is slow, grounding, clarifying, and weight-bearing.',
    destination: '/beach',
    link: 'Return to the shore',
    className: 'motion-mountain'
  },
  {
    name: 'Ocean',
    verb: 'carries',
    body: 'Currents follow intention rather than geography. Ocean motion is drifting, deepening, dissolving, and recursive.',
    destination: '/ocean',
    link: 'Enter the Ocean',
    className: 'motion-ocean'
  },
  {
    name: 'Raft',
    verb: 'mirrors',
    body: 'The raft becomes the visible shape of internal momentum: directional, drifting, fragile, or firm.',
    destination: '/beach',
    link: 'Meet the raft',
    className: 'motion-raft'
  },
  {
    name: 'Cabin',
    verb: 'absorbs',
    body: 'Cabin motion settles, remembers, pauses, and integrates. Stillness changes the person who stays.',
    destination: '/shimmer',
    link: 'Settle at the cabin',
    className: 'motion-cabin'
  },
  {
    name: 'Hub',
    verb: 'recalibrates',
    body: 'Returning is not retreat. The Hub closes a loop, realigns the internal compass, and prepares the next one.',
    destination: '/',
    link: 'Return to the Portal',
    className: 'motion-hub'
  },
  {
    name: 'Velin',
    verb: 'diagnoses',
    body: 'The ruins make pressure, drift, fracture, and residue readable without pretending collapse is resolved.',
    destination: '/ruins',
    link: 'Read the ruins',
    className: 'motion-velin'
  },
  {
    name: 'Quiet Grove',
    verb: 're-coheres',
    body: 'Quiet-Weight recovery absorbs pressure spikes and fracture, while Motion remains necessary to prevent quiet from becoming a lock.',
    destination: '/quiet-grove',
    link: 'Enter the Quiet Grove',
    className: 'motion-quiet-grove'
  },
  {
    name: 'Spiral Grove',
    verb: 'loops',
    body: 'Patterned distortion pulls drift inward. It is the gateway between distortion and spiral collapse, with Quiet Grove as its rare stabilizing exit.',
    destination: '/spiral-grove',
    link: 'Enter the Spiral Grove',
    className: 'motion-spiral-grove'
  },
  {
    name: 'Doug',
    verb: 'stabilizes',
    body: 'Doug handles the quiet fix: absorbing friction, patching drift leaks, closing loops, and helping the system move without jamming.',
    destination: '/doug',
    link: 'Visit Doug’s desk',
    className: 'motion-doug'
  },
  {
    name: 'Rava',
    verb: 'reshapes',
    body: 'Threshold’s Drift Layer formed a pressure gradient that matched Rava’s identity signature. He follows it into the world, where weight becomes terrain, caves, ridges, and altered water paths.',
    destination: '/rava',
    link: 'Enter Rava’s caldera',
    className: 'motion-rava'
  },
  {
    name: 'Old Forest',
    verb: 'redirects',
    body: 'Roots shift subtly underfoot in response to emotional weight, while the Whisper borrows branches to offer fragments only to an unguarded listener. The forest redirects rather than walks.',
    destination: '/cabin-of-moss',
    link: 'Find the fixed porch',
    className: 'motion-old-forest'
  },
  {
    name: 'Forest Stairs',
    verb: 'relocate',
    body: 'These are not the anchored Stone-Layer stairs. Forest Stairs are drift-responsive structures: they appear in compatible environments when pressure spikes, resonance aligns, collapse probability dips, and memory reaches a tipping point.',
    destination: '/old-forest-trek',
    link: 'Take the shifting stairs',
    className: 'motion-forest-stairs',
    availableWhen: (state) => Boolean(state && (
      state.origin === 'Collapse Chamber' ||
      state.origin === 'Hourglass Glyph' ||
      state.origin === 'Rava' ||
      state.origin === 'Ruins of Velin' ||
      /pressure|collapse|memory|fracture/i.test(`${state.value} ${state.detail}`)
    ))
  },
  {
    name: 'Snail Band Clearing',
    verb: 'synchronizes',
    body: 'The Snail gives orientation while the Beetle keeps time. Their band communicates with the Old Forest, stabilizes heavy resonance, and wakes pathways that already exist.',
    destination: '/snail-band-clearing',
    link: 'Enter the clearing',
    className: 'motion-snail-band'
  }
]

export default function Motion() {
  const [activeField, setActiveField] = useState(0)
  const [returnState] = useState(getReturnState)
  const pageRef = useRef(null)
  const panelRefs = useRef([])

  useEffect(() => {
    const updateProgress = () => {
      const page = pageRef.current
      if (!page) return

      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, page.offsetHeight - window.innerHeight)))
      page.style.setProperty('--motion-progress', progress.toFixed(3))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]
        if (mostVisible) {
          const index = Number(mostVisible.target.dataset.fieldIndex)
          setActiveField(index)
          const field = fields[index]
          recordReturnState('Motion', `${field.name} ${field.verb}`, field.body)
        }
      },
      { threshold: [0.35, 0.55, 0.75] }
    )

    panelRefs.current.forEach((panel) => {
      if (panel) observer.observe(panel)
    })
    return () => observer.disconnect()
  }, [])

  function leanField(event) {
    const panel = event.currentTarget
    const bounds = panel.getBoundingClientRect()
    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 22
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 16
    panel.style.setProperty('--motion-x', `${horizontal.toFixed(1)}px`)
    panel.style.setProperty('--motion-y', `${vertical.toFixed(1)}px`)
  }

  function resetLean(event) {
    event.currentTarget.style.setProperty('--motion-x', '0px')
    event.currentTarget.style.setProperty('--motion-y', '0px')
  }

  return (
    <main className="motion-page" ref={pageRef}>
      <header className="motion-intro">
        <p>Threshold motion field</p>
        <h1>The world moves with you.</h1>
        <p>Motion is not speed or progress. It is the negotiation between your vector, the medium around you, and the world’s yield.</p>
        <span aria-hidden="true">Scroll through the field</span>
      </header>

      {fields.map((field, index) => (
        <section
          className={`motion-panel ${field.className}${activeField === index ? ' is-active' : ''}`}
          key={field.name}
          data-field-index={index}
          ref={(element) => { panelRefs.current[index] = element }}
          onMouseEnter={() => setActiveField(index)}
          onPointerLeave={resetLean}
          onPointerMove={leanField}
        >
          {field.name === 'Mountain' && <img src={beachImage} alt="" aria-hidden="true" />}
          {field.name === 'Ocean' && <img src={oceanImage} alt="" aria-hidden="true" />}
          {field.name === 'Raft' && <img className="motion-raft-image" src={raftImage} alt="" aria-hidden="true" />}
          {field.name === 'Cabin' && <img src={cabinImage} alt="" aria-hidden="true" />}
          {field.name === 'Hub' && <div className="motion-hub-rings" aria-hidden="true"><i /><i /><i /></div>}
          <div className="motion-panel-veil" aria-hidden="true" />
          <div className="motion-panel-copy">
            <p>{String(index + 1).padStart(2, '0')} · motion field</p>
            <h2>{field.name} <em>{field.verb}</em></h2>
            <p>{field.body}</p>
            {field.availableWhen && !field.availableWhen(returnState)
              ? <span className="motion-locked-route">The stairs have not formed. Carry a pressure, fracture, collapse, or memory trace into Motion.</span>
              : field.destination.startsWith('/') && field.destination.endsWith('.html')
              ? <a href={field.destination}>{field.link}</a>
              : <Link to={field.destination}>{field.link}</Link>}
          </div>
        </section>
      ))}

      <footer className="motion-outro">
        <p>The player leans. The world shifts. The player feels the shift. Both move again.</p>
        <Link to="/first-door">Return to the First Door</Link>
        <Link to="/">Return to the Portal</Link>
      </footer>
    </main>
  )
}
