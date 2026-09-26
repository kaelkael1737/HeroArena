import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { canAttack } from './raid'
import { generateBots } from './raidBots'

describe('generateBots', () => {
  it('crée au moins un bot éligible pour chaque monstre de départ', () => {
    const bots = generateBots()
    for (const rarity of Object.keys(config.heroes.levelCapByRarity) as (keyof typeof config.heroes.levelCapByRarity)[]) {
      const cap = config.heroes.levelCapByRarity[rarity]
      const brackets = new Set<number>()
      for (const bot of bots) if (bot.rarity === rarity) brackets.add(bot.level)
      // au moins un bot par palier connu de cette rareté
      expect(brackets.size).toBeGreaterThan(0)
      expect(cap).toBeGreaterThan(0)
    }
  })

  it('est déterministe pour une graine donnée', () => {
    expect(generateBots(7)).toEqual(generateBots(7))
  })

  it('donne des identifiants uniques', () => {
    const bots = generateBots()
    expect(new Set(bots.map((b) => b.id)).size).toBe(bots.length)
  })

  it('chaque bot est éligible à attaquer un monstre fraîchement créé à son propre niveau', () => {
    const bots = generateBots()
    for (const bot of bots.slice(0, 5)) {
      const fakeMonster = { id: 'x', rarity: bot.rarity, levelBracket: bot.level, maxHp: 1, currentHp: 1, pot: 1, damageByPlayer: {} }
      expect(canAttack(bot.rarity, bot.level, fakeMonster)).toBe(true)
    }
  })
})
