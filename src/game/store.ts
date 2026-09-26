import { create } from 'zustand'
import { config, recipes, resources as resourceDefs } from './config'
import { getEffectiveAttributes } from './logic/attributes'
import { resolveCombat } from './logic/combat'
import type { CombatantInput } from './logic/combat'
import type { ResourceStock } from './logic/crafting'
import { craft, smelt } from './logic/crafting'
import { canFuseEquipment, canUpgradeEquipment, fuseEquipment, upgradeEquipment } from './logic/equipment'
import { generateHero } from './logic/heroGenerator'
import {
  canStartMission,
  isMissionComplete,
  resolveMission,
  startMission as startMissionLogic,
} from './logic/missions'
import { nextRarity } from './logic/rarity'
import {
  applyDamage,
  canAttack,
  createAllMonsters,
  distributeRewards,
  processBotAttacks,
  raidCooldownMs,
  raidDamage,
  respawnMonster,
} from './logic/raid'
import { generateBots } from './logic/raidBots'
import { createRng, hashString } from './logic/rng'
import { applyXpGain } from './logic/xp'
import { heroes as startingHeroes } from './data/heroes'
import type {
  EquipmentItem,
  EquipmentSlot,
  Hero,
  HeroAttributes,
  MissionDurationId,
  MissionInProgress,
  Monster,
  RaidBot,
  ZoneId,
} from './types'

export const LOCAL_PLAYER_ID = 'moi'

interface GameState {
  now: number
  heroes: Hero[]
  resources: ResourceStock
  equipmentInventory: EquipmentItem[]
  equippedByHero: Record<string, Partial<Record<EquipmentSlot, string>>>
  missions: MissionInProgress[]
  clockRunning: boolean
  clockSpeed: number

  monsters: Monster[]
  bots: RaidBot[]
  heroRaidCooldowns: Record<string, number>
  raidRewards: Record<string, number>

  getHero: (heroId: string) => Hero | undefined
  getEquippedItems: (heroId: string) => EquipmentItem[]
  getEffectiveAttributes: (heroId: string) => HeroAttributes | undefined

  allocatePoint: (heroId: string, attribute: keyof HeroAttributes) => void
  startMission: (heroId: string, zoneId: ZoneId, durationId: MissionDurationId) => void
  claimMission: (missionId: string) => void
  craftItem: (recipeId: string) => void
  smeltResource: (smeltingRecipeId: string) => void
  equipItem: (heroId: string, instanceId: string) => void
  unequipItem: (heroId: string, slot: EquipmentSlot) => void
  upgradeEquipmentItem: (instanceId: string) => void
  fuseEquipmentItems: (instanceIds: string[]) => void
  fuseHeroes: (heroIds: string[]) => void

  trainHero: (heroId: string) => { won: boolean } | undefined
  attackMonster: (heroId: string, monsterId: string) => { damage: number } | undefined

  // Debug
  advanceTime: (ms: number) => void
  finishMissionInstantly: (missionId: string) => void
  grantResources: (amount: number) => void
  setClockRunning: (running: boolean) => void
  setClockSpeed: (speed: number) => void
  debugDamageMonster: (monsterId: string, amount: number) => void
}

function heroLevelCap(hero: Hero): number {
  return config.heroes.levelCapByRarity[hero.permanent.rarity]
}

function mergeRewards(existing: Record<string, number>, gained: Record<string, number>): Record<string, number> {
  const next = { ...existing }
  for (const [id, amount] of Object.entries(gained)) next[id] = (next[id] ?? 0) + amount
  return next
}

