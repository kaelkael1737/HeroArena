import { canAttack } from '../game/logic/raid'
import { LOCAL_PLAYER_ID, useGameStore } from '../game/store'
import { Panel } from '../ui/Panel'

const rarityLabels: Record<string, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

export default function Accueil() {
  const heroes = useGameStore((s) => s.heroes)
  const monsters = useGameStore((s) => s.monsters)
  const raidRewards = useGameStore((s) => s.raidRewards)

  const myShare = raidRewards[LOCAL_PLAYER_ID] ?? 0

  const myMonsterIds = new Set(
    heroes.flatMap((h) =>
      monsters.filter((m) => canAttack(h.permanent.rarity, h.progression.level, m)).map((m) => m.id),
    ),
  )
  const myMonsters = monsters.filter((m) => myMonsterIds.has(m.id))

  return (
    <div className="space-y-6">
      <Panel>
        <h1 className="text-2xl font-bold text-amber-400">Hero Arena</h1>
        <p className="mt-1 text-neutral-400">
          Prototype (phase 1, données simulées) — pas encore connecté à la blockchain WAX.
        </p>
      </Panel>

      <Panel title="Chasse aux monstres">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm text-neutral-500">Monstres actifs</div>
            <div className="text-lg font-medium">{monsters.length}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Tes monstres attaquables</div>
            <div className="text-lg font-medium">{myMonsters.length}</div>
          </div>
          <div>
            <div className="text-sm text-neutral-500">Cagnotte gagnée (cumulée)</div>
            <div className="text-lg font-medium text-amber-400">{myShare} part(s)</div>
          </div>
        </div>

        {myMonsters.length > 0 && (
          <div className="mt-4 space-y-2">
            {myMonsters.slice(0, 6).map((m) => {
              const pct = Math.max(0, Math.round((m.currentHp / m.maxHp) * 100))
              return (
                <div key={m.id} className="text-sm">
                  <div className="mb-1 flex justify-between text-xs text-neutral-500">
                    <span>{rarityLabels[m.rarity]} — niveau {m.levelBracket}</span>
                    <span>{pct}% PV</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                    <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
