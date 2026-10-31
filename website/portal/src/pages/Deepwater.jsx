import { useState } from 'react'
import { Link } from 'react-router-dom'
import depthImage from '../assets/ocean-depth.png'
import fractalImage from '../assets/ocean-fractal.png'
import bubbleImage from '../assets/ocean-bubble.png'
import { recordReturnState } from '../returnState.js'

const forms = [
  {
    name: 'Lumenback',
    role: 'Long-range resonance',
    reading: 'Slow luminescent plates carry a message through density. Surface light makes the signal thin.'
  },
  {
    name: 'Shellgrave',
    role: 'Environmental anchoring',
    reading: 'Layered pressure plates absorb the field like stone. A sudden pressure drop makes the form brittle.'
  },
  {
    name: 'Driftfin',
    role: 'Microcurrent reading',
    reading: 'Ribbon fins read the smallest currents before they become motion. Still water disorients the form.'
  },
  {
    name: 'Abyssal Echo',
    role: 'Emotional mapping',
    reading: 'A low internal hum holds resonance gathered from the environment. Contradictory pressure risks echo-collapse.'
  }
]

export default function Deepwater() {
  const [activeForm, setActiveForm] = useState(0)
  const form = forms[activeForm]

  function selectForm(index) {
    setActiveForm(index)
    const nextForm = forms[index]
    recordReturnState('Deepwater', nextForm.name, nextForm.reading)
  }

  return (
    <main className="deepwater-page">
      <img className="deepwater-image deepwater-image-base" src={depthImage} alt="An authored Ocean depth form" />
      <img className="deepwater-image deepwater-image-fractal" src={fractalImage} alt="" aria-hidden="true" />
      <img className="deepwater-image deepwater-image-bubble" src={bubbleImage} alt="" aria-hidden="true" />
      <div className="deepwater-veil" aria-hidden="true" />
      <section className="deepwater-copy" aria-labelledby="deepwater-title">
        <p>Subsurface / abyssal · pressure resonance</p>
        <h1 id="deepwater-title">The deep remembers in weight.</h1>
        <p>Here, memory is stored in pressure gradients. Perception travels slowly through density, vibration, pulse, and internal luminescence.</p>

        <section className="deepwater-reading" aria-labelledby="form-title">
          <p>Pressure form</p>
          <h2 id="form-title">{form.name}</h2>
          <strong>{form.role}</strong>
          <p aria-live="polite">{form.reading}</p>
          <div className="deepwater-forms" aria-label="Deepwater pressure forms">
            {forms.map((option, index) => (
              <button
                type="button"
                className={index === activeForm ? 'is-active' : ''}
                key={option.name}
                onClick={() => selectForm(index)}
                aria-pressed={index === activeForm}
              >
                {option.name}
              </button>
            ))}
          </div>
        </section>

        <p className="deepwater-note">These are not surface creatures. They emerge where pressure, silence, dense memory, and long-form resonance meet.</p>
        <nav>
          <Link to="/">Return to the Portal</Link>
          <Link to="/ocean">Return to the Ocean surface</Link>
          <Link to="/first-door">Follow the recognition seam</Link>
        </nav>
      </section>
    </main>
  )
}
