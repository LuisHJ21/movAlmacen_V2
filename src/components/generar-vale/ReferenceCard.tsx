import { Check, ChevronRight, FileText, Lock, Warehouse } from 'lucide-react'
import type { ReferenceDocument } from '@/interfaces/almacen.interface'
import { formatQuantity, toSentenceCase } from '@/utils/format'

interface ReferenceCardProps {
  reference: ReferenceDocument
  selected: boolean
  /** Motivo por el que no se puede elegir (ej. proyectada en otro almacén) */
  bloqueo?: string
  onSelect: () => void
}

/** Documento de referencia: tipo y número de orden, descripción, saldo restante destacado, almacén y movimiento */
export function ReferenceCard({ reference: r, selected, bloqueo, onSelect }: ReferenceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!!bloqueo}
      aria-current={selected ? 'true' : undefined}
      className={`group w-full overflow-hidden rounded-xl border-2 text-left shadow-sm transition-[border-color,background-color,transform] duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:active:scale-100 ${
        selected
          ? 'border-primary bg-primary-soft'
          : bloqueo
            ? 'border-border bg-muted/60 opacity-70'
            : 'border-border bg-card hover:border-primary-border active:border-primary'
      }`}
    >
      {/* Cabecera: tipo de documento y número de orden */}
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-lg ${
            bloqueo ? 'bg-border text-muted-foreground' : 'bg-primary text-on-primary'
          }`}
        >
          <FileText aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
            {r.tipoDoc && (
              <span className="rounded bg-primary-muted px-1.5 font-mono text-xs font-bold text-primary-hover">{r.tipoDoc}</span>
            )}
            <span className="truncate font-mono text-base font-bold tracking-wide">{r.nroOrden}</span>
          </p>
          {r.nroMov && <p className="text-xs text-muted-foreground">Mov. {r.nroMov}</p>}
        </div>
        {selected ? (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
            <Check aria-hidden className="size-4" strokeWidth={3} />
          </span>
        ) : bloqueo ? (
          <Lock aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight aria-hidden className="size-5 shrink-0 text-stone-400 transition-transform duration-150 group-hover:translate-x-0.5" />
        )}
      </div>

      {r.descripcion && (
        <p className="line-clamp-2 px-3 pt-1.5 text-sm leading-snug text-foreground">{toSentenceCase(r.descripcion)}</p>
      )}

      {/* Pie: saldo restante y almacén */}
      <div className="mt-2.5 flex items-stretch border-t border-border">
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="text-xs text-muted-foreground">Restante</p>
          <p className={`font-mono text-lg leading-tight font-bold ${bloqueo ? 'text-muted-foreground' : 'text-primary-hover'}`}>
            {r.restante !== null ? `${formatQuantity(r.restante)} kg` : '—'}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 border-l border-border px-3 py-2">
          <Warehouse aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Almacén</p>
            <p className="truncate font-mono text-sm font-semibold">{r.almacen || '—'}</p>
          </div>
        </div>
      </div>

      {bloqueo && (
        <p className="flex items-center gap-1.5 border-t border-border bg-destructive-soft px-3 py-1.5 text-xs font-semibold text-destructive">
          <Lock aria-hidden className="size-3.5 shrink-0" />
          {bloqueo}
        </p>
      )}
    </button>
  )
}
