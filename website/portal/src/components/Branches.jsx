import { NavLink } from 'react-router-dom'
import { BRANCHES } from '../modules/branches.js'

export default function Branches() {
  return (
    <nav className="branch-nav" aria-label="Portal branches">
      {BRANCHES.map((branch) => (
        <NavLink key={branch.id} to={`/branches/${branch.id}`}>
          {branch.label}
        </NavLink>
      ))}
    </nav>
  )
}