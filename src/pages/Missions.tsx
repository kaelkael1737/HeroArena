import { useState } from 'react'
import { config, resourceNftTemplates, resources, zones } from '../game/config'
import { isNftFree } from '../game/logic/missions'
import { nextRarity } from '../game/logic/rarity'
import { maxResourceRankForRarity, nftLevelCap } from '../game/logic/resourceNfts'
import { useGameStore } from '../game/store'
import type { MissionDurationId, MissionInProgress, Rarity, ResourceNft, ResourceNftTemplate } from '../game/types'
import { Button, Panel } from '../ui/Panel'

const durationLabels: Record<MissionDurationId, string> = {
  courte: 'Courte (1h)',
  moyenne: 'Moyenne (4h)',
  longue: 'Longue (8h)',
  expedition: 'Expédition (24h)',
}

const rarityLabels: Record<Rarity, string> = {
  commun: 'Commun',
  peu_commun: 'Peu commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
}

const allRarities = Object.keys(rarityLabels) as Rarity[]

function resourceName(id: string): string {
  return resources.find((r) => r.id === id)?.name ?? id
}

function templateFor(templateId: string): ResourceNftTemplate | undefined {
  return resourceNftTemplates.find((t) => t.id === templateId)
}

/** Clé de regroupement pour la fusion : même gabarit (zone) ET même rareté. */
function groupKey(nft: ResourceNft): string {
  return `${nft.templateId}|${nft.rarity}`
}

export default function Missions() {
  const resourceNfts = useGameStore((s) => s.resourceNfts)
  const missions = useGameStore((s) => s.missions)
  const addResourceNft = useGameStore((s) => s.addResourceNft)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Missions</h1>
      <p className="text-sm text-neutral-500">
        Un héros ne peut jamais faire de mission : il faut posséder le NFT d'exploration de la
        zone visée (acquis sur le Marché, ou obtenu par fusion). 4 NFT en tout, un par zone — la
        rareté et le niveau sont des attributs de l'exemplaire, pas des NFT différents.
      </p>

      <Panel title="Marché — acquérir un NFT d'exploration">
        <p className="mb-3 text-xs text-neutral-500">
          Placeholder gratuit pour la phase de test ; en jeu réel, ceci sera un achat sur le marché WAX.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {resourceNftTemplates.map((t) => (
            <div key={t.id} className="rounded-md border border-neutral-800 p-3">
              <div className="mb-2 text-sm font-medium">
                {t.name} <span className="text-xs text-neutral-500">({zones[t.zoneId].name})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allRarities.map((rarity) => (
                  <Button key={rarity} variant="secondary" onClick={() => addResourceNft(t.id, rarity)}>
                    + {rarityLabels[rarity]}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Mes NFT d'exploration">
        {resourceNfts.length === 0 && (
          <p className="text-neutral-500">Aucun NFT d'exploration possédé — ajoutes-en un depuis le Marché ci-dessus.</p>
        )}
        <div className="space-y-3">
          {resourceNfts.map((nft) => (
            <NftCard key={nft.instanceId} nft={nft} missions={missions} />
          ))}
        </div>
      </Panel>

      <FusionPanel resourceNfts={resourceNfts} />
    </div>
  )
}

function FusionPanel({ resourceNfts }: { resourceNfts: ResourceNft[] }) {
  const fuseResourceNftItems = useGameStore((s) => s.fuseResourceNftItems)
  const needed = config.fusion.itemsRequired

  const groups = new Map<string, ResourceNft[]>()
  for (const nft of resourceNfts) {
    if (nft.level < nftLevelCap(nft.rarity)) continue
    if (!nextRarity(nft.rarity)) continue
    const key = groupKey(nft)
    groups.set(key, [...(groups.get(key) ?? []), nft])
  }
  const eligible = [...groups.entries()].filter(([, nfts]) => nfts.length >= needed)

  return (
    <Panel title="Fusion de NFT d'exploration">
      <p className="mb-3 text-sm text-neutral-500">
        {needed} NFT identiques (même zone, même rareté) au niveau maximum → 1 NFT de la même
        zone, rareté supérieure, niveau 0.
      </p>
      {eligible.length === 0 && <p className="text-neutral-600">Aucune fusion possible pour le moment.</p>}
      <div className="space-y-2">
        {eligible.map(([key, nfts]) => {
          const template = templateFor(nfts[0].templateId)!
          const targetRarity = nextRarity(nfts[0].rarity)!
          return (
            <div key={key} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2 text-sm">
              <span>
                {nfts.length} × {template.name} ({rarityLabels[nfts[0].rarity]}, niveau max) →{' '}
                {rarityLabels[targetRarity]}
              </span>
              <Button onClick={() => fuseResourceNftItems(nfts.slice(0, needed).map((n) => n.instanceId))}>
                Fusionner {needed}
              </Button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function NftCard({ nft, missions }: { nft: ResourceNft; missions: MissionInProgress[] }) {
  const now = useGameStore((s) => s.now)
  const startMission = useGameStore((s) => s.startMission)
  const claimMission = useGameStore((s) => s.claimMission)
  const [durationId, setDurationId] = useState<MissionDurationId>('courte')

  const template = templateFor(nft.templateId)
  if (!template) return null

  const accessibleIds = zones[template.zoneId].resourceIds.slice(0, maxResourceRankForRarity(nft.rarity))
  const activeMission = missions.find((m) => m.nftId === nft.instanceId && !m.claimed)
  const free = isNftFree(nft.instanceId, missions)
  const done = activeMission ? activeMission.endsAt <= now : false

  return (
    <div className="rounded-md border border-neutral-800 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {template.name}{' '}
          <span className="text-xs text-neutral-500">
            ({zones[template.zoneId].name}, {rarityLabels[nft.rarity]}, niveau {nft.level} / {nftLevelCap(nft.rarity)})
          </span>
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Ressources accessibles : {accessibleIds.map(resourceName).join(', ')}
      </p>

      <div className="mt-2 flex items-center justify-between">
        {free ? (
          <>
            <select
              className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-sm"
              value={durationId}
              onChange={(e) => setDurationId(e.target.value as MissionDurationId)}
            >
              {Object.entries(durationLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <Button onClick={() => startMission(nft.instanceId, durationId)}>Envoyer en mission</Button>
          </>
        ) : done ? (
          <>
            <span className="text-xs text-emerald-400">
              Mission {durationLabels[activeMission!.durationId]} terminée
            </span>
            <Button onClick={() => claimMission(activeMission!.id)}>Récupérer</Button>
          </>
        ) : (
          <>
            <span className="text-xs text-neutral-500">
              En mission ({durationLabels[activeMission!.durationId]})
            </span>
            <span className="text-xs text-neutral-500">
              Reste {Math.ceil((activeMission!.endsAt - now) / 60000)} min
            </span>
          </>
        )}
      </div>
    </div>
  )
}
