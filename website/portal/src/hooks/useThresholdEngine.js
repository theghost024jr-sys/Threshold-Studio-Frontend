import { useState } from 'react'
import { createPortalEngine } from '../modules/threshold-engine.js'

const engine = createPortalEngine()

export function useThresholdEngine() {
  const [state, setState] = useState(engine.initialState)

  function selectChannel(channel) {
    setState((current) => ({ ...current, channel: engine.normalizeChannel(channel) }))
  }

  return { channels: engine.channels, selectChannel, state }
}