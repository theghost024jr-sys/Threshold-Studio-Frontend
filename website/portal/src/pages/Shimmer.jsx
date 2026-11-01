import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import cabinImage from '../assets/cabin.png'
import quiverbrightHawk from '../assets/quiverbright-hawk.png'

const sceneLayers = {
  cabinComposite: { anchorDepth: -80, presentationDepth: -80, authority: 'authored' },
  cabinLight: { anchorDepth: 10, presentationDepth: 10, authority: 'presentation' },
  fogFar: { anchorDepth: 20, presentationDepth: 20, authority: 'presentation' },
  fogNear: { anchorDepth: 90, presentationDepth: 90, authority: 'presentation' },
  quiverbright: { anchorDepth: 130, presentationDepth: 130, authority: 'authored' }
}

function layerProps(name) {
  const layer = sceneLayers[name]
  return {
    'data-scene-layer': name,
    'data-layer-authority': layer.authority,
    style: {
      '--anchor-depth': `${layer.anchorDepth}px`,
      '--presentation-depth': `${layer.presentationDepth}px`
    }
  }
}

export default function Shimmer() {
  const sceneRef = useRef(null)

  useEffect(() => {
    let frameId = 0

    const updateScene = () => {
      frameId = 0
      const scene = sceneRef.current
      if (!scene) return

      const bounds = scene.getBoundingClientRect()
      const travel = Math.max(1, bounds.height - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -bounds.top / travel))
      const flightProgress = Math.min(1, progress / 0.68)
      const departureProgress = Math.min(1, Math.max(0, (progress - 0.8) / 0.2))
      const landed = progress >= 0.68 && progress < 0.8
      const birdX = progress < 0.8
        ? -15 + flightProgress * 63
        : 48 + departureProgress * 70
      const birdY = progress < 0.8
        ? 27 - Math.sin(flightProgress * Math.PI) * 13
        : 27 - departureProgress * 36
      const birdOpacity = progress <= 0.26
        ? 0
        : departureProgress > 0.92
          ? 1 - (departureProgress - 0.92) / 0.08
          : 1
      scene.style.setProperty('--scene-progress', progress.toFixed(3))
      scene.style.setProperty('--bird-x', `${birdX.toFixed(1)}vw`)
      scene.style.setProperty('--bird-y', `${birdY.toFixed(1)}%`)
      scene.style.setProperty('--bird-opacity', birdOpacity.toFixed(2))
      scene.dataset.birdState = landed ? 'landed' : 'flying'
    }

    const onScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateScene)
    }

    updateScene()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  const handlePointerMove = (event) => {
    const scene = sceneRef.current
    if (!scene) return

    const bounds = scene.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    scene.style.setProperty('--tilt-x', `${(-vertical * 4).toFixed(2)}deg`)
    scene.style.setProperty('--tilt-y', `${(horizontal * 5).toFixed(2)}deg`)
    scene.style.setProperty('--parallax-x', `${(horizontal * -18).toFixed(1)}px`)
    scene.style.setProperty('--parallax-y', `${(vertical * -12).toFixed(1)}px`)
  }

  const resetPerspective = () => {
    const scene = sceneRef.current
    if (!scene) return

    scene.style.setProperty('--tilt-x', '0deg')
    scene.style.setProperty('--tilt-y', '0deg')
    scene.style.setProperty('--parallax-x', '0px')
    scene.style.setProperty('--parallax-y', '0px')
  }

  return (
    <main className="shimmer-page" ref={sceneRef}>
      <section
        className="shimmer-scene"
        aria-label="Cabin scene"
        onPointerLeave={resetPerspective}
        onPointerMove={handlePointerMove}
      >
        <img className="shimmer-cabin" {...layerProps('cabinComposite')} src={cabinImage} alt="A moss-covered cabin beside a water engine" />
        <div className="shimmer-lights" {...layerProps('cabinLight')} aria-hidden="true" />
        <div className="shimmer-fog shimmer-fog-near" {...layerProps('fogNear')} />
        <div className="shimmer-fog shimmer-fog-far" {...layerProps('fogFar')} />
        <div className="shimmer-bird" {...layerProps('quiverbright')} role="img" aria-label="Quiverbright crossing the clearing">
          <img src={quiverbrightHawk} alt="" />
        </div>
        <div className="shimmer-veil" />
        <div className="shimmer-copy">
          <p className="shimmer-phrase">The construction is familiar. Its making is not.</p>
          <p className="shimmer-direction">Scroll toward the Cabin</p>
        </div>
        <p className="shimmer-arrival">The lights are already on. You can rest here.</p>
        <Link className="shimmer-enter" to="/cabin-of-moss">Enter the Cabin</Link>
      </section>
      <Link className="back-link shimmer-return" to="/">Portal home</Link>
    </main>
  )
}
