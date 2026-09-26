import { useState } from 'react'
import { canAttack } from '../game/logic/raid'
import { useGameStore } from '../game/store'
import { Button, Panel } from '../ui/Panel'

const rarityLabels: Record<string, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}min ${seconds}s`
}

export default function Arene() {
  const heroes = useGameStore((s) => s.heroes)
  const heroIds = heroes.map((h) => h.permanent.id)
  const trainHero = useGameStore((s) => s.trainHero)
  const monsters = useGameStore((s) => s.monsters)
  const now = useGameStore((s) => s.now)
  const heroRaidCooldowns = useGameStore((s) => s.heroRaidCooldowns)
  const attackMonster = useGameStore((s) => s.attackMonster)

  const [selectedHero, setSelectedHero] = useState(heroIds[0])
  const [lastResult, setLastResult] = useState<{ won: boolean } | null>(null)
  const [lastAttack, setLastAttack] = useState<{ damage: number; xpGained: number } | null>(null)

  const hero = heroes.find((h) => h.permanent.id === selectedHero)
  const eligibleMonsters = hero ? monsters.filter((m) => canAttack(hero.permanent.rarity, hero.progression.level, m)) : []
  const readyAt = heroRaidCooldowns[selectedHero] ?? 0
  const onCooldown = now < readyAt

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Arène</h1>

      <Panel title="Choix du héros">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-400">Héros</span>
          <select
            className="w-fit rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5"
            value={selectedHero}
            onChange={(e) => {
              setSelectedHero(e.target.value)
              setLastAttack(null)
              setLastResult(null)
            }}
          >
            {heroes.map((h) => (
              <option key={h.permanent.id} value={h.permanent.id}>
                {h.permanent.name} ({rarityLabels[h.permanent.rarity]}, niveau {h.progression.level})
              </option>
            ))}
          </select>
        </label>
      </Panel>

      <Panel title="Entraînement">
        <p className="mb-3 text-sm text-neutral-500">
          Combat d'essai contre une IA générée. Ne fait pas progresser le héros — seules les
          missions donnent de l'XP.
        </p>
        <Button
          onClick={() => {
            const result = trainHero(selectedHero)
            if (result) setLastResult(result)
          }}
        >
          Combat d'entraînement
        </Button>
        {lastResult && (
          <p className={`mt-3 text-sm ${lastResult.won ? 'text-emerald-400' : 'text-red-400'}`}>
            {lastResult.won ? 'Victoire' : 'Défaite'}
          </p>
        )}
      </Panel>

      <Panel title="Monstre(s) attaquable(s) par ce héros">
        <p className="mb-3 text-sm text-neutral-500">
          Dégâts = niveau × Σ [ tirage(1, attribut) × facteur de chance ], facteur tiré entre 1 et la Chance du héros. Cooldown réduit par l'Énergie. Chaque point de dégâts donne 1 XP au héros — seul le raid le fait progresser.
        </p>
        {eligibleMonsters.length === 0 && <p className="text-neutral-600">Aucun monstre dans la fenêtre de niveau de ce héros.</p>}
        <div className="space-y-3">
          {eligibleMonsters.map((m) => {
            const pct = Math.max(0, Math.round((m.currentHp / m.maxHp) * 100))
            return (
              <div key={m.id} className="rounded-md border border-neutral-800 p-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {rarityLabels[m.rarity]} — niveau {m.levelBracket}
                  </span>
                  <span className="text-neutral-500">
                    {m.currentHp.toLocaleString('fr-FR')} / {m.maxHp.toLocaleString('fr-FR')} PV
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                  <div className="h-full bg-red-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-amber-400">Cagnotte : {m.pot.toLocaleString('fr-FR')} parts</span>
                  <Button
                    disabled={onCooldown}
                    onClick={() => {
                      const result = attackMonster(selectedHero, m.id)
                      if (result) setLastAttack(result)
                    }}
                  >
                    {onCooldown ? `Récup. ${formatRemaining(readyAt - now)}` : 'Attaquer'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        {lastAttack && (
          <p className="mt-3 text-sm text-red-400">
            Coup porté : {lastAttack.damage.toLocaleString('fr-FR')} dégâts
            <span className="text-emerald-400"> (+{lastAttack.xpGained.toLocaleString('fr-FR')} XP)</span>
          </p>
        )}
      </Panel>
    </div>
  )
}
