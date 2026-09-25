import { useMemo } from 'react'
import { getTotalAttributes } from '../game/logic/attributes'
import { applySeasonReset } from '../game/logic/season'
import { useGameStore } from '../game/store'
import type { HeroAttributes } from '../game/types'
import { Panel } from '../ui/Panel'

const attributeLabels: Record<keyof HeroAttributes, string> = {
  luck: 'Chance',
  strength: 'Force',
  health: 'Santé',
  energy: 'Énergie',
  agility: 'Agilité',
}

const rarityLabels: Record<string, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

export default function MesHeros() {
  const heroes = useGameStore((s) => s.heroes)
  const heroIds = heroes.map((h) => h.permanent.id)
  const currentSeasonId = useGameStore((s) => s.currentSeasonId)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mes héros</h1>
      <p className="text-sm text-neutral-500">
        Saison {currentSeasonId}. Les héros non touchés depuis le début de la saison repartent
        automatiquement à zéro (niveau, XP, bonus) au premier usage.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {heroIds.map((id) => (
          <HeroCard key={id} heroId={id} />
        ))}
      </div>
    </div>
  )
}

function HeroCard({ heroId }: { heroId: string }) {
  const heroes = useGameStore((s) => s.heroes)
  const currentSeasonId = useGameStore((s) => s.currentSeasonId)
  const allocatePoint = useGameStore((s) => s.allocatePoint)

  const rawHero = heroes.find((h) => h.permanent.id === heroId)
  const hero = useMemo(
    () => (rawHero ? applySeasonReset(rawHero, currentSeasonId) : undefined),
    [rawHero, currentSeasonId],
  )

  if (!hero) return null
  const total = getTotalAttributes(hero)

  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-neutral-100">{hero.permanent.name}</h3>
          <span className="text-xs text-neutral-500">{rarityLabels[hero.permanent.rarity]}</span>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-400">Niveau {hero.seasonal.level}</div>
          <div className="text-xs text-neutral-600">{hero.seasonal.xp} XP</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {(Object.keys(attributeLabels) as (keyof HeroAttributes)[]).map((attr) => (
          <div key={attr} className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">{attributeLabels[attr]}</span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums">
                {total[attr]}
                {hero.seasonal.bonus[attr] > 0 && (
                  <span className="text-emerald-400"> (+{hero.seasonal.bonus[attr]})</span>
                )}
              </span>
              {hero.seasonal.unspentPoints > 0 && (
                <button
                  type="button"
                  onClick={() => allocatePoint(heroId, attr)}
                  className="flex h-5 w-5 items-center justify-center rounded bg-neutral-800 text-xs hover:bg-amber-500 hover:text-neutral-950"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {hero.seasonal.unspentPoints > 0 && (
        <p className="mt-3 text-xs text-amber-400">
          {hero.seasonal.unspentPoints} point(s) à répartir
        </p>
      )}

      {hero.history.totalWins > 0 && (
        <p className="mt-2 text-xs text-neutral-500">
          Historique : {hero.history.totalWins} victoire(s)
          {hero.history.bestRank ? `, meilleur rang #${hero.history.bestRank}` : ''}
        </p>
      )}
    </Panel>
  )
}

