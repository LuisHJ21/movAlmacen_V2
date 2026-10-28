import { MapPin, MapPinOff, Package, Warehouse } from 'lucide-react'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatCount, formatWeight } from '@/utils/format'

interface PalletResumenCardProps {
  titulo: string
  pallet: Pallet
}

/** Datos del pallet escaneado (origen o destino): bultos, peso, almacén, ubicación y artículos */
export function PalletResumenCard({ titulo, pallet }: PalletResumenCardProps) {
  return (
    <section aria-label={`${titulo} ${pallet.codigo}`} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Package aria-hidden className="size-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{titulo}</p>
          <p className="font-mono text-lg leading-tight font-bold tracking-wider">{pallet.codigo}</p>
        </div>
        <span className="ml-auto text-right text-sm whitespace-nowrap">
          <span className="block font-mono font-bold">{formatWeight(pallet.peso)}</span>
          <span className="block text-muted-foreground">{formatCount(pallet.bultos)} bultos</span>
        </span>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-border text-sm">
        <div className="flex items-center gap-2 px-3 py-2">
          <Warehouse aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Almacén</dt>
            <dd className="truncate font-mono font-semibold">{pallet.almacen ?? '—'}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2">
          {pallet.ubicacion ? (
            <MapPin aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <MapPinOff aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Ubicación</dt>
            <dd className="truncate font-mono font-semibold">{pallet.ubicacion ?? 'Sin ubicación'}</dd>
          </div>
        </div>
      </dl>

      {pallet.articulos.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">{pallet.articulos.length === 1 ? 'Artículo' : 'Artículos'}</span>
          {pallet.articulos.map((a) => (
            <span key={a} className="rounded bg-card px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-border">
              {a}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
