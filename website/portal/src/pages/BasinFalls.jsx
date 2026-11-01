import { useState } from 'react'
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
  const current = relationship ? relationships[relationship] : null

  return (
    <main className={`basin-falls${relationship ? ` basin-falls--${relationship}` : ''}`}>
      <WorldThread active="basin" />
      <section className="basin-falls__scene" aria-label="Basin of the Falls waterworks">
        <div className="basin-falls__falls" aria-hidden="true"><i /><i /><i /></div>
        <div className="basin-falls__aqueduct" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="basin-falls__wheel" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="basin-falls__pond" aria-hidden="true" />
        <div className="basin-falls__stairs" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="basin-falls__cabin-light" aria-hidden="true" />
      </section>

      <section className="basin-falls__reading">
        <p>Basin of the Falls / lower works</p>
        <h1>The system is already working.</h1>
        <p>The Warden is occupied with the falls, collected water, aqueduct, wheel, and outflow. There is no question waiting for an answer.</p>
        <blockquote>The water has not always run this way.</blockquote>
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
