import type { ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarClock,
  Package,
  Warehouse as WarehouseIcon,
  type LucideIcon,
} from 'lucide-react'
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

/** Dato de la cabecera: ícono en recuadro, etiqueta arriba y código + descripción */
function Dato({ Icon, label, codigo, descripcion }: { Icon: LucideIcon; label: string; codigo: string; descripcion?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 py-2.5">
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="min-w-0">
          <span className="block font-mono text-base font-bold">{codigo}</span>
          {descripcion && <span className="block truncate text-sm text-muted-foreground">{descripcion}</span>}
        </dd>
      </div>
    </div>
  )
}

/** Cabecera general del vale: movimiento y fecha en una franja suave, luego artículo y almacén */
export function ValeHeader({ date, movement, articleCode, article, warehouse }: ValeHeaderProps) {
  const isIngreso = movement.tipo === 'ING'
  const MovementIcon = isIngreso ? ArrowDownToLine : ArrowUpFromLine
  const movementName = toSentenceCase(movement.nombre)
  const articleName = article ? toSentenceCase(article.descripcion) : ''
  const warehouseName = warehouse ? toSentenceCase(warehouse.descripcion) : ''

  return (
    <section aria-label="Cabecera del vale" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Movimiento + fecha y hora: franja suave, para no competir con las tarjetas de ítem */}
      <div className="flex items-center gap-3 border-b border-primary-border bg-primary-soft px-3 py-2.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-on-primary">
          <MovementIcon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1" title={`${movement.codigo} · ${movementName}`}>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary-hover">
            {isIngreso ? 'Ingreso' : 'Salida'}
            <span className="rounded bg-primary-muted px-1.5 font-mono text-xs font-bold">{movement.codigo}</span>
          </p>
          <p className="truncate font-heading text-base leading-tight font-bold">{movementName}</p>
        </div>
        <p className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock aria-hidden className="size-4" />
          <time dateTime={date.toISOString()} title={formatDateTime(date)} className="font-semibold text-foreground">
            {formatShortDateTime(date)}
          </time>
        </p>
      </div>

      <dl className="divide-y divide-border px-3">
        <Dato Icon={Package} label="Artículo" codigo={articleCode} descripcion={articleName} />
        {/* Almacén (solo cuando se eligió directamente) */}
        {warehouse && <Dato Icon={WarehouseIcon} label="Almacén" codigo={warehouse.codigo} descripcion={warehouseName} />}
      </dl>
    </section>
  )
}
