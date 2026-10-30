import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { ArrowRight, ArrowRightLeft, CircleAlert, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { SelectorUbicacion } from '@/components/asignar-ubicacion/SelectorUbicacion'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { ValeExtrasFields } from '@/components/generar-vale/ValeExtrasFields'
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

type Step = 'origen' | 'destino' | 'scan' | 'ubicacion' | 'resumen' | 'extras' | 'guardado'

interface AlertaPallet {
  titulo: string
  detalle: ReactNode
  motivo: string
}

const stepTitles: Record<Exclude<Step, 'ubicacion'>, string> = {
  origen: 'Almacén origen',
  destino: 'Almacén destino',
  scan: 'Escanear pallet',
  resumen: 'Resumen',
  extras: 'Datos adicionales',
  guardado: 'Transferencia registrada',
}


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

  const [cargadaEn, setCargadaEn] = useState(() => new Date())
  const [formIds, setFormIds] = useState({ salida: '', ingreso: '' })
  const [recepcionado, setRecepcionado] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [confirmarGuardar, setConfirmarGuardar] = useState(false)
  const cerrarConfirmar = useCallback(() => setConfirmarGuardar(false), [])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [guardada, setGuardada] = useState<Guardada | null>(null)

  const { warehouses, isLoading, error, reload } = useWarehouses()

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

      const completaPallet = origen.ubicaciones.length === 0 && !!verified.ubicacion

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
          ubicacion: requiereUbicacion ? selector.codigo : tipo === '1' ? (pallet.ubicacion ?? '') : '',
          recepcionado,
          observaciones,
        }),
      )
      setGuardada(result)
      setStep('guardado')
    } catch (err) {
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
    if (step === 'extras') return setStep('resumen')
    if (step === 'destino') return setStep('origen')
    if (step === 'scan') {
      setVerifyError(undefined)
      return setStep('destino')
    }
    if (step === 'ubicacion' || (step === 'resumen' && requiereUbicacion)) {
      return selector.retroceder() ? setStep('ubicacion') : volverAEscanear()
    }
    if (step === 'resumen') volverAEscanear()
  }

  const stepNumber =
    step === 'ubicacion'
      ? 4 + selector.paso
      : { origen: 1, destino: 2, scan: 3, resumen: requiereUbicacion ? 9 : 4, extras: requiereUbicacion ? 10 : 5, guardado: requiereUbicacion ? 11 : 6 }[step]
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
        <div className="border-t border-border bg-card px-4 py-3">
          <Button
            fullWidth
            disabled={!puedeGuardar}
            icon={<ArrowRight aria-hidden className="size-5" />}
            onClick={() => {
              setSaveError(undefined)
              setStep('extras')
            }}
          >
            Continuar
          </Button>
        </div>
      )}

      {step === 'extras' && (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-4">
          <p className="text-muted-foreground">
            Completa estos datos si los necesitas; se guardan en los vales de salida e ingreso. Puedes dejarlos vacíos.
          </p>
          <ValeExtrasFields
            recepcionado={recepcionado}
            observaciones={observaciones}
            onRecepcionadoChange={setRecepcionado}
            onObservacionesChange={setObservaciones}
            disabled={isSaving}
          />
        </div>
      )}

      {step === 'extras' && (
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
            {recepcionado.trim() && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Recepcionado</dt>
                <dd className="truncate font-semibold">{recepcionado.trim()}</dd>
              </div>
            )}
            {observaciones.trim() && (
              <div>
                <dt className="text-muted-foreground">Observaciones</dt>
                <dd className="mt-0.5 font-semibold break-words whitespace-pre-line">{observaciones.trim()}</dd>
              </div>
            )}
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
