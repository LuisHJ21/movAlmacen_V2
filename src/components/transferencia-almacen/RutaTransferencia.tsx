import { ArrowRight } from 'lucide-react'
import type { Warehouse } from '@/interfaces/almacen.interface'
import { toSentenceCase } from '@/utils/format'

interface RutaTransferenciaProps {
  origen: Warehouse | null
  destino: Warehouse | null
}

function Extremo({ titulo, almacen }: { titulo: string; almacen: Warehouse | null }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-muted-foreground">{titulo}</p>
      {almacen ? (
        <>
          <p className="font-mono text-base font-bold">{almacen.codigo}</p>
          <p className="truncate text-xs text-muted-foreground">{toSentenceCase(almacen.descripcion)}</p>
        </>
      ) : (
        <p className="font-mono text-base font-bold text-stone-300">—</p>
      )}
    </div>
  )
}

export function RutaTransferencia({ origen, destino }: RutaTransferenciaProps) {
  return (
    <div
      aria-label={`Transferencia de ${origen?.codigo ?? 'sin origen'} a ${destino?.codigo ?? 'sin destino'}`}
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
    >
      <Extremo titulo="Origen" almacen={origen} />
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <ArrowRight aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <Extremo titulo="Destino" almacen={destino} />
      </div>
    </div>
  )
}
