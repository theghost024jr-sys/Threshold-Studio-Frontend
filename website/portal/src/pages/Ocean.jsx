import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import oceanImage from '../assets/universebeach.png'
import raftImage from '../assets/raft.png'
import tideShellMoon from '../assets/tideshellmoon.png'
import { recordReturnState } from '../returnState.js'

const layers = {
  above: {
    label: 'Above · Raft zone',
    title: 'The raft is avoidance made buoyant.',
    body: 'You float on unresolved stories. The surface holds reflections of versions of you and echoes of choices you did not make.',
    reading: 'The current follows intention. Hesitation makes it hesitate.'
  },
  below: {
    label: 'Below · Depth zone',
    title: 'Depth is clarity with pressure attached.',
    body: 'Below, narrative falls away. The ocean measures what you carry, what you avoid, and what you are ready to face.',
    reading: 'Pressure rises with unresolved truth, not distance from the surface.'
  }
}

const motionReadings = [
  'The horizon breathes. There is no fixed line between sea and sky.',
  'The current bends toward intention, not geography.',
  'Pressure gathers around what remains unresolved. The water holds it without a story.'
]

export default function Ocean() {
  const [layer, setLayer] = useState('above')
  const [mirageRevealed, setMirageRevealed] = useState(false)
  const [soundPlaying, setSoundPlaying] = useState(false)
  const [motionPhase, setMotionPhase] = useState(0)
  const pageRef = useRef(null)
  const soundRef = useRef(null)
  const currentLayer = layers[layer]

  useEffect(() => {
    const updateMotion = () => {
      const page = pageRef.current
      if (!page) return

      const bounds = page.getBoundingClientRect()
      const travel = Math.max(1, page.offsetHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -bounds.top / travel))
      page.style.setProperty('--ocean-shift', `${Math.round(progress * -72)}px`)
      page.style.setProperty('--ocean-veil-strength', (0.18 + progress * 0.36).toFixed(2))
      setMotionPhase(Math.min(motionReadings.length - 1, Math.floor(progress * motionReadings.length)))
    }

    updateMotion()
    window.addEventListener('scroll', updateMotion, { passive: true })
    window.addEventListener('resize', updateMotion)
    return () => {
      window.removeEventListener('scroll', updateMotion)
      window.removeEventListener('resize', updateMotion)
    }
  }, [])

  useEffect(() => () => {
    const sound = soundRef.current
    if (!sound) return

    sound.sources.forEach((source) => source.stop())
    sound.context.close()
  }, [])

  function stopSound() {
    const sound = soundRef.current
    if (!sound) return

    sound.sources.forEach((source) => source.stop())
    sound.context.close()
    soundRef.current = null
    setSoundPlaying(false)
  }

  function chooseLayer(nextLayer) {
    setLayer(nextLayer)
    recordReturnState('Ocean', nextLayer === 'above' ? 'surface memory' : 'pressure truth', layers[nextLayer].reading)
  }

  function toggleMirage() {
    const nextState = !mirageRevealed
    setMirageRevealed(nextState)
    recordReturnState('Mirage', nextState ? 'integrity tested' : 'shimmer settled', nextState
      ? 'The Mirage dissolved false stance rather than identity.'
      : 'The reflected waves have settled.')
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
    const current = context.createBiquadFilter()
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)
    const depth = context.createOscillator()
    const shell = context.createOscillator()
    const pulse = context.createOscillator()
    const pulseRange = context.createGain()
    const noise = context.createBufferSource()

    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1
    }

    master.gain.value = 0.045
    current.type = 'lowpass'
    current.frequency.value = 620
    current.Q.value = 0.45
    depth.type = 'sine'
    depth.frequency.value = 43
    shell.type = 'triangle'
    shell.frequency.value = 174
    shell.detune.value = -9
    pulse.type = 'sine'
    pulse.frequency.value = 0.07
    pulseRange.gain.value = 13
    noise.buffer = noiseBuffer
    noise.loop = true

    pulse.connect(pulseRange)
    pulseRange.connect(shell.frequency)
    noise.connect(current)
    current.connect(master)
    depth.connect(master)
    shell.connect(master)
    master.connect(context.destination)

    noise.start()
    depth.start()
    shell.start()
    pulse.start()
    soundRef.current = { context, sources: [noise, depth, shell, pulse] }
    setSoundPlaying(true)
  }

  return (
    <main className={`ocean-page ocean-layer-${layer}${mirageRevealed ? ' ocean-mirage-revealed' : ''}`} ref={pageRef}>
      <img className="ocean-image" src={oceanImage} alt="The Ocean Beyond the Mountains" />
      <div className="ocean-veil" aria-hidden="true" />
      <div className="ocean-veins" aria-hidden="true"><i /><i /><i /></div>
      <img className="ocean-tide-shell" src={tideShellMoon} alt="Tide Shell Moon signal" />
      <img className="ocean-raft" src={raftImage} alt="" aria-hidden={layer !== 'above'} />
      <section className="ocean-copy" aria-labelledby="ocean-title">
        <p>{currentLayer.label} · depth intelligence</p>
        <h1 id="ocean-title">{currentLayer.title}</h1>
        <p>{currentLayer.body}</p>
        <p className="ocean-motion-reading" aria-live="polite">{motionReadings[motionPhase]}</p>
        <div className="ocean-layer-switch" aria-label="Ocean layers">
          <button type="button" className={layer === 'above' ? 'is-active' : ''} onClick={() => chooseLayer('above')}>Remain above</button>
          <button type="button" className={layer === 'below' ? 'is-active' : ''} onClick={() => chooseLayer('below')}>Go below</button>
        </div>
        <p className="ocean-reading" aria-live="polite">{currentLayer.reading}</p>
        <button type="button" className="ocean-sound" onClick={toggleSound} aria-pressed={soundPlaying}>
          {soundPlaying ? 'Quiet the pressure' : 'Listen to the pressure'}
        </button>
        <div className="ocean-mirage">
          <span>Ember / Echo</span>
          <p>{mirageRevealed
            ? 'The reflection sharpens. The Mirage dissolves indecision and false stance, not identity, form, or memory.'
            : 'A heat shimmer crosses the reflected waves.'}</p>
          <button type="button" onClick={toggleMirage}>
            {mirageRevealed ? 'Let the shimmer settle' : 'Test the shimmer'}
          </button>
        </div>
        <nav>
          <Link to="/">Return to the Portal</Link>
          <Link to="/deepwater">Enter the pressure field</Link>
          <Link to="/first-door">Follow the recognition seam</Link>
          <Link to="/beach">Return to the shore</Link>
          <Link to="/">Return to Threshold</Link>
        </nav>
      </section>
      <p className="ocean-scroll-cue" aria-hidden="true">Scroll into the pressure</p>
    </main>
  )
}
