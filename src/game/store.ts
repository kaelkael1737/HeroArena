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
import { createRng } from './logic/rng'
import {
  createBracket,
  getChampion,
  isTournamentOver,
  nextRound,
  runRound,
} from './logic/tournament'
import { applyXpGain } from './logic/xp'
import { heroes as startingHeroes } from './data/heroes'
import type {
  EquipmentItem,
  EquipmentSlot,
  Hero,
  HeroAttributes,
  MissionDurationId,
  MissionInProgress,
  TournamentState,
  ZoneId,
} from './types'

const DAY_MS = 24 * 60 * 60 * 1000

interface GameState {
  currentSeasonId: number
  seasonStartedAt: number
  now: number
  heroes: Hero[]
  resources: ResourceStock
  equipmentInventory: EquipmentItem[]
  equippedByHero: Record<string, Partial<Record<EquipmentSlot, string>>>
  missions: MissionInProgress[]
  tournament: TournamentState | null
  clockRunning: boolean
  clockSpeed: number

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

  startTournament: () => void
  runTournamentRound: () => void
  trainHero: (heroId: string) => { won: boolean; xpGained: number } | undefined

  startNewSeason: () => void

  // Debug
  advanceTime: (ms: number) => void
  finishMissionInstantly: (missionId: string) => void
  jumpToTournament: () => void
  grantResources: (amount: number) => void
  setClockRunning: (running: boolean) => void
  setClockSpeed: (speed: number) => void
}

function heroLevelCap(hero: Hero): number {
  return config.heroes.levelCapByRarity[hero.permanent.rarity]
}

export const useGameStore = create<GameState>((set, get) => ({
  currentSeasonId: 1,
  seasonStartedAt: Date.now(),
  now: Date.now(),
  heroes: startingHeroes,
  resources: {},
  equipmentInventory: [],
  equippedByHero: {},
  missions: [],
  tournament: null,
  clockRunning: true,
  clockSpeed: 500,

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

  startTournament: () => {
    const state = get()
    const competitors = state.heroes.map((h) => ({ id: h.permanent.id, level: h.progression.level }))
    set({ tournament: createBracket(state.currentSeasonId, competitors) })
  },

  runTournamentRound: () => {
    const state = get()
    if (!state.tournament || !state.tournament.active) return
    const combatants: Record<string, CombatantInput> = {}
    for (const hero of state.heroes) {
      const attrs = state.getEffectiveAttributes(hero.permanent.id)
      if (attrs) combatants[hero.permanent.id] = { id: hero.permanent.id, level: hero.progression.level, attributes: attrs }
    }

    const currentRound = state.tournament.rounds[state.tournament.rounds.length - 1]
    const resolvedRound = runRound(currentRound, combatants, (match, i) =>
      hashString(`${state.currentSeasonId}-${match.round}-${i}`),
    )
    const rounds = [...state.tournament.rounds.slice(0, -1), resolvedRound]
    const updated: TournamentState = { ...state.tournament, rounds }

    if (isTournamentOver(updated)) {
      set({ tournament: { ...updated, active: false, champion: getChampion(updated) } })
      return
    }

    const roundNumber = resolvedRound[0].round + 1
    const nextRoundMatches = nextRound(resolvedRound, roundNumber)
    set({ tournament: { ...updated, rounds: [...rounds, nextRoundMatches] } })
  },

  trainHero: (heroId) => {
    const state = get()
    const hero = state.getHero(heroId)
    if (!hero) return undefined

    const attributes = getEffectiveAttributes(hero, state.getEquippedItems(heroId))
    const opponent: CombatantInput = { id: 'adversaire-entrainement', level: hero.progression.level, attributes }
    const seed = hashString(`${heroId}-training-${state.now}`)
    const outcome = resolveCombat({ id: heroId, level: hero.progression.level, attributes }, opponent, seed)
    const won = outcome.winnerId === heroId
    const xpGained = won ? config.xp.trainingWinXp : config.xp.trainingLossXp
    const xpResult = applyXpGain(hero.progression, xpGained, heroLevelCap(hero))

    set({
      heroes: state.heroes.map((h) => (h.permanent.id === heroId ? { ...h, progression: xpResult.progression } : h)),
    })

    return { won, xpGained }
  },

  startNewSeason: () => {
    const state = get()
    set({
      currentSeasonId: state.currentSeasonId + 1,
      seasonStartedAt: state.now,
      tournament: null,
      missions: state.missions.filter((m) => !m.claimed),
    })
  },

  advanceTime: (ms) => set((state) => ({ now: state.now + ms })),

  finishMissionInstantly: (missionId) =>
    set((state) => ({
      missions: state.missions.map((m) => (m.id === missionId ? { ...m, endsAt: state.now } : m)),
    })),

  jumpToTournament: () =>
    set((state) => ({
      now: state.seasonStartedAt + config.season.durationDays * DAY_MS,
    })),

  grantResources: (amount) =>
    set((state) => {
      const next = { ...state.resources }
      for (const resource of resourceDefs) next[resource.id] = (next[resource.id] ?? 0) + amount
      return { resources: next }
    }),

  setClockRunning: (running) => set({ clockRunning: running }),
  setClockSpeed: (speed) => set({ clockSpeed: Math.max(1, speed) }),
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

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return hash >>> 0
}
