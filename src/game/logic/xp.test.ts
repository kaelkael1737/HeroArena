import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { applyXpGain, levelFromXp, xpRequiredForLevel } from './xp'
import { makeHero } from './fixtures'

describe('xpRequiredForLevel', () => {
  it('vaut 0 au niveau 0', () => {
    expect(xpRequiredForLevel(0)).toBe(0)
  })

  it('suit la courbe 100 * niveau^1.5', () => {
    expect(xpRequiredForLevel(4)).toBe(config.xp.xpForLevel(4))
    expect(xpRequiredForLevel(4)).toBe(800)
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
    const hero = makeHero({ seasonal: { seasonId: 1, level: 0, xp: 0, unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } } })
    const result = applyXpGain(hero.seasonal, 5)
    expect(result.seasonal.level).toBe(0)
    expect(result.levelsGained).toBe(0)
    expect(result.seasonal.unspentPoints).toBe(0)
  })

  it('gère les montées de niveaux multiples et attribue les points', () => {
    const hero = makeHero()
    const bigGain = xpRequiredForLevel(3) - hero.seasonal.xp
    const result = applyXpGain(hero.seasonal, bigGain)
    expect(result.seasonal.level).toBe(3)
    expect(result.levelsGained).toBe(3)
    expect(result.seasonal.unspentPoints).toBe(3 * config.xp.pointsPerLevel)
  })

  it('détecte les paliers d\'évolution franchis', () => {
    const hero = makeHero({ seasonal: { seasonId: 1, level: 9, xp: xpRequiredForLevel(9), unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } } })
    const gain = xpRequiredForLevel(10) - hero.seasonal.xp
    const result = applyXpGain(hero.seasonal, gain)
    expect(result.tiersReached).toEqual([10])
  })
})
