import type { ReactNode } from 'react'
import { CalendarDays, Layers, NotebookPen, Package, Scale, UserRound, type LucideIcon } from 'lucide-react'
import type { PalletInfo } from '@/interfaces/pallet.interface'
import { formatCount, formatDate, formatWeight } from '@/utils/format'

function Metric({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-2 py-2.5 text-center">
      <dt className="flex items-center justify-center gap-1 text-xs font-semibold text-muted-foreground">
        <Icon aria-hidden className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-mono text-base font-bold">{children}</dd>
    </div>
  )
}

function Meta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}

/** Cabecera del pallet: franja con código y estado, métricas y datos de registro */
export function PalletInfoHeader({ info }: { info: PalletInfo }) {
  return (
    <section aria-label="Datos del pallet" className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Código y estado */}
      <div className="bg-primary px-4 pt-3 pb-3.5 text-on-primary">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/80 uppercase">Pallet</p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
              info.activo ? 'bg-white text-success' : 'bg-white/20 text-white'
            }`}
          >
            <span aria-hidden className={`size-1.5 rounded-full ${info.activo ? 'bg-success' : 'bg-white/70'}`} />
            {info.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[1.75rem] leading-tight font-bold tracking-wider select-all">{info.codigo}</p>
      </div>

      {/* Métricas */}
      <dl className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <Metric icon={Scale} label="Peso">
          {formatWeight(info.peso)}
        </Metric>
        <Metric icon={Package} label="Bultos">
          {formatCount(info.bultos)}
        </Metric>
        <Metric icon={Layers} label="Ítems">
          {info.items.length}
        </Metric>
      </dl>

      {/* Registro y observación */}
      {(info.fechaRegistro || info.usuarioRegistro || info.observacion) && (
        <dl className="space-y-1.5 px-4 py-2.5">
          {(info.fechaRegistro || info.usuarioRegistro) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {info.fechaRegistro && (
                <Meta icon={CalendarDays} label="Fecha de registro">
                  {formatDate(info.fechaRegistro)}
                </Meta>
              )}
              {info.usuarioRegistro && (
                <Meta icon={UserRound} label="Registrado por">
                  {info.usuarioRegistro}
                </Meta>
              )}
            </div>
          )}
          {info.observacion && (
            <div className="flex min-w-0 items-start gap-2 border-t border-border pt-2">
              <NotebookPen aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted-foreground">Observaciones</dt>
                <dd className="text-sm font-semibold">{info.observacion}</dd>
              </div>
            </div>
          )}
        </dl>
      )}
    </section>
  )
}
