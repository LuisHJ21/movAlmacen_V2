import type { ReactNode } from 'react'
import { ArrowRight, Layers, MapPin, MapPinned, MapPinOff, Package, Pencil } from 'lucide-react'
import { CodigoUbicacion } from '@/components/asignar-ubicacion/CodigoUbicacion'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatCount, formatWeight } from '@/utils/format'
import { separarCodigoUbicacion } from '@/utils/ubicacion'

interface NuevaUbicacion {
  codigo: string
  almacen: string
  /** Ubicación multipallet */
  multiple?: boolean
  /** Vuelve a los pasos de ubicación para cambiarla */
  onCambiar?: () => void
}

interface PalletTransferCardProps {
  pallet: Pallet
  /** La ubicación se conserva tras la transferencia (tipo = 1) */
  mantieneUbicacion?: boolean
  /** Ubicación elegida en el destino: se muestra al lado de la actual */
  nuevaUbicacion?: NuevaUbicacion
}

/** "C3D15204" → C3·D·15·2·04 (partes separadas, compacto para media columna) */
function CodigoCompacto({ codigo, className = '' }: { codigo: string; className?: string }) {
  return (
    <span className={`font-mono text-base font-bold whitespace-nowrap ${className}`}>
      {separarCodigoUbicacion(codigo).map((parte, i) => (
        <span key={i}>
          {i > 0 && <span className="px-px text-xs opacity-40">·</span>}
          {parte}
        </span>
      ))}
    </span>
  )
}

function Columna({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-0.5 flex items-center gap-1 text-xs font-semibold">
        {icono}
        {titulo}
      </p>
      {children}
    </div>
  )
}

/**
 * Pallet a transferir con su ubicación actual. Con nuevaUbicacion, la actual y la nueva se muestran
 * lado a lado (actual → nueva); sin ella, la actual va completa por partes.
 */
export function PalletTransferCard({ pallet, mantieneUbicacion = false, nuevaUbicacion }: PalletTransferCardProps) {
  return (
    <section aria-label={`Pallet ${pallet.codigo}`} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Package aria-hidden className="size-5 shrink-0 text-primary" />
        <span className="font-mono text-lg font-bold tracking-wider">{pallet.codigo}</span>
        <span className="ml-auto text-sm whitespace-nowrap text-muted-foreground">
          {formatCount(pallet.bultos)} bultos · {formatWeight(pallet.peso)}
        </span>
      </div>

      {nuevaUbicacion ? (
        <div className="flex items-stretch gap-2 border-t border-border p-2">
          {/* Actual */}
          <div className="flex min-w-0 flex-1 rounded-lg bg-muted/60 px-2.5 py-2 text-muted-foreground">
            <Columna titulo="Actual" icono={<MapPin aria-hidden className="size-3.5" />}>
              {pallet.ubicacion ? (
                <CodigoCompacto codigo={pallet.ubicacion} className="text-foreground" />
              ) : (
                <p className="text-sm font-semibold">Sin ubicación</p>
              )}
              <p className="font-mono text-xs">{pallet.almacen ?? '—'}</p>
            </Columna>
          </div>

          <ArrowRight aria-hidden className="size-4 shrink-0 self-center text-primary" />

          {/* Nueva */}
          <div className="flex min-w-0 flex-1 rounded-lg border border-primary-border bg-primary-soft px-2.5 py-2 text-primary-hover">
            <Columna titulo="Nueva" icono={<MapPinned aria-hidden className="size-3.5" />}>
              <CodigoCompacto codigo={nuevaUbicacion.codigo} className="text-foreground" />
              <p className="flex items-center gap-1 font-mono text-xs">
                {nuevaUbicacion.almacen}
                {nuevaUbicacion.multiple && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-indigo-100 px-1 font-sans font-bold text-indigo-800">
                    <Layers aria-hidden className="size-3" />
                    Multi
                  </span>
                )}
              </p>
            </Columna>
            {nuevaUbicacion.onCambiar && (
              <button
                type="button"
                onClick={nuevaUbicacion.onCambiar}
                aria-label="Cambiar la nueva ubicación"
                className="-my-2 -mr-2 grid h-touch w-[44px] shrink-0 place-items-center self-center rounded-lg text-primary transition-colors duration-150 hover:bg-primary/10 active:bg-primary/10"
              >
                <Pencil aria-hidden className="size-4" />
              </button>
            )}
          </div>
        </div>
      ) : pallet.ubicacion ? (
        <div className="border-t border-border bg-muted/50 px-3 pt-2 pb-2.5">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <MapPin aria-hidden className="size-4 text-primary" />
            Ubicación actual
            {pallet.almacen && <span className="font-mono">· {pallet.almacen}</span>}
          </p>
          <CodigoUbicacion codigo={pallet.ubicacion} variant="soft" />
        </div>
      ) : (
        <p className="flex items-center gap-2 border-t border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          <MapPinOff aria-hidden className="size-4 shrink-0" />
          Sin ubicación asignada
          {pallet.almacen && <span className="font-mono">· {pallet.almacen}</span>}
        </p>
      )}
    </section>
  )
}
