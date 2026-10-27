import type { ReactNode } from 'react'
import { Undo2, Warehouse as WarehouseIcon } from 'lucide-react'
import type { SelectorUbicacionState } from '@/hooks/useSelectorUbicacion'
import type { Warehouse } from '@/interfaces/almacen.interface'
import { toSentenceCase } from '@/utils/format'
import { CodigoUbicacion } from './CodigoUbicacion'
import { UbicacionGrid } from './UbicacionGrid'

interface SelectorUbicacionProps {
  selector: SelectorUbicacionState
  almacen: Warehouse
  /** Etiqueta junto al almacén (ej. "Mismo almacén") */
  etiqueta?: ReactNode
  onPasoAnterior: () => void
}

/** Paso de armado de la ubicación: almacén, código armado (tocable) y grilla de opciones del paso en curso */
export function SelectorUbicacion({ selector, almacen, etiqueta, onPasoAnterior }: SelectorUbicacionProps) {
  const { paso, codigo, parte, opciones, isLoading, error, reload, elegir, irAParte, automaticas, hayEditables } =
    selector
  if (!parte) return null

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-3 pb-4">
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <p className="flex items-center gap-2 text-sm">
          <WarehouseIcon aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="font-mono font-bold">{almacen.codigo}</span>
          <span className="truncate text-muted-foreground">{toSentenceCase(almacen.descripcion)}</span>
          {etiqueta && (
            <span className="ml-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {etiqueta}
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
            onClick={onPasoAnterior}
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
        onSelect={elegir}
        isLoading={isLoading}
        error={error}
        onRetry={() => void reload()}
      />
    </div>
  )
}
