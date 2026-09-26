import { describe, expect, it } from 'vitest'
import { config } from '../config'
import {
  canFuseEquipment,
  canUpgradeEquipment,
  equipmentBonusAtLevel,
  fuseEquipment,
  upgradeCost,
  upgradeEquipment,
} from './equipment'
import { recipes } from '../config'

const armeCommun = recipes.find((r) => r.id === 'arme_commun')!

describe('equipmentBonusAtLevel', () => {
  it('vaut le bonus de base au niveau 1', () => {
    expect(equipmentBonusAtLevel(armeCommun, 1)).toEqual({ strength: 4 })
  })

  it('croît avec le niveau', () => {
    const atCap = equipmentBonusAtLevel(armeCommun, 5)
    expect(atCap.strength!).toBeGreaterThan(4)
  })
})

describe('upgradeCost', () => {
  it('vaut les ingrédients de base au niveau 1', () => {
    expect(upgradeCost(armeCommun, 1)).toEqual([
      { resourceId: 'minerai_fer', quantity: 3 },
      { resourceId: 'bois', quantity: 1 },
    ])
  })

  it('augmente avec le niveau courant', () => {
    const cost = upgradeCost(armeCommun, 3)
    expect(cost[0].quantity).toBe(9) // 3 * 3
  })
})

describe('canUpgradeEquipment / upgradeEquipment', () => {
  it('refuse au niveau maximum de la rareté', () => {
    const cap = config.equipment.levelCapByRarity.commun
    const item = { instanceId: 'i1', recipeId: 'arme_commun', level: cap }
    expect(canUpgradeEquipment({ minerai_fer: 999, bois: 999 }, item)).toBe(false)
    expect(() => upgradeEquipment({ minerai_fer: 999, bois: 999 }, item)).toThrow()
  })

  it('monte le niveau et consomme les ressources', () => {
    const item = { instanceId: 'i1', recipeId: 'arme_commun', level: 1 }
    const stock = { minerai_fer: 10, bois: 10 }
    expect(canUpgradeEquipment(stock, item)).toBe(true)
    const result = upgradeEquipment(stock, item)
    expect(result.item.level).toBe(2)
    expect(result.stock).toEqual({ minerai_fer: 7, bois: 9 })
  })
})

describe('canFuseEquipment / fuseEquipment', () => {
  it('refuse si moins de 3 objets', () => {
    const cap = config.equipment.levelCapByRarity.commun
    const items = [
      { instanceId: 'a', recipeId: 'arme_commun', level: cap },
      { instanceId: 'b', recipeId: 'arme_commun', level: cap },
    ]
    expect(canFuseEquipment(items)).toBe(false)
  })

  it('refuse si tous ne sont pas au niveau max', () => {
    const cap = config.equipment.levelCapByRarity.commun
    const items = [
      { instanceId: 'a', recipeId: 'arme_commun', level: cap },
      { instanceId: 'b', recipeId: 'arme_commun', level: cap },
      { instanceId: 'c', recipeId: 'arme_commun', level: cap - 1 },
    ]
    expect(canFuseEquipment(items)).toBe(false)
  })

  it('fusionne 3 objets communs au niveau max en 1 objet peu commun niveau 1', () => {
    const cap = config.equipment.levelCapByRarity.commun
    const items = [
      { instanceId: 'a', recipeId: 'arme_commun', level: cap },
      { instanceId: 'b', recipeId: 'arme_commun', level: cap },
      { instanceId: 'c', recipeId: 'arme_commun', level: cap },
    ]
    expect(canFuseEquipment(items)).toBe(true)
    const result = fuseEquipment(items, () => 'fused-1')
    expect(result).toEqual({ instanceId: 'fused-1', recipeId: 'arme_peu_commun', level: 1 })
  })

  it('refuse de fusionner des objets déjà légendaires (rien au-dessus)', () => {
    const cap = config.equipment.levelCapByRarity.legendaire
    const items = [
      { instanceId: 'a', recipeId: 'arme_legendaire', level: cap },
      { instanceId: 'b', recipeId: 'arme_legendaire', level: cap },
      { instanceId: 'c', recipeId: 'arme_legendaire', level: cap },
    ]
    expect(canFuseEquipment(items)).toBe(false)
    expect(() => fuseEquipment(items)).toThrow()
  })
})
