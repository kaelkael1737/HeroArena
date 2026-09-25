import { recipes } from '../config'
import type { EquipmentItem, Hero, HeroAttributes } from '../types'
import { isEquipmentUsable } from './season'

function addAttributes(a: HeroAttributes, b: Partial<HeroAttributes>): HeroAttributes {
  return {
    luck: a.luck + (b.luck ?? 0),
    strength: a.strength + (b.strength ?? 0),
    health: a.health + (b.health ?? 0),
    energy: a.energy + (b.energy ?? 0),
    agility: a.agility + (b.agility ?? 0),
  }
}

/** Attributs de base + bonus saisonniers répartis par le joueur, sans équipement. */
export function getTotalAttributes(hero: Hero): HeroAttributes {
  return addAttributes(hero.permanent.base, hero.seasonal.bonus)
}

/** Attributs effectifs pour le combat/les missions : base + bonus saisonniers + équipement porté et valide cette saison. */
export function getEffectiveAttributes(
  hero: Hero,
  equippedItems: EquipmentItem[],
  currentSeasonId: number,
): HeroAttributes {
  let total = getTotalAttributes(hero)
  for (const item of equippedItems) {
    if (!isEquipmentUsable(item, currentSeasonId)) continue
    const recipe = recipes.find((r) => r.id === item.recipeId)
    if (!recipe) continue
    total = addAttributes(total, recipe.effect.bonus)
  }
  return total
}
