import type { Hero, HeroAttributes, ResourceNft } from '../types'

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
    progression: { level: 0, xp: 0 },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
    ...overrides,
  }
}

export function makeResourceNft(overrides: Partial<ResourceNft> = {}): ResourceNft {
  return { instanceId: 'nft-1', templateId: 'foret', rarity: 'commun', level: 1, xp: 0, ...overrides }
}
