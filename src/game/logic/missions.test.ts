import { describe, expect, it } from 'vitest'
import { config } from '../config'
import { canStartMission, maxConcurrentMissions, resolveMission, startMission } from './missions'
import { makeAttributes, makeHero } from './fixtures'
import { createRng } from './rng'

describe('maxConcurrentMissions', () => {
  it('respecte le minimum même avec peu d\'énergie', () => {
    const hero = makeHero({ permanent: { ...makeHero().permanent, base: makeAttributes({ energy: 1 }) } })
    expect(maxConcurrentMissions(hero)).toBe(config.missions.minConcurrentSlots)
  })

  it('ouvre un slot supplémentaire tous les energyPerSlot points d\'Énergie', () => {
    const hero = makeHero({ permanent: { ...makeHero().permanent, base: makeAttributes({ energy: config.missions.energyPerSlot * 3 }) } })
    expect(maxConcurrentMissions(hero)).toBe(3)
  })

  it('plafonne au maximum configuré', () => {
    const hero = makeHero({ permanent: { ...makeHero().permanent, base: makeAttributes({ energy: config.missions.energyPerSlot * 999 }) } })
    expect(maxConcurrentMissions(hero)).toBe(config.missions.maxConcurrentSlots)
  })
})

describe('canStartMission', () => {
  it('autorise une nouvelle mission sous le plafond', () => {
    const hero = makeHero({ permanent: { ...makeHero().permanent, base: makeAttributes({ energy: config.missions.energyPerSlot * 2 }) } })
    expect(canStartMission(hero, [])).toBe(true)
  })

  it('refuse au-delà du plafond de missions actives', () => {
    const hero = makeHero({ permanent: { ...makeHero().permanent, base: makeAttributes({ energy: config.missions.energyPerSlot }) } })
    const active = [startMission(hero, 'foret', 'courte', 0, () => 'm1')]
    expect(canStartMission(hero, active)).toBe(false)
  })

  it('ignore les missions déjà réclamées dans le décompte', () => {
    const hero = makeHero({ permanent: { ...makeHero().permanent, base: makeAttributes({ energy: config.missions.energyPerSlot }) } })
    const claimed = { ...startMission(hero, 'foret', 'courte', 0, () => 'm1'), claimed: true }
    expect(canStartMission(hero, [claimed])).toBe(true)
  })
})

describe('startMission', () => {
  it('calcule la date de fin selon la durée choisie', () => {
    const hero = makeHero()
    const mission = startMission(hero, 'mine', 'longue', 1000, () => 'm1')
    expect(mission.endsAt).toBe(1000 + config.missions.durations.longue.hours * 60 * 60 * 1000)
    expect(mission.claimed).toBe(false)
  })
})

describe('resolveMission', () => {
  it('donne de l\'XP et des ressources de la zone visitée', () => {
    const hero = makeHero()
    const mission = startMission(hero, 'foret', 'moyenne', 0, () => 'm1')
    const result = resolveMission(hero, mission, createRng(42))
    expect(result.xp).toBeGreaterThan(0)
    const totalResources = Object.values(result.resources).reduce((a, b) => a + b, 0)
    expect(totalResources).toBeGreaterThan(0)
    for (const resourceId of Object.keys(result.resources)) {
      expect(['bois', 'herbes', 'cuir']).toContain(resourceId)
    }
  })

  it('est déterministe pour une graine donnée', () => {
    const hero = makeHero()
    const mission = startMission(hero, 'mine', 'longue', 0, () => 'm1')
    const resultA = resolveMission(hero, mission, createRng(7))
    const resultB = resolveMission(hero, mission, createRng(7))
    expect(resultA).toEqual(resultB)
  })
})
