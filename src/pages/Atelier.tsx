import { useState } from 'react'
import { config, recipes, resources, smeltingRecipes } from '../game/config'
import { canCraft, canSmelt } from '../game/logic/crafting'
import { canUpgradeEquipment, equipmentLevelCap, upgradeCost } from '../game/logic/equipment'
import { nextRarity } from '../game/logic/rarity'
import { useGameStore } from '../game/store'
import type { EquipmentItem } from '../game/types'
import { Button, Panel } from '../ui/Panel'

function resourceName(id: string): string {
  return resources.find((r) => r.id === id)?.name ?? id
}

export default function Atelier() {
  const resourceStock = useGameStore((s) => s.resources)
  const craftItem = useGameStore((s) => s.craftItem)
  const smeltResource = useGameStore((s) => s.smeltResource)
  const heroes = useGameStore((s) => s.heroes)
  const heroIds = heroes.map((h) => h.permanent.id)
  const equipment = useGameStore((s) => s.equipmentInventory)
  const equippedByHero = useGameStore((s) => s.equippedByHero)
  const equipItem = useGameStore((s) => s.equipItem)
  const upgradeEquipmentItem = useGameStore((s) => s.upgradeEquipmentItem)
  const fuseEquipmentItems = useGameStore((s) => s.fuseEquipmentItems)

  const [selectedHero, setSelectedHero] = useState(heroIds[0])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Atelier</h1>

      <Panel title="Fonte">
        <div className="space-y-2">
          {smeltingRecipes.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <span>
                {r.output.quantity} {resourceName(r.output.resourceId)} ← {r.input.quantity}{' '}
                {resourceName(r.input.resourceId)}
              </span>
              <Button disabled={!canSmelt(resourceStock, r.id)} onClick={() => smeltResource(r.id)}>
                Fondre
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Fabriquer un équipement neuf (niveau 1)">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-md border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{recipe.name}</span>
                <span className="text-xs text-neutral-500">{recipe.slot} · {recipe.rarity}</span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {recipe.ingredients.map((i) => `${i.quantity} ${resourceName(i.resourceId)}`).join(' + ')}
              </p>
              <div className="mt-2 flex justify-end">
                <Button disabled={!canCraft(resourceStock, recipe.id)} onClick={() => craftItem(recipe.id)}>
                  Fabriquer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <UpgradePanel equipment={equipment} resourceStock={resourceStock} upgradeEquipmentItem={upgradeEquipmentItem} />

      <FusionPanel equipment={equipment} fuseEquipmentItems={fuseEquipmentItems} />

      <Panel title="Équiper">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">Héros</span>
          <select
            className="w-fit rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5"
            value={selectedHero}
            onChange={(e) => setSelectedHero(e.target.value)}
          >
            {heroes.map((h) => (
              <option key={h.permanent.id} value={h.permanent.id}>
                {h.permanent.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 space-y-2">
          {equipment.length === 0 && <p className="text-neutral-500">Aucun équipement disponible.</p>}
          {equipment.map((item) => {
            const recipe = recipes.find((r) => r.id === item.recipeId)
            const ownerId = Object.entries(equippedByHero).find(([, slots]) =>
              Object.values(slots).includes(item.instanceId),
            )?.[0]
            const ownerName = ownerId ? heroes.find((h) => h.permanent.id === ownerId)?.permanent.name : undefined
            const equippedOnSelected = ownerId === selectedHero
            return (
              <div key={item.instanceId} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
                <span>
                  {recipe?.name ?? item.recipeId}{' '}
                  <span className="text-xs text-neutral-500">({recipe?.slot}, niveau {item.level})</span>
                  {ownerName && (
                    <span className="ml-2 text-xs text-amber-400">Équipé sur {ownerName}</span>
                  )}
                </span>
                <Button
                  variant="secondary"
                  disabled={equippedOnSelected}
                  onClick={() => equipItem(selectedHero, item.instanceId)}
                >
                  {equippedOnSelected ? 'Équipé' : 'Équiper'}
                </Button>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function UpgradePanel({
  equipment,
  resourceStock,
  upgradeEquipmentItem,
}: {
  equipment: EquipmentItem[]
  resourceStock: Record<string, number>
  upgradeEquipmentItem: (instanceId: string) => void
}) {
  return (
    <Panel title="Améliorer">
      {equipment.length === 0 && <p className="text-neutral-500">Aucun équipement à améliorer.</p>}
      <div className="space-y-2">
        {equipment.map((item) => {
          const recipe = recipes.find((r) => r.id === item.recipeId)
          if (!recipe) return null
          const cap = equipmentLevelCap(recipe)
          const atCap = item.level >= cap
          const cost = atCap ? [] : upgradeCost(recipe, item.level)
          return (
            <div key={item.instanceId} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{recipe.name}</span>{' '}
                <span className="text-xs text-neutral-500">
                  niveau {item.level} / {cap}
                  {!atCap && <> — coût : {cost.map((i) => `${i.quantity} ${resourceName(i.resourceId)}`).join(' + ')}</>}
                </span>
              </div>
              <Button
                variant="secondary"
                disabled={atCap || !canUpgradeEquipment(resourceStock, item)}
                onClick={() => upgradeEquipmentItem(item.instanceId)}
              >
                {atCap ? 'Niveau max' : 'Améliorer'}
              </Button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function FusionPanel({
  equipment,
  fuseEquipmentItems,
}: {
  equipment: EquipmentItem[]
  fuseEquipmentItems: (instanceIds: string[]) => void
}) {
  const needed = config.fusion.itemsRequired
  const byRecipe = new Map<string, EquipmentItem[]>()
  for (const item of equipment) {
    const recipe = recipes.find((r) => r.id === item.recipeId)
    if (!recipe) continue
    if (item.level < equipmentLevelCap(recipe)) continue
    if (!nextRarity(recipe.rarity)) continue
    byRecipe.set(item.recipeId, [...(byRecipe.get(item.recipeId) ?? []), item])
  }
  const groups = [...byRecipe.entries()].filter(([, items]) => items.length >= needed)

  return (
    <Panel title="Fusionner">
      <p className="mb-3 text-sm text-neutral-500">
        {needed} équipements identiques au niveau maximum → 1 équipement de rareté supérieure, niveau 1.
      </p>
      {groups.length === 0 && <p className="text-neutral-600">Aucune fusion possible pour le moment.</p>}
      <div className="space-y-2">
        {groups.map(([recipeId, items]) => {
          const recipe = recipes.find((r) => r.id === recipeId)!
          const target = recipes.find((r) => r.slot === recipe.slot && r.rarity === nextRarity(recipe.rarity))
          return (
            <div key={recipeId} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <span>
                {items.length} × {recipe.name} (niveau max) → {target?.name}
              </span>
              <Button onClick={() => fuseEquipmentItems(items.slice(0, needed).map((i) => i.instanceId))}>
                Fusionner {needed}
              </Button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
