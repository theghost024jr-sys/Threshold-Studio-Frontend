import { useArchive } from '../hooks/useArchive.js'

export default function Archive() {
  const { entries, error, loading } = useArchive()

  return (
    <section className="archive-panel" aria-labelledby="archive-heading">
      <div className="section-heading">
        <p className="eyebrow">Published material</p>
        <h2 id="archive-heading">Archive</h2>
      </div>
      {loading && <p>Loading archive...</p>}
      {error && <p className="status-error">Archive unavailable: {error.message}</p>}
      {!loading && !error && entries.length === 0 && <p>No published archive entries are available.</p>}
      {!loading && !error && (
        entries.length > 0 && (
          <ul className="archive-list">
            {entries.slice(0, 8).map((entry, index) => (
              <li key={entry.id || entry.relativePath || index}>
                <span>{entry.title || entry.id || 'Untitled chamber'}</span>
                <small>{entry.chamber || entry.relativePath || 'Threshold'}</small>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  )
}