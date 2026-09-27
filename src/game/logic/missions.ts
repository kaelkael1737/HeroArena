import { config, zones } from '../config'
import type { MissionDurationId, MissionInProgress, ResourceNft } from '../types'
import { findResourceNftTemplate, maxResourceRankForRarity, nftYieldMultiplier } from './resourceNfts'
import { randomInt } from './rng'

/** Un NFT d'exploration ne peut faire qu'une mission à la fois. */
export function isNftFree(nftId: string, missions: MissionInProgress[]): boolean {
  return !missions.some((m) => m.nftId === nftId && !m.claimed)
}

export function startMission(
  nft: ResourceNft,
  durationId: MissionDurationId,
  now: number,
  idFactory: () => string = () => crypto.randomUUID(),
): MissionInProgress {
  const duration = config.missions.durations[durationId]
  return {
    id: idFactory(),
    nftId: nft.instanceId,
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
  resources: Record<string, number>
  xpGained: number
}

/** Tire `count` ressources distinctes parmi `pool`, pondérées par leur poids, sans remise. */
function pickDistinctWeighted(pool: { id: string; weight: number }[], count: number, rng: () => number): string[] {
  const remaining = [...pool]
  const chosen: string[] = []
  for (let i = 0; i < count && remaining.length > 0; i += 1) {
    const totalWeight = remaining.reduce((sum, p) => sum + p.weight, 0)
    let roll = rng() * totalWeight
    let pickedIndex = remaining.length - 1
    for (let j = 0; j < remaining.length; j += 1) {
      roll -= remaining[j].weight
      if (roll <= 0) {
        pickedIndex = j
        break
      }
    }
    chosen.push(remaining[pickedIndex].id)
    remaining.splice(pickedIndex, 1)
  }
  return chosen
}

/**
 * Calcule les récompenses d'une mission terminée : entre 1 et 3 ressources DIFFÉRENTES de la
 * zone du NFT (jamais partagées avec une autre zone), tirées parmi les rangs accessibles à sa
 * rareté (rang 1 = le plus commun ; un commun n'accède qu'au rang 1, un légendaire aux 5). Plus
 * le rang est élevé, moins la ressource est probable et moins elle est abondante par tirage.
 * Le niveau du NFT et la durée de la mission multiplient la quantité. Donne aussi de l'XP au NFT.
 */
export function resolveMission(
  nft: ResourceNft,
  mission: MissionInProgress,
  rng: () => number,
): MissionRewards {
  const template = findResourceNftTemplate(nft.templateId)
  const zone = zones[template.zoneId]
  const duration = config.missions.durations[mission.durationId]
  const levelYield = nftYieldMultiplier(nft.rarity, nft.level)

  const maxRank = maxResourceRankForRarity(nft.rarity)
  const accessibleIds = zone.resourceIds.slice(0, maxRank)
  const pool = accessibleIds.map((id, i) => ({ id, weight: config.missions.weightByRank(i + 1) }))

  const [minTypes, maxTypes] = config.missions.yieldTypesRange
  const numTypes = Math.min(pool.length, randomInt(rng, minTypes, maxTypes))
  const chosen = pickDistinctWeighted(pool, numTypes, rng)

  const resources: Record<string, number> = {}
  for (const resourceId of chosen) {
    const rank = zone.resourceIds.indexOf(resourceId) + 1
    const qty = Math.max(1, Math.round(config.missions.baseQuantityByRank(rank) * duration.yieldMultiplier * levelYield))
    resources[resourceId] = (resources[resourceId] ?? 0) + qty
  }

  const xpGained = Math.round(config.resourceNfts.baseXpPerMission * duration.yieldMultiplier)

  return { resources, xpGained }
}
