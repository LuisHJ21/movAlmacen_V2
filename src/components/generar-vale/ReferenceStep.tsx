import { useMemo, useState } from 'react'
import { AlertCircle, Inbox, RotateCcw, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useReferences } from '@/hooks/useReferences'
import type { ReferenceDocument } from '@/interfaces/almacen.interface'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { referenceMatchesPallet } from '@/utils/vale'
import { MovementChip } from './MovementChip'
import { PalletChip } from './PalletChip'
import { ReferenceCard } from './ReferenceCard'

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

  // Búsqueda por orden, movimiento, descripción o almacén; las que se pueden elegir van primero
  const [query, setQuery] = useState('')
  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase()
    const bloqueada = (r: ReferenceDocument) => esSalida && !referenceMatchesPallet(r, pallet)
    return references
      .filter((r) => !q || [r.nroOrden, r.nroMov, r.descripcion, r.almacen, r.tipoDoc].some((t) => t?.toLowerCase().includes(q)))
      .sort((a, b) => Number(bloqueada(a)) - Number(bloqueada(b)))
  }, [references, query, esSalida, pallet])
  const seleccionada = initialReference ? referenceKey(initialReference) : null

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
        {isLoading ? (
          <div aria-busy="true" aria-label="Cargando documentos de referencia" className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-border" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="m-auto flex flex-col items-center gap-3 text-center">
            <AlertCircle aria-hidden className="size-8 text-destructive" />
            <p>{error}</p>
            <Button variant="secondary" onClick={() => void reload()} icon={<RotateCcw aria-hidden className="size-5" />}>
              Reintentar
            </Button>
          </div>
        ) : references.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-2 text-center text-muted-foreground">
            <Inbox aria-hidden className="size-8" />
            <p>No hay documentos de referencia con saldo restante para este artículo y movimiento.</p>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between px-0.5">
              <p className="text-sm font-semibold">Documento de referencia</p>
              <p className="text-xs text-muted-foreground">
                {references.length} {references.length === 1 ? 'documento' : 'documentos'}
              </p>
            </div>
            {references.length >= 6 && (
              <div className="relative mb-2">
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar orden, movimiento o descripción"
                  aria-label="Buscar documento de referencia"
                  enterKeyHint="search"
                  className="h-touch w-full rounded-lg border-2 border-border-strong bg-card pr-3 pl-10 text-base transition-colors duration-150 placeholder:text-stone-400 focus:border-primary focus:outline-none"
                />
              </div>
            )}
            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2">
              {visibles.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground">Sin resultados para “{query}”.</p>
              ) : (
                <ul className="space-y-2.5">
                  {visibles.map((r) => (
                    <li key={referenceKey(r)}>
                      <ReferenceCard
                        reference={r}
                        selected={seleccionada === referenceKey(r)}
                        bloqueo={fueraDeAlmacen(r) ? `Proyectada en ${r.almacen || 'otro almacén'}` : undefined}
                        onSelect={() => !fueraDeAlmacen(r) && onConfirm(r)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
