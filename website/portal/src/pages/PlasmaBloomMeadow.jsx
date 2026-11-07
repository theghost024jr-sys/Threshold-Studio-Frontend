import { useEffect, useRef } from 'react'
import './PlasmaBloomMeadow.css'

const FLOWER_COUNT = 34
const BUTTERFLY_COUNT = 5
const REACH = 0.28
const AGREE_HUE = 28

const wrapHue = (hue) => ((hue % 360) + 360) % 360

function buildFlowers() {
  return Array.from({ length: FLOWER_COUNT }, (_, index) => ({
    x: 0.06 + ((index * 0.6180339) % 1) * 0.88,
    y: 0.42 + ((index * 0.4142135) % 1) * 0.5,
    offset: (index * 47) % 360,
    phase: index * 1.7,
    size: 0.7 + ((index * 13) % 10) / 14,
    flare: 0,
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

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const flowers = buildFlowers()
    const butterflies = buildButterflies()
    const pointer = { x: -1, y: -1, px: -1, py: -1, speed: 0, linger: 0, active: false }
    let hue = 190
    let width = 0
    let height = 0
    let frame = 0
    let last = performance.now()

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * ratio
      canvas.height = height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const onMove = (event) => {
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
      <nav className="meadow-nav" aria-label="Meadow passages">
        <a href="/housegarden.html">Back to House &amp; Garden</a>
        <a href="/wildflower-drift.html">Wildflower Drift</a>
      </nav>
    </main>
  )
}
