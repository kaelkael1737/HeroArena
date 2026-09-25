import { config } from '../game/config'
import { useGameStore } from '../game/store'
import { Panel } from '../ui/Panel'

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

function formatDuration(ms: number): string {
  if (ms <= 0) return '0h'
  const days = Math.floor(ms / DAY_MS)
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS)
  if (days > 0) return `${days}j ${hours}h`
  const minutes = Math.floor((ms % HOUR_MS) / (60 * 1000))
  return `${hours}h ${minutes}min`
}

export default function Accueil() {
  const currentSeasonId = useGameStore((s) => s.currentSeasonId)
  const seasonStartedAt = useGameStore((s) => s.seasonStartedAt)
  const now = useGameStore((s) => s.now)
  const tournament = useGameStore((s) => s.tournament)
  const heroesCount = useGameStore((s) => s.heroes.length)

  const seasonEndsAt = seasonStartedAt + config.season.durationDays * DAY_MS
  const tournamentEndsAt = seasonEndsAt + config.season.tournamentDurationHours * HOUR_MS

  let phase: 'saison' | 'tournoi' | 'termine' = 'saison'
  if (now >= tournamentEndsAt) phase = 'termine'
  else if (now >= seasonEndsAt) phase = 'tournoi'

  return (
    <div className="space-y-6">
      <Panel>
        <h1 className="text-2xl font-bold text-amber-400">Hero Arena</h1>
        <p className="mt-1 text-neutral-400">
          Prototype (phase 1, données simulées) — pas encore connecté à la blockchain WAX.
        </p>
      </Panel>

      <Panel title={`Saison ${currentSeasonId}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm text-neutral-500">Statut</div>
            <div className="text-lg font-medium">
              {phase === 'saison' && 'En cours'}
              {phase === 'tournoi' && 'Tournoi en cours'}
              {phase === 'termine' && 'Terminée — nouvelle saison à démarrer'}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">
              {phase === 'saison' ? 'Fin de saison dans' : 'Fin du tournoi dans'}
            </div>
            <div className="text-lg font-medium">
              {phase === 'saison' && formatDuration(seasonEndsAt - now)}
              {phase === 'tournoi' && formatDuration(tournamentEndsAt - now)}
              {phase === 'termine' && '—'}
            </div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Héros actifs</div>
            <div className="text-lg font-medium">{heroesCount}</div>
          </div>
        </div>
        {tournament?.champion && (
          <p className="mt-4 rounded-md bg-amber-500/10 px-3 py-2 text-amber-300">
            Champion de la saison : <strong>{tournament.champion}</strong>
          </p>
        )}
      </Panel>
    </div>
  )
}
