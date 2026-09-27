import { useEffect, useState } from 'react'
import { fetchArchiveEntries } from '../modules/archive.js'

export function useArchive() {
  const [entries, setEntries] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetchArchiveEntries()
      .then((data) => {
        if (active) setEntries(data)
      })
      .catch((reason) => {
        if (active) setError(reason)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { entries, error, loading }
}