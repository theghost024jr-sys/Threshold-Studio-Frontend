import { Link } from 'react-router-dom'
import Branches from '../components/Branches.jsx'

export default function Home() {
  return (
    <main className="portal-home">
      <p className="eyebrow">Threshold Studio</p>
      <h1>Portal</h1>
      <p className="lead">A live index of the Threshold archive, atmosphere, and active branches.</p>
      <Link className="primary-link" to="/dashboard">Enter dashboard</Link>
      <Branches />
    </main>
  )
}