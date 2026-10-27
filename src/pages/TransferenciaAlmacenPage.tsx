import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { ArrowRightLeft, CircleAlert, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { SelectorUbicacion } from '@/components/asignar-ubicacion/SelectorUbicacion'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { PalletTransferCard } from '@/components/transferencia-almacen/PalletTransferCard'
import { RutaTransferencia } from '@/components/transferencia-almacen/RutaTransferencia'
import { TransferenciaGuardada } from '@/components/transferencia-almacen/TransferenciaGuardada'
import { TransferItemList } from '@/components/transferencia-almacen/TransferItemList'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useSelectorUbicacion } from '@/hooks/useSelectorUbicacion'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Pallet, PalletData, TipoTransferencia } from '@/interfaces/pallet.interface'
import { palletService } from '@/services/pallet.service'
import { transferenciaService, type TransferenciaGuardada as Guardada } from '@/services/transferencia.service'
import { formatCount, formatQuantity, formatWeight, toSentenceCase } from '@/utils/format'
import { buildTransferenciaRequest, tipoTransferencia } from '@/utils/transferencia'
import { generateFormId } from '@/utils/vale'

type Step = 'origen' | 'destino' | 'scan' | 'ubicacion' | 'resumen' | 'guardado'

/** Validación fallida al escanear: se muestra como aviso y el motivo queda bajo el campo */
interface AlertaPallet {
  titulo: string
  detalle: ReactNode
  /** Texto corto que queda bajo el campo al cerrar el aviso */
  motivo: string
}

const stepTitles: Record<Exclude<Step, 'ubicacion'>, string> = {
  origen: 'Almacén origen',
  destino: 'Almacén destino',
  scan: 'Escanear pallet',
  resumen: 'Resumen',
  guardado: 'Transferencia registrada',
}

/**
 * Transferencia entre almacenes: almacén origen → almacén destino (distinto del origen) → escanear pallet.
 * Al escanear se valida que:
 * - si el pallet tiene almacén asignado, sea el almacén origen (sin almacén se permite);
 * - excepción: origen sin códigos de ubicación (temporal) y pallet ya ubicado. Es el pallet que se arma en
 *   varios días: los ítems nuevos pasan por el temporal y se "transfieren" a su almacén actual manteniendo
 *   la ubicación (tipo = 1). En ese caso el destino debe ser el almacén actual del pallet.
 * Si alguna falla, se avisa y se vuelve a escanear. Si pasan, se consultan los ítems con /pallet/datatransfer.
 * Luego, si el pallet cambia de almacén (tipo = 0) y el destino tiene códigos de ubicación, se elige su
 * ubicación en el destino igual que en Asignar ubicación (código → lado → columna → nivel → profundidad).
 * Al guardar (POST /transferencia) se generan un vale de salida del origen y uno de ingreso al destino.
 */
