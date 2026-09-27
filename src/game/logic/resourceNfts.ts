import { config, resourceNftTemplates } from '../config'
import { nextRarity, rarityRank } from './rarity'
import type { Rarity, ResourceNft, ResourceNftTemplate } from '../types'

export function findResourceNftTemplate(templateId: string): ResourceNftTemplate {
  const template = resourceNftTemplates.find((t) => t.id === templateId)
  if (!template) throw new Error(`Gabarit de NFT d'exploration inconnu : ${templateId}`)
  return template
}

export function nftLevelCap(rarity: Rarity): number {
  return config.resourceNfts.levelCapByRarity[rarity]
}

/** XP cumulé requis pour atteindre `level` depuis le niveau 0. */
export function xpRequiredForNftLevel(level: number): number {
  if (level <= 0) return 0
  return config.resourceNfts.xpForLevel(level)
}

function nftLevelFromXp(xp: number): number {
  let level = 0
  while (xpRequiredForNftLevel(level + 1) <= xp) level += 1
  return level
}

export interface NftXpGainResult {
  nft: ResourceNft
  levelsGained: number
}

/** Applique un gain d'XP à un NFT d'exploration ; plafonné au niveau max de sa rareté. */
export function applyNftXpGain(nft: ResourceNft, xpGained: number, levelCap: number): NftXpGainResult {
  const capXp = xpRequiredForNftLevel(levelCap)
  const newXp = Math.min(nft.xp + xpGained, capXp)
  const newLevel = Math.min(nftLevelFromXp(newXp), levelCap)
  return {
    nft: { ...nft, xp: newXp, level: newLevel },
    levelsGained: newLevel - nft.level,
  }
}

/** Multiplicateur de rendement d'un NFT : base de sa rareté, croissance exponentielle par niveau. */
export function nftYieldMultiplier(rarity: Rarity, level: number): number {
  const base = config.resourceNfts.baseYieldByRarity[rarity]
  const growth = (1 + config.resourceNfts.levelYieldGrowth) ** Math.max(0, level - 1)
  return base * growth
}

/**
 * Poids de tirage d'un rang de ressource pour cette rareté : tous les rangs restent accessibles
 * à toutes les raretés (un commun peut trouver la ressource légendaire de sa zone), mais une
 * rareté plus élevée a une bien meilleure chance de tomber sur les rangs élevés. Le rang 1 (le
 * plus commun) n'est jamais boosté : sa probabilité de base ne change pas avec la rareté.
 */
export function resourceRankWeight(rank: number, rarity: Rarity): number {
  const base = config.missions.weightByRank(rank)
  const boost = 1 + rarityRank(rarity) * (rank - 1) * config.missions.rarityRankBoost
  return base * boost
}

/** Même gabarit (zone) et même rareté, tous au niveau max de cette rareté. */
export function canFuseResourceNfts(nfts: ResourceNft[]): boolean {
  if (nfts.length !== config.fusion.itemsRequired) return false
  const rarity = nfts[0].rarity
  if (!nextRarity(rarity)) return false
  const cap = nftLevelCap(rarity)
  return nfts.every((n) => n.templateId === nfts[0].templateId && n.rarity === rarity && n.level >= cap)
}

export function fuseResourceNfts(
  nfts: ResourceNft[],
  idFactory: () => string = () => crypto.randomUUID(),
): ResourceNft {
  if (!canFuseResourceNfts(nfts)) {
    throw new Error("Fusion impossible : il faut 3 NFT d'exploration identiques (zone et rareté) au niveau maximum.")
  }
  const targetRarity = nextRarity(nfts[0].rarity)!
  return { instanceId: idFactory(), templateId: nfts[0].templateId, rarity: targetRarity, level: 0, xp: 0 }
}
