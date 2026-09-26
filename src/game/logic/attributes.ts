import { recipes } from '../config'
import type { EquipmentItem, Hero, HeroAttributes } from '../types'
import { equipmentBonusAtLevel } from './equipment'

function addAttributes(a: HeroAttributes, b: Partial<HeroAttributes>): HeroAttributes {
  return {
    luck: a.luck + (b.luck ?? 0),
    strength: a.strength + (b.strength ?? 0),
    health: a.health + (b.health ?? 0),
    energy: a.energy + (b.energy ?? 0),
    agility: a.agility + (b.agility ?? 0),
  }
}

/** Attributs de base du héros, sans équipement. Le niveau ne modifie jamais les attributs. */
export function getTotalAttributes(hero: Hero): HeroAttributes {
  return hero.permanent.base
}

/** Attributs effectifs pour le combat/les missions : base + équipement porté (NFT permanent). */
export function getEffectiveAttributes(hero: Hero, equippedItems: EquipmentItem[]): HeroAttributes {
  let total = getTotalAttributes(hero)
  for (const item of equippedItems) {
    const recipe = recipes.find((r) => r.id === item.recipeId)
    if (!recipe) continue
    total = addAttributes(total, equipmentBonusAtLevel(recipe, item.level))
  }
  return total
}
