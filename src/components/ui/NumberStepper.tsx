import { Minus, Plus } from 'lucide-react'

interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  invalid?: boolean
  describedBy?: string
}

export function NumberStepper({ label, value, onChange, min = 0, max = Infinity, invalid, describedBy }: NumberStepperProps) {
  const set = (next: number) => onChange(Math.min(max, Math.max(min, next)))
  const buttonClass =
    'grid size-touch shrink-0 place-items-center text-foreground transition-colors duration-150 hover:bg-muted active:bg-muted disabled:text-stone-300 disabled:hover:bg-transparent'

  return (
    <div
      className={`flex h-touch items-stretch overflow-hidden rounded-lg border-2 bg-card ${
        invalid ? 'border-destructive' : 'border-border-strong focus-within:border-primary'
      }`}
    >
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label={`Restar ${label}`} className={buttonClass}>
        <Minus className="size-5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '')
          onChange(digits === '' ? 0 : Number(digits))
        }}
        onFocus={(e) => e.target.select()}
        className="w-full min-w-0 border-x border-border bg-transparent text-center font-mono text-lg font-semibold focus:outline-none"
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={`Sumar ${label}`} className={buttonClass}>
        <Plus className="size-5" />
      </button>
    </div>
  )
}
