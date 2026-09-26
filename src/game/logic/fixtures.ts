import type { Hero, HeroAttributes } from '../types'

export function makeAttributes(overrides: Partial<HeroAttributes> = {}): HeroAttributes {
  return { luck: 10, strength: 10, health: 10, energy: 10, agility: 10, ...overrides }
}

export function makeHero(overrides: Partial<Hero> = {}): Hero {
  return {
    permanent: {
      id: 'hero-1',
      name: 'Test Hero',
      image: '',
      description: '',
      rarity: 'commun',
      base: makeAttributes(),
      rarityScore: 50,
    },
    progression: {
      level: 0,
      xp: 0,
      unspentPoints: 0,
      bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 },
    },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
    ...overrides,
  }
}
