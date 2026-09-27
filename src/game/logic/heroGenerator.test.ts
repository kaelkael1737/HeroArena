import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { computeRarityScore, generateHero } from './heroGenerator'
import { createRng } from './rng'

const rarityOrder = ['commun', 'peu_commun', 'rare', 'epique', 'legendaire'] as const

describe('generateHero', () => {
  it('chaque attribut individuel reste dans la plage de la rareté demandée', () => {
    for (const rarity of rarityOrder) {
      const [min, max] = config.heroes.attributeRangeByRarity[rarity]
      for (let seed = 0; seed < 20; seed += 1) {
        const hero = generateHero(rarity, createRng(seed), `test-${rarity}-${seed}`)
        for (const value of Object.values(hero.permanent.base)) {
          expect(value).toBeGreaterThanOrEqual(min)
          expect(value).toBeLessThanOrEqual(max)
        }
        expect(hero.permanent.rarity).toBe(rarity)
      }
    }
  })

  it('les plages de raretés sont contiguës et ne se chevauchent jamais', () => {
    for (let i = 0; i < rarityOrder.length - 1; i += 1) {
      const [, maxBelow] = config.heroes.attributeRangeByRarity[rarityOrder[i]]
      const [minAbove] = config.heroes.attributeRangeByRarity[rarityOrder[i + 1]]
      expect(minAbove).toBe(maxBelow)
    }
  })

  it('un héros commun ne peut jamais surpasser un héros peu commun sur un attribut', () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const commun = generateHero('commun', createRng(seed), 'c')
      const peuCommun = generateHero('peu_commun', createRng(seed + 1000), 'p')
      for (const key of Object.keys(commun.permanent.base) as (keyof typeof commun.permanent.base)[]) {
        expect(commun.permanent.base[key]).toBeLessThanOrEqual(peuCommun.permanent.base[key])
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
