import { describe, expect, it } from 'vitest'
import { resolveCombat } from './combat'
import { makeAttributes } from './fixtures'

describe('resolveCombat', () => {
  it('est déterministe pour une graine donnée', () => {
    const a = { id: 'a', level: 5, attributes: makeAttributes() }
    const b = { id: 'b', level: 5, attributes: makeAttributes() }
    const outcome1 = resolveCombat(a, b, 123)
    const outcome2 = resolveCombat(a, b, 123)
    expect(outcome1).toEqual(outcome2)
  })

  it('favorise (statistiquement) le héros aux attributs largement supérieurs', () => {
    const strong = { id: 'strong', level: 20, attributes: makeAttributes({ luck: 50, strength: 50, health: 50, energy: 50, agility: 50 }) }
    const weak = { id: 'weak', level: 1, attributes: makeAttributes({ luck: 1, strength: 1, health: 1, energy: 1, agility: 1 }) }

    let strongWins = 0
    const trials = 50
    for (let seed = 0; seed < trials; seed += 1) {
      const outcome = resolveCombat(strong, weak, seed)
      if (outcome.winnerId === 'strong') strongWins += 1
    }
    expect(strongWins).toBeGreaterThan(trials * 0.9)
  })

  it('désigne toujours un gagnant parmi les deux combattants', () => {
    const a = { id: 'a', level: 1, attributes: makeAttributes() }
    const b = { id: 'b', level: 1, attributes: makeAttributes() }
    const outcome = resolveCombat(a, b, 1)
    expect(['a', 'b']).toContain(outcome.winnerId)
  })
})
