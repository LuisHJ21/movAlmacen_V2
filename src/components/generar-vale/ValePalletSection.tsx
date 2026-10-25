import { ListPlus, Package, Trash2 } from 'lucide-react'
import type { Matrix } from '@/interfaces/almacen.interface'
import type { ValeLine, ValePalletGroup } from '@/interfaces/vale.interface'
import { formatWeight } from '@/utils/format'
import { excludedLines, validateValeLine, valeTotals } from '@/utils/vale'
import { ValeItemCard } from './ValeItemCard'

interface ValePalletSectionProps {
  group: ValePalletGroup
  matrix: Matrix | null
  /** Salidas: editar, quitar y agregar ítems */
  editable: boolean
  /** Pallet inicial: no se quita y debe conservar al menos un ítem */
  isInitial: boolean
  onLineChange: (index: number, changes: Partial<Pick<ValeLine, 'packages' | 'extraKg'>>) => void
  onRemoveLine?: (item: string) => void
  onAddItems?: () => void
  /** Solo los pallets agregados se pueden quitar */
  onRemove?: () => void
}

/** Cabecera de detalle por pallet + sus ítems + total del pallet */
export function ValePalletSection({
  group,
  matrix,
  editable,
  isInitial,
  onLineChange,
  onRemoveLine,
  onAddItems,
  onRemove,
}: ValePalletSectionProps) {
  const { pallet, lines } = group
  const totals = valeTotals(lines)
  const headingId = `pallet-${pallet.code}`
  const excludedCount = excludedLines(group).length
  const lastOfInitial = isInitial && lines.length === 1

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg bg-primary-hover py-1 pr-1 pl-3 text-on-primary">
        <Package aria-hidden className="size-5 shrink-0" />
        <h2 id={headingId} className="font-mono text-base font-bold tracking-wider text-on-primary">
          {pallet.code}
        </h2>
        <span className="ml-auto text-sm whitespace-nowrap text-white/90">
          {lines.length}
          {editable && group.pool.length > lines.length && ` de ${group.pool.length}`}{' '}
          {group.pool.length === 1 ? 'ítem' : 'ítems'}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar pallet ${pallet.code}`}
            className="grid size-touch shrink-0 place-items-center rounded-md transition-colors duration-150 hover:bg-white/15 active:bg-white/15"
          >
            <Trash2 aria-hidden className="size-5" />
          </button>
        ) : (
          <span aria-hidden className="h-touch" />
        )}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-muted-foreground">
          El pallet no tiene ítems disponibles para este movimiento.
        </p>
      ) : (
        lines.map((line, index) => (
          <ValeItemCard
            key={line.item}
            line={line}
            matrixCode={matrix?.code ?? null}
            editable={editable}
            errors={editable ? validateValeLine(line) : undefined}
            onChange={(changes) => onLineChange(index, changes)}
            onRemove={editable && onRemoveLine ? () => onRemoveLine(line.item) : undefined}
            removeDisabledReason={lastOfInitial ? 'El pallet inicial debe tener al menos un ítem' : undefined}
          />
        ))
      )}

      {editable && onAddItems && excludedCount > 0 && (
        <button
          type="button"
          onClick={onAddItems}
          className="flex h-touch w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-primary-soft font-heading font-semibold text-primary-hover transition-colors duration-150 hover:bg-primary/10 active:bg-primary/10"
        >
          <ListPlus aria-hidden className="size-5" />
          Agregar ítems ({excludedCount})
        </button>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm">
        <span className="font-semibold">Total pallet</span>
        <span className="font-mono font-bold">
          {totals.packages} bultos · {formatWeight(totals.weight)}
        </span>
      </div>
    </section>
  )
}
