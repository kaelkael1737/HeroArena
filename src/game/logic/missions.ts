import { config, zones } from '../config'
import type { Hero, MissionDurationId, MissionInProgress, ZoneId } from '../types'
import { getTotalAttributes } from './attributes'
import { randomInt } from './rng'

/** Nombre de missions simultanées autorisées pour un héros, en fonction de son Énergie. */
export function maxConcurrentMissions(hero: Hero): number {
  const total = getTotalAttributes(hero)
  const slots = Math.floor(total.energy / config.missions.energyPerSlot)
  return Math.min(
    config.missions.maxConcurrentSlots,
    Math.max(config.missions.minConcurrentSlots, slots),
  )
}

export function canStartMission(hero: Hero, currentMissionsForHero: MissionInProgress[]): boolean {
  const active = currentMissionsForHero.filter((m) => !m.claimed)
  return active.length < maxConcurrentMissions(hero)
}

export function startMission(
  hero: Hero,
  zoneId: ZoneId,
  durationId: MissionDurationId,
  now: number,
  idFactory: () => string = () => crypto.randomUUID(),
): MissionInProgress {
  const duration = config.missions.durations[durationId]
  return {
    id: idFactory(),
    heroId: hero.permanent.id,
    zoneId,
    durationId,
    startedAt: now,
    endsAt: now + duration.hours * 60 * 60 * 1000,
    claimed: false,
  }
}

export function isMissionComplete(mission: MissionInProgress, now: number): boolean {
  return now >= mission.endsAt
}

export interface MissionRewards {
  xp: number
  resources: Record<string, number>
}

/**
 * Calcule les récompenses d'une mission terminée. La Chance du héros et la durée de la
 * mission augmentent la probabilité d'obtenir une ressource rare de la zone plutôt qu'une commune.
 */
export function resolveMission(
  hero: Hero,
  mission: MissionInProgress,
  rng: () => number,
): MissionRewards {
  const zone = zones[mission.zoneId]
  const duration = config.missions.durations[mission.durationId]
  const total = getTotalAttributes(hero)

  const xp = Math.round(config.xp.baseMissionXp * duration.xpMultiplier)

  const rareChance = Math.min(
    config.missions.maxRareChance,
    config.missions.baseRareChance + duration.rareChanceBonus + total.luck * config.missions.luckRareChancePerPoint,
  )

  const yieldCount = Math.round(config.missions.baseCommonYield * duration.xpMultiplier)
  const resources: Record<string, number> = {}

  for (let i = 0; i < yieldCount; i += 1) {
    const isRare = rng() < rareChance
    // Dans la liste de ressources d'une zone, on considère la dernière comme "rare" de la zone.
    const pool = isRare ? [zone.resourceIds[zone.resourceIds.length - 1]] : zone.resourceIds.slice(0, -1)
    const pick = pool[randomInt(rng, 0, pool.length - 1)]
    resources[pick] = (resources[pick] ?? 0) + 1
  }

  return { xp, resources }
}
