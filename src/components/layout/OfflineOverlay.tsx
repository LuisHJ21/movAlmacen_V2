import { useEffect, useRef } from 'react'
import { WifiOff } from 'lucide-react'
import { useOnline } from '@/hooks/useOnline'

export function OfflineOverlay() {
  const online = useOnline()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (online) return
    const previous = document.activeElement as HTMLElement | null
    previous?.blur()
    panelRef.current?.focus()
    return () => previous?.focus()
  }, [online])

  if (online) return null

  return (
    <div
      ref={panelRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      aria-describedby="offline-desc"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-card px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center outline-none"
    >
      <div className="relative mb-6 flex size-28 items-center justify-center">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-destructive-muted opacity-60" />
        <span className="relative flex size-28 items-center justify-center rounded-full border border-destructive-border bg-destructive-muted">
          <WifiOff aria-hidden className="size-12 text-destructive" />
        </span>
      </div>

      <h2 id="offline-title" className="text-2xl font-bold">
        Sin conexión
      </h2>
      <p id="offline-desc" className="mt-2 max-w-xs text-muted-foreground">
        El equipo se desconectó de la red. Revisa el Wi‑Fi; podrás continuar en cuanto vuelva la conexión.
      </p>

      <p className="mt-8 flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-destructive" />
        Esperando conexión…
      </p>
    </div>
  )
}
