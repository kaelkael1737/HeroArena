import { describe, expect, it } from 'vitest'
import { canCraft, canSmelt, craft, smelt } from './crafting'

describe('canCraft / craft', () => {
  it('refuse si les ingrédients manquent', () => {
    expect(canCraft({}, 'epee_fer')).toBe(false)
  })

  it('fabrique et consomme les ingrédients exacts', () => {
    const stock = { minerai_fer: 5, bois: 2 }
    expect(canCraft(stock, 'epee_fer')).toBe(true)
    const result = craft(stock, 'epee_fer', 1, () => 'item-1')
    expect(result.stock).toEqual({ minerai_fer: 2, bois: 1 })
    expect(result.item).toEqual({ instanceId: 'item-1', recipeId: 'epee_fer', seasonId: 1 })
  })

  it('lève une erreur pour une recette inconnue', () => {
    expect(() => craft({}, 'inconnue', 1)).toThrow()
  })

  it('lève une erreur si les ingrédients sont insuffisants', () => {
    expect(() => craft({ minerai_fer: 1 }, 'epee_fer', 1)).toThrow()
  })
})

describe('canSmelt / smelt', () => {
  it('transforme 3 minerai de fer en 1 acier', () => {
    const stock = { minerai_fer: 3 }
    expect(canSmelt(stock, 'fonte_acier')).toBe(true)
    expect(smelt(stock, 'fonte_acier')).toEqual({ minerai_fer: 0, acier: 1 })
  })

  it('refuse si le minerai est insuffisant', () => {
    expect(canSmelt({ minerai_fer: 2 }, 'fonte_acier')).toBe(false)
    expect(() => smelt({ minerai_fer: 2 }, 'fonte_acier')).toThrow()
  })
})
