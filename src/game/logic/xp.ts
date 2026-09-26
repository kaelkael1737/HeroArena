import { config } from '../config'
import type { HeroProgression } from '../types'

/** XP total requis pour atteindre `level` depuis le niveau 0. */
export function xpRequiredForLevel(level: number): number {
  if (level <= 0) return 0
  return config.xp.xpForLevel(level)
}

export function levelFromXp(xp: number): number {
  let level = 0
  while (xpRequiredForLevel(level + 1) <= xp) {
    level += 1
  }
  return level
}

export interface XpGainResult {
  progression: HeroProgression
  levelsGained: number
  tiersReached: number[]
}

/**
 * Applique un gain d'XP à un héros, gère les montées de niveau (potentiellement multiples) et
 * les points à répartir. Le niveau est plafonné à `levelCap` (verrou de fusion) : l'XP au-delà
 * du seuil du plafond n'est pas accumulé.
 */
export function applyXpGain(progression: HeroProgression, xpGained: number, levelCap = Infinity): XpGainResult {
  const capXp = xpRequiredForLevel(levelCap)
  const newXp = Math.min(progression.xp + xpGained, capXp)
  const newLevel = Math.min(levelFromXp(newXp), levelCap)
  const levelsGained = newLevel - progression.level
  const tiersReached = config.evolution.tiers.filter(
    (tier) => tier > progression.level && tier <= newLevel,
  )

  return {
    progression: {
      ...progression,
      xp: newXp,
      level: newLevel,
      unspentPoints: progression.unspentPoints + levelsGained * config.xp.pointsPerLevel,
    },
    levelsGained,
    tiersReached: [...tiersReached],
  }
}
