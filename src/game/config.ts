import type {
  MissionDurationId,
  Recipe,
  ResourceDef,
  SmeltingRecipe,
  ZoneId,
} from './types'

/** Toutes les valeurs d'équilibrage du jeu. Modifier ici, jamais en dur ailleurs. */
export const config = {
  season: {
    durationDays: 28,
    tournamentDurationHours: 24,
    /** Bonus de départ pour les vétérans (désactivé par défaut). */
    veteranBonusEnabled: false,
    veteranBonusPoints: 0,
  },

  xp: {
    /** xp requis pour atteindre `level` depuis 0. */
    xpForLevel: (level: number) => Math.round(100 * level ** 1.5),
    /** XP gagné pour une mission, avant multiplicateurs de durée. */
    baseMissionXp: 20,
    trainingWinXp: 15,
    trainingLossXp: 5,
    pointsPerLevel: 3,
  },

  evolution: {
    tiers: [10, 25, 50] as const,
  },

  fusion: {
    /** Fraction des attributs de base transférée en bonus saisonnier (non implémenté, phase ultérieure). */
    transferRatio: 0.1,
  },

  equipment: {
    /** Si vrai, l'équipement porte un season_id et devient inutilisable la saison suivante. */
    seasonal: true,
  },

  missions: {
    /** Points d'Énergie du héros nécessaires pour ouvrir un slot de mission simultané. */
    energyPerSlot: 20,
    minConcurrentSlots: 1,
    maxConcurrentSlots: 5,
    durations: {
      courte: { hours: 1, xpMultiplier: 1, rareChanceBonus: 0 },
      moyenne: { hours: 4, xpMultiplier: 2.5, rareChanceBonus: 0.05 },
      longue: { hours: 8, xpMultiplier: 4.5, rareChanceBonus: 0.1 },
      expedition: { hours: 24, xpMultiplier: 10, rareChanceBonus: 0.2 },
    } satisfies Record<MissionDurationId, { hours: number; xpMultiplier: number; rareChanceBonus: number }>,
    /** Chance de base d'obtenir une ressource rare de la zone, avant bonus de durée/Chance. */
    baseRareChance: 0.1,
    /** Chance ajoutée par point de Chance du héros (plafonnée). */
    luckRareChancePerPoint: 0.002,
    maxRareChance: 0.6,
    /** Ressources communes obtenues par mission (avant multiplicateur de durée). */
    baseCommonYield: 3,
  },

  combat: {
    /** true = utiliser un générateur pseudo-aléatoire à graine fixe pour un combat reproductible. */
    seeded: true,
  },
} as const

export const zones: Record<ZoneId, {
  name: string
  recommendedLevel: number
  resourceIds: string[]
}> = {
  foret: { name: 'Forêt', recommendedLevel: 0, resourceIds: ['bois', 'herbes', 'cuir'] },
  mine: { name: 'Mine', recommendedLevel: 5, resourceIds: ['minerai_fer', 'pierre', 'cristal'] },
  marais: { name: 'Marais', recommendedLevel: 15, resourceIds: ['ecailles', 'os_monstre', 'herbes'] },
  volcan: { name: 'Volcan', recommendedLevel: 30, resourceIds: ['essence_feu', 'mithril', 'coeur_dragon'] },
}

export const resources: ResourceDef[] = [
  { id: 'bois', name: 'Bois', rarity: 'commune' },
  { id: 'minerai_fer', name: 'Minerai de fer', rarity: 'commune' },
  { id: 'cuir', name: 'Cuir', rarity: 'commune' },
  { id: 'pierre', name: 'Pierre', rarity: 'commune' },

  { id: 'acier', name: 'Acier', rarity: 'peu_commune' },
  { id: 'ecailles', name: 'Écailles', rarity: 'peu_commune' },
  { id: 'herbes', name: 'Herbes', rarity: 'peu_commune' },
  { id: 'os_monstre', name: 'Os de monstre', rarity: 'peu_commune' },

  { id: 'cristal', name: 'Cristal', rarity: 'rare' },
  { id: 'mithril', name: 'Mithril', rarity: 'rare' },
  { id: 'plume_phenix', name: 'Plume de phénix', rarity: 'rare' },
  { id: 'essence_feu', name: 'Essence de feu', rarity: 'rare' },
  { id: 'essence_glace', name: 'Essence de glace', rarity: 'rare' },
  { id: 'essence_foudre', name: 'Essence de foudre', rarity: 'rare' },

  { id: 'coeur_dragon', name: 'Cœur de dragon', rarity: 'legendaire' },
  { id: 'fragment_etoile', name: "Fragment d'étoile", rarity: 'legendaire' },
]

export const smeltingRecipes: SmeltingRecipe[] = [
  {
    id: 'fonte_acier',
    name: 'Fonte d\'acier',
    input: { resourceId: 'minerai_fer', quantity: 3 },
    output: { resourceId: 'acier', quantity: 1 },
  },
]

