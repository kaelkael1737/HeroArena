import type { CombatOutcome, CombatantInput } from './combat'
import { resolveCombat } from './combat'
import type { TournamentMatch, TournamentState } from '../types'

export interface Competitor {
  id: string
  level: number
}

/**
 * Apparie par niveau proche : trie par niveau puis regroupe les héros consécutifs.
 * Un nombre impair de participants laisse le dernier (le plus haut niveau restant) avec un bye.
 */
export function pairByLevel(competitors: Competitor[]): { heroAId: string; heroBId: string | null }[] {
  const sorted = [...competitors].sort((a, b) => a.level - b.level)
  const pairs: { heroAId: string; heroBId: string | null }[] = []
  for (let i = 0; i < sorted.length; i += 2) {
    const a = sorted[i]
    const b = sorted[i + 1]
    pairs.push({ heroAId: a.id, heroBId: b ? b.id : null })
  }
  return pairs
}

export function createBracket(seasonId: number, competitors: Competitor[]): TournamentState {
  const pairs = pairByLevel(competitors)
  const round: TournamentMatch[] = pairs.map((p) => ({
    round: 1,
    heroAId: p.heroAId,
    heroBId: p.heroBId,
    result: null,
  }))
  return { seasonId, active: true, champion: null, rounds: [round] }
}

/** Résout tous les matchs d'une ronde. Un bye (heroBId = null) donne une victoire automatique. */
export function runRound(
  round: TournamentMatch[],
  combatants: Record<string, CombatantInput>,
  seedFor: (match: TournamentMatch, index: number) => number,
): TournamentMatch[] {
  return round.map((match, index) => {
    if (!match.heroBId) {
      const result: CombatOutcome = { scoreA: 0, scoreB: 0, winnerId: match.heroAId, seed: 0 }
      return { ...match, result: { heroAScore: 0, heroBScore: 0, winnerHeroId: result.winnerId, seed: 0 } }
    }
    const seed = seedFor(match, index)
    const outcome = resolveCombat(combatants[match.heroAId], combatants[match.heroBId], seed)
    return {
      ...match,
      result: { heroAScore: outcome.scoreA, heroBScore: outcome.scoreB, winnerHeroId: outcome.winnerId, seed },
    }
  })
}

function winnersOf(round: TournamentMatch[]): string[] {
  return round.map((m) => {
    if (!m.result) throw new Error('Ronde non résolue')
    return m.result.winnerHeroId
  })
}

/** Construit la ronde suivante à partir des vainqueurs de la ronde précédente. */
export function nextRound(previousRound: TournamentMatch[], roundNumber: number): TournamentMatch[] {
  const winners = winnersOf(previousRound)
  const pairs: TournamentMatch[] = []
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push({
      round: roundNumber,
      heroAId: winners[i],
      heroBId: winners[i + 1] ?? null,
      result: null,
    })
  }
  return pairs
}

export function isTournamentOver(state: TournamentState): boolean {
  const lastRound = state.rounds[state.rounds.length - 1]
  return lastRound.length === 1 && lastRound[0].result !== null
}

export function getChampion(state: TournamentState): string | null {
  if (!isTournamentOver(state)) return null
  const lastRound = state.rounds[state.rounds.length - 1]
  return lastRound[0].result?.winnerHeroId ?? null
}
