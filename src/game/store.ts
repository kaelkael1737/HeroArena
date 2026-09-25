import { create } from 'zustand'
import { config, recipes } from './config'
import { getEffectiveAttributes } from './logic/attributes'
import type { ResourceStock } from './logic/crafting'
import { craft, smelt } from './logic/crafting'
import {
  canStartMission,
  isMissionComplete,
  resolveMission,
  startMission as startMissionLogic,
} from './logic/missions'
import { createRng } from './logic/rng'
import { applySeasonReset } from './logic/season'
import {
  createBracket,
  getChampion,
  isTournamentOver,
  nextRound,
  runRound,
} from './logic/tournament'
import { applyXpGain } from './logic/xp'
import { devHeroes } from './data/devHeroes'
import { resolveCombat } from './logic/combat'
import type {
  CombatantInput,
} from './logic/combat'
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

  startTournament: () => void
  runTournamentRound: () => void
  trainHero: (heroId: string) => { won: boolean; xpGained: number } | undefined

  startNewSeason: () => void

  // Debug
  advanceTime: (ms: number) => void
  finishMissionInstantly: (missionId: string) => void
  jumpToTournament: () => void
}

function touchHero(heroes: Hero[], heroId: string, currentSeasonId: number): Hero[] {
  return heroes.map((h) => (h.permanent.id === heroId ? applySeasonReset(h, currentSeasonId) : h))
}

export const useGameStore = create<GameState>((set, get) => ({
  currentSeasonId: 1,
  seasonStartedAt: Date.now(),
  now: Date.now(),
  heroes: devHeroes,
  resources: {},
  equipmentInventory: [],
  equippedByHero: {},
  missions: [],
  tournament: null,

  getHero: (heroId) => {
    const state = get()
    return applySeasonReset0(state.heroes.find((h) => h.permanent.id === heroId), state.currentSeasonId)
  },

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
    return getEffectiveAttributes(hero, state.getEquippedItems(heroId), state.currentSeasonId)
  },

  allocatePoint: (heroId, attribute) => {
    set((state) => {
      const heroes = touchHero(state.heroes, heroId, state.currentSeasonId)
      return {
        heroes: heroes.map((h) => {
          if (h.permanent.id !== heroId) return h
          if (h.seasonal.unspentPoints <= 0) return h
          return {
            ...h,
            seasonal: {
              ...h.seasonal,
              unspentPoints: h.seasonal.unspentPoints - 1,
              bonus: { ...h.seasonal.bonus, [attribute]: h.seasonal.bonus[attribute] + 1 },
            },
          }
        }),
      }
    })
  },

  startMission: (heroId, zoneId, durationId) => {
    const state = get()
    const heroesAfterTouch = touchHero(state.heroes, heroId, state.currentSeasonId)
    const hero = heroesAfterTouch.find((h) => h.permanent.id === heroId)
    if (!hero) return
    const activeForHero = state.missions.filter((m) => m.heroId === heroId && !m.claimed)
    if (!canStartMission(hero, activeForHero)) return
    const mission = startMissionLogic(hero, zoneId, durationId, state.now)
    set({ heroes: heroesAfterTouch, missions: [...state.missions, mission] })
  },

  claimMission: (missionId) => {
    const state = get()
    const mission = state.missions.find((m) => m.id === missionId)
    if (!mission || mission.claimed || !isMissionComplete(mission, state.now)) return
    const heroesAfterTouch = touchHero(state.heroes, mission.heroId, state.currentSeasonId)
    const hero = heroesAfterTouch.find((h) => h.permanent.id === mission.heroId)
    if (!hero) return

    const rng = createRng(mission.startedAt + hashString(mission.id))
    const rewards = resolveMission(hero, mission, rng)
    const xpResult = applyXpGain(hero.seasonal, rewards.xp)

    set({
      heroes: heroesAfterTouch.map((h) =>
        h.permanent.id === hero.permanent.id ? { ...h, seasonal: xpResult.seasonal } : h,
      ),
      resources: mergeResources(state.resources, rewards.resources),
      missions: state.missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m)),
    })
  },

  craftItem: (recipeId) => {
    const state = get()
    const result = craft(state.resources, recipeId, state.currentSeasonId)
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

  startTournament: () => {
    const state = get()
    const competitors = state.heroes.map((h) => {
      const hero = applySeasonReset0(h, state.currentSeasonId)!
      return { id: hero.permanent.id, level: hero.seasonal.level }
    })
    set({ tournament: createBracket(state.currentSeasonId, competitors) })
  },

  runTournamentRound: () => {
    const state = get()
    if (!state.tournament || !state.tournament.active) return
    const combatants: Record<string, CombatantInput> = {}
    for (const hero of state.heroes) {
      const attrs = state.getEffectiveAttributes(hero.permanent.id)
      const level = state.getHero(hero.permanent.id)?.seasonal.level ?? 1
      if (attrs) combatants[hero.permanent.id] = { id: hero.permanent.id, level, attributes: attrs }
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
    const heroesAfterTouch = touchHero(state.heroes, heroId, state.currentSeasonId)
    const hero = heroesAfterTouch.find((h) => h.permanent.id === heroId)
    if (!hero) return undefined

    const attributes = getEffectiveAttributes(hero, state.getEquippedItems(heroId), state.currentSeasonId)
    const opponent: CombatantInput = {
      id: 'adversaire-entrainement',
      level: hero.seasonal.level,
      attributes,
    }
    const seed = hashString(`${heroId}-training-${state.now}`)
    const outcome = resolveCombat({ id: heroId, level: hero.seasonal.level, attributes }, opponent, seed)
    const won = outcome.winnerId === heroId
    const xpGained = won ? config.xp.trainingWinXp : config.xp.trainingLossXp
    const xpResult = applyXpGain(hero.seasonal, xpGained)

    set({
      heroes: heroesAfterTouch.map((h) =>
        h.permanent.id === heroId ? { ...h, seasonal: xpResult.seasonal } : h,
      ),
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
}))

function applySeasonReset0(hero: Hero | undefined, currentSeasonId: number): Hero | undefined {
  if (!hero) return undefined
  return applySeasonReset(hero, currentSeasonId)
}

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
