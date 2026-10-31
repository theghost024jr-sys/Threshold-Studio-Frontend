import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const routeHelp = {
  '/beach': { label: 'Shore Threshold', answer: 'The shore asks for a stance. Choose mountain, raft, or ocean, then carry that return trace forward.', href: '/ocean', action: 'Face the Ocean' },
  '/ocean': { label: 'Ocean', answer: 'The Ocean measures unresolved pressure. You can remain above, go below, or test the shimmer before returning.', href: '/deepwater', action: 'Enter Deepwater' },
  '/deepwater': { label: 'Deepwater', answer: 'Read the pressure form before trying to move it. Deepwater returns a form, not a finished answer.', href: '/first-door', action: 'Open the First Door' },
  '/first-door': { label: 'First Door', answer: 'The First Door recognizes stance. Pick the petal that names how you are meeting the threshold.', href: '/motion', action: 'Enter Motion' },
  '/motion': { label: 'Motion Field', answer: 'Motion is the negotiation between your vector, the medium, and the world’s yield. Pick a field when you need a next seam.', href: '/doug', action: 'Visit Doug' },
  '/ruins': { label: 'Ruins of Velin', answer: 'Velin makes fracture, residue, and pressure readable. It does not claim to resolve collapse.', href: '/quiet-grove', action: 'Find Quiet Grove' },
  '/quiet-grove': { label: 'Quiet Grove', answer: 'Quiet-Weight can absorb a spike, but do not stay until stillness becomes Quiet-sink. Re-enter Motion when ready.', href: '/motion', action: 'Resume through Motion' },
  '/spiral-grove': { label: 'Spiral Grove', answer: 'Spiral Grove loops drift inward. Its rare stabilizing exit is Quiet Grove.', href: '/quiet-grove', action: 'Find Quiet Grove' },
  '/doug': { label: 'Doug’s desk', answer: 'I can help with forms, route orientation, return traces, and the problem that does not seem to have a department yet.', href: '/motion', action: 'Follow the cleared vector' }
}

function localReply(query, path) {
  const normalized = query.toLowerCase()
  const route = routeHelp[path] || routeHelp['/motion']

  if (/(lost|where|go|next|path|route)/.test(normalized)) return route
  if (/(pressure|collapse|fracture|ruin|residue)/.test(normalized)) return routeHelp['/ruins']
  if (/(quiet|still|recover|calm|grove)/.test(normalized)) return routeHelp['/quiet-grove']
  if (/(drift|motion|move|vector)/.test(normalized)) return routeHelp['/motion']
  if (/(ocean|depth|water|mirage)/.test(normalized)) return routeHelp['/ocean']

  return {
    label: route.label,
    answer: `I do not have a clean form for “${query}” yet, but I can start from where you are. ${route.answer}`,
    href: route.href,
    action: route.action
  }
}

export default function DougHelpDesk() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState(null)
  const [loading, setLoading] = useState(false)

  async function askDoug(event) {
    event.preventDefault()
    const query = question.trim()
    if (!query) return

    setLoading(true)
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
      setReply(localReply(query, location.pathname.replace('/portal', '') || '/'))
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 1500)
    try {
      const response = await fetch('/api/doug/help', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, path: location.pathname.replace('/portal', '') || '/' }),
        signal: controller.signal
      })
      const contentType = response.headers.get('content-type') || ''
      if (response.ok && contentType.includes('application/json')) {
        const payload = await response.json()
        if (payload?.answer && payload?.href && payload?.action) {
          setReply(payload)
          return
        }
      }
    } catch (error) {
      console.warn('Doug help desk is using its local route guide.', error)
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }

    setReply(localReply(query, location.pathname.replace('/portal', '') || '/'))
  }

  return (
    <aside className={`doug-help-desk${open ? ' is-open' : ''}`} aria-label="Ask Doug for help">
      {open && (
        <div className="doug-help-panel">
          <p>Doug’s desk · open</p>
          <h2>Need a hand?</h2>
          <p>Tell Doug what is unclear. He will start with the route, return state, or form that can actually help.</p>
          <form onSubmit={askDoug}>
            <label htmlFor="doug-question">Ask Doug</label>
            <input id="doug-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="I’m lost in the spiral." />
            <button type="submit" disabled={loading}>{loading ? 'Doug is checking.' : 'Ask Doug'}</button>
          </form>
          {reply && (
            <section className="doug-help-reply" aria-live="polite">
              <strong>{reply.label}</strong>
              <p>{reply.answer}</p>
              <button type="button" onClick={() => { navigate(reply.href); setOpen(false) }}>{reply.action}</button>
            </section>
          )}
          <button type="button" className="doug-help-close" onClick={() => setOpen(false)}>Close desk</button>
        </div>
      )}
      <button type="button" className="doug-help-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        Ask Doug
      </button>
    </aside>
  )
}
