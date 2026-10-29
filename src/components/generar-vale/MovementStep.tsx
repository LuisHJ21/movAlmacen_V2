import { useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import { useMovements } from '@/hooks/useMovements'
import type { Movement, MovementKind } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { toSentenceCase } from '@/utils/format'
import { PalletChip } from './PalletChip'

const kindOptions: SegmentOption<MovementKind>[] = [
  { value: 'ING', label: 'Ingreso', Icon: ArrowDownToLine },
  { value: 'SAL', label: 'Salida', Icon: ArrowUpFromLine },
]

interface MovementStepProps {
  pallet: Pallet
  articleCode: string
  initialMovement?: Movement | null
  onConfirm: (movement: Movement) => void
  isSubmitting?: boolean
  submitError?: string
  onDismissError?: () => void
}

export function MovementStep({
  pallet,
  articleCode,
  initialMovement = null,
  onConfirm,
  isSubmitting = false,
  submitError,
  onDismissError,
}: MovementStepProps) {
  const { movements, isLoading, error, reload } = useMovements()
  const [kind, setKind] = useState<MovementKind>(initialMovement?.tipo ?? 'ING')
  const [pendingCode, setPendingCode] = useState<string | null>(null)

  const available = useMemo(() => movements.filter((m) => m.tipo === kind), [movements, kind])
  const items: OptionItem[] = available.map((m) => ({ key: m.codigo, badge: m.codigo, title: toSentenceCase(m.nombre) }))

  const handleKind = (next: MovementKind) => {
    if (isSubmitting) return
    setKind(next)
    onDismissError?.()
  }

  const handleSelect = (code: string) => {
    const movement = available.find((m) => m.codigo === code)
    if (!movement || isSubmitting) return
    setPendingCode(code)
    onConfirm(movement)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4 px-4 pt-4">
        <PalletChip pallet={pallet} articleCode={articleCode} />
        <SegmentedControl
          label="Tipo de movimiento"
          options={kindOptions}
          value={kind}
          onChange={handleKind}
        />
        {submitError && !isSubmitting && (
          <Alert type="error" onClose={onDismissError}>
            {submitError}
          </Alert>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <OptionList
          legend={`Movimiento de ${kind === 'ING' ? 'ingreso' : 'salida'}`}
          name="movement"
          items={items}
          selectedKey={initialMovement?.tipo === kind ? initialMovement.codigo : null}
          onSelect={handleSelect}
          pendingKey={isSubmitting ? pendingCode : null}
          disabled={isSubmitting}
          isLoading={isLoading}
          error={error}
          onRetry={() => void reload()}
          searchPlaceholder="Buscar por nombre o código"
        />
      </div>
    </div>
  )
}
