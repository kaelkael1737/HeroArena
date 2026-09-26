import { zones } from '../game/config'
import { useGameStore } from '../game/store'
import { Button, Panel } from '../ui/Panel'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export default function Debug() {
  const now = useGameStore((s) => s.now)
  const seasonStartedAt = useGameStore((s) => s.seasonStartedAt)
  const currentSeasonId = useGameStore((s) => s.currentSeasonId)
  const missions = useGameStore((s) => s.missions)
  const heroes = useGameStore((s) => s.heroes)
  const advanceTime = useGameStore((s) => s.advanceTime)
  const finishMissionInstantly = useGameStore((s) => s.finishMissionInstantly)
  const jumpToTournament = useGameStore((s) => s.jumpToTournament)
  const startNewSeason = useGameStore((s) => s.startNewSeason)
  const grantResources = useGameStore((s) => s.grantResources)

  const activeMissions = missions.filter((m) => !m.claimed && m.endsAt > now)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-red-400">Debug (phase 1 uniquement)</h1>

      <Panel title="Temps">
        <p className="mb-3 text-sm text-neutral-500">
          Saison {currentSeasonId} — démarrée à {new Date(seasonStartedAt).toLocaleString('fr-FR')} — horloge simulée : {new Date(now).toLocaleString('fr-FR')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => advanceTime(HOUR_MS)}>+ 1 heure</Button>
          <Button variant="secondary" onClick={() => advanceTime(8 * HOUR_MS)}>+ 8 heures</Button>
          <Button variant="secondary" onClick={() => advanceTime(DAY_MS)}>+ 1 jour</Button>
          <Button variant="secondary" onClick={() => advanceTime(7 * DAY_MS)}>+ 7 jours</Button>
          <Button onClick={jumpToTournament}>Sauter à la fin de saison (tournoi)</Button>
        </div>
      </Panel>

      <Panel title="Missions en cours">
        {activeMissions.length === 0 && <p className="text-neutral-500">Aucune mission active.</p>}
        <div className="space-y-2">
          {activeMissions.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <span>
                {heroes.find((h) => h.permanent.id === m.heroId)?.permanent.name ?? m.heroId} — {zones[m.zoneId].name}
              </span>
              <Button variant="secondary" onClick={() => finishMissionInstantly(m.id)}>
                Terminer instantanément
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Ressources">
        <p className="mb-3 text-sm text-neutral-500">
          Pour tester l'amélioration et la fusion d'équipement sans passer par des dizaines de missions.
        </p>
        <Button variant="secondary" onClick={() => grantResources(100)}>+ 100 de chaque ressource</Button>
      </Panel>

      <Panel title="Saison">
        <p className="mb-3 text-sm text-neutral-500">
          Les héros et l'équipement gardent toute leur progression : une nouvelle saison ne fait
          qu'ouvrir un nouveau tournoi et relancer le classement.
        </p>
        <Button variant="danger" onClick={startNewSeason}>
          Démarrer une nouvelle saison
        </Button>
      </Panel>
    </div>
  )
}
