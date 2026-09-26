import { describe, expect, it } from 'vitest'
import { config } from '../config'
import {
  applyDamage,
  canAttack,
  createAllMonsters,
  createMonster,
  distributeRewards,
  generateLevelBrackets,
  monsterMaxHp,
  processBotAttacks,
  raidCooldownMs,
  raidDamage,
  respawnMonster,
} from './raid'
import { makeAttributes } from './fixtures'
import type { RaidBot } from '../types'
import { computeCombatScore } from './combat'
import { createRng } from './rng'

describe('generateLevelBrackets', () => {
  it("couvre toute la plage d'une rareté avec des paliers espacés de 10", () => {
    expect(generateLevelBrackets(config.heroes.levelCapByRarity.commun)).toEqual([5])
    expect(generateLevelBrackets(config.heroes.levelCapByRarity.epique)).toEqual([5, 15, 25, 35, 45])
    expect(generateLevelBrackets(config.heroes.levelCapByRarity.legendaire)).toEqual([5, 15, 25, 35, 45, 55])
  })
})

describe('canAttack', () => {
  it("un monstre de niveau 35 est attaquable par des héros épique de niveau 30 à 40 (exemple donné)", () => {
    const monster = createMonster('epique', 35)
    for (let level = 30; level <= 40; level += 1) {
      expect(canAttack('epique', level, monster)).toBe(true)
    }
    expect(canAttack('epique', 29, monster)).toBe(false)
    expect(canAttack('epique', 41, monster)).toBe(false)
  })

  it('refuse une rareté différente même si le niveau correspond', () => {
    const monster = createMonster('epique', 35)
    expect(canAttack('rare', 35, monster)).toBe(false)
  })

  it('ramène les niveaux 0 ou négatifs au niveau 1 pour le test', () => {
    const monster = createMonster('commun', 5)
    expect(canAttack('commun', 0, monster)).toBe(true)
  })

  it('un héros à la frontière exacte entre deux paliers est éligible pour les deux', () => {
    const lower = createMonster('epique', 25)
    const upper = createMonster('epique', 35)
    expect(canAttack('epique', 30, lower)).toBe(true)
    expect(canAttack('epique', 30, upper)).toBe(true)
  })

  it('tout niveau de la plage a au moins un monstre éligible (aucun trou de couverture)', () => {
    for (const rarity of Object.keys(config.heroes.levelCapByRarity) as (keyof typeof config.heroes.levelCapByRarity)[]) {
      const cap = config.heroes.levelCapByRarity[rarity]
      const monsters = generateLevelBrackets(cap).map((center) => createMonster(rarity, center))
      for (let level = 1; level <= cap; level += 1) {
        expect(monsters.some((m) => canAttack(rarity, level, m))).toBe(true)
      }
    }
  })
})

describe('raidDamage', () => {
  it('reprend exactement la formule de combat (facteur de chance × attributs × niveau)', () => {
    const attrs = makeAttributes({ strength: 20, agility: 10, luck: 5 })
    expect(raidDamage(attrs, 10, createRng(42))).toBe(computeCombatScore(10, attrs, createRng(42)))
  })

  it('est reproductible pour une même graine', () => {
    const attrs = makeAttributes({ strength: 20, agility: 10, luck: 5 })
    expect(raidDamage(attrs, 10, createRng(7))).toBe(raidDamage(attrs, 10, createRng(7)))
  })

  it('augmente en moyenne avec le niveau (sur de nombreux tirages)', () => {
    const attrs = makeAttributes()
    const trials = 100
    let totalLow = 0
    let totalHigh = 0
    for (let seed = 0; seed < trials; seed += 1) {
      totalLow += raidDamage(attrs, 1, createRng(seed))
      totalHigh += raidDamage(attrs, 20, createRng(seed + 10_000))
    }
    expect(totalHigh / trials).toBeGreaterThan(totalLow / trials)
  })
})

describe('raidCooldownMs', () => {
  it("diminue quand l'Énergie augmente", () => {
    expect(raidCooldownMs(50)).toBeLessThan(raidCooldownMs(10))
  })

  it("vaut le cooldown de base à Énergie nulle", () => {
    expect(raidCooldownMs(0)).toBe(config.raid.baseCooldownMinutes * 60 * 1000)
  })
})

