import { describe, expect, it } from 'vitest'
import { config } from '../config'
import {
  applyNftXpGain,
  canFuseResourceNfts,
  fuseResourceNfts,
  maxResourceRankForRarity,
  nftLevelCap,
  nftYieldMultiplier,
  xpRequiredForNftLevel,
} from './resourceNfts'
import { makeResourceNft } from './fixtures'

describe('maxResourceRankForRarity', () => {
  it('un commun n\'accède qu\'au rang 1, un légendaire aux 5', () => {
    expect(maxResourceRankForRarity('commun')).toBe(1)
    expect(maxResourceRankForRarity('peu_commun')).toBe(2)
    expect(maxResourceRankForRarity('rare')).toBe(3)
    expect(maxResourceRankForRarity('epique')).toBe(4)
    expect(maxResourceRankForRarity('legendaire')).toBe(5)
  })
})

describe('nftYieldMultiplier', () => {
  it('vaut le multiplicateur de base de la rareté au niveau 1', () => {
    const template = { id: 'foret_commun', name: '', zoneId: 'foret' as const, rarity: 'commun' as const }
    expect(nftYieldMultiplier(template, 1)).toBe(config.resourceNfts.baseYieldByRarity.commun)
  })

  it('croît exponentiellement avec le niveau', () => {
    const template = { id: 'foret_legendaire', name: '', zoneId: 'foret' as const, rarity: 'legendaire' as const }
    const atCap = nftYieldMultiplier(template, nftLevelCap(template))
    expect(atCap).toBeGreaterThan(nftYieldMultiplier(template, 1) * 2)
  })

  it('une rareté supérieure rapporte plus, à niveau égal', () => {
    const commun = { id: 'foret_commun', name: '', zoneId: 'foret' as const, rarity: 'commun' as const }
    const legendaire = { id: 'foret_legendaire', name: '', zoneId: 'foret' as const, rarity: 'legendaire' as const }
    expect(nftYieldMultiplier(legendaire, 1)).toBeGreaterThan(nftYieldMultiplier(commun, 1))
  })
})

describe('applyNftXpGain', () => {
  it('monte de niveau et plafonne au levelCap', () => {
    const nft = makeResourceNft({ level: 0, xp: 0 })
    const result = applyNftXpGain(nft, xpRequiredForNftLevel(50), 5)
    expect(result.nft.level).toBe(5)
    expect(result.nft.xp).toBe(xpRequiredForNftLevel(5))
  })
})

describe('canFuseResourceNfts / fuseResourceNfts', () => {
  it('refuse si les NFT ne sont pas au niveau max ou de gabarits différents', () => {
    const cap = config.resourceNfts.levelCapByRarity.commun
    const items = [
      makeResourceNft({ instanceId: 'a', templateId: 'foret_commun', level: cap }),
      makeResourceNft({ instanceId: 'b', templateId: 'foret_commun', level: cap }),
      makeResourceNft({ instanceId: 'c', templateId: 'mine_commun', level: cap }),
    ]
    expect(canFuseResourceNfts(items)).toBe(false)
  })

  it('fusionne 3 NFT communs de la même zone en 1 NFT peu commun de cette zone, niveau 0', () => {
    const cap = config.resourceNfts.levelCapByRarity.commun
    const items = [
      makeResourceNft({ instanceId: 'a', templateId: 'foret_commun', level: cap }),
      makeResourceNft({ instanceId: 'b', templateId: 'foret_commun', level: cap }),
      makeResourceNft({ instanceId: 'c', templateId: 'foret_commun', level: cap }),
    ]
    expect(canFuseResourceNfts(items)).toBe(true)
    const fused = fuseResourceNfts(items, () => 'fused-1')
    expect(fused).toEqual({ instanceId: 'fused-1', templateId: 'foret_peu_commun', level: 0, xp: 0 })
  })

  it('refuse de fusionner des NFT déjà légendaires', () => {
    const cap = config.resourceNfts.levelCapByRarity.legendaire
    const items = [
      makeResourceNft({ instanceId: 'a', templateId: 'foret_legendaire', level: cap }),
      makeResourceNft({ instanceId: 'b', templateId: 'foret_legendaire', level: cap }),
      makeResourceNft({ instanceId: 'c', templateId: 'foret_legendaire', level: cap }),
    ]
    expect(canFuseResourceNfts(items)).toBe(false)
    expect(() => fuseResourceNfts(items)).toThrow()
  })
})
