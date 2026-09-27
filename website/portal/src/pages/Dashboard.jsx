import { Link, useParams } from 'react-router-dom'
import Archive from '../components/Archive.jsx'
import Mythic from '../components/Mythic.jsx'
import Weather from '../components/Weather.jsx'
import { BRANCHES } from '../modules/branches.js'

export default function Dashboard() {
  const { branchId } = useParams()
  const branch = BRANCHES.find((item) => item.id === branchId)

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Threshold Studio</p>
          <h1>{branch ? branch.label : 'Portal dashboard'}</h1>
        </div>
        <Link className="back-link" to="/">Portal home</Link>
      </header>
      <div className="dashboard-grid">
        <Weather />
        <Mythic />
        <Archive />
      </div>
    </main>
  )
}