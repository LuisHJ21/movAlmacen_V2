import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, Check, Copy, Home, type LucideIcon } from 'lucide-react'
import type { TransferenciaGuardada as Guardada } from '@/services/transferencia.service'
import { copyToClipboard } from '@/utils/clipboard'
import { formatCount, formatDateTime, formatWeight } from '@/utils/format'

interface TransferenciaGuardadaProps {
  vales: Guardada
  pallet: string
  origen: string
  destino: string
  /** Nueva ubicación en el destino, si se eligió */
  ubicacion?: string
  bultos: number
  peso: number
  date: Date
}

/** Vale generado por la transferencia, con botón para copiar su número */
function ValeRow({ Icon, titulo, almacen, numero }: { Icon: LucideIcon; titulo: string; almacen: string; numero: string }) {
  const [copiado, setCopiado] = useState<'idle' | 'ok' | 'error'>('idle')

  useEffect(() => {
    if (copiado === 'idle') return
    const timer = setTimeout(() => setCopiado('idle'), 2500)
    return () => clearTimeout(timer)
  }, [copiado])

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          {titulo} · <span className="font-mono font-semibold">{almacen}</span>
        </p>
        <p className="font-mono text-xl font-bold tracking-wider select-all">{numero || '—'}</p>
      </div>
      {numero && (
        <button
          type="button"
          onClick={async () => setCopiado((await copyToClipboard(numero)) ? 'ok' : 'error')}
          aria-label={copiado === 'ok' ? `${titulo} copiado` : `Copiar ${titulo.toLowerCase()}`}
          className={`grid h-touch w-[52px] shrink-0 place-items-center rounded-lg border-2 transition-colors duration-150 ${
            copiado === 'ok'
              ? 'border-success bg-success text-white'
              : copiado === 'error'
                ? 'border-destructive text-destructive'
                : 'border-success/40 bg-success-soft text-success hover:border-success active:border-success'
          }`}
        >
          {copiado === 'ok' ? <Check aria-hidden className="size-5" strokeWidth={2.5} /> : <Copy aria-hidden className="size-5" />}
        </button>
      )}
    </div>
  )
}

/** Comprobante de la transferencia: vale de salida y de ingreso, más el resumen de lo transferido */
export function TransferenciaGuardada({ vales, pallet, origen, destino, ubicacion, bultos, peso, date }: TransferenciaGuardadaProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-4">
        <article aria-label="Comprobante de la transferencia" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div role="status" className="flex items-center gap-3 bg-success px-4 py-3.5 text-white">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20">
              <Check aria-hidden className="size-6" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg leading-tight font-bold text-white">Transferencia registrada</h2>
              <p className="text-sm text-white/90">Se generaron los vales de salida e ingreso</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            <ValeRow Icon={ArrowUpFromLine} titulo="Vale de salida" almacen={origen} numero={vales.valeSalida} />
            <ValeRow Icon={ArrowDownToLine} titulo="Vale de ingreso" almacen={destino} numero={vales.valeIngreso} />
          </div>

          <dl className="divide-y divide-border border-t-2 border-dashed border-border-strong px-4 py-1">
            {[
              ['Pallet', pallet],
              ['Ubicación', ubicacion],
              ['Registro', formatDateTime(date)],
            ]
              .filter((row): row is [string, string] => !!row[1])
              .map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 py-1.5">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-sm font-semibold">{value}</dd>
                </div>
              ))}
          </dl>
          <div className="mx-4 mb-4 flex items-baseline justify-between rounded-lg bg-muted px-3 py-2.5">
            <span className="text-sm font-semibold text-muted-foreground">{formatCount(bultos)} bultos</span>
            <span className="font-mono text-xl font-bold">{formatWeight(peso)}</span>
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