export const recipes: Recipe[] = [
  {
    id: 'epee_fer',
    name: 'Épée en fer',
    slot: 'arme',
    ingredients: [{ resourceId: 'minerai_fer', quantity: 3 }, { resourceId: 'bois', quantity: 1 }],
    effect: { bonus: { strength: 4 } },
  },
  {
    id: 'armure_cuir',
    name: 'Armure de cuir',
    slot: 'armure',
    ingredients: [{ resourceId: 'cuir', quantity: 5 }],
    effect: { bonus: { agility: 4 } },
  },
  {
    id: 'bouclier_ecailles',
    name: "Bouclier d'écailles",
    slot: 'bouclier',
    ingredients: [{ resourceId: 'ecailles', quantity: 4 }, { resourceId: 'bois', quantity: 2 }],
    effect: { bonus: { health: 5 } },
  },
  {
    id: 'amulette_cristal',
    name: 'Amulette de cristal',
    slot: 'amulette',
    ingredients: [{ resourceId: 'cristal', quantity: 1 }, { resourceId: 'os_monstre', quantity: 2 }],
    effect: { bonus: { luck: 5 } },
  },
  {
    id: 'potion_energie',
    name: "Potion d'énergie",
    slot: 'amulette',
    ingredients: [{ resourceId: 'herbes', quantity: 3 }],
    effect: { bonus: { energy: 6 }, special: 'temporaire' },
  },
  {
    id: 'lame_feu',
    name: 'Lame de feu',
    slot: 'arme',
    ingredients: [{ resourceId: 'mithril', quantity: 2 }, { resourceId: 'essence_feu', quantity: 1 }],
    effect: { bonus: { strength: 8 }, special: 'brulure' },
  },
  {
    id: 'armure_acier',
    name: "Armure d'acier",
    slot: 'armure',
    ingredients: [{ resourceId: 'acier', quantity: 4 }, { resourceId: 'cuir', quantity: 2 }],
    effect: { bonus: { health: 7 } },
  },
  {
    id: 'bouclier_glace',
    name: 'Bouclier de glace',
    slot: 'bouclier',
    ingredients: [{ resourceId: 'essence_glace', quantity: 2 }, { resourceId: 'acier', quantity: 2 }],
    effect: { bonus: { health: 6, agility: 2 } },
  },
  {
    id: 'amulette_foudre',
    name: 'Amulette de foudre',
    slot: 'amulette',
    ingredients: [{ resourceId: 'essence_foudre', quantity: 2 }, { resourceId: 'cristal', quantity: 1 }],
    effect: { bonus: { agility: 5, luck: 2 } },
  },
  {
    id: 'arc_plume_phenix',
    name: 'Arc de plume de phénix',
    slot: 'arme',
    ingredients: [{ resourceId: 'plume_phenix', quantity: 1 }, { resourceId: 'bois', quantity: 3 }],
    effect: { bonus: { agility: 6, strength: 2 } },
  },
  {
    id: 'armure_ecailles',
    name: "Armure d'écailles",
    slot: 'armure',
    ingredients: [{ resourceId: 'ecailles', quantity: 6 }, { resourceId: 'cuir', quantity: 2 }],
    effect: { bonus: { health: 5, agility: 2 } },
  },
  {
    id: 'bouclier_mithril',
    name: 'Bouclier de mithril',
    slot: 'bouclier',
    ingredients: [{ resourceId: 'mithril', quantity: 3 }],
    effect: { bonus: { health: 10, strength: 2 } },
  },
  {
    id: 'amulette_coeur_dragon',
    name: 'Amulette du cœur de dragon',
    slot: 'amulette',
    ingredients: [{ resourceId: 'coeur_dragon', quantity: 1 }, { resourceId: 'fragment_etoile', quantity: 1 }],
    effect: { bonus: { luck: 10, strength: 5, health: 5, energy: 5, agility: 5 } },
  },
  {
    id: 'epee_mithril',
    name: 'Épée de mithril',
    slot: 'arme',
    ingredients: [{ resourceId: 'mithril', quantity: 2 }, { resourceId: 'acier', quantity: 2 }],
    effect: { bonus: { strength: 9 } },
  },
  {
    id: 'armure_fragment_etoile',
    name: "Armure de fragment d'étoile",
    slot: 'armure',
    ingredients: [{ resourceId: 'fragment_etoile', quantity: 1 }, { resourceId: 'acier', quantity: 3 }],
    effect: { bonus: { health: 9, luck: 3 } },
  },
  {
    id: 'bouclier_pierre',
    name: 'Bouclier de pierre',
    slot: 'bouclier',
    ingredients: [{ resourceId: 'pierre', quantity: 5 }],
    effect: { bonus: { health: 4 } },
  },
]
