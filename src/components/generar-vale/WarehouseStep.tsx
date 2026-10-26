import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatQuantity, toSentenceCase } from '@/utils/format'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'

interface WarehouseStepProps {
  pallet: Pallet
  articleCode: string
  movement: Movement
  initialWarehouse?: Warehouse | null
  onConfirm: (warehouse: Warehouse) => void
}

/** Destino cuando el movimiento NO requiere referencia (F_REF = 0). Tocar un almacén avanza. */
export function WarehouseStep({ pallet, articleCode, movement, initialWarehouse = null, onConfirm }: WarehouseStepProps) {
  const { warehouses, isLoading, error, reload } = useWarehouses()

  const items: OptionItem[] = warehouses.map((w) => ({
    key: w.codigo,
    badge: w.codigo,
    title: toSentenceCase(w.descripcion),
    meta: [
      `Saldo ${formatQuantity(w.saldo)}`,
      w.ubicaciones.length ? `Ubic. ${w.ubicaciones.join(', ')}` : 'Sin ubicaciones',
    ].join(' · '),
  }))

  const handleSelect = (code: string) => {
    const warehouse = warehouses.find((w) => w.codigo === code)
    if (warehouse) onConfirm(warehouse)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <PalletChip pallet={pallet} articleCode={articleCode} />
        <MovementChip movement={movement} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <OptionList
          legend="Almacén"
          name="warehouse"
          items={items}
          selectedKey={initialWarehouse?.codigo ?? null}
          onSelect={handleSelect}
          isLoading={isLoading}
          error={error}
          onRetry={() => void reload()}
          emptyMessage="No hay almacenes disponibles."
          searchPlaceholder="Buscar almacén"
        />
      </div>
    </div>
  )
}
