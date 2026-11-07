import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import canyonImage from '../assets/cindervox-canyon.png'

export default function Canyon() {
  const pageRef = useRef(null)
  const [choice, setChoice] = useState(null)

  useEffect(() => {
    let frameId = 0
    const update = () => {
      frameId = 0
      const page = pageRef.current
      if (!page) return
      const progress = Math.min(1, Math.max(0, window.scrollY / (page.offsetHeight - window.innerHeight)))
      page.style.setProperty('--canyon-progress', progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <main className="canyon-page" ref={pageRef}>
      <section className="canyon-stage">
        <img className="canyon-art" src={canyonImage} alt="Cindervox leading a path through an ember canyon" />
        <div className="canyon-darkness" />
        <p className="canyon-index">Cindervox / Ember passage</p>
        <h1>Follow the light</h1>
        <p className="canyon-guide">The canyon moves sideways while you go deeper</p>
        <section className={`canyon-reveal${choice ? ' is-chosen' : ''}`} aria-labelledby="canyon-choice-title">
          <p className="canyon-reveal-label">At the burn line</p>
          <h2 id="canyon-choice-title">Cindervox does not lead you past the threshold.</h2>
          <p className="canyon-reveal-copy">It holds the threshold open long enough for you to decide what kind of signal you will become.</p>
          <div className="canyon-choices">
            <button
              className={`canyon-choice${choice === 'listen' ? ' is-active' : ''}`}
              type="button"
              onClick={() => setChoice('listen')}
              aria-pressed={choice === 'listen'}
            >
              <span>Hold the boundary</span>
              <small>Listen with Cindervox</small>
            </button>
            <button
              className={`canyon-choice${choice === 'ignite' ? ' is-active' : ''}`}
              type="button"
              onClick={() => setChoice('ignite')}
              aria-pressed={choice === 'ignite'}
            >
              <span>Cross the spark point</span>
              <small>Enter the Ember current</small>
            </button>
          </div>
          <p className="canyon-consequence" aria-live="polite">
            {choice === 'listen' && 'Passive does not mean absent. Cindervox listens, absorbs pressure, and buffers the edge of collapse.'}
            {choice === 'ignite' && 'Ember turns latent signal into action. It sharpens the path, accelerates change, and asks you to bear the heat.'}
            {!choice && 'One path contains pressure. The other gives it direction.'}
          </p>
        </section>
        <p className="canyon-end">The path keeps going.</p>
        <nav className="canyon-nav" aria-label="Canyon destinations">
          <Link to="/cave-corridor">Back to the Cave Corridor</Link>
          <a href="/mythology.html">Meet Cindervox</a>
          <Link to="/">Return to Threshold</Link>
        </nav>
      </section>
    </main>
  )
}
