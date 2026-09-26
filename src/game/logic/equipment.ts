import { config, recipes } from '../config'
import type { EquipmentItem, HeroAttributes, Recipe } from '../types'
import { nextRarity } from './rarity'
import type { ResourceStock } from './crafting'

function findRecipe(recipeId: string): Recipe {
  const recipe = recipes.find((r) => r.id === recipeId)
  if (!recipe) throw new Error(`Gabarit d'équipement inconnu : ${recipeId}`)
  return recipe
}

export function equipmentLevelCap(recipe: Recipe): number {
  return config.equipment.levelCapByRarity[recipe.rarity]
}

/** Bonus effectif d'un équipement à un niveau donné (croît avec le niveau, voir config). */
export function equipmentBonusAtLevel(recipe: Recipe, level: number): Partial<HeroAttributes> {
  const growth = 1 + (level - 1) * config.equipment.bonusGrowthPerLevel
  const bonus: Partial<HeroAttributes> = {}
  for (const [key, value] of Object.entries(recipe.effect.bonus)) {
    bonus[key as keyof HeroAttributes] = Math.round((value ?? 0) * growth)
  }
  return bonus
}

/** Coût en ressources pour passer l'objet du niveau courant au niveau suivant. */
export function upgradeCost(recipe: Recipe, currentLevel: number) {
  const factor = currentLevel * config.equipment.upgradeCostGrowthPerLevel
  return recipe.ingredients.map((ing) => ({
    resourceId: ing.resourceId,
    quantity: Math.ceil(ing.quantity * factor),
  }))
}

export function canUpgradeEquipment(stock: ResourceStock, item: EquipmentItem): boolean {
  const recipe = findRecipe(item.recipeId)
  if (item.level >= equipmentLevelCap(recipe)) return false
  const cost = upgradeCost(recipe, item.level)
  return cost.every((ing) => (stock[ing.resourceId] ?? 0) >= ing.quantity)
}

export function upgradeEquipment(stock: ResourceStock, item: EquipmentItem): { stock: ResourceStock; item: EquipmentItem } {
  const recipe = findRecipe(item.recipeId)
  const cap = equipmentLevelCap(recipe)
  if (item.level >= cap) throw new Error('Cet équipement est déjà au niveau maximum de sa rareté.')
  const cost = upgradeCost(recipe, item.level)
  const nextStock = { ...stock }
  for (const ing of cost) {
    if ((nextStock[ing.resourceId] ?? 0) < ing.quantity) throw new Error('Ressources insuffisantes pour améliorer cet équipement.')
    nextStock[ing.resourceId] -= ing.quantity
  }
  return { stock: nextStock, item: { ...item, level: item.level + 1 } }
}

/** Les items doivent être du même gabarit (donc même emplacement + rareté) et tous au niveau max. */
export function canFuseEquipment(items: EquipmentItem[]): boolean {
  if (items.length !== config.fusion.itemsRequired) return false
  const recipe = findRecipe(items[0].recipeId)
  if (!nextRarity(recipe.rarity)) return false
  const cap = equipmentLevelCap(recipe)
  return items.every((item) => item.recipeId === items[0].recipeId && item.level >= cap)
}

export function fuseEquipment(items: EquipmentItem[], idFactory: () => string = () => crypto.randomUUID()): EquipmentItem {
  if (!canFuseEquipment(items)) throw new Error('Fusion impossible : il faut 3 équipements identiques au niveau maximum.')
  const recipe = findRecipe(items[0].recipeId)
  const targetRarity = nextRarity(recipe.rarity)
  const targetRecipe = recipes.find((r) => r.slot === recipe.slot && r.rarity === targetRarity)
  if (!targetRecipe) throw new Error(`Aucun gabarit d'équipement pour ${recipe.slot} en rareté ${targetRarity}.`)
  return { instanceId: idFactory(), recipeId: targetRecipe.id, level: 1 }
}
