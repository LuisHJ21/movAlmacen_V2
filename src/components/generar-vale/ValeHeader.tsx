import { ArrowDownToLine, ArrowUpFromLine, CalendarClock, Package, Warehouse as WarehouseIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Article } from '@/interfaces/pallet.interface'
import { formatDateTime, toSentenceCase } from '@/utils/format'

interface ValeHeaderProps {
  date: Date
  movement: Movement
  articleCode: string
  article: Article | null
  warehouse: Warehouse | null
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <span aria-hidden className="mt-0.5 shrink-0 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="leading-snug font-semibold">{children}</dd>
      </div>
    </div>
  )
}

/** Cabecera general del vale */
export function ValeHeader({ date, movement, articleCode, article, warehouse }: ValeHeaderProps) {
  const MovementIcon = movement.kind === 'ING' ? ArrowDownToLine : ArrowUpFromLine
  return (
    <section aria-label="Cabecera del vale" className="overflow-hidden rounded-xl border border-border bg-card">
      <dl className="divide-y divide-border">
        <Row icon={<CalendarClock className="size-5" />} label="Fecha y hora">
          {formatDateTime(date)}
        </Row>
        <Row icon={<MovementIcon className="size-5" />} label={movement.kind === 'ING' ? 'Movimiento de ingreso' : 'Movimiento de salida'}>
          <span className="font-mono">{movement.code}</span> · {toSentenceCase(movement.name)}
        </Row>
        <Row icon={<Package className="size-5" />} label="Artículo">
          <span className="font-mono">{articleCode}</span>
          {article && <span className="block font-normal text-muted-foreground">{toSentenceCase(article.description)}</span>}
        </Row>
        {warehouse && (
          <Row icon={<WarehouseIcon className="size-5" />} label="Almacén">
            <span className="font-mono">{warehouse.code}</span> · {toSentenceCase(warehouse.description)}
          </Row>
        )}
      </dl>
    </section>
  )
}
