import { NavLink, Route, Routes } from 'react-router-dom'
import { useGameClock } from './game/clock'
import Accueil from './pages/Accueil'
import MesHeros from './pages/MesHeros'
import Missions from './pages/Missions'
import Inventaire from './pages/Inventaire'
import Atelier from './pages/Atelier'
import Arene from './pages/Arene'
import Classement from './pages/Classement'
import Debug from './pages/Debug'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/heros', label: 'Mes héros' },
  { to: '/missions', label: 'Missions' },
  { to: '/inventaire', label: 'Inventaire' },
  { to: '/atelier', label: 'Atelier' },
  { to: '/arene', label: 'Arène' },
  { to: '/classement', label: 'Classement' },
  { to: '/debug', label: 'Debug' },
]

function App() {
  useGameClock()

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/60">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3">
          <span className="mr-4 shrink-0 font-bold tracking-wide text-amber-400">Hero Arena</span>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/heros" element={<MesHeros />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/inventaire" element={<Inventaire />} />
          <Route path="/atelier" element={<Atelier />} />
          <Route path="/arene" element={<Arene />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/debug" element={<Debug />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
