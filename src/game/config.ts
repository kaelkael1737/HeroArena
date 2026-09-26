import type {
  MissionDurationId,
  Rarity,
  Recipe,
  ResourceDef,
  SmeltingRecipe,
  ZoneId,
} from './types'

/** XP cumulé pour atteindre le niveau 1 ; l'écart entre deux niveaux grandit de xpGapIncrement à chaque niveau. */
const XP_FIRST_LEVEL = 15_200
const XP_GAP_INCREMENT = 1_500

/** Toutes les valeurs d'équilibrage du jeu. Modifier ici, jamais en dur ailleurs. */
export const config = {
  xp: {
    /** xp cumulé requis pour atteindre `level` depuis 0 (écarts croissants entre niveaux, voir plus haut). */
    xpForLevel: (level: number) => level * XP_FIRST_LEVEL + (XP_GAP_INCREMENT / 2) * level * (level - 1),
    /**
     * Seule source d'XP : les dégâts infligés aux monstres du raid (pas les missions, pas
     * l'entraînement). 1 point de dégâts = ce nombre de points d'XP.
     */
    xpPerDamagePoint: 1,
  },

  evolution: {
    tiers: [10, 25, 50] as const,
  },

  heroes: {
    /** Niveau maximum d'un héros selon sa rareté (verrou de fusion). */
    levelCapByRarity: {
      commun: 10,
      peu_commun: 20,
      rare: 30,
      epique: 45,
      legendaire: 60,
    } satisfies Record<Rarity, number>,
    /** Fourchette de la somme des attributs de base à la création (cahier des charges §4). */
    attributeSumRangeByRarity: {
      commun: [50, 70],
      peu_commun: [70, 90],
      rare: [90, 115],
      epique: [115, 140],
      legendaire: [150, 170],
    } satisfies Record<Rarity, [number, number]>,
  },

  equipment: {
    /** Niveau maximum d'un équipement selon sa rareté (verrou de fusion). */
    levelCapByRarity: {
      commun: 5,
      peu_commun: 8,
      rare: 12,
      epique: 18,
      legendaire: 25,
    } satisfies Record<Rarity, number>,
    /** Croissance du bonus par niveau au-delà du niveau 1 (fraction du bonus de base). */
    bonusGrowthPerLevel: 0.15,
    /** Coût pour passer du niveau N à N+1 = ingrédients de base × (N × ce facteur). */
    upgradeCostGrowthPerLevel: 1,
  },

  fusion: {
    /** Nombre de NFT de même rareté, au niveau max, nécessaires pour en fusionner un de rareté supérieure. */
    itemsRequired: 3,
  },

  raid: {
    /** Largeur du palier de niveau autour du centre (ex. centre 35 → attaquable de 30 à 40). */
    bracketWindow: 5,
    /** Écart entre deux centres de palier consécutifs. */
    bracketSpacing: 10,
    /** Cooldown de base (minutes) entre deux attaques, réduit par l'Énergie du héros. */
    baseCooldownMinutes: 60,
    /** Plus ce diviseur est petit, plus l'Énergie réduit vite le cooldown. */
    cooldownEnergyDivisor: 20,
    /** PV du monstre au palier de niveau le plus bas (centre 5) de chaque rareté. */
    baseHpByRarity: {
      commun: 500_000,
      peu_commun: 2_000_000,
      rare: 8_000_000,
      epique: 30_000_000,
      legendaire: 100_000_000,
    } satisfies Record<Rarity, number>,
    /** Croissance des PV (et de la cagnotte) par niveau, même logique que les dégâts. */
    hpLevelGrowth: 0.05,
    /** 1 unité de cagnotte pour ce nombre de PV max (unité neutre en attendant la conversion WAX réelle). */
    hpPerPotUnit: 100,
  },

  missions: {
    /** Points d'Énergie du héros nécessaires pour ouvrir un slot de mission simultané. */
    energyPerSlot: 20,
    minConcurrentSlots: 1,
    maxConcurrentSlots: 5,
    durations: {
      courte: { hours: 1, yieldMultiplier: 1, rareChanceBonus: 0 },
      moyenne: { hours: 4, yieldMultiplier: 2.5, rareChanceBonus: 0.05 },
      longue: { hours: 8, yieldMultiplier: 4.5, rareChanceBonus: 0.1 },
      expedition: { hours: 24, yieldMultiplier: 10, rareChanceBonus: 0.2 },
    } satisfies Record<MissionDurationId, { hours: number; yieldMultiplier: number; rareChanceBonus: number }>,
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
  marais: { name: 'Marais', resourceIds: ['ecailles', 'os_monstre', 'herbes'], recommendedLevel: 15 },
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

/**
 * Gabarits d'équipement : un par (emplacement × rareté), soit 5 rangs par emplacement.
 * Chaque objet fabriqué à partir d'un gabarit est un NFT permanent (niveau 1 au départ) qui
 * monte de niveau avec des ressources et peut être fusionné à rareté égale (voir logic/rarity.ts).
 */
export const recipes: Recipe[] = [
  // Arme (bonus de Force)
  { id: 'arme_commun', name: 'Épée en fer', slot: 'arme', rarity: 'commun', ingredients: [{ resourceId: 'minerai_fer', quantity: 3 }, { resourceId: 'bois', quantity: 1 }], effect: { bonus: { strength: 4 } } },
  { id: 'arme_peu_commun', name: "Épée d'acier", slot: 'arme', rarity: 'peu_commun', ingredients: [{ resourceId: 'acier', quantity: 3 }, { resourceId: 'bois', quantity: 1 }], effect: { bonus: { strength: 7 } } },
  { id: 'arme_rare', name: 'Lame de feu', slot: 'arme', rarity: 'rare', ingredients: [{ resourceId: 'mithril', quantity: 2 }, { resourceId: 'essence_feu', quantity: 1 }], effect: { bonus: { strength: 11 } } },
  { id: 'arme_epique', name: 'Épée de mithril', slot: 'arme', rarity: 'epique', ingredients: [{ resourceId: 'mithril', quantity: 3 }, { resourceId: 'acier', quantity: 2 }], effect: { bonus: { strength: 16 } } },
  { id: 'arme_legendaire', name: 'Lame du cœur de dragon', slot: 'arme', rarity: 'legendaire', ingredients: [{ resourceId: 'coeur_dragon', quantity: 1 }, { resourceId: 'fragment_etoile', quantity: 1 }], effect: { bonus: { strength: 24 } } },

  // Armure (bonus de Santé)
  { id: 'armure_commun', name: 'Armure de cuir', slot: 'armure', rarity: 'commun', ingredients: [{ resourceId: 'cuir', quantity: 5 }], effect: { bonus: { health: 4 } } },
  { id: 'armure_peu_commun', name: "Armure d'acier", slot: 'armure', rarity: 'peu_commun', ingredients: [{ resourceId: 'acier', quantity: 4 }, { resourceId: 'cuir', quantity: 2 }], effect: { bonus: { health: 7 } } },
  { id: 'armure_rare', name: "Armure d'écailles", slot: 'armure', rarity: 'rare', ingredients: [{ resourceId: 'ecailles', quantity: 6 }, { resourceId: 'cuir', quantity: 2 }], effect: { bonus: { health: 11 } } },
  { id: 'armure_epique', name: "Armure de fragment d'étoile", slot: 'armure', rarity: 'epique', ingredients: [{ resourceId: 'fragment_etoile', quantity: 1 }, { resourceId: 'acier', quantity: 3 }], effect: { bonus: { health: 16 } } },
  { id: 'armure_legendaire', name: 'Armure du cœur de dragon', slot: 'armure', rarity: 'legendaire', ingredients: [{ resourceId: 'coeur_dragon', quantity: 1 }, { resourceId: 'acier', quantity: 4 }], effect: { bonus: { health: 24 } } },

  // Bouclier (bonus de Santé + Agilité)
  { id: 'bouclier_commun', name: 'Bouclier de pierre', slot: 'bouclier', rarity: 'commun', ingredients: [{ resourceId: 'pierre', quantity: 5 }], effect: { bonus: { health: 4, agility: 1 } } },
  { id: 'bouclier_peu_commun', name: "Bouclier d'écailles", slot: 'bouclier', rarity: 'peu_commun', ingredients: [{ resourceId: 'ecailles', quantity: 4 }, { resourceId: 'bois', quantity: 2 }], effect: { bonus: { health: 7, agility: 2 } } },
  { id: 'bouclier_rare', name: 'Bouclier de glace', slot: 'bouclier', rarity: 'rare', ingredients: [{ resourceId: 'essence_glace', quantity: 2 }, { resourceId: 'acier', quantity: 2 }], effect: { bonus: { health: 11, agility: 3 } } },
  { id: 'bouclier_epique', name: 'Bouclier de mithril', slot: 'bouclier', rarity: 'epique', ingredients: [{ resourceId: 'mithril', quantity: 3 }], effect: { bonus: { health: 16, agility: 5 } } },
  { id: 'bouclier_legendaire', name: "Bouclier du fragment d'étoile", slot: 'bouclier', rarity: 'legendaire', ingredients: [{ resourceId: 'fragment_etoile', quantity: 1 }, { resourceId: 'mithril', quantity: 2 }], effect: { bonus: { health: 24, agility: 7 } } },

  // Amulette (bonus de Chance)
  { id: 'amulette_commun', name: 'Amulette de bois', slot: 'amulette', rarity: 'commun', ingredients: [{ resourceId: 'bois', quantity: 4 }], effect: { bonus: { luck: 4 } } },
  { id: 'amulette_peu_commun', name: "Amulette d'os", slot: 'amulette', rarity: 'peu_commun', ingredients: [{ resourceId: 'os_monstre', quantity: 2 }, { resourceId: 'bois', quantity: 2 }], effect: { bonus: { luck: 7 } } },
  { id: 'amulette_rare', name: 'Amulette de cristal', slot: 'amulette', rarity: 'rare', ingredients: [{ resourceId: 'cristal', quantity: 1 }, { resourceId: 'os_monstre', quantity: 2 }], effect: { bonus: { luck: 11 } } },
  { id: 'amulette_epique', name: 'Amulette de foudre', slot: 'amulette', rarity: 'epique', ingredients: [{ resourceId: 'essence_foudre', quantity: 2 }, { resourceId: 'cristal', quantity: 1 }], effect: { bonus: { luck: 16 } } },
  { id: 'amulette_legendaire', name: 'Amulette du cœur de dragon', slot: 'amulette', rarity: 'legendaire', ingredients: [{ resourceId: 'coeur_dragon', quantity: 1 }, { resourceId: 'fragment_etoile', quantity: 1 }], effect: { bonus: { luck: 24 } } },
]
