import { OptionList } from '@/components/ui/OptionList'
import type { Matrix } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { toSentenceCase } from '@/utils/format'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'

interface MatrixStepProps {
  pallet: Pallet
  articleCode: string
  movement: Movement
  matrices: Matrix[]
  initialMatrix?: Matrix | null
  onConfirm: (matrix: Matrix) => void
}

/** Solo aparece cuando el movimiento tiene más de una matriz para el artículo. Tocar una matriz avanza. */
export function MatrixStep({ pallet, articleCode, movement, matrices, initialMatrix = null, onConfirm }: MatrixStepProps) {
  const handleSelect = (code: string) => {
    const matrix = matrices.find((m) => m.codigo === code)
    if (matrix) onConfirm(matrix)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <PalletChip pallet={pallet} articleCode={articleCode} />
        <MovementChip movement={movement} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <OptionList
          legend="Matriz contable"
          name="matrix"
          items={matrices.map((m) => ({
            key: m.codigo,
            badge: m.codigo,
            title: toSentenceCase(m.descripcion),
            meta: `Grupo contable ${m.grupoContable} · Subcategoría ${m.subCategoria}`,
          }))}
          selectedKey={initialMatrix?.codigo ?? null}
          onSelect={handleSelect}
          badgePlacement="top"
          searchPlaceholder="Buscar matriz"
        />
      </div>
    </div>
  )
}
