import { CheckCircle2 } from 'lucide-react'
import type { Pallet } from '@/interfaces/pallet.interface'
import { nombreEstadoPallet } from '@/utils/estadoPallet'
import { formatWeight } from '@/utils/format'

export function PalletSummary({ pallet }: { pallet: Pallet }) {
  const rows = [
    { label: 'Bultos', value: pallet.bultos.toString() },
    { label: 'Peso', value: formatWeight(pallet.peso) },
    { label: 'Estado', value: nombreEstadoPallet(pallet.estado) },
    { label: 'Almacén', value: pallet.almacen },
    { label: 'Ubicación', value: pallet.ubicacion },
  ]

  return (
    <section aria-label="Pallet verificado" className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <CheckCircle2 aria-hidden className="size-6 shrink-0 text-success" />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">Pallet verificado</p>
          <p className="font-mono text-xl font-bold tracking-wider">{pallet.codigo}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-border">
        {rows.map(({ label, value }, i) => (
          <div
            key={label}
            className={`bg-card px-4 py-2.5 ${i === rows.length - 1 && rows.length % 2 ? 'col-span-2' : ''}`}
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className={`font-semibold ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
              {value ?? 'Sin asignar'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
