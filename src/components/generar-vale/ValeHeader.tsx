import { ArrowDownToLine, ArrowUpFromLine, CalendarClock, Package, Warehouse as WarehouseIcon } from 'lucide-react'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Article } from '@/interfaces/pallet.interface'
import { formatDateTime, formatShortDateTime, toSentenceCase } from '@/utils/format'

interface ValeHeaderProps {
  date: Date
  movement: Movement
  articleCode: string
  article: Article | null
  warehouse: Warehouse | null
}

/** Cabecera general del vale, compacta: movimiento + fecha / artículo / almacén */
export function ValeHeader({ date, movement, articleCode, article, warehouse }: ValeHeaderProps) {
  const isIngreso = movement.tipo === 'ING'
  const MovementIcon = isIngreso ? ArrowDownToLine : ArrowUpFromLine
  const movementName = toSentenceCase(movement.nombre)
  const articleName = article ? toSentenceCase(article.descripcion) : ''
  const warehouseName = warehouse ? toSentenceCase(warehouse.descripcion) : ''

  return (
    <section aria-label="Cabecera del vale" className="rounded-xl border border-border bg-card px-3 py-2">
      <dl className="space-y-1">
        {/* Movimiento + fecha y hora */}
        <div className="flex items-center gap-2">
          <dt className="sr-only">{isIngreso ? 'Movimiento de ingreso' : 'Movimiento de salida'}</dt>
          <dd className="flex min-w-0 flex-1 items-center gap-1.5" title={`${movement.codigo} · ${movementName}`}>
            <span className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-on-primary">
              <MovementIcon aria-hidden className="size-3.5" />
              <span className="font-mono text-sm font-bold">{movement.codigo}</span>
            </span>
            <span className="truncate text-sm font-semibold">{movementName}</span>
          </dd>
          <dt className="sr-only">Fecha y hora</dt>
          <dd className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock aria-hidden className="size-3.5" />
            <time dateTime={date.toISOString()} title={formatDateTime(date)}>
              {formatShortDateTime(date)}
            </time>
          </dd>
        </div>

        {/* Artículo */}
        <div className="flex items-center gap-1.5 text-sm">
          <dt>
            <Package aria-hidden className="size-4 text-primary" />
            <span className="sr-only">Artículo</span>
          </dt>
          <dd className="min-w-0 truncate" title={articleName ? `${articleCode} · ${articleName}` : articleCode}>
            <span className="font-mono font-semibold">{articleCode}</span>
            {articleName && <span className="text-muted-foreground"> · {articleName}</span>}
          </dd>
        </div>

        {/* Almacén (solo cuando se eligió directamente) */}
        {warehouse && (
          <div className="flex items-center gap-1.5 text-sm">
            <dt>
              <WarehouseIcon aria-hidden className="size-4 text-primary" />
              <span className="sr-only">Almacén</span>
            </dt>
            <dd className="min-w-0 truncate" title={`${warehouse.codigo} · ${warehouseName}`}>
              <span className="font-mono font-semibold">{warehouse.codigo}</span>
              <span className="text-muted-foreground"> · {warehouseName}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}
