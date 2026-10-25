import { useState, type FormEvent } from 'react'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatQuantity, toSentenceCase } from '@/utils/format'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'
import { StepFooter } from './StepFooter'

interface WarehouseStepProps {
  pallet: Pallet
  articleCode: string
  movement: Movement
  initialWarehouse?: Warehouse | null
  onConfirm: (warehouse: Warehouse) => void
}

/** Destino cuando el movimiento NO requiere referencia (F_REF = 0) */
export function WarehouseStep({ pallet, articleCode, movement, initialWarehouse = null, onConfirm }: WarehouseStepProps) {
  const { warehouses, isLoading, error, reload } = useWarehouses()
  const [selectedCode, setSelectedCode] = useState<string | null>(initialWarehouse?.code ?? null)
  const selected = warehouses.find((w) => w.code === selectedCode) ?? null

  const items: OptionItem[] = warehouses.map((w) => ({
    key: w.code,
    badge: w.code,
    title: toSentenceCase(w.description),
    meta: [
      `Saldo ${formatQuantity(w.balance)}`,
      w.locations.length ? `Ubic. ${w.locations.join(', ')}` : 'Sin ubicaciones',
    ].join(' · '),
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
          legend="Almacén"
          name="warehouse"
          items={items}
          selectedKey={selectedCode}
          onSelect={setSelectedCode}
          isLoading={isLoading}
          error={error}
          onRetry={() => void reload()}
          emptyMessage="No hay almacenes disponibles."
          searchPlaceholder="Buscar almacén"
        />
      </div>

      <StepFooter disabled={!selected} />
    </form>
  )
}
