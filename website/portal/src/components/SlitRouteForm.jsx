import { Component, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSlitNavigation } from './SlitNavigationContext.js'

class FormFailureBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    this.props.onFailure(error)
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return <main className="route-loading" role="alert">This route could not be loaded.</main>
    }

    return this.props.children
  }
}

export default function SlitRouteForm({ children }) {
  const location = useLocation()
  const { reportFormSuccess, abortPassage } = useSlitNavigation()

  useEffect(() => {
    reportFormSuccess(location)
  }, [location, reportFormSuccess])

  return (
    <FormFailureBoundary resetKey={location.key} onFailure={abortPassage}>
      {children}
    </FormFailureBoundary>
  )
}
