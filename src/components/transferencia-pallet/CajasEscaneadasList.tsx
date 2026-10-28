import { PackageCheck, Trash2 } from 'lucide-react'
import type { EtiquetaCaja } from '@/interfaces/caja.interface'
import type { PiezaCaja, ResumenCaja } from '@/utils/cajasReales'
import { formatCount, formatWeight } from '@/utils/format'

/** Caja escaneada y encontrada en las cajas reales del origen */
export interface CajaEscaneada {
  /** Índice de la fila de cajas reales a la que corresponde */
  fila: number
  tipo: ResumenCaja['tipo']
  /** La etiqueta escaneada (una sola, aunque la caja tenga varias) */
  etiqueta: EtiquetaCaja
  /** Registros que forman la caja (una etiqueta por pieza) */
  piezas: PiezaCaja[]
  /** Kg de la caja */
  peso: number
}

const nombreTipo: Record<ResumenCaja['tipo'], string> = {
  completas: 'Caja completa',
  mixta: 'Caja mixta',
  incompleta: 'Caja de saldo',
}

interface CajasEscaneadasListProps {
  cajas: CajaEscaneada[]
  onQuitar: (indice: number) => void
}

/** Cajas que el operador ya escaneó del origen, con total; se puede quitar una escaneada por error */
export function CajasEscaneadasList({ cajas, onQuitar }: CajasEscaneadasListProps) {
  if (cajas.length === 0) return null
  const total = cajas.reduce((s, c) => s + c.peso, 0)

  return (
    <section aria-labelledby="cajas-escaneadas" className="overflow-hidden rounded-xl border border-success/30 bg-card shadow-sm">
      <div className="flex items-center gap-2 bg-success-soft px-3 py-2">
        <PackageCheck aria-hidden className="size-5 text-success" />
        <h2 id="cajas-escaneadas" className="text-sm font-semibold text-success">
          Cajas escaneadas
        </h2>
        <span className="ml-auto font-mono text-sm font-bold text-success">
          {formatCount(cajas.length)} · {formatWeight(total)}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {cajas.map((c, i) => (
          <li key={i} className="flex items-center gap-2 py-1 pr-1 pl-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {nombreTipo[c.tipo]}
                {c.piezas.length > 1 && <span className="font-normal text-muted-foreground"> · {c.piezas.length} etiquetas</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Lote <span className="font-mono">{[...new Set(c.piezas.map((p) => p.lote))].join(' · ')}</span>
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-bold">{formatWeight(c.peso)}</span>
            <button
              type="button"
              onClick={() => onQuitar(i)}
              aria-label={`Quitar caja ${i + 1}`}
              className="grid size-touch shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-destructive-soft hover:text-destructive active:bg-destructive-soft"
            >
              <Trash2 aria-hidden className="size-5" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
