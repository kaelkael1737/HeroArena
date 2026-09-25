import { describe, expect, it } from 'vitest'
import { createBracket, getChampion, isTournamentOver, nextRound, pairByLevel, runRound } from './tournament'
import { makeAttributes } from './fixtures'
import type { CombatantInput } from './combat'

describe('pairByLevel', () => {
  it('apparie les niveaux voisins', () => {
    const pairs = pairByLevel([
      { id: 'a', level: 1 },
      { id: 'b', level: 20 },
      { id: 'c', level: 2 },
      { id: 'd', level: 19 },
    ])
    expect(pairs).toEqual([
      { heroAId: 'a', heroBId: 'c' },
      { heroAId: 'd', heroBId: 'b' },
    ])
  })

  it('donne un bye au dernier participant si le nombre est impair', () => {
    const pairs = pairByLevel([{ id: 'a', level: 1 }, { id: 'b', level: 2 }, { id: 'c', level: 3 }])
    expect(pairs[pairs.length - 1]).toEqual({ heroAId: 'c', heroBId: null })
  })
})

function combatantsFor(ids: string[]): Record<string, CombatantInput> {
  const map: Record<string, CombatantInput> = {}
  for (const id of ids) {
    map[id] = { id, level: 5, attributes: makeAttributes() }
  }
  return map
}

describe('tournoi complet', () => {
  it('déroule un bracket à 4 participants jusqu\'au champion', () => {
    const ids = ['a', 'b', 'c', 'd']
    const state = createBracket(1, ids.map((id, i) => ({ id, level: i + 1 })))
    const combatants = combatantsFor(ids)

    const round1 = runRound(state.rounds[0], combatants, (_m, i) => 100 + i)
    expect(isTournamentOver({ ...state, rounds: [round1] })).toBe(false)

    const round2 = nextRound(round1, 2)
    const resolvedRound2 = runRound(round2, combatants, (_m, i) => 200 + i)

    const finalState = { ...state, rounds: [round1, resolvedRound2] }
    expect(isTournamentOver(finalState)).toBe(true)
    expect(getChampion(finalState)).not.toBeNull()
  })

  it('un bye donne une victoire automatique sans combat', () => {
    const ids = ['a', 'b', 'c']
    const state = createBracket(1, ids.map((id, i) => ({ id, level: i + 1 })))
    const combatants = combatantsFor(ids)
    const round1 = runRound(state.rounds[0], combatants, () => 1)
    const byeMatch = round1.find((m) => m.heroBId === null)
    expect(byeMatch?.result?.winnerHeroId).toBe(byeMatch?.heroAId)
  })
})
