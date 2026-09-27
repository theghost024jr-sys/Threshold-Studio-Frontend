import { useContext } from 'react'
import { MythicContext } from '../context/mythic-context.js'

export function useMythic() {
  const context = useContext(MythicContext)
  if (!context) throw new Error('useMythic must be used within MythicProvider')
  return context
}