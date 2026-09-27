import type {
  MissionDurationId,
  Rarity,
  Recipe,
  ResourceDef,
  ResourceNftTemplate,
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
    /**
     * Plage de CHAQUE attribut (Chance, Force, Santé, Énergie, Agilité) selon la rareté.
     * Contiguës et sans chevauchement : le pire héros d'une rareté ne peut jamais dépasser
     * le meilleur de la rareté du dessous, sur aucun attribut.
     */
    attributeRangeByRarity: {
      commun: [5, 15],
      peu_commun: [15, 30],
      rare: [30, 50],
      epique: [50, 80],
      legendaire: [80, 125],
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
    /**
     * Multiplicateur de rendement (ressources ET xp du NFT) par durée — courbe convexe calée sur
     * l'exemple donné (1h → ×1, 2h → ×2,5) : multiplicateur(h) = h^1,32.
     */
    durations: {
      courte: { hours: 1, yieldMultiplier: 1 },
      moyenne: { hours: 4, yieldMultiplier: 6.25 },
      longue: { hours: 8, yieldMultiplier: 15.6 },
      expedition: { hours: 24, yieldMultiplier: 66.8 },
    } satisfies Record<MissionDurationId, { hours: number; yieldMultiplier: number }>,
    /** Nombre de ressources DIFFÉRENTES ramenées par mission (tirées sans remise parmi les rangs accessibles). */
    yieldTypesRange: [1, 3] as [number, number],
    /**
     * Poids de tirage et quantité de base par rang (1 = le plus commun de la zone, 5 = le plus
     * rare) : décroissance linéaire douce, sans gros écart d'un rang à l'autre.
     */
    weightByRank: (rank: number) => 6 - rank,
    baseQuantityByRank: (rank: number) => 6 - rank,
  },

  resourceNfts: {
    /** Niveau maximum d'un NFT d'exploration selon sa rareté (verrou de fusion). */
    levelCapByRarity: {
      commun: 10,
      peu_commun: 15,
      rare: 20,
      epique: 25,
      legendaire: 30,
    } satisfies Record<Rarity, number>,
    /** Multiplicateur de rendement au niveau 1, selon la rareté. */
    baseYieldByRarity: {
      commun: 1,
      peu_commun: 1.25,
      rare: 1.5,
      epique: 1.75,
      legendaire: 2,
    } satisfies Record<Rarity, number>,
    /** Croissance du rendement par niveau, au-delà du niveau 1 (exponentielle : ×(1+x) par niveau). */
    levelYieldGrowth: 0.1,
    /** XP cumulé pour atteindre `level` (écarts croissants, plus petite échelle que les héros). */
    xpForLevel: (level: number) => level * 200 + 50 * level * (level - 1),
    /** XP de base gagné par mission accomplie (avant multiplicateur de durée), quelle que soit la rareté. */
    baseXpPerMission: 50,
  },

  combat: {
    /** true = utiliser un générateur pseudo-aléatoire à graine fixe pour un combat reproductible. */
    seeded: true,
  },
} as const

/**
 * Ressources de chaque zone, classées du rang 1 (la plus commune, la plus abondante) au rang 5
 * (la plus rare). Aucune ressource n'est partagée entre deux zones. Le rang d'un NFT
 * d'exploration (voir resourceNftTemplates) plafonne à quels rangs il peut accéder dans sa zone.
 */
export const zones: Record<ZoneId, {
  name: string
  resourceIds: string[]
}> = {
  foret: { name: 'Forêt', resourceIds: ['bois', 'herbes', 'cuir', 'seve_ambree', 'graine_sequoia'] },
  mine: { name: 'Mine', resourceIds: ['minerai_fer', 'pierre', 'cristal', 'essence_glace', 'fragment_etoile'] },
  marais: { name: 'Marais', resourceIds: ['ecailles', 'os_monstre', 'boue_fertile', 'essence_foudre', 'perle_noire'] },
  volcan: { name: 'Volcan', resourceIds: ['cendre_volcanique', 'essence_feu', 'plume_phenix', 'mithril', 'coeur_dragon'] },
}

/**
 * Gabarits des NFT d'exploration : un par (zone × rareté), 5 rangs par zone, comme l'équipement.
 * Un héros ne peut jamais faire de mission — il faut posséder le NFT de la zone visée.
 */
