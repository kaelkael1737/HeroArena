import type { HeroAttributes } from '../types'
import { createRng, randomInt } from './rng'

export interface CombatantInput {
  id: string
  level: number
  attributes: HeroAttributes
}

export interface CombatOutcome {
  scoreA: number
  scoreB: number
  winnerId: string
  seed: number
}

/**
 * Score de combat d'un héros pour une graine de RNG déjà positionnée :
 * 1. tire un facteur de chance entre 1 et la Chance totale
 * 2. pour chaque attribut (Force, Santé, Énergie, Agilité), tire un nombre entre 1 et sa valeur, multiplié par le facteur de chance
 * 3. additionne, puis multiplie par le niveau
 */
export function computeCombatScore(level: number, attributes: HeroAttributes, rng: () => number): number {
  const luckFactor = randomInt(rng, 1, Math.max(1, attributes.luck))
  const rolls = [attributes.strength, attributes.health, attributes.energy, attributes.agility]
  const sum = rolls.reduce((acc, value) => acc + randomInt(rng, 1, Math.max(1, value)) * luckFactor, 0)
  return sum * Math.max(1, level)
}

/** Résout un combat 1 contre 1 à partir d'une graine : reproductible pour le replay. */
export function resolveCombat(a: CombatantInput, b: CombatantInput, seed: number): CombatOutcome {
  const rng = createRng(seed)
  const scoreA = computeCombatScore(a.level, a.attributes, rng)
  const scoreB = computeCombatScore(b.level, b.attributes, rng)
  return {
    scoreA,
    scoreB,
    winnerId: scoreA >= scoreB ? a.id : b.id,
    seed,
  }
}
