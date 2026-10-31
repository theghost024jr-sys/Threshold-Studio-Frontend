import { Link } from 'react-router-dom'

export default function Shimmer() {
  return (
    <main className="shimmer-page">
      <p className="shimmer-phrase">Once I remember I created shimmer</p>
      <Link className="back-link" to="/">Portal home</Link>
    </main>
  )
}
