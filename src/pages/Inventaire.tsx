import { config, recipes, resourceNftTemplates, resources, zones } from '../game/config'
import { nftLevelCap } from '../game/logic/resourceNfts'
import { useGameStore } from '../game/store'
import { Panel } from '../ui/Panel'

const rarityColor: Record<string, string> = {
  commune: 'text-neutral-300',
  peu_commune: 'text-emerald-400',
  rare: 'text-sky-400',
  epique: 'text-purple-400',
  legendaire: 'text-amber-400',
}

const equipmentRarityColor: Record<string, string> = {
  commun: 'text-neutral-300',
  peu_commun: 'text-emerald-400',
  rare: 'text-sky-400',
  epique: 'text-purple-400',
  legendaire: 'text-amber-400',
}

export default function Inventaire() {
  const resourceStock = useGameStore((s) => s.resources)
  const equipment = useGameStore((s) => s.equipmentInventory)
  const equippedByHero = useGameStore((s) => s.equippedByHero)
  const resourceNfts = useGameStore((s) => s.resourceNfts)

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
        <p className="mb-3 text-sm text-neutral-500">
          NFT permanents : ils ne périment jamais entre les saisons. Amélioration et fusion se
          gèrent depuis l'Atelier.
        </p>
        {equipment.length === 0 && <p className="text-neutral-500">Aucun équipement fabriqué.</p>}
        <div className="space-y-2">
          {equipment.map((item) => {
            const recipe = recipes.find((r) => r.id === item.recipeId)
            const isEquipped = equippedInstanceIds.has(item.instanceId)
            const cap = recipe ? config.equipment.levelCapByRarity[recipe.rarity] : undefined
            return (
              <div
                key={item.instanceId}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{recipe?.name ?? item.recipeId}</span>
                  <span className={`ml-2 text-xs ${recipe ? equipmentRarityColor[recipe.rarity] : ''}`}>
                    {recipe?.rarity} · {recipe?.slot}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neutral-500">
                    Niveau {item.level}
                    {cap !== undefined && <span className="text-neutral-600"> / {cap}</span>}
                  </span>
                  {isEquipped && <span className="text-amber-400">Équipé</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel title="NFT d'exploration">
        <p className="mb-3 text-sm text-neutral-500">
          Se gèrent depuis Missions (mission, fusion). Un héros ne peut jamais les remplacer.
        </p>
        {resourceNfts.length === 0 && <p className="text-neutral-500">Aucun NFT d'exploration possédé.</p>}
        <div className="space-y-2">
          {resourceNfts.map((nft) => {
            const template = resourceNftTemplates.find((t) => t.id === nft.templateId)
            return (
              <div
                key={nft.instanceId}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium">{template?.name ?? nft.templateId}</span>
                  <span className={`ml-2 text-xs ${template ? equipmentRarityColor[template.rarity] : ''}`}>
                    {template?.rarity} · {template ? zones[template.zoneId].name : ''}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  Niveau {nft.level}
                  {template && <span className="text-neutral-600"> / {nftLevelCap(template)}</span>}
                </span>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
