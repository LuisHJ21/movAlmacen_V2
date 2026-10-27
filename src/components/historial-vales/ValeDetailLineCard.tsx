import type { ValeDetailLine } from '@/interfaces/vale.interface'
import { formatQuantity,  toSentenceCase } from '@/utils/format'

// const priceFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 4 })

/** Línea del detalle de un vale registrado: artículo, cantidad y datos contables (solo los que vienen) */
export function ValeDetailLineCard({ line }: { line: ValeDetailLine }) {
  const fields: Array<[string, string]> = [
    ['Matriz', line.matriz],
   // ['Precio unit.', line.precioUnitario ? priceFormatter.format(line.precioUnitario) : ''],
    ['Centro de costo', line.centroCosto],
    ['Cta. presupuestal', line.cuentaPresupuestal],
  ].filter((field): field is [string, string] => !!field[1])

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 px-3 pt-2.5 pb-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold">{line.codArticulo}</p>
          <p className="text-sm leading-snug text-muted-foreground">{toSentenceCase(line.descArticulo)}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-mono text-lg leading-tight font-bold">{formatQuantity(line.cantidad)}</span>
          <span className="text-xs font-semibold text-muted-foreground">{line.unidad}</span>
        </p>
      </div>

      {fields.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border bg-muted/50 px-3 py-2">
          {fields.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="truncate font-mono text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {line.observaciones && (
        <p className="border-t border-border px-3 py-2 text-sm">
          <span className="font-semibold">Obs.: </span>
          {line.observaciones}
        </p>
      )}
    </article>
  )
}
