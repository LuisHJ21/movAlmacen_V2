import { Boxes, Package, PackageOpen, Shuffle, type LucideIcon } from 'lucide-react'
import type { ResumenCaja } from '@/utils/cajasReales'
import { formatCount, formatQuantity, formatWeight } from '@/utils/format'

interface CajasRealesListProps {
  filas: ResumenCaja[]
  pesoUnd: number
  usadas?: number[]
}

const tipoInfo: Record<ResumenCaja['tipo'], { Icon: LucideIcon; clase: string }> = {
  completas: { Icon: Package, clase: 'bg-primary-muted text-primary' },
  mixta: { Icon: Shuffle, clase: 'bg-indigo-100 text-indigo-700' },
  incompleta: { Icon: PackageOpen, clase: 'bg-amber-100 text-amber-800' },
}

const titulo = (f: ResumenCaja) =>
  f.tipo === 'completas'
    ? `${formatCount(f.cajas)} ${f.cajas === 1 ? 'caja completa' : 'cajas completas'}`
    : f.tipo === 'mixta'
      ? `Caja mixta · ${f.aportes.length} ítems`
      : f.aportes.length > 1
        ? `Caja incompleta · ${f.aportes.length} ítems`
        : 'Caja incompleta'

export function CajasRealesList({ filas, pesoUnd, usadas = [] }: CajasRealesListProps) {
  const totalCajas = filas.reduce((s, f) => s + f.cajas, 0)
  const totalPeso = filas.reduce((s, f) => s + f.peso, 0)

  return (
    <section aria-labelledby="cajas-reales" className="space-y-2">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="cajas-reales" className="flex items-center gap-1.5 text-sm font-semibold">
          <Boxes aria-hidden className="size-4 text-primary" />
          Cajas reales del origen
        </h2>
        <span className="text-xs text-muted-foreground">Caja de {formatWeight(pesoUnd)}</span>
      </div>

      {filas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-3 py-6 text-center text-muted-foreground">
          El pallet origen no tiene cajas con peso.
        </p>
      ) : (
        <ul className="space-y-2">
          {filas.map((f, i) => {
            const { Icon, clase } = tipoInfo[f.tipo]
            const escaneadas = usadas[i] ?? 0
            const completa = escaneadas >= f.cajas && f.cajas > 0
            return (
              <li
                key={i}
                className={`flex gap-2.5 rounded-xl border px-3 py-2.5 shadow-sm ${
                  completa ? 'border-success/40 bg-success-soft' : 'border-border bg-card'
                }`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${clase}`}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-heading text-sm font-semibold">{titulo(f)}</p>
                    <p className="shrink-0 font-mono text-sm font-bold">{formatWeight(f.peso)}</p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    Lote <span className="font-mono text-foreground">{f.lotes.join(' · ') || '—'}</span>
                    {f.trazas.length > 0 && (
                      <>
                        {' '}
                        · Traza <span className="font-mono text-foreground">{f.trazas.join(' · ')}</span>
                      </>
                    )}
                  </p>
                  {escaneadas > 0 && (
                    <p className="mt-1 text-xs font-semibold text-success">
                      {formatCount(escaneadas)} de {formatCount(f.cajas)} escaneada{f.cajas === 1 ? '' : 's'}
                    </p>
                  )}
                  {f.aportes.length > 1 && (
                    <p className="mt-1 flex flex-wrap gap-1">
                      {f.aportes.map((kg, j) => (
                        <span key={j} className="rounded bg-indigo-50 px-1.5 font-mono text-xs text-indigo-800">
                          {formatQuantity(kg)}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
        <span className="text-sm font-semibold text-muted-foreground">{formatCount(totalCajas)} cajas</span>
        <span className="font-mono text-lg font-bold">{formatWeight(totalPeso)}</span>
      </div>
    </section>
  )
}
