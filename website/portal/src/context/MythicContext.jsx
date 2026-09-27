import { useState } from 'react'
import { MYTHIC_BY_CHANNEL } from '../modules/mythic.js'
import { MythicContext } from './mythic-context.js'

export function MythicProvider({ children }) {
  const [channel, setChannel] = useState('threshold')
  const mythic = MYTHIC_BY_CHANNEL[channel] || MYTHIC_BY_CHANNEL.threshold

  return (
    <MythicContext.Provider value={{ channel, mythic, setChannel }}>
      {children}
    </MythicContext.Provider>
  )
}