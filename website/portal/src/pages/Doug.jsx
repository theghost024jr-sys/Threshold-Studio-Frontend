import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import dougImage from '../assets/doug.png'
import marigoldImage from '../assets/dougs-marigold.png'
import { recordReturnState } from '../returnState.js'

const deskWork = {
  welcome: {
    label: 'The quiet stabilizer',
    title: 'Doug has the form you need.',
    body: 'Doug is the bureaucratic particle that keeps the system from jamming. He absorbs friction, patches drift leaks, closes loops, and prevents collapse through unnoticed competence.'
  },
  triangle: {
    label: 'Geometric irregularity',
    title: 'The triangle has been reviewed.',
    body: 'Doug monitors triangles, reshapes them when needed, files the related forms, and makes sure the geometry does not become somebody else’s problem.'
  },
  help: {
    label: 'Desk support',
    title: '“Let’s figure it out.”',
    body: 'Doug listens to confused questions, finds the form that is actually needed, and translates system nonsense into a human next step.'
  },
  marigold: {
    label: 'Marigold — Ongoing',
    title: 'The flower is doing its job.',
    body: 'Doug waters the marigold before work. It is sturdy, quietly bright, and growing because someone cared for it every morning.'
  }
}

export default function Doug() {
  const [work, setWork] = useState('welcome')
  const [soundPlaying, setSoundPlaying] = useState(false)
  const soundRef = useRef(null)
  const current = deskWork[work]

  useEffect(() => () => {
    stopSound()
  }, [])

  function stopSound() {
    const sound = soundRef.current
    if (!sound) return

    sound.sources.forEach((source) => source.stop())
    sound.context.close()
    soundRef.current = null
    setSoundPlaying(false)
  }

  function chooseWork(nextWork) {
    setWork(nextWork)
    recordReturnState('Doug', deskWork[nextWork].label, deskWork[nextWork].body)
  }

  function toggleSound() {
    if (soundRef.current) {
      stopSound()
      return
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const context = new AudioContext()
    const master = context.createGain()
    const hum = context.createOscillator()
    const secondHum = context.createOscillator()
    const pulse = context.createOscillator()
    const pulseGain = context.createGain()

    master.gain.value = 0.035
    hum.type = 'sine'
    hum.frequency.value = 57
    secondHum.type = 'triangle'
    secondHum.frequency.value = 173
    secondHum.detune.value = -8
    pulse.type = 'sine'
    pulse.frequency.value = 0.1
    pulseGain.gain.value = 6

    pulse.connect(pulseGain)
    pulseGain.connect(secondHum.frequency)
    hum.connect(master)
    secondHum.connect(master)
    master.connect(context.destination)

    hum.start()
    secondHum.start()
    pulse.start()
    soundRef.current = { context, sources: [hum, secondHum, pulse] }
    setSoundPlaying(true)
  }

  return (
    <main className={`doug-page doug-work--${work}`}>
      <div className="doug-grid" aria-hidden="true" />
      <div className="doug-triangle-field" aria-hidden="true"><i /><i /><i /></div>
      <figure className="doug-portrait-frame">
        <img className="doug-portrait" src={dougImage} alt="Doug, the quiet stabilizer" />
        <figcaption>Doug · Municipal Shape Safety Technician</figcaption>
      </figure>
      <img className="doug-marigold" src={marigoldImage} alt="Doug's marigold" />

      <section className="doug-copy" aria-labelledby="doug-title">
        <p>{current.label} · desk open</p>
        <h1 id="doug-title">{current.title}</h1>
        <p>{current.body}</p>
        <div className="doug-actions" aria-label="Doug's desk">
          <button type="button" className={work === 'triangle' ? 'is-active' : ''} onClick={() => chooseWork('triangle')}>File a triangle report</button>
          <button type="button" className={work === 'help' ? 'is-active' : ''} onClick={() => chooseWork('help')}>Ask Doug for help</button>
          <button type="button" className={work === 'marigold' ? 'is-active' : ''} onClick={() => chooseWork('marigold')}>Check the marigold</button>
        </div>
        <button type="button" className="doug-sound" onClick={toggleSound} aria-pressed={soundPlaying}>
          {soundPlaying ? 'Quiet the office hum' : 'Listen to the office hum'}
        </button>
        <p className="doug-note">Doug does not need recognition. The system needs him because someone has to make the quiet fix before it becomes a problem.</p>
        <nav>
          <Link to="/">Return to the Portal</Link>
          <Link to="/motion">Follow the cleared vector</Link>
          <Link to="/quiet-grove">Find a quiet stabilizer</Link>
        </nav>
      </section>
    </main>
  )
}
