import { ArrowRight } from 'lucide-react'
import type { Pallet } from '@/interfaces/pallet.interface'

interface RutaPalletsProps {
  origen?: Pallet
  destino?: Pallet
}

function Extremo({ titulo, pallet, alinear = 'left' }: { titulo: string; pallet?: Pallet; alinear?: 'left' | 'right' }) {
  return (
    <div className={`min-w-0 flex-1 ${alinear === 'right' ? 'text-right' : ''}`}>
      <p className="text-xs font-semibold text-muted-foreground">{titulo}</p>
      {pallet ? (
        <>
          <p className="font-mono text-base font-bold tracking-wide">{pallet.codigo}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {pallet.almacen ?? 'Sin almacén'}
            {pallet.ubicacion && ` · ${pallet.ubicacion}`}
          </p>
        </>
      ) : (
        <p className="font-mono text-base font-bold text-stone-300">—</p>
      )}
    </div>
  )
}

/** Pallet origen → pallet destino; el extremo aún sin escanear aparece vacío */
export function RutaPallets({ origen, destino }: RutaPalletsProps) {
  return (
    <div
      aria-label={`Transferencia del pallet ${origen?.codigo ?? 'sin origen'} al pallet ${destino?.codigo ?? 'sin destino'}`}
      className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
    >
      <Extremo titulo="Pallet origen" pallet={origen} />
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <ArrowRight aria-hidden className="size-4" />
      </span>
      <Extremo titulo="Pallet destino" pallet={destino} alinear="right" />
    </div>
  )
}
