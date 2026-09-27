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
 * Rang maximum (1 à 5) de ressource de zone accessible à cette rareté : un commun ne trouve que
 * la ressource la plus commune de sa zone, un légendaire les 5. C'est "l'atout" propre à chaque
 * rareté, en plus du niveau qui augmente la quantité récoltée.
 */
export function maxResourceRankForRarity(rarity: Rarity): number {
  return rarityRank(rarity) + 1
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
