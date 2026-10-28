import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { useReferences } from '@/hooks/useReferences'
import type { ReferenceDocument } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatQuantity, toSentenceCase } from '@/utils/format'
import { referenceMatchesPallet } from '@/utils/vale'
import { Alert } from '@/components/ui/Alert'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'

/** Una orden puede venir repetida con distinto NRO_MOV */
export const referenceKey = (r: ReferenceDocument) => `${r.nroOrden}-${r.nroMov}`

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
 * Se consulta con nroDoc vacío para listar los disponibles. Tocar una referencia avanza.
 */
export function ReferenceStep({ pallet, movement, articleCode, initialReference = null, onConfirm }: ReferenceStepProps) {
  const { references, isLoading, error, reload } = useReferences({
    articleCode,
    movementCode: movement.codigo,
    docNumber: '',
  })

  // Salida: el pallet debe estar en el almacén donde está proyectada la referencia
  const esSalida = movement.tipo === 'SAL'
  const fueraDeAlmacen = (r: ReferenceDocument) => esSalida && !referenceMatchesPallet(r, pallet)
  const bloqueadas = references.filter(fueraDeAlmacen).length

  const items: OptionItem[] = references.map((r) => ({
    key: referenceKey(r),
    badge: r.nroOrden,
    title: toSentenceCase(r.descripcion),
    meta: [
      `${r.tipoDoc} ${r.nroMov}`,
      r.restante !== null && `Restante ${formatQuantity(r.restante)}`,
      fueraDeAlmacen(r) ? `Otro almacén (${r.almacen})` : r.almacen,
    ]
      .filter(Boolean)
      .join(' · '),
    searchText: r.nroMov,
    disabled: fueraDeAlmacen(r),
  }))

  const handleSelect = (key: string) => {
    const reference = references.find((r) => referenceKey(r) === key)
    if (reference && !fueraDeAlmacen(reference)) onConfirm(reference)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <PalletChip pallet={pallet} articleCode={articleCode} />
        <MovementChip movement={movement} />
        {esSalida && !isLoading && !error && bloqueadas > 0 && (
          <Alert type={bloqueadas === references.length ? 'error' : 'info'}>
            {pallet.almacen
              ? bloqueadas === references.length
                ? `No existen referencias proyectadas en el almacen  ${pallet.almacen}.`
                : `Solo puedes elegir referencias proyectadas en ${pallet.almacen}, .`
              : 'El pallet no tiene almacén asignado, no puede salir con referencia.'}
          </Alert>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <OptionList
          legend="Documento de referencia"
          name="reference"
          items={items}
          selectedKey={initialReference ? referenceKey(initialReference) : null}
          onSelect={handleSelect}
          isLoading={isLoading}
          error={error}
          onRetry={() => void reload()}
          emptyMessage="No hay documentos de referencia con saldo restante para este artículo y movimiento."
          searchThreshold={6}
          badgePlacement="top"
          searchPlaceholder="Buscar orden o descripción"
        />
      </div>
    </div>
  )
}
