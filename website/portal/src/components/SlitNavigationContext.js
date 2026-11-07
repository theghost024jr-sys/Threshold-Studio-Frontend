import { createContext, useContext } from 'react'

export const SlitNavigationContext = createContext(null)

export function useSlitNavigation() {
  const context = useContext(SlitNavigationContext)
  if (!context) throw new Error('useSlitNavigation must be used inside SlitPassage.')
  return context
}
