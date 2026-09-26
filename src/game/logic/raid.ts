import { config } from '../config'
import type { HeroAttributes, Monster, RaidBot, Rarity } from '../types'

const RARITIES: Rarity[] = ['commun', 'peu_commun', 'rare', 'epique', 'legendaire']

/** Centres des paliers de niveau d'une rareté, espacés régulièrement, couvrant toute la plage [1, levelCap]. */
export function generateLevelBrackets(levelCap: number): number[] {
  const { bracketSpacing, bracketWindow } = config.raid
  const centers: number[] = []
  let center = Math.ceil(bracketSpacing / 2)
  while (center - bracketWindow < levelCap) {
    centers.push(center)
    center += bracketSpacing
  }
  return centers
}

/**
 * Un héros peut attaquer un monstre s'il est de la même rareté et que son niveau tombe dans la
 * fenêtre du palier (± bracketWindow autour du niveau du monstre). Aux frontières exactes, un
 * héros peut être éligible pour deux monstres voisins à la fois — ce n'est pas une erreur.
 */
export function canAttack(heroRarity: Rarity, heroLevel: number, monster: Monster): boolean {
  if (heroRarity !== monster.rarity) return false
  return Math.abs(Math.max(1, heroLevel) - monster.levelBracket) <= config.raid.bracketWindow
}

/** Dégâts infligés par attaque : déterministe, aucun facteur de hasard. */
export function raidDamage(attributes: HeroAttributes, level: number): number {
  const { damageWeights, damageLevelGrowth } = config.raid
  const base = Object.entries(damageWeights).reduce(
    (sum, [key, weight]) => sum + attributes[key as keyof HeroAttributes] * (weight ?? 0),
    0,
  )
  const growth = 1 + Math.max(0, level - 1) * damageLevelGrowth
  return Math.max(1, Math.round(base * growth))
}

/** Temps de récupération (ms) avant la prochaine attaque, réduit par l'Énergie du héros. */
export function raidCooldownMs(energy: number): number {
  const { baseCooldownMinutes, cooldownEnergyDivisor } = config.raid
  const minutes = baseCooldownMinutes / (1 + Math.max(0, energy) / cooldownEnergyDivisor)
  return Math.round(minutes * 60 * 1000)
}

export function monsterMaxHp(rarity: Rarity, bracketCenter: number): number {
  const growth = 1 + Math.max(0, bracketCenter - 1) * config.raid.hpLevelGrowth
  return Math.round(config.raid.baseHpByRarity[rarity] * growth)
}

export function monsterPot(maxHp: number): number {
  return Math.round(maxHp / config.raid.hpPerPotUnit)
}

/** Identifiant stable d'un emplacement de monstre (rareté × palier) : le même à chaque renaissance. */
export function monsterSlotId(rarity: Rarity, bracketCenter: number): string {
  return `${rarity}-${bracketCenter}`
}

export function createMonster(rarity: Rarity, bracketCenter: number): Monster {
  const maxHp = monsterMaxHp(rarity, bracketCenter)
  return {
    id: monsterSlotId(rarity, bracketCenter),
    rarity,
    levelBracket: bracketCenter,
    maxHp,
    currentHp: maxHp,
    pot: monsterPot(maxHp),
    damageByPlayer: {},
  }
}

/** Un monstre par palier de niveau, pour chaque rareté : couvre toute la plage de niveaux du jeu. */
export function createAllMonsters(): Monster[] {
  return RARITIES.flatMap((rarity) => {
    const cap = config.heroes.levelCapByRarity[rarity]
    return generateLevelBrackets(cap).map((center) => createMonster(rarity, center))
  })
}

export interface RaidAttackResult {
  monster: Monster
  killed: boolean
}

export function applyDamage(monster: Monster, playerId: string, amount: number): RaidAttackResult {
  const currentHp = Math.max(0, monster.currentHp - amount)
  const damageByPlayer = {
    ...monster.damageByPlayer,
    [playerId]: (monster.damageByPlayer[playerId] ?? 0) + amount,
  }
  return { monster: { ...monster, currentHp, damageByPlayer }, killed: currentHp <= 0 }
}

/** Part de la cagnotte pour chaque joueur ayant participé, au prorata des dégâts cumulés. */
export function distributeRewards(monster: Monster): Record<string, number> {
  const totalDamage = Object.values(monster.damageByPlayer).reduce((a, b) => a + b, 0)
  if (totalDamage <= 0) return {}
  const rewards: Record<string, number> = {}
  for (const [playerId, damage] of Object.entries(monster.damageByPlayer)) {
    rewards[playerId] = Math.round((damage / totalDamage) * monster.pot)
  }
  return rewards
}

/** Un monstre neuf renaît au même emplacement (rareté × palier), PV et cagnotte remis à plein. */
export function respawnMonster(monster: Monster): Monster {
  return createMonster(monster.rarity, monster.levelBracket)
}

export interface BotTickResult {
  monsters: Monster[]
  bots: RaidBot[]
  rewardGains: Record<string, number>
}

/** Fait attaquer chaque bot dont le cooldown est écoulé ; utilisé à chaque avancée de l'horloge. */
export function processBotAttacks(monsters: Monster[], bots: RaidBot[], now: number): BotTickResult {
  let nextMonsters = monsters
  const rewardGains: Record<string, number> = {}

  const nextBots = bots.map((bot) => {
    if (now < bot.nextAttackAt) return bot
    const monster = nextMonsters.find((m) => canAttack(bot.rarity, bot.level, m))
    if (!monster) return bot

    const damage = raidDamage(bot.attributes, bot.level)
    const { monster: updated, killed } = applyDamage(monster, bot.id, damage)
    nextMonsters = nextMonsters.map((m) => (m.id === monster.id ? updated : m))

    if (killed) {
      const rewards = distributeRewards(updated)
      for (const [id, amount] of Object.entries(rewards)) rewardGains[id] = (rewardGains[id] ?? 0) + amount
      nextMonsters = nextMonsters.map((m) => (m.id === monster.id ? respawnMonster(updated) : m))
    }

    return { ...bot, nextAttackAt: now + raidCooldownMs(bot.attributes.energy) }
  })

  return { monsters: nextMonsters, bots: nextBots, rewardGains }
}
