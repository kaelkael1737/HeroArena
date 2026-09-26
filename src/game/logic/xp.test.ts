import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { applyXpGain, levelFromXp, xpRequiredForLevel } from './xp'
import { makeHero } from './fixtures'

describe('xpRequiredForLevel', () => {
  it('vaut 0 au niveau 0', () => {
    expect(xpRequiredForLevel(0)).toBe(0)
  })

  it('suit la courbe arithmétique (15200 au niveau 1, +1500 par niveau)', () => {
    expect(xpRequiredForLevel(4)).toBe(config.xp.xpForLevel(4))
    expect(xpRequiredForLevel(1)).toBe(15_200)
    expect(xpRequiredForLevel(2) - xpRequiredForLevel(1)).toBe(15_200 + 1_500)
    expect(xpRequiredForLevel(3) - xpRequiredForLevel(2)).toBe(15_200 + 2 * 1_500)
  })
})

describe('levelFromXp', () => {
  it('reste à 0 sans XP', () => {
    expect(levelFromXp(0)).toBe(0)
  })

  it('monte de niveau une fois le seuil atteint', () => {
    const threshold = xpRequiredForLevel(5)
    expect(levelFromXp(threshold - 1)).toBe(4)
    expect(levelFromXp(threshold)).toBe(5)
  })
})

describe('applyXpGain', () => {
  it('accumule l\'XP sans monter de niveau si insuffisant', () => {
    const hero = makeHero({ progression: { level: 0, xp: 0, unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } } })
    const result = applyXpGain(hero.progression, 5)
    expect(result.progression.level).toBe(0)
    expect(result.levelsGained).toBe(0)
    expect(result.progression.unspentPoints).toBe(0)
  })

  it('gère les montées de niveaux multiples et attribue les points', () => {
    const hero = makeHero()
    const bigGain = xpRequiredForLevel(3) - hero.progression.xp
    const result = applyXpGain(hero.progression, bigGain)
    expect(result.progression.level).toBe(3)
    expect(result.levelsGained).toBe(3)
    expect(result.progression.unspentPoints).toBe(3 * config.xp.pointsPerLevel)
  })

  it('détecte les paliers d\'évolution franchis', () => {
    const hero = makeHero({ progression: { level: 9, xp: xpRequiredForLevel(9), unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } } })
    const gain = xpRequiredForLevel(10) - hero.progression.xp
    const result = applyXpGain(hero.progression, gain)
    expect(result.tiersReached).toEqual([10])
  })

  it('plafonne le niveau et l\'XP au levelCap (verrou de fusion)', () => {
    const hero = makeHero()
    const result = applyXpGain(hero.progression, xpRequiredForLevel(50), 10)
    expect(result.progression.level).toBe(10)
    expect(result.progression.xp).toBe(xpRequiredForLevel(10))
  })

  it('n\'accumule plus d\'XP une fois au levelCap', () => {
    const hero = makeHero({ progression: { level: 10, xp: xpRequiredForLevel(10), unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } } })
    const result = applyXpGain(hero.progression, 100, 10)
    expect(result.progression.level).toBe(10)
    expect(result.progression.xp).toBe(xpRequiredForLevel(10))
    expect(result.levelsGained).toBe(0)
  })
})
