import { useEffect, useRef, useState } from 'react'
import './FrogChamber.css'

const JAR_PLACES = [
  ['table', 'Put it on the table'],
  ['fire', 'Put it beside the fire'],
  ['held', 'Keep holding it'],
]

// The scene withdraws on its own. Time and stillness carry it — no control does.
const SLEEP_AFTER_MS = 8000
const WAKE_AFTER_MS = 3200

export default function FrogChamber() {
  const [phase, setPhase] = useState('arrived')
  const [jar, setJar] = useState('held')
  const [lowEnd, setLowEnd] = useState(false)
  const soundRef = useRef(null)

  // Stars settle into sleep; sleep ends the chamber. No button, no navigation —
  // the scene's own timing carries both transitions.
  useEffect(() => {
    if (phase === 'after') {
      const timer = setTimeout(() => setPhase('sleeping'), SLEEP_AFTER_MS)
      return () => clearTimeout(timer)
    }
    if (phase === 'sleeping') {
      const timer = setTimeout(() => setPhase('awake'), WAKE_AFTER_MS)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [phase])

  function toggleLowEnd() {
    const next = !lowEnd
    setLowEnd(next)

    if (!next) {
      soundRef.current?.gain.gain.setTargetAtTime(0.0001, soundRef.current.context.currentTime, 0.2)
      return
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    if (!soundRef.current) {
      const context = new AudioContext()
      const gain = context.createGain()
      const low = context.createOscillator()
      low.type = 'sine'
      low.frequency.value = 44
      gain.gain.value = 0.0001
      low.connect(gain).connect(context.destination)
      low.start()
      soundRef.current = { context, gain, low }
    }

    soundRef.current.context.resume()
    soundRef.current.gain.gain.setTargetAtTime(0.06, soundRef.current.context.currentTime, 0.4)
  }

  return (
    <main className={`frog-chamber frog-chamber--${phase}`}>
      {phase !== 'awake' && (
        <>
          <section className="frog-approach">
            <p className="frog-approach__line">The blooms get farther apart. The ground gets wetter.</p>
            <p>The music is gone. The low frequencies remain: water moving, mud shifting, reeds rubbing, something occasionally plopping into water.</p>
            <p className="frog-approach__note">The bass player doesn&rsquo;t need a bass here. The Chamber carries the low end.</p>
            <button type="button" className="frog-listen" aria-pressed={lowEnd} onClick={toggleLowEnd}>
              {lowEnd ? 'Quiet the low end' : 'Listen to the low end'}
            </button>
          </section>

          <section className="frog-room" aria-label="The Frog Chamber">
            <div className="frog-water" aria-hidden="true" />
            <div className="frog-stones" aria-hidden="true"><i /><i /><i /><i /></div>
            <div className="frog-reeds" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <div className="frog-fire" aria-hidden="true"><span /></div>

            <div className="frog-table">
              <p className="frog-table__dish">Beef Wellington</p>
              <p className="frog-table__note">Beautifully made. Not magical. It is Beef Wellington. The strange part is that a frog made it.</p>
            </div>

            <p className="frog-places">One table. Two places.</p>
          </section>
        </>
      )}

      {phase === 'awake' && (
        <section className="frog-awake" aria-label="The meadow after waking">
          <div className="frog-water" aria-hidden="true" />
          <div className="frog-reeds" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          <p className="frog-awake__line">You wake.</p>
          <p>The ground is wet. Reeds at the edges. Water moving where you cannot see it. Open sky.</p>
          <p className="frog-awake__gone">No Frog. No table. No Wellington. No fire. No sleeping bag.</p>
          <p className="frog-awake__jar">As for the jar — you do not check. Whether it came through the night with you is not something this place will tell you.</p>
        </section>
      )}

      <section className="frog-scene" aria-live="polite">
        {phase === 'arrived' && (
          <>
            <p className="frog-dialogue">You haven&rsquo;t eaten.</p>
            <p>The Frog notices that you are still carrying the jar. It does not ask what it is.</p>
            <button type="button" onClick={() => setPhase('seated')}>Sit down</button>
          </>
        )}

        {phase === 'seated' && (
          <>
            <p className="frog-dialogue">You can put that down.</p>
            <div className="frog-jar-choices" aria-label="The jar">
              {JAR_PLACES.map(([place, label]) => (
                <button
                  type="button"
                  key={place}
                  className={jar === place ? 'is-active' : ''}
                  aria-pressed={jar === place}
                  onClick={() => setJar(place)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="frog-eat" onClick={() => setPhase('after')}>We eat.</button>
          </>
        )}

        {phase === 'after' && (
          <>
            <p>Frog cuts the Wellington. We eat. There is almost no conversation.</p>
            <p>For a while you are not trying to open something, solve something, find something, contribute something, carry something, or understand something.</p>
            <p className="frog-after__line">You get up. Frog stays.</p>
            {jar === 'table' && <p className="frog-jar-on-table">The jar is sitting on the table.</p>}
            {jar === 'fire' && <p className="frog-jar-on-table">The jar is sitting beside the fire.</p>}
            {jar === 'held' && <p className="frog-jar-on-table">You are still holding the jar.</p>}
            <p className="frog-unresolved">
              Do I remember it? Do I leave without it? Did I finally find where it wanted to be?
              Or did I simply forget my jar at a frog&rsquo;s dinner table?
            </p>
            <p className="frog-unresolved__note">We don&rsquo;t answer that yet. That is for Threshold to decide.</p>

            <div className="frog-rest">
            <p className="frog-rest__outside">Outside: a small fire, a sleeping bag on the ground, the Meadow around you, open sky above.</p>
            <p className="frog-rest__maybe">Maybe the Frog is still nearby. Maybe not. The jar is wherever you left it.</p>
            <p className="frog-rest__line">You lie down.</p>
            <p className="frog-rest__line">The fire settles.</p>
            <p className="frog-rest__line frog-rest__stars">You look up at the stars.</p>
            <ul className="frog-rest__absences">
              <li>No menu.</li>
              <li>No sleep button.</li>
              <li>No clock.</li>
              <li>No objective.</li>
            </ul>
            <p className="frog-rest__hidden">Threshold knows you are tired. You experience being tired. There is no ENERGY 17/100.</p>
            <p className="frog-rest__note">The Frog noticed you needed something. Fed you. Gave you somewhere safe to sleep. And left you alone under the stars.</p>
            </div>
          </>
        )}

        {phase === 'sleeping' && (
          <div className="frog-sleep" aria-hidden="true" />
        )}
      </section>
    </main>
  )
}
