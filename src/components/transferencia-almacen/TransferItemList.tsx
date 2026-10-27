import { Sigma } from 'lucide-react'
import type { PalletData } from '@/interfaces/pallet.interface'
import { formatCount, formatDate, formatWeight, parseIsoDate, toSentenceCase } from '@/utils/format'

/** Ítems del pallet que se transfieren (todos, sin poder quitar ninguno), con totales */
export function TransferItemList({ datos }: { datos: PalletData }) {
  const bultos = datos.items.reduce((sum, i) => sum + i.bultos, 0)
  const peso = datos.items.reduce((sum, i) => sum + i.peso, 0)

  if (datos.items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">El pallet no tiene ítems para transferir.</p>
  }

  return (
    <section aria-label="Ítems a transferir" className="space-y-2">
      <h2 className="flex items-baseline justify-between text-sm font-bold">
        Ítems a transferir
        <span className="text-xs font-semibold text-muted-foreground">{datos.items.length}</span>
      </h2>
      <ul className="space-y-2">
        {datos.items.map((item) => {
          // La API envía la fecha como "2025-09-06"
          const produccion = parseIsoDate(item.fecha)
          const trazabilidad: Array<[string, string]> = [
            ['Lote', item.lote],
            ['Traza', item.traza],
            ['Producción', produccion ? formatDate(produccion) : item.fecha],
          ].filter((field): field is [string, string] => !!field[1])

          return (
            <li key={item.item}>
              <article
                aria-label={`Ítem ${item.item}: ${item.codArticulo}`}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <header className="flex items-start gap-3 px-3 pt-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-primary font-mono text-sm font-bold text-primary">
                    {item.item}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-bold">{item.codArticulo}</p>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {toSentenceCase(item.descripcion)}
                    </p>
                  </div>
                </header>

                <dl className="mx-3 mt-2.5 flex items-stretch overflow-hidden rounded-lg border border-primary-border bg-primary-soft">
                  <div className="min-w-0 flex-1 px-3 py-2">
                    <dt className="text-xs font-semibold text-primary-hover">Peso</dt>
                    <dd className="font-mono text-xl leading-tight font-bold">{formatWeight(item.peso)}</dd>
                  </div>
                  <div className="w-px bg-primary-border" />
                  <div className="w-24 shrink-0 px-3 py-2">
                    <dt className="text-xs font-semibold text-primary-hover">Bultos</dt>
                    <dd className="font-mono text-xl leading-tight font-bold">{formatCount(item.bultos)}</dd>
                  </div>
                </dl>

                {trazabilidad.length > 0 && (
                  <dl className="grid grid-cols-3 gap-2 px-3 pt-2.5 pb-3">
                    {trazabilidad.map(([label, value]) => (
                      <div key={label} className="min-w-0 border-l-2 border-border-strong pl-2">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="truncate font-mono text-sm font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            </li>
          )
        })}
      </ul>
      <section aria-label="Total a transferir" className="overflow-hidden rounded-xl border border-primary-border bg-card shadow-sm">
        <h3 className="flex items-center gap-2 bg-primary-soft px-3 py-1.5 text-xs font-bold tracking-wide text-primary-hover uppercase">
          <Sigma aria-hidden className="size-4" />
          Total a transferir
        </h3>
        <dl className="grid grid-cols-[1fr_1fr_1.6fr] divide-x divide-border">
          <div className="px-3 py-2">
            <dt className="text-xs text-muted-foreground">Ítems</dt>
            <dd className="font-mono text-lg leading-tight font-bold">{datos.items.length}</dd>
          </div>
          <div className="px-3 py-2">
            <dt className="text-xs text-muted-foreground">Bultos</dt>
            <dd className="font-mono text-lg leading-tight font-bold">{formatCount(bultos)}</dd>
          </div>
          <div className="px-3 py-2 text-right">
            <dt className="text-xs text-muted-foreground">Peso</dt>
            <dd className="font-mono text-xl leading-tight font-bold text-primary-hover">{formatWeight(peso)}</dd>
          </div>
        </dl>
      </section>
    </section>
  )
}
