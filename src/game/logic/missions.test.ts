import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { isNftFree, resolveMission, startMission } from './missions'
import { makeResourceNft } from './fixtures'
import { createRng } from './rng'

describe('isNftFree', () => {
  it('est libre sans mission en cours', () => {
    expect(isNftFree('nft-1', [])).toBe(true)
  })

  it("n'est pas libre pendant une mission non réclamée", () => {
    const nft = makeResourceNft()
    const mission = startMission(nft, 'courte', 0, () => 'm1')
    expect(isNftFree(nft.instanceId, [mission])).toBe(false)
  })

  it('redevient libre une fois la mission réclamée', () => {
    const nft = makeResourceNft()
    const mission = { ...startMission(nft, 'courte', 0, () => 'm1'), claimed: true }
    expect(isNftFree(nft.instanceId, [mission])).toBe(true)
  })
})

describe('startMission', () => {
  it('calcule la date de fin selon la durée choisie et référence le NFT', () => {
    const nft = makeResourceNft({ instanceId: 'nft-42' })
    const mission = startMission(nft, 'longue', 1000, () => 'm1')
    expect(mission.endsAt).toBe(1000 + config.missions.durations.longue.hours * 60 * 60 * 1000)
    expect(mission.nftId).toBe('nft-42')
    expect(mission.claimed).toBe(false)
  })
})

describe('resolveMission', () => {
  it('donne entre 1 et 3 ressources différentes, et de l\'XP', () => {
    const nft = makeResourceNft({ templateId: 'foret', rarity: 'legendaire', level: 10 })
    const mission = startMission(nft, 'moyenne', 0, () => 'm1')
    for (let seed = 0; seed < 20; seed += 1) {
      const result = resolveMission(nft, mission, createRng(seed))
      const types = Object.keys(result.resources).length
      expect(types).toBeGreaterThanOrEqual(1)
      expect(types).toBeLessThanOrEqual(3)
      expect(result.xpGained).toBeGreaterThan(0)
    }
  })

  it("un NFT commun PEUT ramener n'importe quel rang de sa zone (jamais bloqué)", () => {
    const nft = makeResourceNft({ templateId: 'foret', rarity: 'commun' })
    const mission = startMission(nft, 'expedition', 0, () => 'm1')
    const seen = new Set<string>()
    for (let seed = 0; seed < 300; seed += 1) {
      const result = resolveMission(nft, mission, createRng(seed))
      for (const id of Object.keys(result.resources)) seen.add(id)
    }
    expect(seen).toEqual(new Set(['bois', 'herbes', 'cuir', 'seve_ambree', 'graine_sequoia']))
  })

  it('un NFT légendaire tombe beaucoup plus souvent sur le rang 5 qu\'un commun', () => {
    const commun = makeResourceNft({ templateId: 'mine', rarity: 'commun' })
    const legendaire = makeResourceNft({ templateId: 'mine', rarity: 'legendaire' })
    const mission = startMission(commun, 'expedition', 0, () => 'm1')

    let communHits = 0
    let legendaireHits = 0
    const trials = 300
    for (let seed = 0; seed < trials; seed += 1) {
      if (resolveMission(commun, mission, createRng(seed)).resources.fragment_etoile) communHits += 1
      if (resolveMission(legendaire, mission, createRng(seed)).resources.fragment_etoile) legendaireHits += 1
    }
    expect(legendaireHits).toBeGreaterThan(communHits * 2)
  })

  it('un NFT de la mine ne donne jamais une ressource d\'une autre zone', () => {
    const nft = makeResourceNft({ templateId: 'mine', rarity: 'legendaire' })
    const mission = startMission(nft, 'expedition', 0, () => 'm1')
    for (let seed = 0; seed < 50; seed += 1) {
      const result = resolveMission(nft, mission, createRng(seed))
      for (const resourceId of Object.keys(result.resources)) {
        expect(['minerai_fer', 'pierre', 'cristal', 'essence_glace', 'fragment_etoile']).toContain(resourceId)
      }
    }
  })

  it('est déterministe pour une graine donnée', () => {
    const nft = makeResourceNft()
    const mission = startMission(nft, 'longue', 0, () => 'm1')
    const resultA = resolveMission(nft, mission, createRng(7))
    const resultB = resolveMission(nft, mission, createRng(7))
    expect(resultA).toEqual(resultB)
  })

  it('la ressource de rang 1 rapporte en moyenne plus par tirage que celle de rang 5', () => {
    const nft = makeResourceNft({ templateId: 'foret', rarity: 'legendaire', level: 1 })
    const mission = startMission(nft, 'courte', 0, () => 'm1')
    let totalRank1 = 0
    let totalRank5 = 0
    for (let seed = 0; seed < 300; seed += 1) {
      const result = resolveMission(nft, mission, createRng(seed))
      totalRank1 += result.resources.bois ?? 0
      totalRank5 += result.resources.graine_sequoia ?? 0
    }
    expect(totalRank1).toBeGreaterThan(totalRank5)
  })

  it('un NFT de niveau/rareté plus élevé rapporte en moyenne plus de ressources', () => {
    const low = makeResourceNft({ templateId: 'foret', rarity: 'commun', level: 1 })
    const high = makeResourceNft({ templateId: 'foret', rarity: 'legendaire', level: 20 })
    const mission = startMission(low, 'moyenne', 0, () => 'm1')

    let totalLow = 0
    let totalHigh = 0
    for (let seed = 0; seed < 30; seed += 1) {
      totalLow += Object.values(resolveMission(low, mission, createRng(seed)).resources).reduce((a, b) => a + b, 0)
      totalHigh += Object.values(resolveMission(high, mission, createRng(seed)).resources).reduce((a, b) => a + b, 0)
    }
    expect(totalHigh).toBeGreaterThan(totalLow)
  })
})
