export type Rarity = 'commun' | 'peu_commun' | 'rare' | 'epique' | 'legendaire'

export interface HeroAttributes {
  luck: number
  strength: number
  health: number
  energy: number
  agility: number
}

/** Données permanentes, immuables dans le NFT. */
export interface HeroPermanent {
  id: string
  name: string
  image: string
  description: string
  rarity: Rarity
  base: HeroAttributes
  rarityScore: number
}

/**
 * Progression du héros. Permanente : ne se réinitialise jamais entre les saisons. Ne modifie pas
 * les attributs (seul l'équipement le fait) — sert de multiplicateur de dégâts de raid et de
 * verrou de fusion.
 */
export interface HeroProgression {
  level: number
  xp: number
}

/** Historique, jamais remis à zéro. */
export interface HeroHistory {
  bestRank: number | null
  totalWins: number
  titles: string[]
  badges: string[]
}

export interface Hero {
  permanent: HeroPermanent
  progression: HeroProgression
  history: HeroHistory
}

export type ResourceRarity = 'commune' | 'peu_commune' | 'rare' | 'epique' | 'legendaire'

export interface ResourceDef {
  id: string
  name: string
  rarity: ResourceRarity
}

export type EquipmentSlot = 'arme' | 'armure' | 'bouclier' | 'amulette'

export interface RecipeIngredient {
  resourceId: string
  quantity: number
}

export interface EquipmentEffect {
  bonus: Partial<HeroAttributes>
}

/** Gabarit d'un équipement pour un emplacement et une rareté donnés (le "mint" de départ, niveau 1). */
export interface Recipe {
  id: string
  name: string
  slot: EquipmentSlot
  rarity: Rarity
  /** Coût pour fabriquer l'objet neuf au niveau 1. */
  ingredients: RecipeIngredient[]
  /** Bonus au niveau 1 ; croît avec le niveau (voir config.equipment.bonusGrowthPerLevel). */
  effect: EquipmentEffect
}

export interface SmeltingRecipe {
  id: string
  name: string
  input: RecipeIngredient
  output: RecipeIngredient
}

/** Un équipement possédé : NFT permanent, non consommable, qui monte de niveau et peut être fusionné. */
export interface EquipmentItem {
  instanceId: string
  recipeId: string
  level: number
}

export type ZoneId = 'foret' | 'mine' | 'marais' | 'volcan'

/**
 * Gabarit d'un NFT d'exploration pour une zone et une rareté données (le "mint" de départ,
 * niveau 1). Un héros ne peut jamais faire de mission : il faut posséder le NFT de la zone.
 */
export interface ResourceNftTemplate {
  id: string
  name: string
  zoneId: ZoneId
  rarity: Rarity
}

/** Un NFT d'exploration possédé : permanent, monte de niveau en accomplissant des missions. */
export interface ResourceNft {
  instanceId: string
  templateId: string
  level: number
  xp: number
}

export type MissionDurationId = 'courte' | 'moyenne' | 'longue' | 'expedition'

export interface MissionInProgress {
  id: string
  nftId: string
  durationId: MissionDurationId
  startedAt: number
  endsAt: number
  claimed: boolean
}

/**
 * Monstre partagé : un par (rareté × palier de niveau). Les héros de cette rareté, dont le
 * niveau tombe dans la fenêtre du palier, peuvent l'attaquer. Sa cagnotte se répartit au
 * prorata des dégâts cumulés de chaque joueur quand ses PV tombent à 0, puis il renaît.
 */
export interface Monster {
  id: string
  rarity: Rarity
  levelBracket: number
  maxHp: number
  currentHp: number
  pot: number
  damageByPlayer: Record<string, number>
}

/** Participant simulé (bot) pour tester le combat de monstre en phase 1, sans vrai multijoueur. */
export interface RaidBot {
  id: string
  playerName: string
  rarity: Rarity
  level: number
  attributes: HeroAttributes
  nextAttackAt: number
}
