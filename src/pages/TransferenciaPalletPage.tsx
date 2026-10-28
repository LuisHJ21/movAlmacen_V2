import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, RotateCcw, ScanQrCode, Warehouse, X } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { ArticleStep } from '@/components/generar-vale/ArticleStep'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { CajasEscaneadasList, type CajaEscaneada } from '@/components/transferencia-pallet/CajasEscaneadasList'
import { CajasRealesList } from '@/components/transferencia-pallet/CajasRealesList'
import { EscanearCajaStep } from '@/components/transferencia-pallet/EscanearCajaStep'
import { RutaPallets } from '@/components/transferencia-pallet/RutaPallets'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Pallet } from '@/interfaces/pallet.interface'
import { palletService } from '@/services/pallet.service'
import type { EtiquetaCaja } from '@/interfaces/caja.interface'
import { obtenerCajasReales, resumirCaja, toCajaReal, type ResumenCaja } from '@/utils/cajasReales'
import { formatWeight } from '@/utils/format'
import { buscarCaja, cantidadesDisponibles, type TipoCajaEscaneo } from '@/utils/validarCaja'

type Step = 'origen' | 'destino' | 'articulo' | 'resumen' | 'caja'

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
  articulo: 'Artículo',
  resumen: 'Resumen',
  caja: 'Escanear caja',
}

const Codigo = ({ children }: { children: ReactNode }) => <span className="font-mono font-bold">{children}</span>

/**
 * Transferencia entre pallets: escanear pallet origen → escanear pallet destino → artículo (si el origen
 * tiene varios) → resumen. Ambos deben tener almacén asignado y estar en el mismo almacén; el destino no
 * puede ser el mismo origen. En el resumen se traen los ítems del origen (/pallet/data sin movimiento)
 * y se simulan sus cajas reales (utils/cajasReales).
 */
