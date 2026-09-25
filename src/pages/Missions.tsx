import { useState } from 'react'
import { resources, zones } from '../game/config'
import { maxConcurrentMissions } from '../game/logic/missions'
import { useGameStore } from '../game/store'
import type { MissionDurationId, ZoneId } from '../game/types'
import { Button, Panel } from '../ui/Panel'

const durationLabels: Record<MissionDurationId, string> = {
  courte: 'Courte (1h)',
  moyenne: 'Moyenne (4h)',
  longue: 'Longue (8h)',
  expedition: 'Expédition (24h)',
}

function resourceName(id: string): string {
  return resources.find((r) => r.id === id)?.name ?? id
}

export default function Missions() {
  const heroes = useGameStore((s) => s.heroes)
  const heroIds = heroes.map((h) => h.permanent.id)
  const missions = useGameStore((s) => s.missions)
  const now = useGameStore((s) => s.now)
  const startMission = useGameStore((s) => s.startMission)
  const claimMission = useGameStore((s) => s.claimMission)

  const [selectedHero, setSelectedHero] = useState(heroIds[0])
  const [zoneId, setZoneId] = useState<ZoneId>('foret')
  const [durationId, setDurationId] = useState<MissionDurationId>('courte')

  const hero = useGameStore((s) => (selectedHero ? s.getHero(selectedHero) : undefined))
  const activeForHero = missions.filter((m) => m.heroId === selectedHero && !m.claimed)
  const slots = hero ? maxConcurrentMissions(hero) : 0
  const canStart = hero ? activeForHero.length < slots : false

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Missions</h1>

      <Panel title="Nouvelle mission">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Zone</span>
            <select
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value as ZoneId)}
            >
              {Object.entries(zones).map(([id, zone]) => (
                <option key={id} value={id}>
                  {zone.name} (niveau {zone.recommendedLevel}+)
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-400">Durée</span>
            <select
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5"
              value={durationId}
              onChange={(e) => setDurationId(e.target.value as MissionDurationId)}
            >
              {Object.entries(durationLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button
              disabled={!canStart}
              onClick={() => selectedHero && startMission(selectedHero, zoneId, durationId)}
            >
              Envoyer en mission
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Ressources de la zone : {zones[zoneId].resourceIds.map(resourceName).join(', ')} —{' '}
          {activeForHero.length}/{slots} emplacement(s) de mission utilisés pour ce héros.
        </p>
      </Panel>

      <Panel title="Missions en cours">
        {missions.length === 0 && <p className="text-neutral-500">Aucune mission en cours.</p>}
        <div className="space-y-2">
          {missions.map((mission) => {
            const remaining = mission.endsAt - now
            const done = remaining <= 0
            return (
              <div
                key={mission.id}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {heroes.find((h) => h.permanent.id === mission.heroId)?.permanent.name ?? mission.heroId}
                  </span>{' '}
                  — {zones[mission.zoneId].name} ({durationLabels[mission.durationId]})
                </div>
                <div className="flex items-center gap-3">
                  {mission.claimed ? (
                    <span className="text-xs text-neutral-600">Réclamée</span>
                  ) : done ? (
                    <Button onClick={() => claimMission(mission.id)}>Récupérer</Button>
                  ) : (
                    <span className="text-xs text-neutral-500">
                      Reste {Math.ceil(remaining / 60000)} min
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
