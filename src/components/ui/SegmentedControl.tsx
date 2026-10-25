import type { LucideIcon } from 'lucide-react'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  Icon?: LucideIcon
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  label: string
  options: SegmentOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** Texto de ayuda bajo las opciones (ej. por qué una está deshabilitada) */
  hint?: string
}

/** Selector de una opción entre pocas (botones grandes tipo radio) */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: SegmentedControlProps<T>) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold text-foreground">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value: optionValue, label: optionLabel, Icon, disabled }) => {
          const selected = value === optionValue
          return (
            <label
              key={optionValue}
              className={`relative flex h-touch items-center justify-center gap-2 rounded-lg border-2 font-heading font-semibold transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring ${
                selected
                  ? 'border-primary bg-primary text-on-primary'
                  : disabled
                    ? 'cursor-not-allowed border-border bg-muted text-stone-400'
                    : 'cursor-pointer border-border-strong bg-card text-foreground hover:bg-muted active:bg-muted'
              }`}
            >
              <input
                type="radio"
                name={label}
                value={optionValue}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(optionValue)}
                className="sr-only"
              />
              {Icon && <Icon aria-hidden className="size-5" />}
              {optionLabel}
            </label>
          )
        })}
      </div>
      {hint && <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>}
    </fieldset>
  )
}
