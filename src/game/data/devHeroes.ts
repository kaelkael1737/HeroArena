import type { Hero } from '../types'

/**
 * Héros de développement temporaires, juste pour avoir des données à afficher dans l'UI.
 * La vraie liste de 40 héros (cahier des charges §4) n'est pas encore construite — à faire
 * dans une passe dédiée, avec de vrais noms/images/rareté.
 */
export const devHeroes: Hero[] = [
  {
    permanent: {
      id: 'dev-1',
      name: '(dev) Kessia',
      image: '',
      description: 'Héros de test — Chance élevée.',
      rarity: 'rare',
      base: { luck: 22, strength: 10, health: 14, energy: 16, agility: 12 },
      rarityScore: 100,
    },
    seasonal: { seasonId: 1, level: 0, xp: 0, unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
  },
  {
    permanent: {
      id: 'dev-2',
      name: '(dev) Bramm',
      image: '',
      description: 'Héros de test — Force élevée.',
      rarity: 'peu_commun',
      base: { luck: 8, strength: 20, health: 18, energy: 12, agility: 8 },
      rarityScore: 80,
    },
    seasonal: { seasonId: 1, level: 0, xp: 0, unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
  },
  {
    permanent: {
      id: 'dev-3',
      name: '(dev) Ylenne',
      image: '',
      description: 'Héros de test — Agilité élevée.',
      rarity: 'commun',
      base: { luck: 10, strength: 8, health: 10, energy: 14, agility: 20 },
      rarityScore: 62,
    },
    seasonal: { seasonId: 1, level: 0, xp: 0, unspentPoints: 0, bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 } },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
  },
]
