import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './PlasmaBloomMeadow.css'

const FLOWER_COUNT = 34
const BUTTERFLY_COUNT = 5
const REACH = 0.28
const AGREE_HUE = 28
const BLOOM_INSTRUMENTS = ['bell', 'glass', 'chorus', 'rain']

const wrapHue = (hue) => ((hue % 360) + 360) % 360

function buildFlowers() {
  return Array.from({ length: FLOWER_COUNT }, (_, index) => ({
    x: 0.06 + ((index * 0.6180339) % 1) * 0.88,
    y: 0.42 + ((index * 0.4142135) % 1) * 0.5,
    offset: (index * 47) % 360,
    phase: index * 1.7,
    size: 0.7 + ((index * 13) % 10) / 14,
    flare: 0,
    instrument: BLOOM_INSTRUMENTS[index % BLOOM_INSTRUMENTS.length],
  }))
}

function buildButterflies() {
  return Array.from({ length: BUTTERFLY_COUNT }, (_, index) => ({
    x: Math.random(),
    y: 0.2 + Math.random() * 0.5,
    angle: Math.random() * Math.PI * 2,
    hue: index * 70,
    target: -1,
  }))
}

export default function PlasmaBloomMeadow() {
  const canvasRef = useRef(null)
  const soundRef = useRef(null)
  const [vergeOpen, setVergeOpen] = useState(false)
  const [frogHere, setFrogHere] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const flowers = buildFlowers()
    const butterflies = buildButterflies()
    const pointer = { x: -1, y: -1, px: -1, py: -1, speed: 0, linger: 0, active: false }
    const playedSequence = []
    let activeInstrument = null
    let activeReveal = null
    let hue = 190
    let width = 0
    let height = 0
    let frame = 0
    let last = performance.now()

    const startSound = () => {
      if (soundRef.current) {
        soundRef.current.context.resume()
        return
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      const context = new AudioContext()
      const output = context.createGain()
      const root = context.createOscillator()
      const shimmer = context.createOscillator()
      const rootGain = context.createGain()
      const shimmerGain = context.createGain()

      output.gain.value = 0.0001
      root.type = 'sine'
      root.frequency.value = 88
      shimmer.type = 'triangle'
      shimmer.frequency.value = 220
      rootGain.gain.value = 0
      shimmerGain.gain.value = 0
      root.connect(rootGain).connect(output)
      shimmer.connect(shimmerGain).connect(output)
      output.connect(context.destination)
      root.start()
      shimmer.start()
      context.resume()
      soundRef.current = { context, output, root, shimmer, rootGain, shimmerGain }
    }

    const shapeSound = (calmness, currentHue, opened) => {
      const sound = soundRef.current
      if (!sound) return

      const now = sound.context.currentTime
      sound.root.frequency.setTargetAtTime(82 + currentHue / 12, now, 0.18)
      sound.shimmer.frequency.setTargetAtTime(196 + currentHue / 5, now, 0.12)
      sound.rootGain.gain.setTargetAtTime(0.06 + calmness * 0.14, now, 0.2)
      sound.shimmerGain.gain.setTargetAtTime(calmness * 0.06 + (opened ? 0.08 : 0), now, 0.16)
      sound.output.gain.setTargetAtTime(opened ? 0.24 : 0.16, now, 0.2)
    }

    const ringVergeBell = () => {
      const sound = soundRef.current
      if (!sound || sound.bellRung) return

      const now = sound.context.currentTime
      const bell = sound.context.createOscillator()
      const bellGain = sound.context.createGain()
      const overtone = sound.context.createOscillator()
      const overtoneGain = sound.context.createGain()

      bell.type = 'sine'
      bell.frequency.setValueAtTime(659.25, now)
      overtone.type = 'sine'
      overtone.frequency.setValueAtTime(1318.51, now)
      bellGain.gain.setValueAtTime(0.32, now)
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
      overtoneGain.gain.setValueAtTime(0.12, now)
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
      bell.connect(bellGain).connect(sound.output)
      overtone.connect(overtoneGain).connect(sound.output)
      bell.start(now)
      overtone.start(now)
      bell.stop(now + 1.85)
      overtone.stop(now + 0.95)
      sound.bellRung = true
    }

    const playBloomInstrument = (instrument) => {
      const sound = soundRef.current
      if (!sound) return

      const tones = {
        bell: [523.25, 'sine', 0.36],
        glass: [783.99, 'sine', 0.24],
        chorus: [329.63, 'triangle', 0.48],
        rain: [1174.66, 'triangle', 0.16],
      }
      const [frequency, type, duration] = tones[instrument]
      const now = sound.context.currentTime
      const voice = sound.context.createOscillator()
      const gain = sound.context.createGain()

      voice.type = type
      voice.frequency.setValueAtTime(frequency, now)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      voice.connect(gain).connect(sound.output)
      voice.start(now)
      voice.stop(now + duration + 0.02)
    }

    const revealComposition = () => {
      const composition = playedSequence.slice(-2).join('>')
      if (composition === 'chorus>bell') activeReveal = 'butterflyConvergence'
      if (composition === 'glass>chorus') activeReveal = 'bloomChorus'
      if (composition === 'rain>glass') activeReveal = 'aurora'
      if (composition === 'bell>glass') activeReveal = 'fallingLanterns'
    }

    const recordBloom = (instrument) => {
      if (instrument === activeInstrument) return

      activeInstrument = instrument
      playedSequence.push(instrument)
      if (playedSequence.length > 2) playedSequence.shift()
      playBloomInstrument(instrument)
      revealComposition()
    }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const onMove = (event) => {
      startSound()
      const box = canvas.getBoundingClientRect()
      pointer.x = (event.clientX - box.left) / box.width
      pointer.y = (event.clientY - box.top) / box.height
      pointer.active = true
    }
    const onLeave = () => { pointer.active = false }

    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000

      if (pointer.active && pointer.px >= 0) {
        const moved = Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py)
        pointer.speed = pointer.speed * 0.85 + (moved / Math.max(dt, 0.001)) * 0.15
      } else {
        pointer.speed *= 0.9
      }
      pointer.px = pointer.x
      pointer.py = pointer.y
      // Lingering brightens the plasma; rushing dims it.
      const calm = pointer.active && pointer.speed < 0.25
      pointer.linger = Math.min(1, Math.max(0, pointer.linger + (calm ? dt * 0.6 : -dt * 1.2)))
      if (pointer.linger >= 0.92) {
        setVergeOpen(true)
        ringVergeBell()
      }
      // The band has stopped. The Frog returns alone once the field has gone quiet.
      if (pointer.linger >= 0.6) {
        setFrogHere(true)
      }
      shapeSound(pointer.linger, hue, pointer.linger >= 0.92)
      // Hovering shifts hue more than touch ever does; the colour is never fixed.
      if (pointer.active) hue = wrapHue(hue + dt * (6 + pointer.linger * 26))

      ctx.fillStyle = '#05060c'
      ctx.fillRect(0, 0, width, height)
      const haze = ctx.createRadialGradient(width / 2, height, 0, width / 2, height, height)
      haze.addColorStop(0, `hsla(${hue}, 70%, 22%, 0.55)`)
      haze.addColorStop(1, 'rgba(5, 6, 12, 0)')
      ctx.fillStyle = haze
      ctx.fillRect(0, 0, width, height)

      ctx.globalCompositeOperation = 'lighter'
      const heads = flowers.map((flower) => {
        const sway = reduced ? 0 : Math.sin(t * 0.6 + flower.phase + hue / 57) * 0.018
        const flowerHue = wrapHue(hue + flower.offset * 0.35 + Math.sin(t * 0.3 + flower.phase) * 20)
        flower.flare = Math.max(0, flower.flare - dt * 0.8)
        return {
          flower,
          flowerHue,
          hx: (flower.x + sway) * width,
          hy: flower.y * height - flower.size * 0.06 * height,
        }
      })

      heads.forEach(({ flower, flowerHue, hx, hy }) => {
        const baseX = flower.x * width
        const baseY = Math.min(height, flower.y * height + height * 0.08)
        ctx.strokeStyle = `hsla(${flowerHue}, 60%, 55%, 0.25)`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(baseX, baseY)
        ctx.quadraticCurveTo(baseX, (baseY + hy) / 2, hx, hy)
        ctx.stroke()

        const glow = 10 + flower.size * 12 + flower.flare * 22
        const bloom = ctx.createRadialGradient(hx, hy, 0, hx, hy, glow)
        bloom.addColorStop(0, `hsla(${flowerHue}, 90%, 78%, ${0.75 + flower.flare * 0.25})`)
        bloom.addColorStop(1, `hsla(${flowerHue}, 90%, 50%, 0)`)
        ctx.fillStyle = bloom
        ctx.beginPath()
        ctx.arc(hx, hy, glow, 0, Math.PI * 2)
        ctx.fill()

        if (pointer.active) {
          const dx = pointer.x * width - hx
          const dy = pointer.y * height - hy
          const dist = Math.hypot(dx / width, dy / height)
          if (dist < REACH) {
            const strength = (1 - dist / REACH) * (0.25 + pointer.linger * 0.75)
            ctx.strokeStyle = `hsla(${flowerHue}, 95%, 70%, ${strength * 0.8})`
            ctx.lineWidth = 1 + strength * 1.5
            ctx.beginPath()
            ctx.moveTo(hx, hy)
            const jitter = reduced ? 0 : Math.sin(t * 9 + flower.phase) * 10 * strength
            ctx.quadraticCurveTo(hx + dx * 0.5 + jitter, hy + dy * 0.5 - jitter, pointer.x * width, pointer.y * height)
            ctx.stroke()
          }
        }
      })

      if (pointer.active) {
        const nearest = heads.reduce((closest, head) => {
          const distance = Math.hypot(pointer.x * width - head.hx, pointer.y * height - head.hy)
          return distance < closest.distance ? { distance, flower: head.flower } : closest
        }, { distance: Infinity, flower: null })
        if (nearest.distance < Math.min(width, height) * 0.12) {
          recordBloom(nearest.flower.instrument)
        } else {
          activeInstrument = null
        }
      } else {
        activeInstrument = null
      }

      // Two flowers that agree arc a bridge between them.
      for (let a = 0; a < heads.length; a += 1) {
        for (let b = a + 1; b < heads.length; b += 1) {
          const ha = heads[a]
          const hb = heads[b]
          const gap = Math.hypot(ha.hx - hb.hx, ha.hy - hb.hy)
          const diff = Math.abs(((ha.flowerHue - hb.flowerHue + 540) % 360) - 180)
          if (gap < width * 0.14 && 180 - diff < AGREE_HUE) {
            const bridgeHue = wrapHue((ha.flowerHue + hb.flowerHue) / 2 + 120)
            ctx.strokeStyle = `hsla(${bridgeHue}, 100%, 75%, 0.35)`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(ha.hx, ha.hy)
            const bend = reduced ? 0 : Math.sin(t * 5 + a + b) * 6
            ctx.lineTo((ha.hx + hb.hx) / 2 + bend, (ha.hy + hb.hy) / 2 - bend)
            ctx.lineTo(hb.hx, hb.hy)
            ctx.stroke()
          }
        }
      }

      // Butterflies do not land. They tune.
      butterflies.forEach((fly) => {
        if (!reduced) {
          fly.angle += (Math.random() - 0.5) * 2.4 * dt
          fly.x += Math.cos(fly.angle) * 0.05 * dt
          fly.y += Math.sin(fly.angle) * 0.035 * dt
          if (fly.x < 0.02 || fly.x > 0.98) fly.angle = Math.PI - fly.angle
          if (fly.y < 0.08 || fly.y > 0.8) fly.angle = -fly.angle
          fly.x = Math.min(0.98, Math.max(0.02, fly.x))
          fly.y = Math.min(0.8, Math.max(0.08, fly.y))
        }
        fly.hue = wrapHue(fly.hue + dt * 60)
        const fx = fly.x * width
        const fy = fly.y * height

        if (pointer.active && Math.hypot(pointer.x - fly.x, pointer.y - fly.y) < 0.1) {
          hue = wrapHue(hue + (fly.hue - hue) * dt * 1.5)
        }
        if (fly.target < 0 && Math.random() < dt * 0.15) {
          fly.target = Math.floor(Math.random() * heads.length)
        }
        if (fly.target >= 0) {
          const head = heads[fly.target]
          fly.x += (head.hx / width - fly.x) * dt * 0.6
          fly.y += (head.hy / height - fly.y) * dt * 0.6
          if (Math.hypot(head.hx - fx, head.hy - fy) < 14) {
            head.flower.flare = 1
            fly.target = -1
            fly.angle = Math.random() * Math.PI * 2
          }
        }

        const flap = reduced ? 0.6 : 0.4 + Math.abs(Math.sin(t * 8 + fly.hue)) * 0.6
        ctx.fillStyle = `hsla(${fly.hue}, 100%, 72%, 0.8)`
        ctx.beginPath()
        ctx.ellipse(fx - 4, fy, 5 * flap, 3, -0.4, 0, Math.PI * 2)
        ctx.ellipse(fx + 4, fy, 5 * flap, 3, 0.4, 0, Math.PI * 2)
        ctx.fill()
      })

      if (activeReveal === 'bloomChorus') {
        heads.forEach(({ hx, hy, flowerHue }, index) => {
          if (index % 3 !== 0) return
          ctx.strokeStyle = `hsla(${wrapHue(flowerHue + 110)}, 100%, 82%, 0.45)`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(hx, hy, 12 + Math.sin(t * 3 + index) * 4, 0, Math.PI * 2)
          ctx.stroke()
        })
      }

      if (activeReveal === 'butterflyConvergence') {
        const centerX = width * 0.5
        const centerY = height * 0.34
        const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.2)
        halo.addColorStop(0, `hsla(${wrapHue(hue + 145)}, 100%, 78%, 0.28)`)
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = halo
        ctx.beginPath()
        ctx.arc(centerX, centerY, width * 0.2, 0, Math.PI * 2)
        ctx.fill()
      }

      if (activeReveal === 'fallingLanterns') {
        for (let index = 0; index < 14; index += 1) {
          const lanternX = ((index * 0.173 + 0.08) % 1) * width
          const lanternY = ((t * 0.045 + index * 0.23) % 1.2 - 0.1) * height
          const glow = ctx.createRadialGradient(lanternX, lanternY, 0, lanternX, lanternY, 18)
          glow.addColorStop(0, 'rgba(255, 224, 142, 0.8)')
          glow.addColorStop(1, 'rgba(255, 171, 90, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(lanternX, lanternY, 18, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (activeReveal === 'aurora') {
        const aurora = ctx.createLinearGradient(0, 0, width, height * 0.7)
        aurora.addColorStop(0, `hsla(${wrapHue(hue + 120)}, 100%, 68%, 0.06)`)
        aurora.addColorStop(0.45, `hsla(${wrapHue(hue + 180)}, 100%, 72%, 0.38)`)
        aurora.addColorStop(1, `hsla(${wrapHue(hue + 245)}, 100%, 66%, 0.04)`)
        ctx.strokeStyle = aurora
        ctx.lineWidth = Math.max(16, width * 0.06)
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let step = 0; step <= 20; step += 1) {
          const x = (step / 20) * width
          const y = height * 0.2
            + Math.sin(step * 0.72 + t * 0.7) * height * 0.07
            + Math.sin(step * 0.29 - t * 0.42) * height * 0.05
          if (step === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.lineCap = 'butt'
        for (let index = 0; index < 20; index += 1) {
          const x = ((index * 0.19 + t * 0.012) % 1) * width
          const y = height * 0.22 + Math.sin(index * 0.9 + t) * height * 0.08
          ctx.fillStyle = `hsla(${wrapHue(hue + 145)}, 100%, 88%, 0.42)`
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalCompositeOperation = 'source-over'

      if (!reduced) frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      soundRef.current?.context.close()
      soundRef.current = null
    }
  }, [])

  return (
    <main className="meadow-page">
      <canvas
        ref={canvasRef}
        className="meadow-canvas"
        role="img"
        aria-label="A field of flowers made of living plasma. They answer your movement and your colour."
      />
      <header className="meadow-title">
        <p>Plasma-Bloom Meadow</p>
      </header>
      <p className="meadow-line">You&rsquo;re not the player. You&rsquo;re the variable.</p>
      {frogHere && (
        <div className="meadow-frog" aria-live="polite">
          <p className="meadow-frog__line">You haven&rsquo;t eaten.</p>
          <p className="meadow-frog__walking">The Frog starts walking.</p>
          <Link to="/frog-chamber">Follow the Frog</Link>
        </div>
      )}
      <nav className="meadow-nav" aria-label="Meadow passages">
        <a href="/housegarden.html">Back to House &amp; Garden</a>
        <a href="/wildflower-drift.html">Wildflower Drift</a>
        {vergeOpen && <Link to="/cave-corridor-prototype">Follow the violet seam</Link>}
      </nav>
    </main>
  )
}
