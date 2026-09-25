import { useGameStore } from '../game/store'
import { Panel } from '../ui/Panel'

export default function Classement() {
  const heroes = useGameStore((s) => s.heroes)
  const currentSeasonId = useGameStore((s) => s.currentSeasonId)

  const displayed = heroes.map((h) => ({
    id: h.permanent.id,
    name: h.permanent.name,
    level: h.seasonal.seasonId === currentSeasonId ? h.seasonal.level : 0,
    totalWins: h.history.totalWins,
    bestRank: h.history.bestRank,
    titles: h.history.titles,
  }))

  const bySeasonLevel = [...displayed].sort((a, b) => b.level - a.level)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Classement</h1>

      <Panel title={`Classement de la saison ${currentSeasonId}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="pb-2">#</th>
              <th className="pb-2">Héros</th>
              <th className="pb-2">Niveau</th>
            </tr>
          </thead>
          <tbody>
            {bySeasonLevel.map((h, i) => (
              <tr key={h.id} className="border-t border-neutral-800">
                <td className="py-1.5 text-neutral-500">{i + 1}</td>
                <td className="py-1.5">{h.name}</td>
                <td className="py-1.5 tabular-nums">{h.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Palmarès historique">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="pb-2">Héros</th>
              <th className="pb-2">Victoires</th>
              <th className="pb-2">Meilleur rang</th>
              <th className="pb-2">Titres</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((h) => (
              <tr key={h.id} className="border-t border-neutral-800">
                <td className="py-1.5">{h.name}</td>
                <td className="py-1.5 tabular-nums">{h.totalWins}</td>
                <td className="py-1.5 tabular-nums">{h.bestRank ?? '—'}</td>
                <td className="py-1.5 text-neutral-400">{h.titles.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
