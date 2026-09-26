import { useEffect, useRef } from 'react'
import { useGameStore } from './store'

const TICK_MS = 200

/**
 * Fait avancer l'horloge simulée automatiquement, en temps réel × clockSpeed.
 * À monter une seule fois (dans App), pour que le temps avance quelle que soit la page affichée.
 */
export function useGameClock() {
  const clockRunning = useGameStore((s) => s.clockRunning)
  const clockSpeed = useGameStore((s) => s.clockSpeed)
  const advanceTime = useGameStore((s) => s.advanceTime)
  const lastTickRef = useRef<number | null>(null)

  useEffect(() => {
    if (!clockRunning) {
      lastTickRef.current = null
      return
    }

    const interval = setInterval(() => {
      const now = performance.now()
      const last = lastTickRef.current ?? now
      lastTickRef.current = now
      advanceTime((now - last) * clockSpeed)
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [clockRunning, clockSpeed, advanceTime])
}
