import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import { WorldMap } from '../../world/WorldMap.jsx'
import {
  ChambersIndexPage,
  EllaPage,
  GardenPage,
} from '../../world/WorldChamberPages.jsx'
import { ChamberPage } from '../../world/chambers/ChamberPage.jsx'

export default function App() {
  const basename = window.location.pathname.startsWith('/portal') ? '/portal' : '/'

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/branches/:branchId" element={<Dashboard />} />
        <Route path="/world" element={<WorldMap />} />
        <Route path="/world/map" element={<WorldMap />} />
        <Route path="/world/garden" element={<GardenPage />} />
        <Route path="/world/ella" element={<EllaPage />} />
        <Route path="/world/chambers" element={<ChambersIndexPage />} />
        <Route path="/world/chambers/:id" element={<ChamberPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
