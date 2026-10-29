import { AlertCircle, Inbox, Layers, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { UbicacionOpcion } from '@/interfaces/ubicacion.interface'
import { segmentoNuevo, type ParteUbicacionInfo } from '@/utils/ubicacion'

interface UbicacionGridProps {
  info: ParteUbicacionInfo
  prefijo: string
  opciones: UbicacionOpcion[]
  seleccion?: string | null
  onSelect: (opcion: UbicacionOpcion) => void
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

const columnas = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' } as const

export function UbicacionGrid({ info, prefijo, opciones, seleccion, onSelect, isLoading, error, onRetry }: UbicacionGridProps) {
  if (isLoading) {
    return (
      <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 aria-hidden className="size-5 animate-spin" />
        Cargando {info.titulo.toLowerCase()}…
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
        <AlertCircle aria-hidden className="size-8 text-destructive" />
        <p>{error}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} icon={<RotateCcw aria-hidden className="size-5" />}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (opciones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <Inbox aria-hidden className="size-8" />
        <p>No hay ubicaciones registradas para {prefijo || 'este almacén'}.</p>
      </div>
    )
  }

  const esFinal = info.parte === 'profundidad'
  const libres = opciones.reduce((sum, o) => sum + o.disponibles, 0)
  const multiples = opciones.filter((o) => o.multiple).length

  return (
    <div>
      <p className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-semibold">{info.titulo}</span>
        <span className="text-muted-foreground">
          {libres} {esFinal ? (libres === 1 ? 'disponible' : 'disponibles') : libres === 1 ? 'posición libre' : 'posiciones libres'}
        </span>
      </p>
      {esFinal && multiples > 0 && (
        <p className="mb-2 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-800">
          <Layers aria-hidden className="size-4 shrink-0" />
          <span>
            <span className="font-bold">Multipallet:</span> admite varios pallets en la misma ubicación.
          </span>
        </p>
      )}
      <ul className={`grid gap-2 ${columnas[info.columnas]}`}>
        {opciones.map((opcion) => {
          const segmento = segmentoNuevo(opcion.codigo, prefijo)
          const lleno = opcion.disponibles === 0
          const elegido = seleccion === opcion.codigo
          const porcentaje = opcion.total ? (opcion.disponibles / opcion.total) * 100 : 0
          const estado = esFinal
            ? opcion.multiple
              ? 'Multipallet'
              : lleno
                ? 'Ocupada'
                : 'Libre'
            : lleno
              ? 'Llena'
              : `${opcion.disponibles}/${opcion.total}`
          return (
            <li key={opcion.codigo}>
              <button
                type="button"
                data-key={opcion.codigo}
                data-multiple={opcion.multiple || undefined}
                disabled={lleno}
                onClick={() => onSelect(opcion)}
                aria-current={elegido ? 'true' : undefined}
                aria-label={`${info.titulo} ${segmento}: ${
                  esFinal ? estado.toLowerCase() : `${opcion.disponibles} de ${opcion.total} posiciones libres`
                }`}
                className={`relative flex min-h-18 w-full flex-col items-center justify-center rounded-xl border-2 px-1 pt-1.5 pb-2 transition-colors duration-150 disabled:cursor-not-allowed ${
                  lleno
                    ? 'border-border bg-muted text-stone-400'
                    : opcion.multiple
                      ? elegido
                        ? 'border-indigo-700 bg-indigo-200 text-indigo-950'
                        : 'border-indigo-500 bg-indigo-100 text-indigo-950 hover:border-indigo-700 active:bg-indigo-200'
                      : elegido
                        ? 'border-primary bg-primary-soft'
                        : 'border-border bg-card hover:border-primary-border active:border-primary active:bg-primary-soft'
                }`}
              >
                {opcion.multiple && (
                  <Layers aria-hidden className="absolute top-1.5 right-1.5 size-4 text-indigo-700" />
                )}
                <span className={`font-mono text-2xl leading-tight font-bold ${lleno ? 'line-through' : ''}`}>
                  {segmento}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    lleno ? '' : opcion.multiple ? 'font-bold text-indigo-800' : 'text-muted-foreground'
                  }`}
                >
                  {estado}
                </span>
                {!esFinal && (
                  <span aria-hidden className="mt-1 h-1 w-4/5 overflow-hidden rounded-full bg-border">
                    <span
                      className={`block h-full rounded-full ${porcentaje > 25 ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
