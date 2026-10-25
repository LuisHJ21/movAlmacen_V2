import { useState, type FormEvent } from 'react'
import { Check, ListChecks, Package } from 'lucide-react'
import type { ValeLine } from '@/interfaces/vale.interface'
import { formatQuantity, formatWeight } from '@/utils/format'
import { lineWeight } from '@/utils/vale'
import { StepFooter } from './StepFooter'

interface ItemPickerStepProps {
  palletCode: string
  /** Ítems que se pueden elegir (sin los vacíos) */
  candidates: ValeLine[]
  /** Al inicio todos marcados; al agregar ítems, ninguno */
  initiallySelected?: boolean
  intro: string
  confirmLabel: (count: number) => string
  onConfirm: (selected: ValeLine[]) => void
}

/** Salidas: elegir qué ítems del pallet entran al vale */
export function ItemPickerStep({
  palletCode,
  candidates,
  initiallySelected = true,
  intro,
  confirmLabel,
  onConfirm,
}: ItemPickerStepProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initiallySelected ? candidates.map((c) => c.item) : []),
  )
  const allSelected = selected.size === candidates.length

  const toggle = (item: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      return next
    })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selected.size > 0) onConfirm(candidates.filter((c) => selected.has(c.item)))
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 px-4 pt-4">
        <div className="flex items-center gap-2 rounded-lg bg-primary-hover px-3 py-2 text-on-primary">
          <Package aria-hidden className="size-5 shrink-0" />
          <span className="font-mono font-bold tracking-wider">{palletCode}</span>
          <span className="ml-auto text-sm text-white/90">{candidates.length} disponibles</span>
        </div>
        <p className="text-sm text-muted-foreground">{intro}</p>
        <button
          type="button"
          onClick={() => setSelected(new Set(allSelected ? [] : candidates.map((c) => c.item)))}
          className="flex h-touch w-full items-center justify-center gap-2 rounded-lg border-2 border-border-strong bg-card font-heading font-semibold text-foreground transition-colors duration-150 hover:bg-muted active:bg-muted"
        >
          <ListChecks aria-hidden className="size-5" />
          {allSelected ? 'Quitar selección' : 'Seleccionar todos'}
        </button>
      </div>

      <fieldset className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-2">
        <legend className="sr-only">Ítems del pallet {palletCode}</legend>
        <ul className="space-y-2">
          {candidates.map((line) => {
            const isSelected = selected.has(line.item)
            return (
              <li key={line.item}>
                <label
                  className={`relative flex min-h-touch cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring ${
                    isSelected ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:bg-muted active:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(line.item)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`grid size-6 shrink-0 place-items-center rounded-md border-2 ${
                      isSelected ? 'border-primary bg-primary text-on-primary' : 'border-border-strong bg-card'
                    }`}
                  >
                    {isSelected && <Check className="size-4" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="font-heading font-bold">#{line.item}</span>
                      <span className="text-sm text-muted-foreground">Lote {line.lot || '—'}</span>
                      <span className="ml-auto font-heading font-bold whitespace-nowrap">
                        {formatWeight(lineWeight(line))}
                      </span>
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {line.packages} bultos · {formatQuantity(line.extraKg)} kg adic. · {line.trace || '—'}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <StepFooter disabled={selected.size === 0} label={confirmLabel(selected.size)} />
    </form>
  )
}
