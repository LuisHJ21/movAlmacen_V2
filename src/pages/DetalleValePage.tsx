import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Ban, FileSearch, Loader2, RotateCw } from 'lucide-react'
import { valeKindIcon } from '@/components/historial-vales/ValeHistoryCard'
import { ValeDetailLineCard } from '@/components/historial-vales/ValeDetailLineCard'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useValeDetail } from '@/hooks/useValeDetail'
import type { ValeHistoryItem } from '@/interfaces/vale.interface'
import { formatDateTime, formatQuantity, toSentenceCase } from '@/utils/format'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-semibold">{children}</dd>
    </div>
  )
}

/**
 * Detalle de un vale del historial. Los datos de cabecera llegan en el state desde la lista;
 * si el vale está anulado no se consulta la API. Abierto por URL directa (sin state) siempre consulta.
 */
export default function DetalleValePage() {
  const { valeNumber = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const vale = (location.state as { vale?: ValeHistoryItem } | null)?.vale
  const annulled = vale?.activo === false

  const { lines, isLoading, error, reload } = useValeDetail(valeNumber, !annulled)

  // Si se llegó desde la lista se vuelve a ella (conserva el rango); si no, a la lista por defecto
  const goBack = location.key !== 'default' ? () => navigate(-1) : undefined
  const units = [...new Set(lines.map((l) => l.unidad))]
  const total = lines.reduce((sum, l) => sum + l.cantidad, 0)
  const Icon = vale ? valeKindIcon(vale) : null
  const reference = vale ? [vale.tipoReferencia, vale.nroReferencia].filter(Boolean).join(' ') : ''

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader
        title="Detalle de vale"
        subtitle={valeNumber}
        onBack={goBack}
        backLabel="Volver al historial"
        backTo="/historial-vales"
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-6">
        {/* Cabecera */}
        <section
          aria-label="Datos del vale"
          className={`rounded-xl border bg-card px-4 py-3 ${annulled ? 'border-destructive/40' : 'border-border'}`}
        >
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">N° de vale</p>
            {vale && (
              <span
                className={`ml-auto rounded-md px-1.5 py-0.5 text-xs font-bold uppercase ${
                  annulled ? 'bg-destructive text-white' : 'bg-success-soft text-success'
                }`}
              >
                {annulled ? 'Anulado' : 'Activo'}
              </span>
            )}
          </div>
          <p
            className={`font-mono text-2xl font-bold tracking-wider select-all ${annulled ? 'text-muted-foreground line-through' : ''}`}
          >
            {valeNumber}
          </p>

          {vale && (
            <>
              <div className="mt-2 flex items-center gap-2 border-t border-border pt-2.5">
                {Icon && <Icon aria-hidden className="size-5 shrink-0 text-primary" />}
                <span className="min-w-0 truncate text-sm font-semibold">{toSentenceCase(vale.nombreMovimiento)}</span>
              </div>
              <dl className="mt-1 divide-y divide-border">
                {vale.fecha && <Row label="Registro">{formatDateTime(vale.fecha)}</Row>}
                {reference && (
                  <Row label="Referencia">
                    <span className="font-mono">{reference}</span>
                  </Row>
                )}
                {vale.almacen && <Row label="Almacén">{vale.almacen}</Row>}
              </dl>
            </>
          )}
        </section>

        {/* Detalle */}
        {annulled ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm">
            <Ban aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p>
              <span className="font-semibold">Este vale fue anulado.</span> No tiene detalle de artículos para mostrar.
            </p>
          </div>
        ) : isLoading ? (
          <div role="status" className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 aria-hidden className="size-5 animate-spin" />
            Cargando detalle…
          </div>
        ) : error ? (
          <div className="space-y-3">
            <Alert type="error">{error}</Alert>
            <Button variant="secondary" fullWidth icon={<RotateCw aria-hidden className="size-5" />} onClick={reload}>
              Reintentar
            </Button>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-xl bg-muted text-muted-foreground">
              <FileSearch aria-hidden className="size-7" />
            </span>
            <p className="mt-3 font-semibold">Sin detalle</p>
            <p className="mt-0.5 text-sm text-muted-foreground">No se encontraron artículos para este vale.</p>
            {!vale && (
              <Link to="/historial-vales" className="mt-4 text-sm font-semibold text-primary underline">
                Ir al historial
              </Link>
            )}
          </div>
        ) : (
          <section aria-label="Artículos del vale" className="space-y-2">
            <h2 className="flex items-baseline justify-between text-sm font-bold">
              Artículos
              <span className="text-xs font-semibold text-muted-foreground">{lines.length}</span>
            </h2>
            <ul className="space-y-2">
              {lines.map((line, index) => (
                <li key={`${line.nroMov}-${index}`}>
                  <ValeDetailLineCard line={line} />
                </li>
              ))}
            </ul>
            {/* El total solo tiene sentido si todas las líneas usan la misma unidad */}
            {lines.length > 1 && units.length === 1 && (
              <div className="flex items-baseline justify-between rounded-lg bg-muted px-3 py-2.5">
                <span className="text-sm font-semibold text-muted-foreground">Total</span>
                <span className="font-mono text-xl font-bold">
                  {formatQuantity(total)} <span className="text-sm">{units[0]}</span>
                </span>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
