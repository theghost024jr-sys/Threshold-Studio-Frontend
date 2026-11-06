import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import DougHelpDesk from './components/DougHelpDesk.jsx'
import NaturalEffects from './components/NaturalEffects.jsx'
import SlitPassage from './components/SlitPassage.jsx'
import SlitRouteForm from './components/SlitRouteForm.jsx'
import './App.css'

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Beach = lazy(() => import('./pages/Beach.jsx'))
const Basin = lazy(() => import('./pages/Basin.jsx'))
const BasinFalls = lazy(() => import('./pages/BasinFalls.jsx'))
const CaveCorridor = lazy(() => import('./pages/CaveCorridor.jsx'))
const Canyon = lazy(() => import('./pages/Canyon.jsx'))
const Deepwater = lazy(() => import('./pages/Deepwater.jsx'))
const Doug = lazy(() => import('./pages/Doug.jsx'))
const Ethos = lazy(() => import('./pages/Ethos.jsx'))
const FirstDoor = lazy(() => import('./pages/FirstDoor.jsx'))
const Home = lazy(() => import('./pages/Home.jsx'))
const Motion = lazy(() => import('./pages/Motion.jsx'))
const Ocean = lazy(() => import('./pages/Ocean.jsx'))
const QuietGrove = lazy(() => import('./pages/QuietGrove.jsx'))
const Ruins = lazy(() => import('./pages/Ruins.jsx'))
const Shimmer = lazy(() => import('./pages/Shimmer.jsx'))
const SpiralGrove = lazy(() => import('./pages/SpiralGrove.jsx'))
const SystemChamber = lazy(() => import('./pages/SystemChamber.jsx'))
const HourglassGlyph = lazy(() => import('./pages/HourglassGlyph.jsx'))
const Rava = lazy(() => import('./pages/Rava.jsx'))
const GlyphArchive = lazy(() => import('./pages/GlyphArchive.jsx'))
const Rohg = lazy(() => import('./pages/Rohg.jsx'))
const SnailBand = lazy(() => import('./pages/SnailBand.jsx'))
const CabinOfMoss = lazy(() => import('./pages/CabinOfMoss.jsx'))
const LanternrootConservatory = lazy(() => import('./pages/LanternrootConservatory.jsx'))
const OldForestTrek = lazy(() => import('./pages/OldForestTrek.jsx'))
const WildflowerDrift = lazy(() => import('./pages/WildflowerDrift.jsx'))
const WorldMap = lazy(() => import('../../world/WorldMap.jsx').then(({ WorldMap: Page }) => ({ default: Page })))
const ChambersIndexPage = lazy(() => import('../../world/WorldChamberPages.jsx').then(({ ChambersIndexPage: Page }) => ({ default: Page })))
const EllaPage = lazy(() => import('../../world/WorldChamberPages.jsx').then(({ EllaPage: Page }) => ({ default: Page })))
const GardenPage = lazy(() => import('../../world/WorldChamberPages.jsx').then(({ GardenPage: Page }) => ({ default: Page })))
const ChamberPage = lazy(() => import('../../world/chambers/ChamberPage.jsx').then(({ ChamberPage: Page }) => ({ default: Page })))

export default function App() {
  const basename = window.location.pathname.startsWith('/portal') ? '/portal' : '/'

  return (
    <BrowserRouter basename={basename}>
      <SlitPassage>
        <NaturalEffects />
        <DougHelpDesk />
        <Suspense fallback={<main className="route-loading">Loading</main>}>
          <SlitRouteForm>
            <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/beach" element={<Beach />} />
          <Route path="/basin" element={<Basin />} />
          <Route path="/basin-falls" element={<BasinFalls />} />
          <Route path="/cave-corridor" element={<CaveCorridor />} />
          <Route path="/canyon" element={<Canyon />} />
          <Route path="/deepwater" element={<Deepwater />} />
          <Route path="/doug" element={<Doug />} />
          <Route path="/ethos" element={<Ethos />} />
          <Route path="/first-door" element={<FirstDoor />} />
          <Route path="/motion" element={<Motion />} />
          <Route path="/ocean" element={<Ocean />} />
          <Route path="/quiet-grove" element={<QuietGrove />} />
          <Route path="/ruins" element={<Ruins />} />
          <Route path="/shimmer" element={<Shimmer />} />
          <Route path="/spiral-grove" element={<SpiralGrove />} />
          <Route path="/drift-systems" element={<SystemChamber />} />
          <Route path="/drift-chamber" element={<SystemChamber />} />
          <Route path="/collapse-chamber" element={<SystemChamber />} />
          <Route path="/glyphs/hourglass" element={<HourglassGlyph />} />
          <Route path="/glyphs" element={<GlyphArchive />} />
          <Route path="/rohg" element={<Rohg />} />
          <Route path="/snail-band-clearing" element={<SnailBand />} />
          <Route path="/cabin-of-moss" element={<CabinOfMoss />} />
          <Route path="/lanternroot-conservatory" element={<LanternrootConservatory />} />
          <Route path="/old-forest-trek" element={<OldForestTrek />} />
          <Route path="/wildflower-drift" element={<WildflowerDrift />} />
          <Route path="/rava" element={<Rava />} />
          <Route path="/branches/:branchId" element={<Dashboard />} />
          <Route path="/world" element={<WorldMap />} />
          <Route path="/world/map" element={<WorldMap />} />
          <Route path="/world/garden" element={<GardenPage />} />
          <Route path="/world/ella" element={<EllaPage />} />
          <Route path="/world/chambers" element={<ChambersIndexPage />} />
          <Route path="/world/chambers/:id" element={<ChamberPage />} />
            <Route path="*" element={<main className="route-loading">This route is unavailable.</main>} />
            </Routes>
          </SlitRouteForm>
        </Suspense>
      </SlitPassage>
    </BrowserRouter>
  )
}
