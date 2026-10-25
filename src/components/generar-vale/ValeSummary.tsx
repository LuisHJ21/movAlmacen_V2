import { Sigma } from 'lucide-react'
import type { Matrix, Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Article } from '@/interfaces/pallet.interface'
import type { ValeLine, ValePalletGroup } from '@/interfaces/vale.interface'
import { formatWeight } from '@/utils/format'
import { valeTotals } from '@/utils/vale'
import { ValeHeader } from './ValeHeader'
import { ValePalletSection } from './ValePalletSection'

interface ValeSummaryProps {
  date: Date
  movement: Movement
  articleCode: string
  article: Article | null
  warehouse: Warehouse | null
  matrix: Matrix | null
  groups: ValePalletGroup[]
  onLineChange: (palletCode: string, index: number, changes: Partial<Pick<ValeLine, 'packages' | 'extraKg'>>) => void
  onRemovePallet?: (palletCode: string) => void
  /** Salidas: quitar un ítem / volver a agregar ítems excluidos de un pallet */
  onRemoveLine?: (palletCode: string, item: string) => void
  onAddItems?: (palletCode: string) => void
}

/** Resumen del vale: cabecera general + detalle por cada pallet */
export function ValeSummary({
  date,
  movement,
  articleCode,
  article,
  warehouse,
  matrix,
  groups,
  onLineChange,
  onRemovePallet,
  onRemoveLine,
  onAddItems,
}: ValeSummaryProps) {
  // Solo las salidas permiten ajustar bultos y kg adicionales
  const editable = movement.kind === 'SAL'
  const total = valeTotals(groups.flatMap((g) => g.lines))

  return (
    <div className="space-y-4">
      <ValeHeader date={date} movement={movement} articleCode={articleCode} article={article} warehouse={warehouse} />

      {groups.map((group, index) => (
        <ValePalletSection
          key={group.pallet.code}
          group={group}
          matrix={matrix}
          editable={editable}
          isInitial={index === 0}
          onLineChange={(lineIndex, changes) => onLineChange(group.pallet.code, lineIndex, changes)}
          onRemoveLine={onRemoveLine ? (item) => onRemoveLine(group.pallet.code, item) : undefined}
          onAddItems={onAddItems ? () => onAddItems(group.pallet.code) : undefined}
          // El pallet inicial define artículo y movimiento: no se quita
          onRemove={index > 0 && onRemovePallet ? () => onRemovePallet(group.pallet.code) : undefined}
        />
      ))}

      {groups.length > 1 && (
        <div className="flex items-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-white">
          <Sigma aria-hidden className="size-5 shrink-0" />
          <span className="font-semibold">Total vale · {groups.length} pallets</span>
          <span className="ml-auto font-mono font-bold whitespace-nowrap">
            {total.packages} bultos · {formatWeight(total.weight)}
          </span>
        </div>
      )}
    </div>
  )
}
