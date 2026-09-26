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

/** Progression du héros. Permanente : ne se réinitialise jamais entre les saisons. */
export interface HeroProgression {
  level: number
  xp: number
  unspentPoints: number
  bonus: HeroAttributes
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

export type ResourceRarity = 'commune' | 'peu_commune' | 'rare' | 'legendaire'

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

export type MissionDurationId = 'courte' | 'moyenne' | 'longue' | 'expedition'

export interface MissionInProgress {
  id: string
  heroId: string
  zoneId: ZoneId
  durationId: MissionDurationId
  startedAt: number
  endsAt: number
  claimed: boolean
}

export interface CombatResult {
  heroAScore: number
  heroBScore: number
  winnerHeroId: string
  seed: number
}

export interface TournamentMatch {
  round: number
  heroAId: string
  heroBId: string | null // null = bye (pas d'adversaire)
  result: CombatResult | null
}

export interface TournamentState {
  seasonId: number
  active: boolean
  champion: string | null
  rounds: TournamentMatch[][]
}
