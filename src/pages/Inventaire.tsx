import { recipes, resources } from '../game/config'
import { useGameStore } from '../game/store'
import { Panel } from '../ui/Panel'

const rarityColor: Record<string, string> = {
  commune: 'text-neutral-300',
  peu_commune: 'text-emerald-400',
  rare: 'text-sky-400',
  legendaire: 'text-amber-400',
}

export default function Inventaire() {
  const resourceStock = useGameStore((s) => s.resources)
  const equipment = useGameStore((s) => s.equipmentInventory)
  const equippedByHero = useGameStore((s) => s.equippedByHero)
  const currentSeasonId = useGameStore((s) => s.currentSeasonId)

  const equippedInstanceIds = new Set(
    Object.values(equippedByHero).flatMap((slots) => Object.values(slots).filter(Boolean)),
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Inventaire</h1>

      <Panel title="Ressources">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {resources.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <span className={rarityColor[r.rarity]}>{r.name}</span>
              <span className="tabular-nums text-neutral-300">{resourceStock[r.id] ?? 0}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Équipement">
        {equipment.length === 0 && <p className="text-neutral-500">Aucun équipement fabriqué.</p>}
        <div className="space-y-2">
          {equipment.map((item) => {
            const recipe = recipes.find((r) => r.id === item.recipeId)
            const isEquipped = equippedInstanceIds.has(item.instanceId)
            const usable = !item.seasonId || item.seasonId === currentSeasonId
            return (
              <div
                key={item.instanceId}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{recipe?.name ?? item.recipeId}</span>
                  <span className="ml-2 text-xs text-neutral-500">({recipe?.slot})</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {isEquipped && <span className="text-amber-400">Équipé</span>}
                  {!usable && <span className="text-red-400">Périmé (saison précédente)</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
