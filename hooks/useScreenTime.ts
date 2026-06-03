'use client'
import { useEffect, useRef } from 'react'

const PING_INTERVAL_MS = 5 * 60 * 1000 // ping every 5 minutes
const MINUTES_PER_PING = 5

export function useScreenTime() {
  const lastPingRef = useRef<number>(Date.now())
  const isActiveRef = useRef<boolean>(true)

  useEffect(() => {
    function ping() {
      if (!isActiveRef.current) return
      fetch('/api/screentime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: MINUTES_PER_PING }),
      }).catch(() => {})
    }

    function onVisible() { isActiveRef.current = !document.hidden }
    document.addEventListener('visibilitychange', onVisible)

    const interval = setInterval(ping, PING_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
