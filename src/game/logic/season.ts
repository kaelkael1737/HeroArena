import { config } from '../config'
import type { EquipmentItem, Hero, HeroSeasonal } from '../types'

const zeroAttributes = { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 }

function freshSeasonal(seasonId: number): HeroSeasonal {
  return {
    seasonId,
    level: 0,
    xp: 0,
    unspentPoints: 0,
    bonus: { ...zeroAttributes },
  }
}

/**
 * Reset paresseux : si le héros n'a pas encore été touché cette saison, sa progression
 * saisonnière repart de zéro. Les données permanentes et l'historique sont conservés.
 */
export function applySeasonReset(hero: Hero, currentSeasonId: number): Hero {
  if (hero.seasonal.seasonId === currentSeasonId) {
    return hero
  }
  return {
    ...hero,
    seasonal: freshSeasonal(currentSeasonId),
  }
}

/** Un équipement saisonnier devient inutilisable dès que la saison change. */
export function isEquipmentUsable(item: EquipmentItem, currentSeasonId: number): boolean {
  if (!config.equipment.seasonal) return true
  return item.seasonId === currentSeasonId
}
