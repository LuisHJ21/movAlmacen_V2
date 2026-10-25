import { useState, type FormEvent } from 'react'
import { OptionList } from '@/components/ui/OptionList'
import type { Matrix } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { toSentenceCase } from '@/utils/format'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'
import { StepFooter } from './StepFooter'

interface MatrixStepProps {
  pallet: Pallet
  articleCode: string
  movement: Movement
  matrices: Matrix[]
  initialMatrix?: Matrix | null
  onConfirm: (matrix: Matrix) => void
}

/** Solo aparece cuando el movimiento tiene más de una matriz para el artículo */
export function MatrixStep({ pallet, articleCode, movement, matrices, initialMatrix = null, onConfirm }: MatrixStepProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(initialMatrix?.code ?? null)
  const selected = matrices.find((m) => m.code === selectedCode) ?? null

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selected) onConfirm(selected)
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <PalletChip pallet={pallet} articleCode={articleCode} />
        <MovementChip movement={movement} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4">
        <OptionList
          legend="Matriz contable"
          name="matrix"
          items={matrices.map((m) => ({
            key: m.code,
            badge: m.code,
            title: toSentenceCase(m.description),
            meta: `Grupo contable ${m.accountingGroup} · Subcategoría ${m.subCategory}`,
          }))}
          selectedKey={selectedCode}
          onSelect={setSelectedCode}
          badgePlacement="top"
          searchPlaceholder="Buscar matriz"
        />
      </div>

      <StepFooter disabled={!selected} />
    </form>
  )
}
