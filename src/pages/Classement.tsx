import { LOCAL_PLAYER_ID, useGameStore } from '../game/store'
import { Panel } from '../ui/Panel'

const rarityLabels: Record<string, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

export default function Classement() {
  const monsters = useGameStore((s) => s.monsters)
  const bots = useGameStore((s) => s.bots)
  const raidRewards = useGameStore((s) => s.raidRewards)

  const playerName = (playerId: string) =>
    playerId === LOCAL_PLAYER_ID ? 'Moi' : bots.find((b) => b.id === playerId)?.playerName ?? playerId

  const rewardRows = Object.entries(raidRewards)
    .map(([playerId, amount]) => ({ playerId, name: playerName(playerId), amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 20)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Classement</h1>

      <Panel title="Gains cumulés (cagnotte)">
        <p className="mb-3 text-sm text-neutral-500">
          Part de cagnotte gagnée à chaque fois qu'un monstre meurt, au prorata des dégâts infligés.
        </p>
        {rewardRows.length === 0 && <p className="text-neutral-600">Aucun monstre tué pour l'instant.</p>}
        {rewardRows.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-2">#</th>
                <th className="pb-2">Joueur</th>
                <th className="pb-2">Parts gagnées</th>
              </tr>
            </thead>
            <tbody>
              {rewardRows.map((r, i) => (
                <tr key={r.playerId} className={`border-t border-neutral-800 ${r.playerId === LOCAL_PLAYER_ID ? 'text-amber-400' : ''}`}>
                  <td className="py-1.5 text-neutral-500">{i + 1}</td>
                  <td className="py-1.5">{r.name}</td>
                  <td className="py-1.5 tabular-nums">{r.amount.toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Monstres actifs">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="pb-2">Rareté</th>
              <th className="pb-2">Niveau</th>
              <th className="pb-2">PV restants</th>
              <th className="pb-2">Participants</th>
              <th className="pb-2">Cagnotte</th>
            </tr>
          </thead>
          <tbody>
            {monsters.map((m) => (
              <tr key={m.id} className="border-t border-neutral-800">
                <td className="py-1.5">{rarityLabels[m.rarity]}</td>
                <td className="py-1.5 tabular-nums">{m.levelBracket}</td>
                <td className="py-1.5 tabular-nums">
                  {Math.round((m.currentHp / m.maxHp) * 100)} %
                </td>
                <td className="py-1.5 tabular-nums">{Object.keys(m.damageByPlayer).length}</td>
                <td className="py-1.5 tabular-nums text-amber-400">{m.pot.toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
