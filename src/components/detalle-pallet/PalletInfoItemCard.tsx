import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardCheck, Factory, FileInput, type LucideIcon } from 'lucide-react'
import type { PalletInfoItem } from '@/interfaces/pallet.interface'
import { formatCount, formatDate, formatWeight, toSentenceCase } from '@/utils/format'

/** Fila del bloque "Origen": icono, título y contenido */
function OriginRow({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        {children}
      </div>
    </div>
  )
}

/**
 * Ítem del pallet: artículo, peso y bultos destacados, trazabilidad y origen
 * (producción → vale de ingreso → registro en el pallet). El vale abre su detalle.
 */
export function PalletInfoItemCard({ item }: { item: PalletInfoItem }) {
  const reference = [item.tipoReferencia, item.referencia].filter(Boolean).join(' ')
  const movement = [item.codMovimiento, toSentenceCase(item.nombreMovimiento)].filter(Boolean).join(' · ')
  const weightChanged = item.pesoOriginal > 0 && item.pesoOriginal !== item.peso
  const registered = [item.fechaRegistro && formatDate(item.fechaRegistro), item.usuarioRegistro]
    .filter(Boolean)
    .join(' · ')

  const trace: Array<[string, string]> = [
    ['Lote', item.lote],
    ['Traza', item.traza],
    ['Producción', item.fechaProduccion ? formatDate(item.fechaProduccion) : ''],
  ].filter((field): field is [string, string] => !!field[1])

  return (
    <article
      aria-label={`Ítem ${item.item}: ${item.codArticulo}`}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Artículo */}
      <header className="flex items-start gap-3 px-3 pt-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-primary font-mono text-sm font-bold text-primary">
          {item.item}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold">{item.codArticulo}</p>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{toSentenceCase(item.descripcion)}</p>
        </div>
      </header>

      {/* Peso y bultos */}
      <dl className="mx-3 mt-2.5 flex items-stretch overflow-hidden rounded-lg border border-primary-border bg-primary-soft">
        <div className="min-w-0 flex-1 px-3 py-2">
          <dt className="text-xs font-semibold text-primary-hover">Peso</dt>
          <dd className="font-mono text-xl leading-tight font-bold">{formatWeight(item.peso)}</dd>
          {weightChanged && (
            <dd className="text-xs text-muted-foreground">de {formatWeight(item.pesoOriginal)} originales</dd>
          )}
        </div>
        <div className="w-px bg-primary-border" />
        <div className="w-24 shrink-0 px-3 py-2">
          <dt className="text-xs font-semibold text-primary-hover">Bultos</dt>
          <dd className="font-mono text-xl leading-tight font-bold">{formatCount(item.bultos)}</dd>
        </div>
      </dl>

      {/* Trazabilidad */}
      {trace.length > 0 && (
        <dl className="grid grid-cols-3 gap-2 px-3 pt-2.5">
          {trace.map(([label, value]) => (
            <div key={label} className="min-w-0 border-l-2 border-border-strong pl-2">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="truncate font-mono text-sm font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Origen */}
      {(item.codParte || item.nroVale || registered) && (
        <div className="mt-3 border-t border-border bg-muted/40">
          <h3 id={`origen-${item.item}`} className="px-3 pt-2 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
            Origen
          </h3>
          <ul aria-labelledby={`origen-${item.item}`} className="divide-y divide-border">
            {item.codParte && (
              <li className="flex px-3 py-2">
                <OriginRow icon={Factory} title="Plan diario">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{item.codParte}</span>
                    {item.especie && (
                      <span className="rounded bg-foreground px-1.5 font-mono text-xs leading-5 font-bold text-white">
                        <span className="sr-only">Especie </span>
                        {item.especie}
                      </span>
                    )}
                  </p>
                  {item.descParte && (
                    <p className="truncate text-sm text-muted-foreground">{toSentenceCase(item.descParte)}</p>
                  )}
                </OriginRow>
              </li>
            )}
            {item.nroVale && (
              <li>
                <Link
                  to={`/historial-vales/${encodeURIComponent(item.nroVale)}`}
                  aria-label={`Ver vale de ingreso ${item.nroVale}`}
                  className="flex items-center gap-2 px-3 py-2 transition-colors duration-150 hover:bg-muted active:bg-muted"
                >
                  <OriginRow icon={FileInput} title="Vale de ingreso">
                    <p className="font-mono text-sm font-bold text-primary">{item.nroVale}</p>
                    {movement && <p className="truncate text-sm text-muted-foreground">{movement}</p>}
                    {reference && <p className="font-mono text-sm text-muted-foreground">{reference}</p>}
                  </OriginRow>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            )}
            {registered && (
              <li className="flex px-3 py-2">
                <OriginRow icon={ClipboardCheck} title="Registro en pallet">
                  <p className="font-mono text-sm font-semibold">{registered}</p>
                </OriginRow>
              </li>
            )}
          </ul>
        </div>
      )}
    </article>
  )
}
