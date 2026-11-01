import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import WorldThread from '../components/WorldThread.jsx'

const relationships = {
  take: {
    label: 'Take',
    prompt: 'Draw from what the Basin provides.',
    response: 'Provision becomes clear: usable water and work leave the Basin while the wheel continues to turn.'
  },
  tend: {
    label: 'Tend',
    prompt: 'Clear the caught channel and return the guide stone.',
    response: 'Function becomes clear: channel, wheel, terrain, and outflow depend on one another.'
  },
  wait: {
    label: 'Wait',
    prompt: 'Remain beside the rhythm without taking from it.',
    response: 'The wheel, shadow, and reflection return in sequence. A Cabin window catches the same pulse above.'
  }
}

export default function BasinFalls() {
  const [relationship, setRelationship] = useState(null)
  const [waterworksNoticed, setWaterworksNoticed] = useState(false)
  const sceneRef = useRef(null)
  const current = relationship ? relationships[relationship] : null

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return undefined

    const updateTravel = () => {
      const bounds = scene.parentElement.getBoundingClientRect()
      const travelDistance = Math.max(1, bounds.height - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -bounds.top / travelDistance))
      scene.style.setProperty('--basin-progress', progress.toFixed(3))
    }

    updateTravel()
    window.addEventListener('scroll', updateTravel, { passive: true })
    window.addEventListener('resize', updateTravel)
    return () => {
      window.removeEventListener('scroll', updateTravel)
      window.removeEventListener('resize', updateTravel)
    }
  }, [])

  return (
    <main className={`basin-falls${relationship ? ` basin-falls--${relationship}` : ''}${waterworksNoticed ? ' basin-falls--waterworks-noticed' : ''}`}>
      <WorldThread active="basin" />
      <section className="basin-falls__scene" ref={sceneRef} aria-label="Basin of the Falls waterworks">
        <div className="basin-falls__falls" aria-hidden="true"><i /><i /><i /></div>
        <div className="basin-falls__aqueduct" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="basin-falls__wheel" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="basin-falls__pond" aria-hidden="true" />
        <div className="basin-falls__wet-stone" aria-hidden="true" />
        <div className="basin-falls__water-glint" aria-hidden="true" />
        <div className="basin-falls__warden" aria-hidden="true"><i /><i /></div>
        <button className="basin-falls__waterworks-cue" type="button" onClick={() => setWaterworksNoticed(true)} aria-pressed={waterworksNoticed}>
          <span>movement at the waterworks</span>
        </button>
        <div className="basin-falls__stairs" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <Link className="basin-falls__porch-route" to="/cabin-of-moss">
          <span>Recovered stairs</span>
          <small>Climb to the porch</small>
        </Link>
        <div className="basin-falls__forest-seam" aria-hidden="true" />
        <div className="basin-falls__cabin-light" aria-hidden="true" />
      </section>

      <section className="basin-falls__reading">
        <p>Basin of the Falls / lower works</p>
        <h1>The system is already working.</h1>
        <p>The Warden is occupied with the falls, collected water, aqueduct, wheel, and outflow. There is no question waiting for an answer.</p>
        <blockquote>The water has not always run this way.</blockquote>
        {waterworksNoticed && <p className="basin-falls__notice" aria-live="polite">The waterworks become easier to read. Nothing asks you to remain.</p>}
      </section>

      <section className="basin-falls__contact" aria-labelledby="basin-contact-title">
        <p>Contact with the system</p>
        <h2 id="basin-contact-title">Choose a relationship.</h2>
        <div>
          {Object.entries(relationships).map(([id, choice]) => (
            <button type="button" className={relationship === id ? 'is-active' : ''} onClick={() => setRelationship(id)} key={id}>
              <strong>{choice.label}</strong>
              <span>{choice.prompt}</span>
            </button>
          ))}
        </div>
        <p className="basin-falls__response" aria-live="polite">
          {current ? current.response : 'Take, Tend, and Wait are all legitimate ways to meet the same working place.'}
        </p>
      </section>

      <section className="basin-falls__ascent">
        <p>Return view</p>
        <h2>The stairs were here.</h2>
        <p>From halfway up, the wheel, aqueduct, pond, falls, and Cabin resolve into one continuous Basin. The Warden remains below, still at work.</p>
      </section>

      <nav className="basin-falls__nav">
        <Link to="/cabin-of-moss">Climb to the porch</Link>
        <Link to="/old-forest-trek">Continue into the Old Forest</Link>
        <Link to="/basin">Return to the Basin view</Link>
      </nav>
    </main>
  )
}