export const resourceNftTemplates: ResourceNftTemplate[] = [
  { id: 'foret_commun', name: 'Bûcheron novice', zoneId: 'foret', rarity: 'commun' },
  { id: 'foret_peu_commun', name: 'Éclaireur des bois', zoneId: 'foret', rarity: 'peu_commun' },
  { id: 'foret_rare', name: 'Ranger sylvestre', zoneId: 'foret', rarity: 'rare' },
  { id: 'foret_epique', name: 'Gardien de la canopée', zoneId: 'foret', rarity: 'epique' },
  { id: 'foret_legendaire', name: 'Esprit de la forêt ancienne', zoneId: 'foret', rarity: 'legendaire' },

  { id: 'mine_commun', name: 'Mineur novice', zoneId: 'mine', rarity: 'commun' },
  { id: 'mine_peu_commun', name: 'Prospecteur', zoneId: 'mine', rarity: 'peu_commun' },
  { id: 'mine_rare', name: 'Foreur expérimenté', zoneId: 'mine', rarity: 'rare' },
  { id: 'mine_epique', name: 'Maître mineur', zoneId: 'mine', rarity: 'epique' },
  { id: 'mine_legendaire', name: 'Golem des profondeurs', zoneId: 'mine', rarity: 'legendaire' },

  { id: 'marais_commun', name: 'Piégeur novice', zoneId: 'marais', rarity: 'commun' },
  { id: 'marais_peu_commun', name: 'Pisteur des marais', zoneId: 'marais', rarity: 'peu_commun' },
  { id: 'marais_rare', name: 'Chasseur de créatures', zoneId: 'marais', rarity: 'rare' },
  { id: 'marais_epique', name: 'Traqueur redouté', zoneId: 'marais', rarity: 'epique' },
  { id: 'marais_legendaire', name: 'Ombre du marécage', zoneId: 'marais', rarity: 'legendaire' },

  { id: 'volcan_commun', name: 'Éclaireur volcanique', zoneId: 'volcan', rarity: 'commun' },
  { id: 'volcan_peu_commun', name: 'Arpenteur de cendres', zoneId: 'volcan', rarity: 'peu_commun' },
  { id: 'volcan_rare', name: 'Coureur de lave', zoneId: 'volcan', rarity: 'rare' },
  { id: 'volcan_epique', name: 'Dompteur de flammes', zoneId: 'volcan', rarity: 'epique' },
  { id: 'volcan_legendaire', name: 'Héraut du volcan', zoneId: 'volcan', rarity: 'legendaire' },
]

export const resources: ResourceDef[] = [
  // Forêt
  { id: 'bois', name: 'Bois', rarity: 'commune' },
  { id: 'herbes', name: 'Herbes', rarity: 'peu_commune' },
  { id: 'cuir', name: 'Cuir', rarity: 'rare' },
  { id: 'seve_ambree', name: 'Sève ambrée', rarity: 'epique' },
  { id: 'graine_sequoia', name: 'Graine de séquoia millénaire', rarity: 'legendaire' },

  // Mine
  { id: 'minerai_fer', name: 'Minerai de fer', rarity: 'commune' },
  { id: 'pierre', name: 'Pierre', rarity: 'peu_commune' },
  { id: 'cristal', name: 'Cristal', rarity: 'rare' },
  { id: 'essence_glace', name: 'Essence de glace', rarity: 'epique' },
  { id: 'fragment_etoile', name: "Fragment d'étoile", rarity: 'legendaire' },

  // Marais
  { id: 'ecailles', name: 'Écailles', rarity: 'commune' },
  { id: 'os_monstre', name: 'Os de monstre', rarity: 'peu_commune' },
  { id: 'boue_fertile', name: 'Boue fertile', rarity: 'rare' },
  { id: 'essence_foudre', name: 'Essence de foudre', rarity: 'epique' },
  { id: 'perle_noire', name: 'Perle noire', rarity: 'legendaire' },

  // Volcan
  { id: 'cendre_volcanique', name: 'Cendre volcanique', rarity: 'commune' },
  { id: 'essence_feu', name: 'Essence de feu', rarity: 'peu_commune' },
  { id: 'plume_phenix', name: 'Plume de phénix', rarity: 'rare' },
  { id: 'mithril', name: 'Mithril', rarity: 'epique' },
  { id: 'coeur_dragon', name: 'Cœur de dragon', rarity: 'legendaire' },

  // Fonte uniquement (jamais trouvé en mission)
  { id: 'acier', name: 'Acier', rarity: 'peu_commune' },
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
