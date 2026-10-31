import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import beachImage from '../assets/abeach.png'
import universeBeachImage from '../assets/universebeach.png'
import raftImage from '../assets/raft.png'
import { recordReturnState } from '../returnState.js'

const stances = {
  mountain: 'The mountains clarify the structure already built. Returning is not failure; it is choosing solidity over depth.',
  raft: 'The raft remains neutral. It reflects the shape of your readiness without predicting the crossing.',
  ocean: 'The ocean opens as the unknown self: depth, possibility, and narratives not yet met.'
}

export default function Beach() {
  const pageRef = useRef(null)
  const [message, setMessage] = useState('')
  const [monumentRaised, setMonumentRaised] = useState(false)
  const [stance, setStance] = useState(null)
  const canRaise = message.trim().length > 0

  useEffect(() => {
    const page = pageRef.current
    if (!page) return undefined
    const updatePointer = (event) => {
      page.style.setProperty('--beach-x', `${((event.clientX / innerWidth) - 0.5) * 2}`)
      page.style.setProperty('--beach-y', `${((event.clientY / innerHeight) - 0.5) * 2}`)
    }
    addEventListener('pointermove', updatePointer, { passive: true })
    return () => removeEventListener('pointermove', updatePointer)
  }, [])

  function playShoreTone() {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    const now = context.currentTime
    const gain = context.createGain()
    const low = context.createOscillator()
    const shimmer = context.createOscillator()
    low.type = 'sine'
    low.frequency.setValueAtTime(82, now)
    low.frequency.exponentialRampToValueAtTime(58, now + 1.8)
    shimmer.type = 'sine'
    shimmer.frequency.setValueAtTime(247, now)
    shimmer.frequency.linearRampToValueAtTime(294, now + 1.8)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.18)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    low.connect(gain)
    shimmer.connect(gain)
    gain.connect(context.destination)
    low.start(now)
    shimmer.start(now)
    low.stop(now + 1.82)
    shimmer.stop(now + 1.82)
    low.addEventListener('ended', () => context.close())
  }

  function raiseMonument() {
    if (canRaise) {
      playShoreTone()
      setMonumentRaised(true)
    }
  }

  function chooseStance(nextStance) {
    setStance(nextStance)
    recordReturnState('Shore', nextStance, stances[nextStance])
  }

  return (
    <main className={`beach-page${monumentRaised ? ' is-revealed' : ''}${stance ? ` is-${stance}` : ''}`} ref={pageRef}>
      <section className="beach-stage" aria-labelledby="beach-title">
        <img className="beach-image beach-image-near" src={beachImage} alt="The shore beyond the mountains" />
        <img className="beach-image beach-image-far" src={universeBeachImage} alt="" aria-hidden="true" />
        <div className="beach-horizon" aria-hidden="true" />
        <div className="beach-tide beach-tide-one" aria-hidden="true" />
        <div className="beach-tide beach-tide-two" aria-hidden="true" />
        <p className="beach-sand-writing" aria-hidden="true">{message}</p>
        <div className="beach-monument" aria-hidden="true"><span /><span /><span /></div>
        <img className="beach-raft" src={raftImage} alt="A raft waiting at the shoreline" />

        <header className="beach-intro">
          <p>Shore threshold · sand memory</p>
          <h1 id="beach-title">What will the shore remember?</h1>
          <p>Behind you: mountain weight. Ahead: ocean depth. Beneath you: stone-memory ground fine enough to hold an intention.</p>
        </header>

        <section className="beach-inscription" aria-labelledby="beach-inscription-title">
          <p>Signal in the sand</p>
          <h2 id="beach-inscription-title">Leave a trace.</h2>
          <label htmlFor="shore-message">A word, a question, or an unresolved thing</label>
          <textarea
            id="shore-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              setMonumentRaised(false)
            }}
            placeholder="The sand can hold it."
            maxLength="240"
          />
          <button type="button" onClick={raiseMonument} disabled={!canRaise}>Turn inward</button>
          <p className="beach-result" aria-live="polite">
            {!canRaise && 'The shore stays quiet. A message is not a command; it is a signal.'}
            {canRaise && !monumentRaised && 'The sand remembers the shape. The monument waits for introspection.'}
            {monumentRaised && 'A pressure inversion gathers below the sand. The monument rises as a mirror of the truth beneath the message.'}
          </p>
        </section>

        <section className="beach-stance" aria-labelledby="beach-stance-title">
          <p>Four-way possibility field</p>
          <h2 id="beach-stance-title">Where does the signal point?</h2>
          <div className="beach-choices">
            <button type="button" className={stance === 'mountain' ? 'is-active' : ''} onClick={() => chooseStance('mountain')} aria-pressed={stance === 'mountain'}>Look to the mountains</button>
            <button type="button" className={stance === 'raft' ? 'is-active' : ''} onClick={() => chooseStance('raft')} aria-pressed={stance === 'raft'}>Wait with the raft</button>
            <button type="button" className={stance === 'ocean' ? 'is-active' : ''} onClick={() => chooseStance('ocean')} aria-pressed={stance === 'ocean'}>Face the ocean</button>
          </div>
          <p className="beach-stance-copy" aria-live="polite">{stance ? stances[stance] : 'The world does not answer for you. It responds to the stance you bring to the shore.'}</p>
          {stance === 'ocean' && <Link className="beach-ocean-link" to="/ocean">Cross into the ocean beyond</Link>}
        </section>

        <nav className="beach-nav" aria-label="Beach destinations">
          <Link to="/">Return to the Portal</Link>
          <Link to="/">Return to Threshold</Link>
          <a href="/mythology.html">Return to Mythology</a>
        </nav>
      </section>
    </main>
  )
}
