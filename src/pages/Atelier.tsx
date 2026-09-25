import { useState } from 'react'
import { recipes, resources, smeltingRecipes } from '../game/config'
import { canCraft, canSmelt } from '../game/logic/crafting'
import { useGameStore } from '../game/store'
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
  const equipItem = useGameStore((s) => s.equipItem)

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

      <Panel title="Recettes">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="rounded-md border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{recipe.name}</span>
                <span className="text-xs text-neutral-500">{recipe.slot}</span>
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
            return (
              <div key={item.instanceId} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
                <span>
                  {recipe?.name ?? item.recipeId} <span className="text-xs text-neutral-500">({recipe?.slot})</span>
                </span>
                <Button variant="secondary" onClick={() => equipItem(selectedHero, item.instanceId)}>
                  Équiper
                </Button>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
