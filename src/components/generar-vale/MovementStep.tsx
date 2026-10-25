import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import { useMovements } from '@/hooks/useMovements'
import type { Movement, MovementKind } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { toSentenceCase } from '@/utils/format'
import { getAllowedMovementKind } from '@/utils/validations'
import { PalletChip } from './PalletChip'
import { StepFooter } from './StepFooter'

const kindOptions: SegmentOption<MovementKind>[] = [
  { value: 'ING', label: 'Ingreso', Icon: ArrowDownToLine },
  { value: 'SAL', label: 'Salida', Icon: ArrowUpFromLine },
]

const kindHints: Record<MovementKind, string> = {
  ING: 'El pallet no tiene almacén y ubicación asignados: solo puede ingresar.',
  SAL: 'El pallet ya tiene almacén y ubicación: solo puede salir.',
}

interface MovementStepProps {
  pallet: Pallet
  articleCode: string
  /** Selección previa (al regresar desde el paso siguiente) */
  initialMovement?: Movement | null
  onConfirm: (movement: Movement) => void
  /** Mientras se consultan la matriz y los datos del pallet */
  isSubmitting?: boolean
  submitError?: string
  onSelectionChange?: () => void
}

export function MovementStep({
  pallet,
  articleCode,
  initialMovement = null,
  onConfirm,
  isSubmitting = false,
  submitError,
  onSelectionChange,
}: MovementStepProps) {
  const { movements, isLoading, error, reload } = useMovements()
  // El tipo lo define el estado del pallet; el otro queda bloqueado
  const kind = getAllowedMovementKind(pallet)
  const [selectedCode, setSelectedCode] = useState<string | null>(
    initialMovement?.kind === kind ? initialMovement.code : null,
  )

  const available = useMemo(() => movements.filter((m) => m.kind === kind), [movements, kind])
  const items: OptionItem[] = available.map((m) => ({ key: m.code, badge: m.code, title: toSentenceCase(m.name) }))
  const selected = available.find((m) => m.code === selectedCode) ?? null

  const kindSegments = kindOptions.map((option) => ({ ...option, disabled: option.value !== kind }))

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selected && !isSubmitting) onConfirm(selected)
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-4 px-4 pt-4">
        <PalletChip pallet={pallet} articleCode={articleCode} />
        <SegmentedControl
          label="Tipo de movimiento"
          options={kindSegments}
          value={kind}
          onChange={() => {}}
          hint={kindHints[kind]}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4">
        <OptionList
          legend={`Movimiento de ${kind === 'ING' ? 'ingreso' : 'salida'}`}
          name="movement"
          items={items}
          selectedKey={selectedCode}
          onSelect={(code) => {
            setSelectedCode(code)
            onSelectionChange?.()
          }}
          isLoading={isLoading}
          error={error}
          onRetry={() => void reload()}
          searchPlaceholder="Buscar por nombre o código"
        />
      </div>

      <StepFooter
        disabled={!selected}
        isLoading={isSubmitting}
        loadingLabel="Consultando matriz…"
        error={submitError}
      />
    </form>
  )
}
