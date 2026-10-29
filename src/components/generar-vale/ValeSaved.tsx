import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Check, Copy, Home } from 'lucide-react'
import type { Movement } from '@/interfaces/movimiento.interface'
import { copyToClipboard } from '@/utils/clipboard'
import { formatDateTime, formatWeight, toSentenceCase } from '@/utils/format'

interface ValeSavedProps {
  movement: Movement
  articleCode: string
  palletCount: number
  itemCount: number
  totalWeight: number
  date: Date
  message?: string
  valeNumber?: string
}

type CopyState = 'idle' | 'copied' | 'error'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-semibold">{children}</dd>
    </div>
  )
}

export function ValeSaved({
  movement,
  articleCode,
  palletCount,
  itemCount,
  totalWeight,
  date,
  message,
  valeNumber,
}: ValeSavedProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const MovementIcon = movement.tipo === 'ING' ? ArrowDownToLine : ArrowUpFromLine

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => setCopyState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [copyState])

  const handleCopy = async () => {
    if (!valeNumber) return
    setCopyState((await copyToClipboard(valeNumber)) ? 'copied' : 'error')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-4">
        <article
          aria-label="Comprobante del vale"
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div role="status" className="flex items-center gap-3 bg-success px-4 py-3.5 text-white">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20">
              <Check aria-hidden className="size-6" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg leading-tight font-bold text-white">Vale guardado</h2>
              <p className="truncate text-sm text-white/90">{message ?? 'Vale generado correctamente'}</p>
            </div>
          </div>

          {valeNumber && (
            <div className="px-4 pt-4 pb-3 text-center">
              <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">N° de vale</p>
              <p className="mt-0.5 font-mono text-3xl font-bold tracking-wider text-foreground select-all">
                {valeNumber}
              </p>
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-label={copyState === 'copied' ? 'Número de vale copiado' : 'Copiar número de vale'}
                className={`mt-3 inline-flex h-touch w-full items-center justify-center gap-2 rounded-lg border-2 font-heading font-semibold transition-colors duration-150 ${
                  copyState === 'copied'
                    ? 'border-success bg-success text-white'
                    : 'border-success/40 bg-success-soft text-success hover:border-success active:border-success'
                }`}
              >
                {copyState === 'copied' ? (
                  <Check aria-hidden className="size-5" strokeWidth={2.5} />
                ) : (
                  <Copy aria-hidden className="size-5" />
                )}
                {copyState === 'copied' ? '¡Copiado!' : 'Copiar número'}
              </button>
              <p aria-live="polite" className="mt-1 min-h-4 text-xs text-destructive">
                {copyState === 'error' && 'No se pudo copiar. Mantén presionado el número para copiarlo.'}
              </p>
            </div>
          )}

          <div aria-hidden className="relative h-6">
            <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border border-border bg-background" />
            <span className="absolute inset-x-5 top-1/2 border-t-2 border-dashed border-border-strong" />
            <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border border-border bg-background" />
          </div>

          <div className="px-4 pt-1 pb-4">
            <div className="flex items-center gap-2" title={`${movement.codigo} · ${toSentenceCase(movement.nombre)}`}>
              <span className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-on-primary">
                <MovementIcon aria-hidden className="size-3.5" />
                <span className="font-mono text-sm font-bold">{movement.codigo}</span>
              </span>
              <span className="truncate text-sm font-semibold">{toSentenceCase(movement.nombre)}</span>
            </div>

            <dl className="mt-2 divide-y divide-border">
              <Row label="Artículo">
                <span className="font-mono">{articleCode}</span>
              </Row>
              <Row label="Detalle">
                {palletCount} {palletCount === 1 ? 'pallet' : 'pallets'} · {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
              </Row>
              <Row label="Registro">{formatDateTime(date)}</Row>
            </dl>

            <div className="mt-3 flex items-baseline justify-between rounded-lg bg-muted px-3 py-2.5">
              <span className="text-sm font-semibold text-muted-foreground">Peso total</span>
              <span className="font-mono text-xl font-bold">{formatWeight(totalWeight)}</span>
            </div>
          </div>
        </article>
      </div>

      <div className="border-t border-border bg-card px-4 py-3">
        <Link
          to="/"
          className="inline-flex h-touch w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-heading font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover active:bg-primary-hover"
        >
          <Home aria-hidden className="size-5" />
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
