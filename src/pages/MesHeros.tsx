import { config, recipes } from '../game/config'
import { getEffectiveAttributes, getTotalAttributes } from '../game/logic/attributes'
import { nextRarity } from '../game/logic/rarity'
import { useGameStore } from '../game/store'
import type { EquipmentItem, EquipmentSlot, Hero, HeroAttributes, Rarity } from '../game/types'
import { HeroAvatar } from '../ui/HeroAvatar'
import { Button, Panel } from '../ui/Panel'

const slotLabels: Record<EquipmentSlot, string> = {
  arme: 'Arme',
  armure: 'Armure',
  bouclier: 'Bouclier',
  amulette: 'Amulette',
}

const rarityOrder: Record<Rarity, number> = {
  legendaire: 0,
  epique: 1,
  rare: 2,
  peu_commun: 3,
  commun: 4,
}

const attributeLabels: Record<keyof HeroAttributes, string> = {
  luck: 'Chance',
  strength: 'Force',
  health: 'Santé',
  energy: 'Énergie',
  agility: 'Agilité',
}

const rarityLabels: Record<Rarity, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

export default function MesHeros() {
  const heroes = useGameStore((s) => s.heroes)
  const sortedHeroIds = [...heroes]
    .sort((a, b) => rarityOrder[a.permanent.rarity] - rarityOrder[b.permanent.rarity])
    .map((h) => h.permanent.id)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mes héros</h1>
      <p className="text-sm text-neutral-500">
        Les héros gardent toute leur progression en permanence, saison après saison.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedHeroIds.map((id) => (
          <HeroCard key={id} heroId={id} />
        ))}
      </div>
      <FusionPanel heroes={heroes} />
    </div>
  )
}

function HeroCard({ heroId }: { heroId: string }) {
  const hero = useGameStore((s) => s.heroes.find((h) => h.permanent.id === heroId))
  const equippedSlots = useGameStore((s) => s.equippedByHero[heroId])
  const equipmentInventory = useGameStore((s) => s.equipmentInventory)
  const unequipItem = useGameStore((s) => s.unequipItem)

  if (!hero) return null

  const equippedItems = Object.values(equippedSlots ?? {})
    .filter((id): id is string => Boolean(id))
    .map((id) => equipmentInventory.find((i) => i.instanceId === id))
    .filter((i): i is EquipmentItem => Boolean(i))

  const total = getTotalAttributes(hero)
  const effective = getEffectiveAttributes(hero, equippedItems)
  const cap = config.heroes.levelCapByRarity[hero.permanent.rarity]

  return (
    <Panel>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <HeroAvatar name={hero.permanent.name} rarity={hero.permanent.rarity} />
          <div>
            <h3 className="font-semibold text-neutral-100">{hero.permanent.name}</h3>
            <span className="text-xs text-neutral-500">{rarityLabels[hero.permanent.rarity]}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-400">
            Niveau {hero.progression.level}
            <span className="text-neutral-600"> / {cap}</span>
          </div>
          <div className="text-xs text-neutral-600">{hero.progression.xp} XP</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {(Object.keys(attributeLabels) as (keyof HeroAttributes)[]).map((attr) => {
          const fromEquipment = effective[attr] - total[attr]
          return (
            <div key={attr} className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">{attributeLabels[attr]}</span>
              <span className="tabular-nums">
                {effective[attr]}
                {fromEquipment > 0 && (
                  <span className="text-sky-400"> (+{fromEquipment} équip.)</span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 space-y-1">
        {(Object.keys(slotLabels) as EquipmentSlot[]).map((slot) => {
          const instanceId = equippedSlots?.[slot]
          const item = equipmentInventory.find((i) => i.instanceId === instanceId)
          const recipe = item ? recipes.find((r) => r.id === item.recipeId) : undefined
          return (
            <div key={slot} className="flex items-center justify-between text-xs">
              <span className="text-neutral-600">{slotLabels[slot]}</span>
              {recipe && item ? (
                <span className="flex items-center gap-2">
                  <span className="text-neutral-300">
                    {recipe.name} (niv. {item.level})
                  </span>
                  <button
                    type="button"
                    onClick={() => unequipItem(heroId, slot)}
                    className="text-neutral-600 hover:text-red-400"
                  >
                    retirer
                  </button>
                </span>
              ) : (
                <span className="text-neutral-700">vide</span>
              )}
            </div>
          )
        })}
      </div>

      {hero.progression.level >= cap && (
        <p className="mt-2 text-xs text-sky-400">Niveau maximum atteint — prêt pour une fusion.</p>
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

function FusionPanel({ heroes }: { heroes: Hero[] }) {
  const fuseHeroes = useGameStore((s) => s.fuseHeroes)
  const needed = config.fusion.itemsRequired

  const groups = (Object.keys(rarityLabels) as Rarity[])
    .map((rarity) => {
      const cap = config.heroes.levelCapByRarity[rarity]
      const eligible = heroes.filter((h) => h.permanent.rarity === rarity && h.progression.level >= cap)
      return { rarity, eligible, target: nextRarity(rarity) }
    })
    .filter((g) => g.target && g.eligible.length >= needed)

  return (
    <Panel title="Fusion de héros">
      <p className="mb-3 text-sm text-neutral-500">
        {needed} héros de même rareté, tous au niveau maximum, peuvent être fusionnés en 1 héros de
        rareté supérieure (niveau 1, attributs neufs). Les {needed} héros d'origine sont consommés.
      </p>
      {groups.length === 0 && (
        <p className="text-neutral-600">Aucune fusion possible pour le moment.</p>
      )}
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.rarity} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
            <span>
              {g.eligible.length} héros {rarityLabels[g.rarity]} au niveau max → 1 héros {rarityLabels[g.target!]}
            </span>
            <Button onClick={() => fuseHeroes(g.eligible.slice(0, needed).map((h) => h.permanent.id))}>
              Fusionner {needed}
            </Button>
          </div>
        ))}
      </div>
    </Panel>
  )
}
