import { zones } from '../game/config'
import { useGameStore } from '../game/store'
import { Button, Panel } from '../ui/Panel'

const speedPresets = [1, 60, 500, 2000]

const rarityLabels: Record<string, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

export default function Debug() {
  const now = useGameStore((s) => s.now)
  const missions = useGameStore((s) => s.missions)
  const heroes = useGameStore((s) => s.heroes)
  const clockRunning = useGameStore((s) => s.clockRunning)
  const clockSpeed = useGameStore((s) => s.clockSpeed)
  const setClockRunning = useGameStore((s) => s.setClockRunning)
  const setClockSpeed = useGameStore((s) => s.setClockSpeed)
  const finishMissionInstantly = useGameStore((s) => s.finishMissionInstantly)
  const grantResources = useGameStore((s) => s.grantResources)
  const monsters = useGameStore((s) => s.monsters)
  const debugDamageMonster = useGameStore((s) => s.debugDamageMonster)

  const activeMissions = missions.filter((m) => !m.claimed && m.endsAt > now)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-red-400">Debug (phase 1 uniquement)</h1>

      <Panel title="Horloge">
        <p className="mb-3 text-sm text-neutral-500">
          Horloge simulée :{' '}
          <span className="tabular-nums text-neutral-300">{new Date(now).toLocaleString('fr-FR')}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={clockRunning ? 'secondary' : 'primary'} onClick={() => setClockRunning(!clockRunning)}>
            {clockRunning ? '⏸ Pause' : '▶ Lecture'}
          </Button>
          <span className="text-xs text-neutral-500">Vitesse :</span>
          {speedPresets.map((speed) => (
            <Button
              key={speed}
              variant={clockSpeed === speed ? 'primary' : 'secondary'}
              onClick={() => setClockSpeed(speed)}
            >
              x{speed}
            </Button>
          ))}
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

      <Panel title="Monstres">
        <p className="mb-3 text-sm text-neutral-500">
          Avec seulement quelques participants simulés, un monstre met des heures réelles à mourir
          même à x2000. Ce raccourci inflige de gros dégâts sans les attribuer à personne (la
          cagnotte reste répartie entre les vrais participants) pour tester la mort/renaissance.
        </p>
        <div className="space-y-1">
          {monsters.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <span>
                {rarityLabels[m.rarity]} — niveau {m.levelBracket} ({Math.round((m.currentHp / m.maxHp) * 100)}% PV)
              </span>
              <Button variant="secondary" onClick={() => debugDamageMonster(m.id, Math.round(m.maxHp * 0.9))}>
                -90 % PV
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
