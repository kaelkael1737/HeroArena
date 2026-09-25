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

/** Données saisonnières, remises à zéro (paresseusement) à chaque nouvelle saison. */
export interface HeroSeasonal {
  seasonId: number
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
  seasonal: HeroSeasonal
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
  special?: string
}

export interface Recipe {
  id: string
  name: string
  slot: EquipmentSlot
  ingredients: RecipeIngredient[]
  effect: EquipmentEffect
}

export interface SmeltingRecipe {
  id: string
  name: string
  input: RecipeIngredient
  output: RecipeIngredient
}

export interface EquipmentItem {
  instanceId: string
  recipeId: string
  seasonId: number
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
