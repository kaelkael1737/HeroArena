import { beforeEach, describe, expect, it } from 'vitest'
import { config } from './config'
import { LOCAL_PLAYER_ID, useGameStore } from './store'

function resetStore() {
  useGameStore.setState(useGameStore.getInitialState(), true)
}

beforeEach(() => {
  resetStore()
})

describe('craftItem / upgradeEquipmentItem / fuseEquipmentItems', () => {
  it('fabrique, monte au niveau max puis fusionne 3 objets communs en 1 peu commun', () => {
    useGameStore.getState().grantResources(500)

    for (let i = 0; i < 3; i += 1) useGameStore.getState().craftItem('arme_commun')
    let items = useGameStore.getState().equipmentInventory
    expect(items).toHaveLength(3)
    expect(items.every((i) => i.recipeId === 'arme_commun' && i.level === 1)).toBe(true)

    const cap = config.equipment.levelCapByRarity.commun
    for (const item of items) {
      for (let level = item.level; level < cap; level += 1) {
        useGameStore.getState().upgradeEquipmentItem(item.instanceId)
      }
    }
    items = useGameStore.getState().equipmentInventory
    expect(items.every((i) => i.level === cap)).toBe(true)

    useGameStore.getState().fuseEquipmentItems(items.map((i) => i.instanceId))
    const after = useGameStore.getState().equipmentInventory
    expect(after).toHaveLength(1)
    expect(after[0]).toMatchObject({ recipeId: 'arme_peu_commun', level: 1 })
  })

  it('ne monte pas au-delà du niveau maximum de la rareté', () => {
    useGameStore.getState().grantResources(9999)
    useGameStore.getState().craftItem('arme_commun')
    const instanceId = useGameStore.getState().equipmentInventory[0].instanceId
    const cap = config.equipment.levelCapByRarity.commun
    for (let i = 0; i < cap + 5; i += 1) useGameStore.getState().upgradeEquipmentItem(instanceId)
    expect(useGameStore.getState().equipmentInventory[0].level).toBe(cap)
  })

  it('détache un équipement fusionné de son porteur', () => {
    useGameStore.getState().grantResources(500)
    for (let i = 0; i < 3; i += 1) useGameStore.getState().craftItem('arme_commun')
    const items = useGameStore.getState().equipmentInventory
    const heroId = useGameStore.getState().heroes[0].permanent.id
    useGameStore.getState().equipItem(heroId, items[0].instanceId)

    const cap = config.equipment.levelCapByRarity.commun
    for (const item of items) {
      for (let level = item.level; level < cap; level += 1) {
        useGameStore.getState().upgradeEquipmentItem(item.instanceId)
      }
    }
    useGameStore.getState().fuseEquipmentItems(items.map((i) => i.instanceId))
    expect(useGameStore.getState().equippedByHero[heroId]?.arme).toBeUndefined()
  })
})

describe('fuseHeroes', () => {
  it('fusionne 3 héros communs au niveau max en 1 héros peu commun neuf', () => {
    const state = useGameStore.getState()
    const communHeroes = state.heroes.filter((h) => h.permanent.rarity === 'commun').slice(0, 3)
    expect(communHeroes.length).toBe(3)
    const cap = config.heroes.levelCapByRarity.commun

    useGameStore.setState({
      heroes: state.heroes.map((h) =>
        communHeroes.some((c) => c.permanent.id === h.permanent.id)
          ? { ...h, progression: { ...h.progression, level: cap } }
          : h,
      ),
    })

    const idsToFuse = communHeroes.map((h) => h.permanent.id)
    useGameStore.getState().fuseHeroes(idsToFuse)

    const heroesAfter = useGameStore.getState().heroes
    expect(heroesAfter).toHaveLength(state.heroes.length - 3 + 1)
    for (const id of idsToFuse) {
      expect(heroesAfter.find((h) => h.permanent.id === id)).toBeUndefined()
    }
    const newHero = heroesAfter.find((h) => !state.heroes.some((h0) => h0.permanent.id === h.permanent.id))
    expect(newHero?.permanent.rarity).toBe('peu_commun')
    expect(newHero?.progression.level).toBe(0)
  })

  it('refuse si les héros ne sont pas tous au niveau maximum', () => {
    const state = useGameStore.getState()
    const communHeroes = state.heroes.filter((h) => h.permanent.rarity === 'commun').slice(0, 3)
    const ids = communHeroes.map((h) => h.permanent.id)
    useGameStore.getState().fuseHeroes(ids)
    expect(useGameStore.getState().heroes).toHaveLength(state.heroes.length)
  })
})

describe('addResourceNft / startMission / claimMission', () => {
  it("un héros ne peut jamais faire de mission : les missions se font uniquement via un NFT d'exploration", () => {
    useGameStore.getState().addResourceNft('foret_commun')
    const nft = useGameStore.getState().resourceNfts[0]

    useGameStore.getState().startMission(nft.instanceId, 'courte')
    const mission = useGameStore.getState().missions[0]
    expect(mission.nftId).toBe(nft.instanceId)

    useGameStore.getState().finishMissionInstantly(mission.id)
    useGameStore.getState().claimMission(mission.id)

    const resources = useGameStore.getState().resources
    const totalResources = Object.values(resources).reduce((a, b) => a + b, 0)
    expect(totalResources).toBeGreaterThan(0)

    const updatedNft = useGameStore.getState().resourceNfts[0]
    expect(updatedNft.xp).toBeGreaterThan(0)

    // aucun héros n'est jamais impliqué ni modifié
    const heroesBefore = useGameStore.getInitialState().heroes
    expect(useGameStore.getState().heroes).toEqual(heroesBefore)
  })

  it("refuse de démarrer une seconde mission sur un NFT déjà occupé", () => {
    useGameStore.getState().addResourceNft('mine_commun')
    const nft = useGameStore.getState().resourceNfts[0]
    useGameStore.getState().startMission(nft.instanceId, 'courte')
    useGameStore.getState().startMission(nft.instanceId, 'courte')
    expect(useGameStore.getState().missions).toHaveLength(1)
  })
})