export const useGameStore = create<GameState>((set, get) => ({
  now: Date.now(),
  heroes: startingHeroes,
  resources: {},
  equipmentInventory: [],
  equippedByHero: {},
  missions: [],
  clockRunning: true,
  clockSpeed: 500,

  monsters: createAllMonsters(),
  bots: generateBots(),
  heroRaidCooldowns: {},
  raidRewards: {},

  getHero: (heroId) => get().heroes.find((h) => h.permanent.id === heroId),

  getEquippedItems: (heroId) => {
    const state = get()
    const slots = state.equippedByHero[heroId] ?? {}
    return Object.values(slots)
      .filter((instanceId): instanceId is string => Boolean(instanceId))
      .map((instanceId) => state.equipmentInventory.find((i) => i.instanceId === instanceId))
      .filter((i): i is EquipmentItem => Boolean(i))
  },

  getEffectiveAttributes: (heroId) => {
    const state = get()
    const hero = state.getHero(heroId)
    if (!hero) return undefined
    return getEffectiveAttributes(hero, state.getEquippedItems(heroId))
  },

  allocatePoint: (heroId, attribute) => {
    set((state) => ({
      heroes: state.heroes.map((h) => {
        if (h.permanent.id !== heroId) return h
        if (h.progression.unspentPoints <= 0) return h
        return {
          ...h,
          progression: {
            ...h.progression,
            unspentPoints: h.progression.unspentPoints - 1,
            bonus: { ...h.progression.bonus, [attribute]: h.progression.bonus[attribute] + 1 },
          },
        }
      }),
    }))
  },

  startMission: (heroId, zoneId, durationId) => {
    const state = get()
    const hero = state.getHero(heroId)
    if (!hero) return
    const activeForHero = state.missions.filter((m) => m.heroId === heroId && !m.claimed)
    if (!canStartMission(hero, activeForHero)) return
    const mission = startMissionLogic(hero, zoneId, durationId, state.now)
    set({ missions: [...state.missions, mission] })
  },

  claimMission: (missionId) => {
    const state = get()
    const mission = state.missions.find((m) => m.id === missionId)
    if (!mission || mission.claimed || !isMissionComplete(mission, state.now)) return
    const hero = state.getHero(mission.heroId)
    if (!hero) return

    const rng = createRng(mission.startedAt + hashString(mission.id))
    const rewards = resolveMission(hero, mission, rng)
    const xpResult = applyXpGain(hero.progression, rewards.xp, heroLevelCap(hero))

    set({
      heroes: state.heroes.map((h) =>
        h.permanent.id === hero.permanent.id ? { ...h, progression: xpResult.progression } : h,
      ),
      resources: mergeResources(state.resources, rewards.resources),
      missions: state.missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
    })
  },

  craftItem: (recipeId) => {
    const state = get()
    const result = craft(state.resources, recipeId)
    set({
      resources: result.stock,
      equipmentInventory: [...state.equipmentInventory, result.item],
    })
  },

  smeltResource: (smeltingRecipeId) => {
    const state = get()
    set({ resources: smelt(state.resources, smeltingRecipeId) })
  },

  equipItem: (heroId, instanceId) => {
    const state = get()
    const item = state.equipmentInventory.find((i) => i.instanceId === instanceId)
    if (!item) return
    const recipeSlot = recipeSlotOf(item.recipeId)
    if (!recipeSlot) return
    set({
      equippedByHero: {
        ...state.equippedByHero,
        [heroId]: { ...state.equippedByHero[heroId], [recipeSlot]: instanceId },
      },
    })
  },

  unequipItem: (heroId, slot) => {
    const state = get()
    const current = { ...state.equippedByHero[heroId] }
    delete current[slot]
    set({ equippedByHero: { ...state.equippedByHero, [heroId]: current } })
  },

  upgradeEquipmentItem: (instanceId) => {
    const state = get()
    const item = state.equipmentInventory.find((i) => i.instanceId === instanceId)
    if (!item || !canUpgradeEquipment(state.resources, item)) return
    const result = upgradeEquipment(state.resources, item)
    set({
      resources: result.stock,
      equipmentInventory: state.equipmentInventory.map((i) => (i.instanceId === instanceId ? result.item : i)),
    })
  },

  fuseEquipmentItems: (instanceIds) => {
    const state = get()
    const items = instanceIds
      .map((id) => state.equipmentInventory.find((i) => i.instanceId === id))
      .filter((i): i is EquipmentItem => Boolean(i))
    if (items.length !== instanceIds.length || !canFuseEquipment(items)) return
    const fused = fuseEquipment(items)

    const nextEquippedByHero = { ...state.equippedByHero }
    for (const [heroId, slots] of Object.entries(nextEquippedByHero)) {
      const cleaned = { ...slots }
      for (const [slot, instanceId] of Object.entries(cleaned)) {
        if (instanceId && instanceIds.includes(instanceId)) delete cleaned[slot as EquipmentSlot]
      }
      nextEquippedByHero[heroId] = cleaned
    }

    set({
      equipmentInventory: [
        ...state.equipmentInventory.filter((i) => !instanceIds.includes(i.instanceId)),
        fused,
      ],
      equippedByHero: nextEquippedByHero,
    })
  },

  fuseHeroes: (heroIds) => {
    const state = get()
    const items = heroIds
      .map((id) => state.heroes.find((h) => h.permanent.id === id))
      .filter((h): h is Hero => Boolean(h))
    if (items.length !== heroIds.length || items.length !== config.fusion.itemsRequired) return

    const rarity = items[0].permanent.rarity
    const cap = config.heroes.levelCapByRarity[rarity]
    const eligible = items.every((h) => h.permanent.rarity === rarity && h.progression.level >= cap)
    if (!eligible) return
    const targetRarity = nextRarity(rarity)
    if (!targetRarity) return

    const seed = hashString(`${heroIds.join('-')}-${state.now}`)
    const newHero = generateHero(targetRarity, createRng(seed), crypto.randomUUID())

    const nextEquippedByHero = { ...state.equippedByHero }
    for (const heroId of heroIds) delete nextEquippedByHero[heroId]

    set({
      heroes: [...state.heroes.filter((h) => !heroIds.includes(h.permanent.id)), newHero],
      equippedByHero: nextEquippedByHero,
    })
  },

  trainHero: (heroId) => {
    const state = get()
    const hero = state.getHero(heroId)
    if (!hero) return undefined

    const attributes = getEffectiveAttributes(hero, state.getEquippedItems(heroId))
    const opponent: CombatantInput = { id: 'adversaire-entrainement', level: hero.progression.level, attributes }
    const seed = hashString(`${heroId}-training-${state.now}`)
    const outcome = resolveCombat({ id: heroId, level: hero.progression.level, attributes }, opponent, seed)

    return { won: outcome.winnerId === heroId }
  },

  attackMonster: (heroId, monsterId) => {
    const state = get()
    const hero = state.getHero(heroId)
    const monster = state.monsters.find((m) => m.id === monsterId)
    if (!hero || !monster) return undefined
    if (!canAttack(hero.permanent.rarity, hero.progression.level, monster)) return undefined
    if (state.now < (state.heroRaidCooldowns[heroId] ?? 0)) return undefined

    const attributes = getEffectiveAttributes(hero, state.getEquippedItems(heroId))
    const seed = hashString(`${heroId}-${monsterId}-attack-${state.now}`)
    const damage = raidDamage(attributes, hero.progression.level, createRng(seed))
    const { monster: updated, killed } = applyDamage(monster, LOCAL_PLAYER_ID, damage)

    let monsters = state.monsters.map((m) => (m.id === monster.id ? updated : m))
    let raidRewards = state.raidRewards
    if (killed) {
      raidRewards = mergeRewards(raidRewards, distributeRewards(updated))
      monsters = monsters.map((m) => (m.id === monster.id ? respawnMonster(updated) : m))
    }

    set({
      monsters,
      raidRewards,
      heroRaidCooldowns: { ...state.heroRaidCooldowns, [heroId]: state.now + raidCooldownMs(attributes.energy) },
    })

    return { damage }
  },

  advanceTime: (ms) =>
    set((state) => {
      const now = state.now + ms
      const botResult = processBotAttacks(state.monsters, state.bots, now)
      return {
        now,
        monsters: botResult.monsters,
        bots: botResult.bots,
        raidRewards: mergeRewards(state.raidRewards, botResult.rewardGains),
      }
    }),

  finishMissionInstantly: (missionId) =>
    set((state) => ({
      missions: state.missions.map((m) => (m.id === missionId ? { ...m, endsAt: state.now } : m)),
    })),

  grantResources: (amount) =>
    set((state) => {
      const next = { ...state.resources }
      for (const resource of resourceDefs) next[resource.id] = (next[resource.id] ?? 0) + amount
      return { resources: next }
    }),

  setClockRunning: (running) => set({ clockRunning: running }),
  setClockSpeed: (speed) => set({ clockSpeed: Math.max(1, speed) }),

  debugDamageMonster: (monsterId, amount) => {
    const state = get()
    const monster = state.monsters.find((m) => m.id === monsterId)
    if (!monster) return
    const currentHp = Math.max(0, monster.currentHp - amount)
    const updated = { ...monster, currentHp }

    let monsters = state.monsters.map((m) => (m.id === monsterId ? updated : m))
    let raidRewards = state.raidRewards
    if (currentHp <= 0) {
      raidRewards = mergeRewards(raidRewards, distributeRewards(updated))
      monsters = monsters.map((m) => (m.id === monsterId ? respawnMonster(updated) : m))
    }
    set({ monsters, raidRewards })
  },
}))

function mergeResources(stock: ResourceStock, gained: Record<string, number>): ResourceStock {
  const next = { ...stock }
  for (const [id, qty] of Object.entries(gained)) {
    next[id] = (next[id] ?? 0) + qty
  }
  return next
}

const recipesById: Record<string, EquipmentSlot> = Object.fromEntries(
  recipes.map((r) => [r.id, r.slot]),
)

function recipeSlotOf(recipeId: string): EquipmentSlot | undefined {
  return recipesById[recipeId]
}
