import type { Rarity } from '../game/types'

const rarityColors: Record<Rarity, string> = {
  commun: '#9ca3af',
  peu_commun: '#4ade80',
  rare: '#38bdf8',
  epique: '#c084fc',
  legendaire: '#fbbf24',
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Placeholder généré (initiales + couleur de rareté) tant qu'il n'y a pas de vraie image de héros. */
export function HeroAvatar({ name, rarity, size = 40 }: { name: string; rarity: Rarity; size?: number }) {
  const color = rarityColors[rarity]
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color,
        backgroundColor: `${color}26`,
        border: `1.5px solid ${color}`,
      }}
    >
      {initialsOf(name)}
    </div>
  )
}
