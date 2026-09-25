import { config } from '../config'
import type { HeroSeasonal } from '../types'

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
  seasonal: HeroSeasonal
  levelsGained: number
  tiersReached: number[]
}

/** Applique un gain d'XP à un héros, gère les montées de niveau (potentiellement multiples) et les points à répartir. */
export function applyXpGain(seasonal: HeroSeasonal, xpGained: number): XpGainResult {
  const newXp = seasonal.xp + xpGained
  const newLevel = levelFromXp(newXp)
  const levelsGained = newLevel - seasonal.level
  const tiersReached = config.evolution.tiers.filter(
    (tier) => tier > seasonal.level && tier <= newLevel,
  )

  return {
    seasonal: {
      ...seasonal,
      xp: newXp,
      level: newLevel,
      unspentPoints: seasonal.unspentPoints + levelsGained * config.xp.pointsPerLevel,
    },
    levelsGained,
    tiersReached: [...tiersReached],
  }
}
