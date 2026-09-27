import { config } from '../config'
import type { Hero, HeroAttributes, HeroPermanent, Rarity } from '../types'
import { generateName } from './nameGenerator'
import { randomInt } from './rng'

const attrKeys: (keyof HeroAttributes)[] = ['luck', 'strength', 'health', 'energy', 'agility']
type Archetype = keyof HeroAttributes | 'balanced'
const archetypes: Archetype[] = ['luck', 'strength', 'health', 'energy', 'agility', 'balanced']

/**
 * Tire chaque attribut indépendamment dans la même plage [min, max] de la rareté — jamais au-delà,
 * donc un attribut d'une rareté ne peut jamais dépasser le plancher de la rareté supérieure.
 * L'archétype ne fait que biaiser où, dans cette plage, l'attribut tombe (haut pour l'attribut
 * dominant, bas pour les autres) ; il ne l'élargit jamais.
 */
function buildAttributes(range: [number, number], archetype: Archetype, rng: () => number): HeroAttributes {
  const [min, max] = range
  const mid = (min + max) / 2

  if (archetype === 'balanced') {
    return {
      luck: randomInt(rng, min, max),
      strength: randomInt(rng, min, max),
      health: randomInt(rng, min, max),
      energy: randomInt(rng, min, max),
      agility: randomInt(rng, min, max),
    }
  }

  const attrs = {} as HeroAttributes
  for (const key of attrKeys) {
    attrs[key] = key === archetype
      ? randomInt(rng, Math.ceil(mid), max)
      : randomInt(rng, min, Math.floor(mid))
  }
  return attrs
}

/** rarity_score = somme pondérée des attributs de base (la Chance compte davantage). */
export function computeRarityScore(attrs: HeroAttributes): number {
  return Math.round(attrs.luck * 1.5 + attrs.strength + attrs.health + attrs.energy + attrs.agility)
}

/** Génère un héros neuf pour une rareté donnée (mint initial ou résultat d'une fusion). */
export function generateHero(rarity: Rarity, rng: () => number, id: string): Hero {
  const range = config.heroes.attributeRangeByRarity[rarity]
  const archetype = archetypes[randomInt(rng, 0, archetypes.length - 1)]
  const base = buildAttributes(range, archetype, rng)

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
    progression: { level: 0, xp: 0 },
    history: { bestRank: null, totalWins: 0, titles: [], badges: [] },
  }
}
