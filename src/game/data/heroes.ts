import heroesData from './heroes.json'
import type { Hero, HeroPermanent } from '../types'

const permanents = heroesData as HeroPermanent[]

/** Les 40 héros de départ (cahier des charges §4), initialisés pour la saison 1. */
export const heroes: Hero[] = permanents.map((permanent) => ({
  permanent,
  progression: {
    level: 0,
    xp: 0,
    unspentPoints: 0,
    bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 },
  },
  history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
}))
