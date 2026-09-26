import type { Rarity } from '../types'

/** Ordre croissant des raretés, du plus commun au plus légendaire. */
export const rarityLadder: Rarity[] = ['commun', 'peu_commun', 'rare', 'epique', 'legendaire']

export function rarityRank(rarity: Rarity): number {
  return rarityLadder.indexOf(rarity)
}

/** Rareté obtenue en fusionnant des NFT de `rarity`, ou `null` si déjà au sommet (légendaire). */
export function nextRarity(rarity: Rarity): Rarity | null {
  const next = rarityLadder[rarityRank(rarity) + 1]
  return next ?? null
}