export default function TransferenciaAlmacenPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('origen')
  const [origen, setOrigen] = useState<Warehouse | null>(null)
  const [destino, setDestino] = useState<Warehouse | null>(null)
  const [pallet, setPallet] = useState<Pallet>()
  const [datos, setDatos] = useState<PalletData | null>(null)
  const [tipo, setTipo] = useState<TipoTransferencia>('0')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [alerta, setAlerta] = useState<AlertaPallet | null>(null)
  const { usuario } = useAuth()

  // Guardado: la fecha y los ids de formulario se generan al cargar la transferencia (un reintento envía los mismos)
  const [cargadaEn, setCargadaEn] = useState(() => new Date())
  const [formIds, setFormIds] = useState({ salida: '', ingreso: '' })
  const [confirmarGuardar, setConfirmarGuardar] = useState(false)
  const cerrarConfirmar = useCallback(() => setConfirmarGuardar(false), [])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [guardada, setGuardada] = useState<Guardada | null>(null)

  const { warehouses, isLoading, error, reload } = useWarehouses()

  // Ubicación en el destino: solo si el pallet cambia de almacén y el destino maneja ubicaciones
  const requiereUbicacion = tipo === '0' && !!destino && destino.ubicaciones.length > 0
  const selector = useSelectorUbicacion(destino, step === 'ubicacion')

  useEffect(() => {
    if (step === 'ubicacion' && selector.completo) setStep('resumen')
  }, [step, selector.completo])

  const toItem = (w: Warehouse): OptionItem => ({
    key: w.codigo,
    badge: w.codigo,
    title: toSentenceCase(w.descripcion),
    meta: `Saldo ${formatQuantity(w.saldo)}`,
  })

  const elegirOrigen = (code: string) => {
    const warehouse = warehouses.find((w) => w.codigo === code)
    if (!warehouse) return
    setOrigen(warehouse)
    // El destino no puede ser el mismo almacén
    if (destino?.codigo === warehouse.codigo) setDestino(null)
    setStep('destino')
  }

  const elegirDestino = (code: string) => {
    const warehouse = warehouses.find((w) => w.codigo === code)
    if (!warehouse) return
    if (warehouse.codigo !== destino?.codigo) selector.reiniciar()
    setDestino(warehouse)
    setStep('scan')
  }

  const handleScanned = async (code: string) => {
    if (!origen || !destino) return
    setIsVerifying(true)
    setVerifyError(undefined)
    try {
      const verified = await palletService.verify(code)
      const codigo = <span className="font-mono font-semibold">{verified.codigo}</span>

      // Origen temporal (sin códigos de ubicación) y pallet ya ubicado: se completa el pallet en su almacén actual
      const completaPallet = origen.ubicaciones.length === 0 && !!verified.ubicacion

      // Solo se valida si el pallet tiene almacén: sin almacén asignado puede transferirse
      if (verified.almacen && verified.almacen !== origen.codigo && !completaPallet) {
        setAlerta({
          titulo: 'El pallet no está en el almacén origen',
          detalle: (
            <p>
              {codigo} está en <span className="font-mono font-bold">{verified.almacen}</span>, no en el origen{' '}
              <span className="font-mono font-bold">{origen.codigo}</span>. Escanea otro pallet.
            </p>
          ),
          motivo: `${verified.codigo} está en ${verified.almacen}, no en ${origen.codigo}`,
        })
        return
      }

      // Al completar un pallet ubicado, el destino tiene que ser su almacén actual (mantiene la ubicación)
      if (completaPallet && destino.codigo !== verified.almacen) {
        setAlerta({
          titulo: 'El pallet ya tiene ubicación asignada',
          detalle: (
            <p>
              {codigo} ya está en <span className="font-mono font-bold">{verified.ubicacion}</span>
              {verified.almacen && (
                <>
                  {' '}
                  (<span className="font-mono font-bold">{verified.almacen}</span>)
                </>
              )}
              . Desde <span className="font-mono font-bold">{origen.codigo}</span> solo puede transferirse a su
              almacén actual{verified.almacen ? ` ${verified.almacen}` : ''}, no a{' '}
              <span className="font-mono font-bold">{destino.codigo}</span>.
            </p>
          ),
          motivo: `${verified.codigo} ya tiene ubicación asignada (${verified.ubicacion})`,
        })
        return
      }

      // Validaciones superadas: ítems del pallet para el almacén destino
      const tipoCalculado = tipoTransferencia(origen, destino, verified)
      const data = await palletService.getDataTransfer(verified.codigo, destino.codigo, tipoCalculado)
      setTipo(tipoCalculado)
      setPallet(verified)
      setDatos(data)
      selector.reiniciar()
      const ahora = new Date()
      setCargadaEn(ahora)
      setFormIds({ salida: generateFormId(ahora), ingreso: generateFormId(ahora) })
      setSaveError(undefined)
      setStep(tipoCalculado === '0' && destino.ubicaciones.length > 0 ? 'ubicacion' : 'resumen')
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, 'No fue posible verificar el pallet'))
    } finally {
      setIsVerifying(false)
    }
  }

  // Al cerrar el aviso el motivo queda bajo el campo, y el código queda seleccionado para la siguiente lectura
  const cerrarAlerta = () => {
    if (alerta) setVerifyError(alerta.motivo)
    setAlerta(null)
  }

  const volverAEscanear = () => {
    setPallet(undefined)
    setDatos(null)
    selector.reiniciar()
    setStep('scan')
  }


  const items = datos?.items ?? []
  const totalBultos = items.reduce((sum, i) => sum + i.bultos, 0)
  const totalPeso = items.reduce((sum, i) => sum + i.peso, 0)
  // Se guarda con ítems y, si corresponde, con la ubicación de destino elegida
  const puedeGuardar = !!pallet && !!origen && !!destino && items.length > 0 && (!requiereUbicacion || selector.completo)

  const handleGuardar = async () => {
    setConfirmarGuardar(false)
    if (!puedeGuardar || isSaving || !pallet || !origen || !destino || !usuario) return
    setIsSaving(true)
    setSaveError(undefined)
    try {
      const result = await transferenciaService.create(
        buildTransferenciaRequest({
          date: cargadaEn,
          formIdSalida: formIds.salida,
          formIdIngreso: formIds.ingreso,
          usuario: usuario.usuario,
          pallet,
          origen,
          destino,
          items,
          // Elegida en el destino; al completar un pallet (tipo 1) se mantiene la actual; sin ubicaciones, ''
          ubicacion: requiereUbicacion ? selector.codigo : tipo === '1' ? (pallet.ubicacion ?? '') : '',
        }),
      )
      setGuardada(result)
      setStep('guardado')
    } catch (err) {
      // Sin respuesta no se sabe si se registró: los mismos ids de formulario evitan duplicarla al reintentar
      setSaveError(
        isAxiosError(err) && !err.response
          ? 'No se recibió respuesta del servidor. La transferencia pudo haberse registrado: verifícala antes de volver a guardar.'
          : getApiErrorMessage(err, 'No fue posible registrar la transferencia'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const goBack = () => {
    if (step === 'destino') return setStep('origen')
    if (step === 'scan') {
      setVerifyError(undefined)
      return setStep('destino')
    }
    // Ubicación (o resumen con ubicación): quita la última parte elegida; sin partes vuelve al escaneo
    if (step === 'ubicacion' || (step === 'resumen' && requiereUbicacion)) {
      return selector.retroceder() ? setStep('ubicacion') : volverAEscanear()
    }
    if (step === 'resumen') volverAEscanear()
  }

  const stepNumber =
    step === 'ubicacion'
      ? 4 + selector.paso
      : { origen: 1, destino: 2, scan: 3, resumen: requiereUbicacion ? 9 : 4, guardado: requiereUbicacion ? 10 : 5 }[step]
  const stepTitle = step === 'ubicacion' ? `Ubicación destino · ${selector.parte?.titulo ?? ''}` : stepTitles[step]

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Transferencia entre almacenes"
        subtitle={step === 'guardado' ? stepTitle : `Paso ${stepNumber} · ${stepTitle}`}
        onBack={step === 'origen' || step === 'guardado' || isSaving ? undefined : goBack}
        backTo={step === 'guardado' ? '/' : undefined}
        action={
          step !== 'origen' &&
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

      {step !== 'guardado' && (
        <div className="px-4 pt-4">
          <RutaTransferencia origen={origen} destino={destino} />
        </div>
      )}

      {(step === 'origen' || step === 'destino') && (
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
          <OptionList
            key={step}
            legend={step === 'origen' ? 'Almacén origen' : 'Almacén destino'}
            name={step}
            items={(step === 'origen' ? warehouses : warehouses.filter((w) => w.codigo !== origen?.codigo)).map(toItem)}
            selectedKey={(step === 'origen' ? origen : destino)?.codigo ?? null}
            onSelect={step === 'origen' ? elegirOrigen : elegirDestino}
            isLoading={isLoading}
            error={error}
            onRetry={() => void reload()}
            emptyMessage="No hay almacenes disponibles."
            searchPlaceholder="Buscar almacén"
          />
        </div>
      )}

      {step === 'scan' && origen && (
        <ScanPalletStep
          onScanned={handleScanned}
          isLoading={isVerifying}
          serverError={verifyError}
          onCodeChange={() => setVerifyError(undefined)}
          title="Escanea el pallet"
          description={
            origen.ubicaciones.length === 0
              ? `Debe estar en ${origen.codigo}; si ya está ubicado, el destino debe ser su almacén actual.`
              : `Si tiene almacén asignado, debe ser el origen ${origen.codigo}.`
          }
          submitLabel="Verificar"
        />
      )}

      {step === 'ubicacion' && destino && (
        <SelectorUbicacion selector={selector} almacen={destino} etiqueta="Destino" onPasoAnterior={goBack} />
      )}

      {step === 'resumen' && pallet && destino && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-4 pb-4">
          <PalletTransferCard
            pallet={pallet}
            nuevaUbicacion={
              requiereUbicacion && selector.completo
                ? { codigo: selector.codigo, almacen: destino.codigo, multiple: selector.multiple, onCambiar: goBack }
                : undefined
            }
          />
          {datos && <TransferItemList datos={datos} />}
        </div>
      )}

      {step === 'resumen' && (
        <div className="space-y-2 border-t border-border bg-card px-4 py-3">
          {saveError && <Alert type="error">{saveError}</Alert>}
          <Button
            fullWidth
            disabled={!puedeGuardar}
            isLoading={isSaving}
            icon={isSaving ? undefined : <ArrowRightLeft aria-hidden className="size-5" />}
            onClick={() => setConfirmarGuardar(true)}
          >
            {isSaving ? 'Registrando…' : 'Transferir'}
          </Button>
        </div>
      )}

      {step === 'guardado' && guardada && pallet && origen && destino && (
        <TransferenciaGuardada
          vales={guardada}
          pallet={pallet.codigo}
          origen={origen.codigo}
          destino={destino.codigo}
          ubicacion={requiereUbicacion ? selector.codigo : undefined}
          bultos={totalBultos}
          peso={totalPeso}
          date={cargadaEn}
        />
      )}

      <ConfirmDialog
        open={confirmarGuardar}
        title="¿Registrar la transferencia?"
        Icon={ArrowRightLeft}
        confirmLabel="Sí, transferir"
        cancelLabel="Revisar"
        onConfirm={() => void handleGuardar()}
        onCancel={cerrarConfirmar}
      >
        {pallet && origen && destino && (
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pallet</dt>
              <dd className="font-mono font-semibold">{pallet.codigo}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">De → a</dt>
              <dd className="font-mono font-semibold">
                {origen.codigo} → {destino.codigo}
              </dd>
            </div>
            {requiereUbicacion && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Ubicación</dt>
                <dd className="font-mono font-semibold">{selector.codigo}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-mono font-semibold">
                {formatCount(totalBultos)} bultos · {formatWeight(totalPeso)}
              </dd>
            </div>
            <p className="pt-1 text-muted-foreground">Se generarán un vale de salida y uno de ingreso.</p>
          </dl>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!alerta}
        title={alerta?.titulo ?? ''}
        Icon={CircleAlert}
        tone="destructive"
        hideCancel
        confirmLabel="Entendido"
        onConfirm={cerrarAlerta}
        onCancel={cerrarAlerta}
      >
        {alerta?.detalle}
      </ConfirmDialog>
    </div>
  )
}
