import { useState } from 'react'
import { useGameStore } from '../game/store'
import { Button, Panel } from '../ui/Panel'

export default function Arene() {
  const heroes = useGameStore((s) => s.heroes)
  const heroIds = heroes.map((h) => h.permanent.id)
  const trainHero = useGameStore((s) => s.trainHero)
  const tournament = useGameStore((s) => s.tournament)
  const startTournament = useGameStore((s) => s.startTournament)
  const runTournamentRound = useGameStore((s) => s.runTournamentRound)

  const [selectedHero, setSelectedHero] = useState(heroIds[0])
  const [lastResult, setLastResult] = useState<{ won: boolean; xpGained: number } | null>(null)

  const currentRound = tournament?.rounds[tournament.rounds.length - 1]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Arène</h1>

      <Panel title="Entraînement">
        <div className="flex items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Héros</span>
            <select
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5"
              value={selectedHero}
              onChange={(e) => setSelectedHero(e.target.value)}
            >
              {heroes.map((h) => (
                <option key={h.permanent.id} value={h.permanent.id}>
                  {h.permanent.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            onClick={() => {
              const result = trainHero(selectedHero)
              if (result) setLastResult(result)
            }}
          >
            Combat d'entraînement
          </Button>
        </div>
        {lastResult && (
          <p className={`mt-3 text-sm ${lastResult.won ? 'text-emerald-400' : 'text-red-400'}`}>
            {lastResult.won ? 'Victoire' : 'Défaite'} — +{lastResult.xpGained} XP
          </p>
        )}
      </Panel>

      <Panel title="Tournoi final">
        {!tournament && (
          <Button onClick={startTournament}>Lancer le tournoi (inscrit tous les héros)</Button>
        )}

        {tournament && (
          <div className="space-y-4">
            {tournament.champion && (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-300">
                Champion : <strong>{tournament.champion}</strong>
              </p>
            )}

            {tournament.active && (
              <Button onClick={runTournamentRound}>
                Lancer la ronde {currentRound?.[0]?.round}
              </Button>
            )}

            {tournament.rounds.map((round, i) => (
              <div key={i}>
                <h3 className="mb-1 text-sm font-medium text-neutral-400">Ronde {i + 1}</h3>
                <div className="space-y-1">
                  {round.map((match, j) => (
                    <div key={j} className="rounded-md border border-neutral-800 px-3 py-2 text-sm">
                      {match.heroBId ? (
                        <span>
                          {match.heroAId} vs {match.heroBId}
                          {match.result && (
                            <span className="ml-2 text-amber-400">
                              → {match.result.winnerHeroId} gagne ({match.result.heroAScore} - {match.result.heroBScore})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>
                          {match.heroAId} <span className="text-neutral-500">(bye, qualifié d'office)</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
