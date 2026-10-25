import { useState, type FormEvent } from 'react'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { useReferences } from '@/hooks/useReferences'
import type { ReferenceDocument } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatQuantity, toSentenceCase } from '@/utils/format'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'
import { StepFooter } from './StepFooter'

/** Una orden puede venir repetida con distinto NRO_MOV */
export const referenceKey = (r: ReferenceDocument) => `${r.orderNumber}-${r.movementNumber}`

interface ReferenceStepProps {
  pallet: Pallet
  movement: Movement
  articleCode: string
  initialReference?: ReferenceDocument | null
  onConfirm: (reference: ReferenceDocument) => void
}

/**
 * Destino cuando el movimiento requiere documento de referencia (F_REF = 1)
 * y el pallet no trae uno (salidas, o ingresos sin referencia en sus datos).
 * Se consulta con nroDoc vacío para listar los disponibles.
 */
export function ReferenceStep({ pallet, movement, articleCode, initialReference = null, onConfirm }: ReferenceStepProps) {
  const { references, isLoading, error, reload } = useReferences({
    articleCode,
    movementCode: movement.code,
    docNumber: '',
  })
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialReference ? referenceKey(initialReference) : null,
  )
  const selected = references.find((r) => referenceKey(r) === selectedKey) ?? null

  const items: OptionItem[] = references.map((r) => ({
    key: referenceKey(r),
    badge: r.orderNumber,
    title: toSentenceCase(r.description),
    meta: [
      `${r.docType} ${r.movementNumber}`,
      r.remaining !== null && `Restante ${formatQuantity(r.remaining)}`,
      r.warehouse,
    ]
      .filter(Boolean)
      .join(' · '),
    searchText: r.movementNumber,
  }))

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
          legend="Documento de referencia"
          name="reference"
          items={items}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          isLoading={isLoading}
          error={error}
          onRetry={() => void reload()}
          emptyMessage="No hay documentos de referencia con saldo restante para este artículo y movimiento."
          searchThreshold={6}
          badgePlacement="top"
          searchPlaceholder="Buscar orden o descripción"
        />
      </div>

      <StepFooter disabled={!selected} />
    </form>
  )
}