export default function TransferenciaPalletPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('origen')
  const [origen, setOrigen] = useState<Pallet>()
  const [destino, setDestino] = useState<Pallet>()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string>()
  const [alerta, setAlerta] = useState<AlertaPallet | null>(null)
  const [articulo, setArticulo] = useState<string | null>(null)
  const [cajas, setCajas] = useState<{ filas: ResumenCaja[]; pesoUnd: number } | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string>()
  // Cajas escaneadas: usadas[i] = cajas de la fila i ya escaneadas
  const [usadas, setUsadas] = useState<number[]>([])
  const [escaneadas, setEscaneadas] = useState<CajaEscaneada[]>([])
  const [alertaCaja, setAlertaCaja] = useState<{ titulo: string; motivo: string } | null>(null)
  const [aviso, setAviso] = useState<string>()

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
        // Varios artículos en el origen: se elige cuál transferir antes de traer sus datos
        if (origen.articulos.length > 1) return setStep('articulo')
        elegirArticulo(origen.articulos[0] ?? '')
      },
    )
  }

  const elegirArticulo = (codigo: string) => {
    setArticulo(codigo)
    setStep('resumen')
    void cargarOrigen(codigo)
  }

  // Datos del origen (/pallet/data sin movimiento) y simulación de sus cajas reales
  const cargarOrigen = async (codigoArticulo: string) => {
    if (!origen) return
    setCargando(true)
    setErrorCarga(undefined)
    setCajas(null)
    setUsadas([])
    setEscaneadas([])
    setAviso(undefined)
    try {
      const data = await palletService.getData(origen.codigo, '', codigoArticulo)
      const items = data.items.filter((i) => i.codArticulo === codigoArticulo || !i.codArticulo)
      const pesoUnd = data.articulo?.pesoUnidad || items[0]?.pesoUnidad || 0
      const filas = obtenerCajasReales(items.map(toCajaReal), pesoUnd).map((c) => resumirCaja(c, pesoUnd))
      setCajas({ filas, pesoUnd })
    } catch (err) {
      setErrorCarga(getApiErrorMessage(err, 'No fue posible obtener los datos del pallet origen'))
    } finally {
      setCargando(false)
    }
  }

  // Al cerrar el aviso el motivo queda bajo el campo, y el código queda seleccionado para la siguiente lectura
  const cerrarAlerta = () => {
    if (alerta) setVerifyError(alerta.motivo)
    setAlerta(null)
  }

  // Etiqueta leída: se busca una caja real de esa cantidad de registros que la incluya y, si no se escaneó, se suma
  const handleCaja = (tipo: TipoCajaEscaneo, etiquetas: number, etiqueta: EtiquetaCaja) => {
    if (!cajas || !articulo) return
    const r = buscarCaja(cajas.filas, usadas, etiqueta, tipo, etiquetas, articulo)
    if (!r.ok) return setAlertaCaja({ titulo: r.titulo, motivo: r.motivo })

    const fila = cajas.filas[r.fila]
    const peso = fila.tipo === 'completas' ? cajas.pesoUnd : fila.peso
    setUsadas((prev) => {
      const next = [...prev]
      next[r.fila] = (next[r.fila] ?? 0) + 1
      return next
    })
    setEscaneadas((prev) => [...prev, { fila: r.fila, tipo: fila.tipo, etiqueta, piezas: fila.piezas, peso }])
    setAviso(`Caja agregada (${formatWeight(peso)}). Escanea la siguiente o revisa el resumen.`)
    setStep('resumen')
  }

  const quitarCaja = (indice: number) => {
    const caja = escaneadas[indice]
    if (!caja) return
    setUsadas((prev) => {
      const next = [...prev]
      next[caja.fila] = Math.max(0, (next[caja.fila] ?? 0) - 1)
      return next
    })
    setEscaneadas((prev) => prev.filter((_, i) => i !== indice))
  }

  const goBack = () => {
    setVerifyError(undefined)
    if (step === 'caja') return setStep('resumen')
    if (step === 'resumen' && origen && origen.articulos.length > 1) return setStep('articulo')
    setStep(step === 'resumen' || step === 'articulo' ? 'destino' : 'origen')
  }

  const conArticulo = !!origen && origen.articulos.length > 1
  const pasoResumen = conArticulo ? 4 : 3
  const stepNumber = { origen: 1, destino: 2, articulo: 3, resumen: pasoResumen, caja: pasoResumen + 1 }[step]

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
          <RutaPallets origen={origen} destino={step === 'destino' ? undefined : destino} />
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

      {step === 'articulo' && origen && (
        <ArticleStep pallet={origen} initialArticle={articulo} onConfirm={elegirArticulo} />
      )}

      {step === 'resumen' && origen && destino && (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-3 pb-4">
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
              <Warehouse aria-hidden className="size-4 shrink-0" />
              Ambos pallets están en el almacén <Codigo>{origen.almacen}</Codigo>
            </p>

            {cargando ? (
              <div aria-busy="true" aria-label="Cargando cajas del origen" className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-border" />
                ))}
              </div>
            ) : errorCarga ? (
              <div className="space-y-2">
                <Alert type="error">{errorCarga}</Alert>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => articulo && void cargarOrigen(articulo)}
                  icon={<RotateCcw aria-hidden className="size-5" />}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              cajas && (
                <>
                  <CajasEscaneadasList cajas={escaneadas} onQuitar={quitarCaja} />
                  <CajasRealesList filas={cajas.filas} pesoUnd={cajas.pesoUnd} usadas={usadas} />
                </>
              )
            )}
          </div>

          <div className="space-y-2 border-t border-border bg-card px-4 py-3">
            {aviso && (
              <Alert type="success" onClose={() => setAviso(undefined)}>
                {aviso}
              </Alert>
            )}
            <Button
              fullWidth
              disabled={!cajas || cargando}
              onClick={() => {
                setAviso(undefined)
                setStep('caja')
              }}
              icon={<ScanQrCode aria-hidden className="size-5" />}
            >
              Escanear caja
            </Button>
          </div>
        </>
      )}

      {step === 'caja' && cajas && (
        <EscanearCajaStep
          pesoUnd={formatWeight(cajas.pesoUnd)}
          cantidades={cantidadesDisponibles(cajas.filas)}
          onLeida={handleCaja}
        />
      )}

      <ConfirmDialog
        open={!!alertaCaja}
        title={alertaCaja?.titulo ?? ''}
        Icon={CircleAlert}
        tone="destructive"
        hideCancel
        confirmLabel="Escanear de nuevo"
        onConfirm={() => setAlertaCaja(null)}
        onCancel={() => setAlertaCaja(null)}
      >
        <p>{alertaCaja?.motivo}</p>
      </ConfirmDialog>

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
