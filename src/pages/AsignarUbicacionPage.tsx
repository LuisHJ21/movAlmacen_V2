import { useEffect, useState } from 'react'
import { Layers, MapPin, MapPinned, Undo2, Warehouse as WarehouseIcon, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { CodigoUbicacion } from '@/components/asignar-ubicacion/CodigoUbicacion'
import { UbicacionGrid } from '@/components/asignar-ubicacion/UbicacionGrid'
import { PalletChip } from '@/components/generar-vale/PalletChip'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { PageHeader } from '@/components/ui/PageHeader'
import { useUbicaciones } from '@/hooks/useUbicaciones'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import type { UbicacionOpcion } from '@/interfaces/ubicacion.interface'
import { palletService } from '@/services/pallet.service'
import { formatQuantity, toSentenceCase } from '@/utils/format'
import { nivelFiltro, PARTES_UBICACION } from '@/utils/ubicacion'

type Step = 'scan' | 'almacen' | 'ubicacion' | 'resumen'

/** Parte elegida del código; auto = se eligió sola por ser la única opción (regresar la salta) */
interface Eleccion {
  codigo: string
  auto: boolean
  /** Ubicación final multipallet */
  multiple?: boolean
}

/** Largo del código armado tras elegir `partes` partes */
const largoHasta = (partes: number) => PARTES_UBICACION.slice(0, partes).reduce((sum, p) => sum + p.largo, 0)

/**
 * Asignar ubicación: escanear pallet → almacén → código de ubicación → lado → columna → nivel →
 * profundidad → resumen. Si el pallet ya tiene ubicación se confirma la reasignación, que siempre
 * es dentro del mismo almacén: se omite el paso de almacén.
 */
export default function AsignarUbicacionPage() {
  const [step, setStep] = useState<Step>('scan')
  const [pallet, setPallet] = useState<Pallet>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [confirmReasignar, setConfirmReasignar] = useState(false)
  const [almacen, setAlmacen] = useState<Warehouse | null>(null)
  const [elecciones, setElecciones] = useState<Eleccion[]>([])

  const paso = elecciones.length
  const codigo = elecciones.at(-1)?.codigo ?? ''
  const parte = PARTES_UBICACION[paso]

  const { warehouses, isLoading: loadingWarehouses, error: warehousesError, reload: reloadWarehouses } = useWarehouses()

  // Reasignación: el pallet ya tiene ubicación y se queda en su almacén
  const reasignacion = !!pallet?.ubicacion
  const almacenActual = warehouses.find((w) => w.codigo === pallet?.almacen) ?? null

  // Al reasignar, el almacén es el del pallet (se fija en cuanto cargan los almacenes)
  useEffect(() => {
    if (step === 'ubicacion' && reasignacion && !almacen && almacenActual) setAlmacen(almacenActual)
  }, [step, reasignacion, almacen, almacenActual])

  // Paso 0 (código): se consultan todos los códigos del almacén juntos ("C1,P1") para ver su disponibilidad
  const filtro = step === 'ubicacion' && almacen ? (paso === 0 ? almacen.ubicaciones.join(',') : codigo) : ''
  const { opciones: todas, isLoading, error, reload } = useUbicaciones(filtro, nivelFiltro(paso))
  // Descarta resultados de la consulta anterior mientras llega la nueva
  const opciones = todas.filter(
    (o) =>
      o.codigo.length === largoHasta(paso + 1) &&
      (paso === 0 ? almacen?.ubicaciones.includes(o.codigo) : o.codigo.startsWith(codigo)),
  )

  // Una sola opción con espacio: se elige sola
  useEffect(() => {
    if (step !== 'ubicacion' || isLoading || error || opciones.length !== 1 || opciones[0].disponibles === 0) return
    const unica = opciones[0].codigo
    setElecciones((current) =>
      current.at(-1)?.codigo === unica ? current : [...current, { codigo: unica, auto: true, multiple: opciones[0].multiple }],
    )
  }, [step, isLoading, error, opciones])

  useEffect(() => {
    if (step === 'ubicacion' && paso === PARTES_UBICACION.length) setStep('resumen')
  }, [step, paso])

  const reiniciar = () => {
    setStep('scan')
    setPallet(undefined)
    setAlmacen(null)
    setElecciones([])
    setVerifyError(undefined)
    setConfirmReasignar(false)
  }

  const handleScanned = async (code: string) => {
    setIsVerifying(true)
    setVerifyError(undefined)
    try {
      const verified = await palletService.verify(code)
      setPallet(verified)
      setAlmacen(null)
      setElecciones([])
      if (verified.ubicacion) setConfirmReasignar(true)
      else setStep('almacen')
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, 'No fue posible verificar el pallet'))
    } finally {
      setIsVerifying(false)
    }
  }

  const elegirAlmacen = (code: string) => {
    const warehouse = warehouses.find((w) => w.codigo === code)
    if (!warehouse) return
    if (warehouse.codigo !== almacen?.codigo) setElecciones([])
    setAlmacen(warehouse)
    setStep('ubicacion')
  }

  const elegirOpcion = (opcion: UbicacionOpcion) => {
    setElecciones((current) => [...current, { codigo: opcion.codigo, auto: false, multiple: opcion.multiple }])
  }

  // Regresar quita la última parte elegida a mano junto con las que se eligieron solas después
  // Tocar una parte ya elegida del código vuelve a ese paso (descarta esa parte y las siguientes)
  const irAParte = (indice: number) => {
    setElecciones((current) => current.slice(0, indice))
    setStep('ubicacion')
  }
  const automaticas = elecciones.map((e) => e.auto)
  const hayEditables = elecciones.some((e) => !e.auto)

  const goBack = () => {
    if (step === 'almacen') return reiniciar()
    const ultimaManual = elecciones.findLastIndex((e) => !e.auto)
    if (ultimaManual === -1) {
      // Al reasignar no hay paso de almacén: se vuelve al escaneo
      if (reasignacion) return reiniciar()
      setElecciones([])
      setStep('almacen')
      return
    }
    setElecciones(elecciones.slice(0, ultimaManual))
    setStep('ubicacion')
  }

  const warehouseItems: OptionItem[] = warehouses.map((w) => ({
    key: w.codigo,
    badge: w.codigo,
    title: toSentenceCase(w.descripcion),
    meta: [
      w.ubicaciones.length ? `Ubic. ${w.ubicaciones.join(', ')}` : 'Sin ubicaciones físicas',
      `Saldo ${formatQuantity(w.saldo)}`,
      w.codigo === pallet?.almacen ? 'Actual' : '',
    ]
      .filter(Boolean)
      .join(' · '),
    disabled: w.ubicaciones.length === 0,
  }))

  // Al reasignar no hay paso de almacén: la numeración se corre uno
  const offset = reasignacion ? 2 : 3
  const stepNumber = step === 'scan' ? 1 : step === 'almacen' ? 2 : step === 'resumen' ? offset + 5 : paso + offset
  const stepTitle =
    step === 'scan' ? 'Escanear pallet' : step === 'almacen' ? 'Almacén' : step === 'resumen' ? 'Confirmar' : parte?.titulo

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Asignar ubicación"
        subtitle={`Paso ${stepNumber} · ${stepTitle}`}
        onBack={step === 'scan' ? undefined : goBack}
        action={
          step !== 'scan' && (
            <button
              type="button"
              onClick={reiniciar}
              className="flex h-touch items-center gap-1.5 rounded-lg px-3 font-heading text-sm font-semibold text-destructive transition-colors duration-150 hover:bg-destructive-soft active:bg-destructive-soft"
            >
              <X aria-hidden className="size-4" />
              Cancelar
            </button>
          )
        }
      />

      {step === 'scan' && (
        <ScanPalletStep
          onScanned={handleScanned}
          isLoading={isVerifying}
          serverError={verifyError}
          onCodeChange={() => setVerifyError(undefined)}
          description="Escanea el pallet que vas a ubicar en el rack."
        />
      )}

      {step !== 'scan' && pallet && (
        <div className="space-y-2 px-4 pt-4">
          <PalletChip pallet={pallet} />
          {pallet.ubicacion && (
            <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
              <MapPin aria-hidden className="size-4 shrink-0" />
              Ubicación actual
              <span className="font-mono font-semibold text-foreground">{pallet.ubicacion}</span>
              {pallet.almacen && <span>· {pallet.almacen}</span>}
            </p>
          )}
        </div>
      )}

      {step === 'almacen' && (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
          <OptionList
            legend="Almacén destino"
            name="almacen"
            items={warehouseItems}
            selectedKey={almacen?.codigo ?? null}
            onSelect={elegirAlmacen}
            isLoading={loadingWarehouses}
            error={warehousesError}
            onRetry={() => void reloadWarehouses()}
            emptyMessage="No hay almacenes disponibles."
            searchPlaceholder="Buscar almacén"
          />
        </div>
      )}

      {step === 'ubicacion' && reasignacion && !almacen && (
        <div className="px-4 pt-6">
          {loadingWarehouses ? (
            <p role="status" className="text-center text-muted-foreground">
              Cargando almacén…
            </p>
          ) : warehousesError ? (
            <Alert type="error">{warehousesError}</Alert>
          ) : (
            !almacenActual && (
              <Alert type="error">
                No se encontró el almacén del pallet ({pallet?.almacen ?? 'sin almacén'}). No se puede reasignar.
              </Alert>
            )
          )}
        </div>
      )}

      {step === 'ubicacion' && almacen && parte && (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-3 pb-4">
          <div className="space-y-2 rounded-xl border border-border bg-card p-3">
            <p className="flex items-center gap-2 text-sm">
              <WarehouseIcon aria-hidden className="size-4 shrink-0 text-primary" />
              <span className="font-mono font-bold">{almacen.codigo}</span>
              <span className="truncate text-muted-foreground">{toSentenceCase(almacen.descripcion)}</span>
              {reasignacion && (
                <span className="ml-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  Mismo almacén
                </span>
              )}
            </p>
            <CodigoUbicacion codigo={codigo} pasoActual={paso} onEditar={irAParte} automaticas={automaticas} />
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
              <p className="text-xs text-muted-foreground">
                {hayEditables ? 'Toca una parte para cambiarla' : 'Elige una opción para continuar'}
              </p>
              <button
                type="button"
                onClick={goBack}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border-2 border-border-strong px-3 font-heading text-sm font-semibold transition-colors duration-150 hover:bg-muted active:bg-muted"
              >
                <Undo2 aria-hidden className="size-4" />
                Paso anterior
              </button>
            </div>
          </div>
          <UbicacionGrid
            info={parte}
            prefijo={codigo}
            opciones={opciones}
            onSelect={elegirOpcion}
            isLoading={isLoading}
            error={error}
            onRetry={() => void reload()}
          />
        </div>
      )}

      {step === 'resumen' && almacen && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <section aria-label="Nueva ubicación" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 bg-primary px-4 py-2.5 text-on-primary">
                <MapPinned aria-hidden className="size-5" />
                <h2 className="font-bold text-white">Nueva ubicación</h2>
                <span className="ml-auto font-mono text-sm font-semibold text-white/90">{almacen.codigo}</span>
              </div>
              <div className="space-y-3 px-4 py-3">
                <p className="text-center font-mono text-3xl font-bold tracking-[0.15em] select-all">{codigo}</p>
                <CodigoUbicacion codigo={codigo} size="lg" onEditar={irAParte} automaticas={automaticas} />
                {hayEditables && (
                  <p className="text-center text-xs text-muted-foreground">Toca una parte para cambiarla</p>
                )}
                {elecciones.at(-1)?.multiple && (
                  <p className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
                    <Layers aria-hidden className="size-4 shrink-0" />
                    <span>
                      <span className="font-bold">Multipallet:</span> esta ubicación admite varios pallets.
                    </span>
                  </p>
                )}
                {pallet?.ubicacion && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                    Reemplaza la ubicación actual{' '}
                    <span className="font-mono font-semibold">{pallet.ubicacion}</span>
                    {pallet.almacen && ` (${pallet.almacen})`}
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-2 border-t border-border bg-card px-4 py-3">
            {/* TODO: guardar con el endpoint de asignación cuando esté disponible */}
            <Alert type="info">Falta el endpoint para guardar la asignación.</Alert>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={goBack} icon={<Undo2 aria-hidden className="size-5" />} className="shrink-0 px-4">
                Atrás
              </Button>
              <Button fullWidth disabled icon={<MapPin aria-hidden className="size-5" />}>
                Asignar ubicación
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmReasignar}
        title="El pallet ya tiene ubicación"
        Icon={MapPin}
        confirmLabel="Reasignar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          setConfirmReasignar(false)
          setAlmacen(almacenActual)
          setStep('ubicacion')
        }}
        onCancel={reiniciar}
      >
        {pallet && (
          <div className="space-y-2">
            <p>
              <span className="font-mono font-semibold">{pallet.codigo}</span> está en{' '}
              <span className="font-mono font-bold">{pallet.ubicacion}</span>
              {pallet.almacen && ` (${pallet.almacen})`}.
            </p>
            <p>¿Deseas reasignar su ubicación? La nueva ubicación será en el mismo almacén.</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
