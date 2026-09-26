import { config } from '../config'
import type { RaidBot, Rarity } from '../types'
import { generateHero } from './heroGenerator'
import { generateLevelBrackets } from './raid'
import { createRng } from './rng'

const RARITIES: Rarity[] = ['commun', 'peu_commun', 'rare', 'epique', 'legendaire']
const BOTS_PER_BRACKET = 2

/**
 * Joueurs simulés pour tester le combat de monstre en phase 1 (pas de vrai multijoueur pour
 * l'instant) : deux par palier de chaque rareté, garantissant qu'aucun monstre ne reste sans
 * participant dès le départ.
 */
export function generateBots(seed = 1): RaidBot[] {
  const rng = createRng(seed)
  const bots: RaidBot[] = []
  let counter = 0

  for (const rarity of RARITIES) {
    const cap = config.heroes.levelCapByRarity[rarity]
    for (const level of generateLevelBrackets(cap)) {
      for (let i = 0; i < BOTS_PER_BRACKET; i += 1) {
        counter += 1
        const id = `bot-${counter}`
        const hero = generateHero(rarity, rng, id)
        bots.push({
          id,
          playerName: hero.permanent.name,
          rarity,
          level,
          attributes: hero.permanent.base,
          nextAttackAt: 0,
        })
      }
    }
  }

  return bots
}
