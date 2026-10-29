import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Check, Home, Layers, MapPin, MapPinned, Undo2, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { CodigoUbicacion } from '@/components/asignar-ubicacion/CodigoUbicacion'
import { SelectorUbicacion } from '@/components/asignar-ubicacion/SelectorUbicacion'
import { PalletChip } from '@/components/generar-vale/PalletChip'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useSelectorUbicacion } from '@/hooks/useSelectorUbicacion'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { palletService } from '@/services/pallet.service'
import { ubicacionService } from '@/services/ubicacion.service'
import { formatQuantity, toSentenceCase } from '@/utils/format'

type Step = 'scan' | 'almacen' | 'ubicacion' | 'resumen' | 'guardado'

export default function AsignarUbicacionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('scan')
  const [pallet, setPallet] = useState<Pallet>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [confirmReasignar, setConfirmReasignar] = useState(false)
  const [almacen, setAlmacen] = useState<Warehouse | null>(null)
  const { usuario } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()

  const selector = useSelectorUbicacion(almacen, step === 'ubicacion')
  const { paso, codigo, parte } = selector

  const { warehouses, isLoading: loadingWarehouses, error: warehousesError, reload: reloadWarehouses } = useWarehouses()

  const reasignacion = !!pallet?.ubicacion
  const almacenActual = warehouses.find((w) => w.codigo === pallet?.almacen) ?? null

  useEffect(() => {
    if (step === 'ubicacion' && reasignacion && !almacen && almacenActual) setAlmacen(almacenActual)
  }, [step, reasignacion, almacen, almacenActual])

  useEffect(() => {
    if (step === 'ubicacion' && selector.completo) setStep('resumen')
  }, [step, selector.completo])

  const reiniciar = () => {
    setStep('scan')
    setSaveError(undefined)
    setPallet(undefined)
    setAlmacen(null)
    selector.reiniciar()
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
      selector.reiniciar()
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
    if (warehouse.codigo !== almacen?.codigo) selector.reiniciar()
    setAlmacen(warehouse)
    setStep('ubicacion')
  }

  const irAParte = (indice: number) => {
    selector.irAParte(indice)
    setStep('ubicacion')
  }

  const guardar = async () => {
    if (!pallet || !almacen || !usuario || !selector.completo || isSaving) return
    setIsSaving(true)
    setSaveError(undefined)
    try {
      await ubicacionService.asignar({
        codUbicacion: codigo,
        pallet: pallet.codigo,
        usuario: usuario.usuario,
        almacenDest: almacen.codigo,
      })
      setStep('guardado')
    } catch (err) {
      setSaveError(
        isAxiosError(err) && !err.response
          ? 'No se recibió respuesta del servidor. La ubicación pudo haberse asignado: verifica el pallet antes de reintentar.'
          : getApiErrorMessage(err, 'No fue posible asignar la ubicación'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const goBack = () => {
    setSaveError(undefined)
    if (step === 'almacen') return reiniciar()
    if (selector.retroceder()) return setStep('ubicacion')
    if (reasignacion) return reiniciar()
    setStep('almacen')
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

  const offset = reasignacion ? 2 : 3
  const stepNumber = step === 'scan' ? 1 : step === 'almacen' ? 2 : step === 'resumen' ? offset + 5 : paso + offset
  const stepTitle =
    step === 'scan' ? 'Escanear pallet' : step === 'almacen' ? 'Almacén' : step === 'resumen' ? 'Confirmar' : parte?.titulo
  const subtitle = step === 'guardado' ? (reasignacion ? 'Ubicación reasignada' : 'Ubicación asignada') : `Paso ${stepNumber} · ${stepTitle}`

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Asignar ubicación"
        subtitle={subtitle}
        onBack={step === 'scan' || step === 'guardado' || isSaving ? undefined : goBack}
        action={
          step !== 'scan' &&
          step !== 'guardado' &&
          !isSaving && (
            <button
              type="button"
              onClick={() => navigate('/')}
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

      {step !== 'scan' && step !== 'guardado' && pallet && (
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

      {step === 'ubicacion' && almacen && (
        <SelectorUbicacion
          selector={selector}
          almacen={almacen}
          etiqueta={reasignacion ? 'Mismo almacén' : undefined}
          onPasoAnterior={goBack}
        />
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
                <CodigoUbicacion codigo={codigo} size="lg" onEditar={irAParte} automaticas={selector.automaticas} />
                {selector.hayEditables && (
                  <p className="text-center text-xs text-muted-foreground">Toca una parte para cambiarla</p>
                )}
                {selector.multiple && (
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
            {saveError && (
              <Alert type="error" onClose={() => setSaveError(undefined)}>
                {saveError}
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={goBack}
                disabled={isSaving}
                icon={<Undo2 aria-hidden className="size-5" />}
                className="shrink-0 px-4"
              >
                Atrás
              </Button>
              <Button
                fullWidth
                onClick={() => void guardar()}
                isLoading={isSaving}
                icon={isSaving ? undefined : <MapPin aria-hidden className="size-5" />}
              >
                {isSaving ? 'Asignando…' : reasignacion ? 'Reasignar ubicación' : 'Asignar ubicación'}
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 'guardado' && pallet && almacen && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4">
            <article aria-label="Ubicación asignada" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div role="status" className="flex items-center gap-3 bg-success px-4 py-3.5 text-white">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20">
                  <Check aria-hidden className="size-6" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg leading-tight font-bold text-white">
                    {reasignacion ? 'Ubicación reasignada' : 'Ubicación asignada'}
                  </h2>
                  <p className="text-sm text-white/90">
                    <span className="font-mono font-semibold">{pallet.codigo}</span> · {almacen.codigo}
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-4 py-4">
                <p className="text-center font-mono text-3xl font-bold tracking-[0.15em] select-all">{codigo}</p>
                <CodigoUbicacion codigo={codigo} size="lg" />
                {pallet.ubicacion && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm">
                    Antes en <span className="font-mono font-semibold">{pallet.ubicacion}</span>
                  </p>
                )}
              </div>
            </article>
          </div>

          <div className="border-t border-border bg-card px-4 py-3">
            <Button fullWidth onClick={() => navigate('/')} icon={<Home aria-hidden className="size-5" />}>
              Ir al inicio
            </Button>
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
        onCancel={() => navigate('/')}
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
