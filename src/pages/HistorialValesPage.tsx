import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardList, Loader2, RotateCw } from 'lucide-react'
import { DateRangeFilter, lastDaysRange, type DateRange } from '@/components/historial-vales/DateRangeFilter'
import { ValeHistoryCard } from '@/components/historial-vales/ValeHistoryCard'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useValeHistory } from '@/hooks/useValeHistory'
import type { ValeHistoryItem } from '@/interfaces/vale.interface'
import { formatDate, formatDayLabel, parseIsoDate, toIsoDate } from '@/utils/format'

function groupByDay(vales: ValeHistoryItem[]) {
  const groups = new Map<string, { date: Date | null; vales: ValeHistoryItem[] }>()
  for (const vale of vales) {
    const key = vale.fecha ? toIsoDate(vale.fecha) : 'sin-fecha'
    const group = groups.get(key) ?? { date: vale.fecha, vales: [] }
    group.vales.push(vale)
    groups.set(key, group)
  }
  return [...groups.entries()]
}

function rangeLabel({ from, to }: DateRange): string {
  const start = parseIsoDate(from)
  const end = parseIsoDate(to)
  if (!start || !end) return ''
  return from === to ? formatDate(start) : `${formatDate(start)} al ${formatDate(end)}`
}

export default function HistorialValesPage() {
  const { usuario: user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const range = useMemo<DateRange>(() => {
    const from = searchParams.get('desde') ?? ''
    const to = searchParams.get('hasta') ?? ''
    return parseIsoDate(from) && parseIsoDate(to) ? { from, to } : lastDaysRange(1)
  }, [searchParams])
  const setRange = ({ from, to }: DateRange) => setSearchParams({ desde: from, hasta: to }, { replace: true })
  const { vales, isLoading, error, reload } = useValeHistory({
    usuario: user?.usuario ?? '',
    desde: range.from,
    hasta: range.to,
  })

  const days = useMemo(() => groupByDay(vales), [vales])
  const annulled = vales.filter((v) => !v.activo).length

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col">
      <PageHeader title="Historial de vales" subtitle="Tus vales por fecha de registro" />
      <DateRangeFilter value={range} onChange={setRange} disabled={isLoading} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" aria-busy={isLoading}>
        {isLoading ? (
          <div role="status" className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 aria-hidden className="size-5 animate-spin" />
            Cargando vales…
          </div>
        ) : error ? (
          <div className="space-y-3 pt-4">
            <Alert type="error">{error}</Alert>
            <Button variant="secondary" fullWidth icon={<RotateCw aria-hidden className="size-5" />} onClick={reload}>
              Reintentar
            </Button>
          </div>
        ) : vales.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-xl bg-muted text-muted-foreground">
              <ClipboardList aria-hidden className="size-7" />
            </span>
            <p className="mt-3 font-semibold">Sin vales registrados</p>
            <p className="mt-0.5 text-sm text-muted-foreground">No tienes vales del {rangeLabel(range)}.</p>
          </div>
        ) : (
          <>
            <p aria-live="polite" className="pt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {vales.length} {vales.length === 1 ? 'vale' : 'vales'}
              </span>
              {annulled > 0 && ` · ${annulled} ${annulled === 1 ? 'anulado' : 'anulados'}`} · {rangeLabel(range)}
            </p>
            {days.map(([key, day]) => (
              <section key={key} aria-label={day.date ? formatDayLabel(day.date) : 'Sin fecha'}>
                <h2 className="sticky top-0 z-10 -mx-4 flex items-baseline justify-between bg-background/95 px-4 pt-3 pb-1.5 text-sm font-bold backdrop-blur">
                  {day.date ? formatDayLabel(day.date) : 'Sin fecha'}
                  <span className="text-xs font-semibold text-muted-foreground">{day.vales.length}</span>
                </h2>
                <ul className="space-y-2">
                  {day.vales.map((vale) => (
                    <li key={vale.nroVale}>
                      <ValeHistoryCard vale={vale} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
