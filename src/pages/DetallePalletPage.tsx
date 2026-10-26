import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Home, Loader2, PackageOpen, RotateCw } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { PalletInfoHeader } from '@/components/detalle-pallet/PalletInfoHeader'
import { PalletInfoItemCard } from '@/components/detalle-pallet/PalletInfoItemCard'
import { ScanPalletStep } from '@/components/generar-vale/ScanPalletStep'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import type { PalletInfo } from '@/interfaces/pallet.interface'
import { palletService } from '@/services/pallet.service'

/**
 * Consulta de pallet: escanear → información e ítems.
 * El código vive en la URL (?pallet=): al volver de un vale abierto desde aquí se recarga el mismo pallet.
 */
export default function DetallePalletPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const palletCode = searchParams.get('pallet') ?? ''

  const [info, setInfo] = useState<PalletInfo>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  // Error al escanear (pallet inexistente): se muestra en el campo y se vuelve a la pantalla de escaneo
  const [scanError, setScanError] = useState<string>()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!palletCode) {
      setInfo(undefined)
      setError(undefined)
      return
    }
    let ignore = false
    setIsLoading(true)
    setError(undefined)
    palletService
      .getInfo(palletCode)
      .then((result) => {
        if (!ignore) setInfo(result)
      })
      .catch((err: unknown) => {
        if (ignore) return
        const message = getApiErrorMessage(err, 'No fue posible consultar el pallet')
        // Falla del servidor o de conexión: se ofrece reintentar. Pallet inexistente: se vuelve a escanear.
        if (isAxiosError(err) && (!err.response || err.response.status >= 500)) {
          setInfo(undefined)
          setError(message)
        } else {
          setScanError(message)
          setSearchParams({}, { replace: true })
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [palletCode, attempt, setSearchParams])

  const scan = (code: string) => {
    setScanError(undefined)
    setInfo(undefined)
    setSearchParams({ pallet: code })
  }

  const showScan = !palletCode

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Detalle de pallet"
        subtitle={showScan ? 'Escanea un pallet' : palletCode}
        onBack={showScan ? undefined : () => setSearchParams({})}
        backLabel="Escanear otro pallet"
      />

      {showScan ? (
        <ScanPalletStep
          onScanned={scan}
          serverError={scanError}
          onCodeChange={() => setScanError(undefined)}
          description="Apunta el lector al código de barras para ver su contenido y trazabilidad."
          submitLabel="Consultar"
        />
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-4">
            {isLoading || (!info && !error) ? (
              <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <Loader2 aria-hidden className="size-5 animate-spin" />
                Consultando pallet…
              </div>
            ) : error ? (
              <div className="space-y-3">
                <Alert type="error">{error}</Alert>
                <Button
                  variant="secondary"
                  fullWidth
                  icon={<RotateCw aria-hidden className="size-5" />}
                  onClick={() => setAttempt((n) => n + 1)}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              info && (
                <>
                  <PalletInfoHeader info={info} />
                  {info.items.length === 0 ? (
                    <div className="flex flex-col items-center px-4 py-8 text-center">
                      <span className="grid size-14 place-items-center rounded-xl bg-muted text-muted-foreground">
                        <PackageOpen aria-hidden className="size-7" />
                      </span>
                      <p className="mt-3 font-semibold">Sin ítems</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">El pallet no tiene ítems registrados.</p>
                    </div>
                  ) : (
                    <section aria-label="Ítems del pallet" className="space-y-2">
                      <h2 className="flex items-baseline justify-between text-sm font-bold">
                        Ítems
                        <span className="text-xs font-semibold text-muted-foreground">{info.items.length}</span>
                      </h2>
                      <ul className="space-y-2">
                        {info.items.map((item) => (
                          <li key={item.item}>
                            <PalletInfoItemCard item={item} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )
            )}
          </div>

          <div className="border-t border-border bg-card px-4 py-3">
            <Link
              to="/"
              className="inline-flex h-touch w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 font-heading font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover active:bg-primary-hover"
            >
              <Home aria-hidden className="size-5" />
              Ir al inicio
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
