import { config } from '../config'
import type { Hero, HeroAttributes, HeroPermanent, Rarity } from '../types'
import { generateName } from './nameGenerator'
import { randomInt } from './rng'

const attrKeys: (keyof HeroAttributes)[] = ['luck', 'strength', 'health', 'energy', 'agility']
type Archetype = keyof HeroAttributes | 'balanced'
const archetypes: Archetype[] = ['luck', 'strength', 'health', 'energy', 'agility', 'balanced']

function buildAttributes(sum: number, archetype: Archetype): HeroAttributes {
  if (archetype === 'balanced') {
    const base = Math.floor(sum / 5)
    const remainder = sum - base * 5
    const attrs: HeroAttributes = { luck: base, strength: base, health: base, energy: base, agility: base }
    for (let i = 0; i < remainder; i += 1) attrs[attrKeys[i % 5]] += 1
    return attrs
  }
  const primaryShare = Math.round(sum * 0.36)
  const rest = sum - primaryShare
  const others = attrKeys.filter((k) => k !== archetype)
  const restBase = Math.floor(rest / 4)
  const remainder = rest - restBase * 4
  const attrs: HeroAttributes = { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 }
  attrs[archetype] = primaryShare
  for (const k of others) attrs[k] = restBase
  for (let i = 0; i < remainder; i += 1) attrs[others[i % 4]] += 1
  return attrs
}

/** rarity_score = somme pondérée des attributs de base (la Chance compte davantage). */
export function computeRarityScore(attrs: HeroAttributes): number {
  return Math.round(attrs.luck * 1.5 + attrs.strength + attrs.health + attrs.energy + attrs.agility)
}

/** Génère un héros neuf pour une rareté donnée (mint initial ou résultat d'une fusion). */
export function generateHero(rarity: Rarity, rng: () => number, id: string): Hero {
  const [min, max] = config.heroes.attributeSumRangeByRarity[rarity]
  const sum = randomInt(rng, min, max)
  const archetype = archetypes[randomInt(rng, 0, archetypes.length - 1)]
  const base = buildAttributes(sum, archetype)

  const permanent: HeroPermanent = {
    id,
    name: generateName(rng),
    image: '',
    description: 'Héros né de la fusion de trois NFT de rareté inférieure.',
    rarity,
    base,
    rarityScore: computeRarityScore(base),
  }

  return {
    permanent,
    progression: {
      level: 0,
      xp: 0,
      unspentPoints: 0,
      bonus: { luck: 0, strength: 0, health: 0, energy: 0, agility: 0 },
    },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
  }
}
