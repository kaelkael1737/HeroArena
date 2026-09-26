import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { computeRarityScore, generateHero } from './heroGenerator'
import { createRng } from './rng'

describe('generateHero', () => {
  it('respecte la fourchette d\'attributs de la rareté demandée', () => {
    for (const rarity of ['commun', 'peu_commun', 'rare', 'epique', 'legendaire'] as const) {
      const [min, max] = config.heroes.attributeSumRangeByRarity[rarity]
      for (let seed = 0; seed < 20; seed += 1) {
        const hero = generateHero(rarity, createRng(seed), `test-${rarity}-${seed}`)
        const sum = Object.values(hero.permanent.base).reduce((a, b) => a + b, 0)
        expect(sum).toBeGreaterThanOrEqual(min)
        expect(sum).toBeLessThanOrEqual(max)
        expect(hero.permanent.rarity).toBe(rarity)
      }
    }
  })

  it('démarre au niveau 0 avec un historique vierge', () => {
    const hero = generateHero('rare', createRng(1), 'test-fresh')
    expect(hero.progression.level).toBe(0)
    expect(hero.progression.xp).toBe(0)
    expect(hero.history.totalWins).toBe(0)
  })

  it('est déterministe pour une graine donnée', () => {
    const a = generateHero('epique', createRng(42), 'x')
    const b = generateHero('epique', createRng(42), 'x')
    expect(a).toEqual(b)
  })

  it('calcule le rarityScore de façon cohérente (la Chance compte davantage)', () => {
    const hero = generateHero('rare', createRng(5), 'test-score')
    expect(hero.permanent.rarityScore).toBe(computeRarityScore(hero.permanent.base))
  })
})