describe('monsterMaxHp / createAllMonsters', () => {
  it('un monstre de palier plus haut a plus de PV, à rareté égale', () => {
    expect(monsterMaxHp('epique', 45)).toBeGreaterThan(monsterMaxHp('epique', 5))
  })

  it('crée un monstre par palier de chaque rareté, sans doublon', () => {
    const monsters = createAllMonsters()
    const ids = new Set(monsters.map((m) => m.id))
    expect(ids.size).toBe(monsters.length)
    expect(monsters.length).toBe(1 + 2 + 3 + 5 + 6) // commun, peu_commun, rare, epique, legendaire
  })
})

describe('applyDamage / distributeRewards / respawnMonster', () => {
  it('réduit les PV et enregistre les dégâts par joueur', () => {
    const monster = createMonster('commun', 5)
    const { monster: after, killed } = applyDamage(monster, 'moi', 1000)
    expect(after.currentHp).toBe(monster.maxHp - 1000)
    expect(after.damageByPlayer.moi).toBe(1000)
    expect(killed).toBe(false)
  })

  it('détecte la mort du monstre et ne descend jamais sous 0 PV', () => {
    const monster = createMonster('commun', 5)
    const { monster: after, killed } = applyDamage(monster, 'moi', monster.maxHp + 999)
    expect(after.currentHp).toBe(0)
    expect(killed).toBe(true)
  })

  it('répartit la cagnotte au prorata exact des dégâts cumulés', () => {
    let monster = createMonster('commun', 5)
    monster = applyDamage(monster, 'moi', 300).monster
    monster = applyDamage(monster, 'bot-1', 700).monster
    const rewards = distributeRewards(monster)
    expect(rewards.moi).toBe(Math.round(monster.pot * 0.3))
    expect(rewards['bot-1']).toBe(Math.round(monster.pot * 0.7))
  })

  it('renaît au même emplacement avec les PV à plein et un historique de dégâts vierge', () => {
    const monster = createMonster('rare', 15)
    const damaged = applyDamage(monster, 'moi', 500).monster
    const respawned = respawnMonster(damaged)
    expect(respawned.id).toBe(monster.id)
    expect(respawned.currentHp).toBe(respawned.maxHp)
    expect(respawned.damageByPlayer).toEqual({})
  })
})

describe('processBotAttacks', () => {
  function makeBot(overrides: Partial<RaidBot> = {}): RaidBot {
    return {
      id: 'bot-1',
      playerName: 'Test Bot',
      rarity: 'commun',
      level: 5,
      attributes: makeAttributes(),
      nextAttackAt: 0,
      ...overrides,
    }
  }

  it('ignore un bot dont le cooldown n\'est pas écoulé', () => {
    const monster = createMonster('commun', 5)
    const bot = makeBot({ nextAttackAt: 1000 })
    const result = processBotAttacks([monster], [bot], 500)
    expect(result.monsters[0].currentHp).toBe(monster.maxHp)
    expect(result.bots[0]).toEqual(bot)
  })

  it('fait attaquer un bot prêt et repousse son prochain créneau', () => {
    const monster = createMonster('commun', 5)
    const bot = makeBot({ nextAttackAt: 0 })
    const result = processBotAttacks([monster], [bot], 1000)
    expect(result.monsters[0].currentHp).toBeLessThan(monster.maxHp)
    expect(result.bots[0].nextAttackAt).toBeGreaterThan(1000)
  })

  it('répartit la cagnotte et fait renaître le monstre quand un bot achève le coup fatal', () => {
    const monster = { ...createMonster('commun', 5), currentHp: 1 }
    const bot = makeBot({ nextAttackAt: 0 })
    const result = processBotAttacks([monster], [bot], 1000)
    expect(result.monsters[0].currentHp).toBe(result.monsters[0].maxHp) // renaissance
    expect(result.rewardGains['bot-1']).toBeGreaterThan(0)
  })

  it('n\'attaque pas si aucun monstre ne correspond à sa rareté/niveau', () => {
    const monster = createMonster('rare', 5)
    const bot = makeBot({ rarity: 'commun', nextAttackAt: 0 })
    const result = processBotAttacks([monster], [bot], 1000)
    expect(result.monsters[0].currentHp).toBe(monster.maxHp)
    expect(result.bots[0]).toEqual(bot)
  })
})
