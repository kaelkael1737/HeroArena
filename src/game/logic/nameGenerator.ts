const firstPart1 = ['Ka', 'Ny', 'Ze', 'Bra', 'Ily', 'Ve', 'Or', 'Fen', 'Sil', 'Tho', 'Wy', 'Ae', 'Ru', 'Mor', 'Cor', 'Isa', 'Dre', 'Ash', 'Vor', 'Lu']
const firstPart2 = ['ren', 'wyn', 'dra', 'lis', 'mir', 'tha', 'vek', 'ion', 'nel', 'ric', 'sha', 'lyn', 'dor', 'wen', 'ta', 'rin', 'vas', 'mon', 'tir', 'ael']
const surnamePrefix = ['Iron', 'Storm', 'Shadow', 'Ember', 'Frost', 'Stone', 'Blood', 'Silver', 'Night', 'Sun', 'Moon', 'Wind', 'Thorn', 'Grim', 'Bright', 'Ash', 'Star', 'Wolf', 'Raven', 'Oak']
const surnameSuffix = ['heart', 'blade', 'fall', 'song', 'mere', 'crest', 'wood', 'vale', 'hollow', 'forge', 'ward', 'reach', 'holt', 'spire', 'gale', 'root', 'shade', 'claw', 'gate', 'mark']

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)]
}

/** Nom original généré par combinaison de syllabes, pour les héros issus d'une fusion. */
export function generateName(rng: () => number): string {
  const first = pick(firstPart1, rng) + pick(firstPart2, rng)
  const last = pick(surnamePrefix, rng) + pick(surnameSuffix, rng)
  return `${first} ${last}`
}
