import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CircleAlert, Warehouse, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { PalletResumenCard } from '@/components/transferencia-pallet/PalletResumenCard'
import { RutaPallets } from '@/components/transferencia-pallet/RutaPallets'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Pallet } from '@/interfaces/pallet.interface'
import { palletService } from '@/services/pallet.service'

type Step = 'origen' | 'destino' | 'resumen'

/** Validación fallida al escanear: se muestra como aviso y el motivo queda bajo el campo */
interface AlertaPallet {
  titulo: string
  detalle: ReactNode
  /** Texto corto que queda bajo el campo al cerrar el aviso */
  motivo: string
}

const stepTitles: Record<Step, string> = {
  origen: 'Pallet origen',
  destino: 'Pallet destino',
  resumen: 'Resumen',
}

const Codigo = ({ children }: { children: ReactNode }) => <span className="font-mono font-bold">{children}</span>

/**
 * Transferencia entre pallets: escanear pallet origen → escanear pallet destino.
 * Ambos deben tener almacén asignado y estar en el mismo almacén; el destino no puede ser el mismo origen.
 */
export default function TransferenciaPalletPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('origen')
  const [origen, setOrigen] = useState<Pallet>()
  const [destino, setDestino] = useState<Pallet>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [alerta, setAlerta] = useState<AlertaPallet | null>(null)

  const verificar = async (code: string, validar: (pallet: Pallet) => AlertaPallet | null, onOk: (pallet: Pallet) => void) => {
    setIsVerifying(true)
    setVerifyError(undefined)
    try {
      const verified = await palletService.verify(code)
      const fallo = validar(verified)
      if (fallo) return setAlerta(fallo)
      onOk(verified)
    } catch (err) {
      setVerifyError(getApiErrorMessage(err, 'No fue posible verificar el pallet'))
    } finally {
      setIsVerifying(false)
    }
  }

  const handleOrigen = (code: string) =>
    verificar(
      code,
      (p) =>
        p.almacen
          ? null
          : {
              titulo: 'El pallet no tiene almacén',
              detalle: (
                <p>
                  <Codigo>{p.codigo}</Codigo> no tiene almacén asignado, así que no se puede comparar con el destino.
                  Escanea otro pallet.
                </p>
              ),
              motivo: `${p.codigo} no tiene almacén asignado`,
            },
      (p) => {
        setOrigen(p)
        // Un destino escaneado antes deja de valer si ya no coincide con el nuevo origen
        if (destino && (destino.codigo === p.codigo || destino.almacen !== p.almacen)) setDestino(undefined)
        setStep('destino')
      },
    )

  const handleDestino = (code: string) => {
    if (!origen) return
    return verificar(
      code,
      (p) => {
        if (p.codigo === origen.codigo)
          return {
            titulo: 'Es el mismo pallet',
            detalle: (
              <p>
                <Codigo>{p.codigo}</Codigo> es el pallet origen. Escanea un pallet distinto como destino.
              </p>
            ),
            motivo: 'El destino no puede ser el mismo pallet origen',
          }
        if (p.almacen !== origen.almacen)
          return {
            titulo: 'Los pallets están en almacenes distintos',
            detalle: (
              <p>
                <Codigo>{p.codigo}</Codigo>{' '}
                {p.almacen ? (
                  <>
                    está en <Codigo>{p.almacen}</Codigo>
                  </>
                ) : (
                  'no tiene almacén asignado'
                )}
                , y el origen <Codigo>{origen.codigo}</Codigo> está en <Codigo>{origen.almacen}</Codigo>. Ambos
                pallets deben estar en el mismo almacén.
              </p>
            ),
            motivo: p.almacen
              ? `${p.codigo} está en ${p.almacen}, no en ${origen.almacen}`
              : `${p.codigo} no tiene almacén asignado`,
          }
        return null
      },
      (p) => {
        setDestino(p)
        setStep('resumen')
      },
    )
  }

  // Al cerrar el aviso el motivo queda bajo el campo, y el código queda seleccionado para la siguiente lectura
  const cerrarAlerta = () => {
    if (alerta) setVerifyError(alerta.motivo)
    setAlerta(null)
  }

  const goBack = () => {
    setVerifyError(undefined)
    setStep(step === 'resumen' ? 'destino' : 'origen')
  }

  const stepNumber = { origen: 1, destino: 2, resumen: 3 }[step]

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Transferencia entre pallets"
        subtitle={`Paso ${stepNumber} · ${stepTitles[step]}`}
        onBack={step === 'origen' || isVerifying ? undefined : goBack}
        action={
          step !== 'origen' &&
          !isVerifying && (
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

      {step !== 'origen' && (
        <div className="px-4 pt-4">
          <RutaPallets origen={origen} destino={step === 'resumen' ? destino : undefined} />
        </div>
      )}

      {step === 'origen' && (
        <ScanPalletStep
          key="origen"
          title="Escanea el pallet origen"
          description="Es el pallet del que sale el producto."
          onScanned={handleOrigen}
          isLoading={isVerifying}
          serverError={verifyError}
          onCodeChange={() => setVerifyError(undefined)}
        />
      )}

      {step === 'destino' && origen && (
        <ScanPalletStep
          key="destino"
          title="Escanea el pallet destino"
          description={`Debe estar en el almacén ${origen.almacen}, igual que el origen.`}
          onScanned={handleDestino}
          isLoading={isVerifying}
          serverError={verifyError}
          onCodeChange={() => setVerifyError(undefined)}
        />
      )}

      {step === 'resumen' && origen && destino && (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-3 pb-4">
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
              <Warehouse aria-hidden className="size-4 shrink-0" />
              Ambos pallets están en el almacén <Codigo>{origen.almacen}</Codigo>
            </p>
            <PalletResumenCard titulo="Pallet origen" pallet={origen} />
            <PalletResumenCard titulo="Pallet destino" pallet={destino} />
          </div>

          <div className="space-y-2 border-t border-border bg-card px-4 py-3">
            {/* TODO: siguiente paso (qué se transfiere) y endpoint de guardado, por definir */}
            <Alert type="info">Falta definir el siguiente paso de la transferencia.</Alert>
            <Button fullWidth disabled icon={<ArrowRight aria-hidden className="size-5" />} className="flex-row-reverse">
              Continuar
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!alerta}
        title={alerta?.titulo ?? ''}
        Icon={CircleAlert}
        tone="destructive"
        hideCancel
        confirmLabel="Escanear otro"
        onConfirm={cerrarAlerta}
        onCancel={cerrarAlerta}
      >
        {alerta?.detalle}
      </ConfirmDialog>
    </div>
  )
}
