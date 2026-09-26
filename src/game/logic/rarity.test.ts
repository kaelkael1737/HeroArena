import { describe, expect, it } from 'vitest'
import { nextRarity, rarityRank } from './rarity'

describe('rarityRank', () => {
  it('classe les raretés du plus commun au plus légendaire', () => {
    expect(rarityRank('commun')).toBe(0)
    expect(rarityRank('legendaire')).toBe(4)
    expect(rarityRank('rare')).toBeGreaterThan(rarityRank('peu_commun'))
  })
})

describe('nextRarity', () => {
  it('donne la rareté juste au-dessus', () => {
    expect(nextRarity('commun')).toBe('peu_commun')
    expect(nextRarity('epique')).toBe('legendaire')
  })

  it('retourne null au sommet de l\'échelle', () => {
    expect(nextRarity('legendaire')).toBeNull()
  })
})
