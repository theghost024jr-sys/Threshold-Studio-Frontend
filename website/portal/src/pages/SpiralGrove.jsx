import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { recordReturnState } from '../returnState.js'

const readings = {
  arc: {
    label: 'Oscillating Curvature',
    title: 'The grove repeats what is about to happen.',
    body: 'Drift curves inward along the spiral geometry. It speeds and slows in pulses, leaving a faint after-image that loops every few seconds.'
  },
  whisper: {
    label: 'Spiral Whisper',
    title: 'The whisper tightens curvature.',
    body: 'Spiral Whisper is collapse-adjacent. Repeated exposure can synchronize an identity with the grove’s rhythm and draw its edges inward.'
  },
  echo: {
    label: 'Spiral Echo',
    title: 'The echo returns on a pattern.',
    body: 'Signals loop. Phantom signals arrive at predictable intervals. The environment is entrancing, not hostile—but the loop can become a trap.'
  },
  crows: {
    label: 'Loop-Crows',
    title: 'The birds keep the pattern moving.',
    body: 'Loop-Crows mimic rhythmic distortion, holding to looped patrol paths and echo-pattern communication as the grove pulls inward.'
  }
}

export default function SpiralGrove() {
  const [reading, setReading] = useState('arc')
  const [soundPlaying, setSoundPlaying] = useState(false)
  const soundRef = useRef(null)
  const current = readings[reading]

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

  function read(nextReading) {
    setReading(nextReading)
    recordReturnState('Spiral Grove', readings[nextReading].label, readings[nextReading].body)
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
    const filter = context.createBiquadFilter()
    const call = context.createOscillator()
    const echo = context.createOscillator()
    const rhythm = context.createOscillator()
    const rhythmGain = context.createGain()
    const noise = context.createBufferSource()
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)

    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = Math.random() * 2 - 1
    }

    master.gain.value = 0.045
    filter.type = 'bandpass'
    filter.frequency.value = 680
    filter.Q.value = 0.55
    call.type = 'triangle'
    call.frequency.value = 116
    echo.type = 'sine'
    echo.frequency.value = 119
    echo.detune.value = 17
    rhythm.type = 'sine'
    rhythm.frequency.value = 0.17
    rhythmGain.gain.value = 30
    noise.buffer = noiseBuffer
    noise.loop = true

    rhythm.connect(rhythmGain)
    rhythmGain.connect(call.frequency)
    rhythmGain.connect(echo.frequency)
    noise.connect(filter)
    filter.connect(master)
    call.connect(master)
    echo.connect(master)
    master.connect(context.destination)

    noise.start()
    call.start()
    echo.start()
    rhythm.start()
    soundRef.current = { context, sources: [noise, call, echo, rhythm] }
    setSoundPlaying(true)
  }

  return (
    <main className={`spiral-grove spiral-grove--${reading}`}>
      <div className="spiral-sky" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
      <div className="spiral-forest" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="spiral-rings" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="loop-crows" aria-hidden="true"><i /><i /><i /></div>

      <section className="spiral-copy" aria-labelledby="spiral-title">
        <p>{current.label} · pre-collapse geometry</p>
        <h1 id="spiral-title">{current.title}</h1>
        <p>{current.body}</p>

        <div className="spiral-readings" aria-label="Spiral Grove signal readings">
          <button type="button" className={reading === 'arc' ? 'is-active' : ''} onClick={() => read('arc')}>Read the arc</button>
          <button type="button" className={reading === 'whisper' ? 'is-active' : ''} onClick={() => read('whisper')}>Hear Spiral Whisper</button>
          <button type="button" className={reading === 'echo' ? 'is-active' : ''} onClick={() => read('echo')}>Track Spiral Echo</button>
          <button type="button" className={reading === 'crows' ? 'is-active' : ''} onClick={() => read('crows')}>Follow Loop-Crows</button>
        </div>
        <button type="button" className="spiral-sound" onClick={toggleSound} aria-pressed={soundPlaying}>
          {soundPlaying ? 'Quiet the pattern' : 'Listen to the pattern'}
        </button>

        <p className="spiral-caution">Identity is not meant to re-cohere here. Spiral collapse is born in this environment; the rare stabilizing exit is Quiet Grove.</p>
        <nav>
          <Link to="/quiet-grove">Find the Quiet Grove</Link>
          <Link to="/">Return to the Portal</Link>
          <Link to="/motion">Enter the Motion Field</Link>
        </nav>
      </section>
    </main>
  )
}
