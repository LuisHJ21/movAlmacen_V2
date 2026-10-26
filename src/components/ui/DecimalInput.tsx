import { useEffect, useState } from 'react'

interface DecimalInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  invalid?: boolean
  describedBy?: string
  /** Máximo de decimales que se pueden escribir */
  maxDecimals?: number
}

const toText = (n: number) => (Number.isFinite(n) ? String(n) : '')

/**
 * Número decimal con punto (ej. "2.5"), con un máximo de decimales. Si se escribe coma
 * se toma como punto decimal (en estos campos no se escriben separadores de miles).
 * Guarda el texto mientras se escribe para no perder el punto final.
 */
export function DecimalInput({
  label,
  value,
  onChange,
  suffix,
  invalid,
  describedBy,
  maxDecimals = 4,
}: DecimalInputProps) {
  const [text, setText] = useState(toText(value))

  // Sincroniza si el valor cambia desde fuera
  useEffect(() => {
    setText((current) => (Number(current) === value ? current : toText(value)))
  }, [value])

  return (
    <div
      className={`flex h-touch items-center overflow-hidden rounded-lg border-2 bg-card ${
        invalid ? 'border-destructive' : 'border-border-strong focus-within:border-primary'
      }`}
    >
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={text}
        onChange={(e) => {
          const cleaned = e.target.value
            .replace(/,/g, '.')
            .replace(/[^\d.]/g, '')
            .replace(/(\..*)\./, '$1')
            // No permite escribir más decimales que maxDecimals
            .replace(new RegExp(`([.][0-9]{${maxDecimals}})[0-9]+`), '$1')
          setText(cleaned)
          const parsed = Number(cleaned)
          onChange(cleaned === '' ? 0 : Number.isFinite(parsed) ? parsed : NaN)
        }}
        onFocus={(e) => e.target.select()}
        className="w-full min-w-0 bg-transparent px-3 text-right font-mono text-lg font-semibold focus:outline-none"
      />
      {suffix && <span className="pr-3 text-sm text-muted-foreground">{suffix}</span>}
    </div>
  )
}
