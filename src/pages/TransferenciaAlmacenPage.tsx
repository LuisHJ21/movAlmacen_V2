import { useState } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { PalletChip } from '@/components/generar-vale/PalletChip'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { RutaTransferencia } from '@/components/transferencia-almacen/RutaTransferencia'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OptionList, type OptionItem } from '@/components/ui/OptionList'
import { PageHeader } from '@/components/ui/PageHeader'
import { useWarehouses } from '@/hooks/useWarehouses'
import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Pallet } from '@/interfaces/pallet.interface'
import { palletService } from '@/services/pallet.service'
import { formatQuantity, toSentenceCase } from '@/utils/format'

type Step = 'origen' | 'destino' | 'scan' | 'verificado'

const stepTitles: Record<Step, string> = {
  origen: 'Almacén origen',
  destino: 'Almacén destino',
  scan: 'Escanear pallet',
  verificado: 'Pallet verificado',
}

/**
 * Transferencia entre almacenes: almacén origen → almacén destino (distinto del origen) →
 * escanear pallet. El pallet debe estar en el almacén origen; si no, se avisa y se vuelve a escanear.
 */
export default function TransferenciaAlmacenPage() {
  const [step, setStep] = useState<Step>('origen')
  const [origen, setOrigen] = useState<Warehouse | null>(null)
  const [destino, setDestino] = useState<Warehouse | null>(null)
  const [pallet, setPallet] = useState<Pallet>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  // Pallet escaneado que no está en el almacén origen
  const [fueraDeOrigen, setFueraDeOrigen] = useState<Pallet | null>(null)

  const { warehouses, isLoading, error, reload } = useWarehouses()

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
    setDestino(warehouse)
    setStep('scan')
  }

  const handleScanned = async (code: string) => {
    if (!origen) return
    setIsVerifying(true)
    setVerifyError(undefined)
    try {
      const verified = await palletService.verify(code)
      if (verified.almacen !== origen.codigo) {
        setFueraDeOrigen(verified)
        return
      }
      setPallet(verified)
      setStep('verificado')
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, 'No fue posible verificar el pallet'))
    } finally {
      setIsVerifying(false)
    }
  }

  // Al cerrar el aviso el motivo queda bajo el campo, y el código queda seleccionado para la siguiente lectura
  const cerrarAlerta = () => {
    if (fueraDeOrigen && origen) {
      setVerifyError(`${fueraDeOrigen.codigo} está en ${fueraDeOrigen.almacen ?? 'ningún almacén'}, no en ${origen.codigo}`)
    }
    setFueraDeOrigen(null)
  }

  const reiniciar = () => {
    setStep('origen')
    setOrigen(null)
    setDestino(null)
    setPallet(undefined)
    setVerifyError(undefined)
    setFueraDeOrigen(null)
  }

  const goBack = () => {
    if (step === 'destino') return setStep('origen')
    if (step === 'scan') {
      setVerifyError(undefined)
      return setStep('destino')
    }
    if (step === 'verificado') {
      setPallet(undefined)
      setStep('scan')
    }
  }

  const stepNumber = { origen: 1, destino: 2, scan: 3, verificado: 4 }[step]

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Transferencia entre almacenes"
        subtitle={`Paso ${stepNumber} · ${stepTitles[step]}`}
        onBack={step === 'origen' ? undefined : goBack}
        action={
          step !== 'origen' && (
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

      <div className="px-4 pt-4">
        <RutaTransferencia origen={origen} destino={destino} />
      </div>

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
          description={`Debe estar en el almacén origen ${origen.codigo}.`}
          submitLabel="Verificar"
        />
      )}

      {step === 'verificado' && pallet && origen && destino && (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-4 pb-4">
          <div role="status" className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2.5 text-sm font-semibold text-success">
            <CircleCheck aria-hidden className="size-5 shrink-0" />
            El pallet está en {origen.codigo} y puede transferirse a {destino.codigo}.
          </div>
          <PalletChip pallet={pallet} />
          {pallet.ubicacion && (
            <p className="px-1 text-sm text-muted-foreground">
              Ubicación actual <span className="font-mono font-semibold text-foreground">{pallet.ubicacion}</span>
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!fueraDeOrigen}
        title="El pallet no está en el almacén origen"
        Icon={CircleAlert}
        tone="destructive"
        hideCancel
        confirmLabel="Entendido"
        onConfirm={cerrarAlerta}
        onCancel={cerrarAlerta}
      >
        {fueraDeOrigen && origen && (
          <p>
            <span className="font-mono font-semibold">{fueraDeOrigen.codigo}</span>{' '}
            {fueraDeOrigen.almacen ? (
              <>
                está en <span className="font-mono font-bold">{fueraDeOrigen.almacen}</span>
              </>
            ) : (
              'no tiene almacén asignado'
            )}
            , no en el origen <span className="font-mono font-bold">{origen.codigo}</span>. Escanea otro pallet.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
