import { describe, expect, it } from 'vitest'
import { applySeasonReset, isEquipmentUsable } from './season'
import { makeHero } from './fixtures'

describe('applySeasonReset', () => {
  it('ne touche pas un héros déjà à jour pour la saison', () => {
    const hero = makeHero({ seasonal: { seasonId: 2, level: 5, xp: 999, unspentPoints: 3, bonus: { luck: 1, strength: 1, health: 1, energy: 1, agility: 1 } } })
    const result = applySeasonReset(hero, 2)
    expect(result).toBe(hero)
  })

  it('remet la progression saisonnière à zéro pour une nouvelle saison', () => {
    const hero = makeHero({ seasonal: { seasonId: 1, level: 5, xp: 999, unspentPoints: 3, bonus: { luck: 1, strength: 1, health: 1, energy: 1, agility: 1 } } })
    const result = applySeasonReset(hero, 2)
    expect(result.seasonal).toEqual({
      seasonId: 2,
      level: 0,
      xp: 0,
      unspentPoints: 0,
      bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 },
    })
  })

  it('conserve les données permanentes et l\'historique', () => {
    const hero = makeHero({ history: { bestRank: 1, totalWins: 10, titles: ['Champion'], badges: ['or'] } })
    const result = applySeasonReset(hero, 99)
    expect(result.permanent).toBe(hero.permanent)
    expect(result.history).toBe(hero.history)
  })
})

describe('isEquipmentUsable', () => {
  it('est utilisable si fabriqué pendant la saison en cours', () => {
    expect(isEquipmentUsable({ instanceId: 'a', recipeId: 'epee_fer', seasonId: 3 }, 3)).toBe(true)
  })

  it('devient inutilisable une fois la saison changée', () => {
    expect(isEquipmentUsable({ instanceId: 'a', recipeId: 'epee_fer', seasonId: 2 }, 3)).toBe(false)
  })
})
