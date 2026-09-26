/**
 * PRNG à graine (mulberry32) pour des tirages reproductibles : un combat ou une mission
 * rejoué avec la même graine donne toujours le même résultat (utile pour les replays).
 * Ne jamais utiliser Math.random() dans la logique de jeu pure.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entier aléatoire entre min et max inclus. */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Hash déterministe d'une chaîne, pour dériver une graine de RNG reproductible. */
export function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return hash >>> 0
}
