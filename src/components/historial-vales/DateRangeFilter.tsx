import { useEffect, useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { parseIsoDate, toIsoDate } from '@/utils/format'

export interface DateRange {
  /** "YYYY-MM-DD" */
  from: string
  /** "YYYY-MM-DD" */
  to: string
}

/** Rango de los últimos `days` días contando hoy (1 = solo hoy) */
export function lastDaysRange(days: number, today = new Date()): DateRange {
  const from = new Date(today)
  from.setDate(today.getDate() - (days - 1))
  return { from: toIsoDate(from), to: toIsoDate(today) }
}

function yesterdayRange(today = new Date()): DateRange {
  const day = new Date(today)
  day.setDate(today.getDate() - 1)
  return { from: toIsoDate(day), to: toIsoDate(day) }
}

const presets: Array<{ label: string; range: () => DateRange }> = [
  { label: 'Hoy', range: () => lastDaysRange(1) },
  { label: 'Ayer', range: () => yesterdayRange() },
  { label: '7 días', range: () => lastDaysRange(7) },
  { label: '30 días', range: () => lastDaysRange(30) },
]

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  disabled?: boolean
}

/** Accesos rápidos + fechas Desde/Hasta. Los accesos consultan al tocarlos; las fechas, con el botón buscar. */
export function DateRangeFilter({ value, onChange, disabled = false }: DateRangeFilterProps) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string>()

  // Si el rango cambia desde fuera (ej. acceso rápido), las fechas lo reflejan
  useEffect(() => setDraft(value), [value])

  const today = toIsoDate(new Date())

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const from = parseIsoDate(draft.from)
    const to = parseIsoDate(draft.to)
    if (!from || !to) return setError('Ingresa ambas fechas')
    if (from > to) return setError('"Desde" no puede ser posterior a "Hasta"')
    setError(undefined)
    onChange(draft)
  }

  const selectPreset = (range: DateRange) => {
    setError(undefined)
    onChange(range)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3 border-b border-border bg-card px-4 pt-3 pb-4">
      <div role="group" aria-label="Rango rápido" className="grid grid-cols-4 gap-2">
        {presets.map(({ label, range }) => {
          const r = range()
          const active = r.from === value.from && r.to === value.to
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => selectPreset(r)}
              className={`h-10 rounded-lg border-2 font-heading text-sm font-semibold transition-colors duration-150 disabled:opacity-60 ${
                active
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-border-strong bg-card text-foreground hover:bg-muted active:bg-muted'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="Desde"
            type="date"
            value={draft.from}
            max={draft.to || today}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            className="px-2!"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Input
            label="Hasta"
            type="date"
            value={draft.to}
            min={draft.from}
            max={today}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            className="px-2!"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          aria-label="Consultar vales"
          className="grid size-touch shrink-0 place-items-center rounded-lg bg-primary text-on-primary transition-colors duration-150 hover:bg-primary-hover active:bg-primary-hover disabled:opacity-60"
        >
          <Search aria-hidden className="size-5" />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
