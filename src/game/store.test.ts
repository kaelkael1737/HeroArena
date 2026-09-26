import { beforeEach, describe, expect, it } from 'vitest'
import { config } from './config'
import { useGameStore } from './store'

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

describe('grantResources', () => {
  it('ajoute le même montant à toutes les ressources', () => {
    useGameStore.getState().grantResources(42)
    const stock = useGameStore.getState().resources
    expect(Object.values(stock).every((v) => v === 42)).toBe(true)
  })
})