describe('fuseResourceNftItems', () => {
  it("fusionne 3 NFT communs de la même zone en 1 NFT peu commun", () => {
    for (let i = 0; i < 3; i += 1) useGameStore.getState().addResourceNft('foret_commun')
    const cap = config.resourceNfts.levelCapByRarity.commun
    useGameStore.setState((state) => ({
      resourceNfts: state.resourceNfts.map((n) => ({ ...n, level: cap })),
    }))
    const ids = useGameStore.getState().resourceNfts.map((n) => n.instanceId)
    useGameStore.getState().fuseResourceNftItems(ids)

    const after = useGameStore.getState().resourceNfts
    expect(after).toHaveLength(1)
    expect(after[0]).toMatchObject({ templateId: 'foret_peu_commun', level: 0 })
  })
})

describe('attackMonster', () => {
  it('inflige des dégâts et applique un cooldown', () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    const result = useGameStore.getState().attackMonster(hero.permanent.id, monster.id)
    expect(result?.damage).toBeGreaterThan(0)
    const updated = useGameStore.getState().monsters.find((m) => m.id === monster.id)!
    expect(updated.currentHp).toBe(monster.maxHp - result!.damage)
    expect(updated.damageByPlayer[LOCAL_PLAYER_ID]).toBe(result!.damage)
  })

  it("accorde de l'XP au héros, proportionnelle aux dégâts infligés", () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    const result = useGameStore.getState().attackMonster(hero.permanent.id, monster.id)
    expect(result?.xpGained).toBe(result!.damage * config.xp.xpPerDamagePoint)
    const updatedHero = useGameStore.getState().getHero(hero.permanent.id)!
    expect(updatedHero.progression.xp).toBe(result!.xpGained)
  })

  it('refuse une seconde attaque avant la fin du cooldown', () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    useGameStore.getState().attackMonster(hero.permanent.id, monster.id)
    expect(useGameStore.getState().attackMonster(hero.permanent.id, monster.id)).toBeUndefined()
  })

  it("autorise de nouveau une fois le cooldown écoulé", () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    useGameStore.getState().attackMonster(hero.permanent.id, monster.id)
    useGameStore.getState().advanceTime(2 * 60 * 60 * 1000)
    expect(useGameStore.getState().attackMonster(hero.permanent.id, monster.id)?.damage).toBeGreaterThan(0)
  })

  it('refuse si la rareté du héros ne correspond pas au monstre', () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'rare')!
    expect(useGameStore.getState().attackMonster(hero.permanent.id, monster.id)).toBeUndefined()
  })

  it('répartit la cagnotte et fait renaître le monstre au coup fatal', () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    useGameStore.setState({
      monsters: useGameStore.getState().monsters.map((m) => (m.id === monster.id ? { ...m, currentHp: 1 } : m)),
    })
    useGameStore.getState().attackMonster(hero.permanent.id, monster.id)
    const respawned = useGameStore.getState().monsters.find((m) => m.id === monster.id)!
    expect(respawned.currentHp).toBe(respawned.maxHp)
    expect(useGameStore.getState().raidRewards[LOCAL_PLAYER_ID]).toBeGreaterThan(0)
  })
})

describe('advanceTime (attaques automatiques des bots)', () => {
  it('les bots font baisser les PV des monstres quand le temps avance', () => {
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    useGameStore.getState().advanceTime(3 * 60 * 60 * 1000)
    const updated = useGameStore.getState().monsters.find((m) => m.id === monster.id)!
    expect(updated.currentHp).toBeLessThan(monster.maxHp)
  })
})

describe('debugDamageMonster', () => {
  it('réduit les PV sans attribuer les dégâts à un joueur', () => {
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    useGameStore.getState().debugDamageMonster(monster.id, 1000)
    const updated = useGameStore.getState().monsters.find((m) => m.id === monster.id)!
    expect(updated.currentHp).toBe(monster.maxHp - 1000)
    expect(updated.damageByPlayer).toEqual({})
  })

  it('déclenche la mort/renaissance et répartit la cagnotte entre les vrais participants', () => {
    const hero = useGameStore.getState().heroes.find((h) => h.permanent.rarity === 'commun')!
    const monster = useGameStore.getState().monsters.find((m) => m.rarity === 'commun' && m.levelBracket === 5)!
    useGameStore.getState().attackMonster(hero.permanent.id, monster.id)
    useGameStore.getState().debugDamageMonster(monster.id, monster.maxHp)
    const respawned = useGameStore.getState().monsters.find((m) => m.id === monster.id)!
    expect(respawned.currentHp).toBe(respawned.maxHp)
    expect(useGameStore.getState().raidRewards[LOCAL_PLAYER_ID]).toBeGreaterThan(0)
  })
})

describe('grantResources', () => {
  it('ajoute le même montant à toutes les ressources', () => {
    useGameStore.getState().grantResources(42)
    const stock = useGameStore.getState().resources
    expect(Object.values(stock).every((v) => v === 42)).toBe(true)
  })
})
