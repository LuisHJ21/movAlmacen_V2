import { forwardRef, useId, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react'
import { AlertCircle, Keyboard, ScanBarcode, X } from 'lucide-react'

interface ScanInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Se dispara con Enter (lo envía el lector al terminar de leer) */
  onSubmit: () => void
  placeholder?: string
  /** Ayuda bajo el campo (se oculta cuando hay error) */
  hint?: string
  error?: string
  disabled?: boolean
}

/**
 * Campo para lectores de código de barras de PDA (modo teclado).
 * Por defecto no abre el teclado en pantalla (inputMode="none");
 * "Escribir" lo habilita para captura manual.
 */
export const ScanInput = forwardRef<HTMLInputElement, ScanInputProps>(
  ({ label, value, onChange, onSubmit, placeholder = 'Esperando lectura…', hint, error, disabled }, ref) => {
    const inputId = useId()
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    const inputRef = useRef<HTMLInputElement>(null)
    const [manual, setManual] = useState(false)

    useImperativeHandle(ref, () => inputRef.current!)

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      }
    }

    const toggleManual = () => {
      setManual((v) => !v)
      // Re-enfoca para que el cambio de inputMode abra/cierre el teclado
      requestAnimationFrame(() => {
        inputRef.current?.blur()
        inputRef.current?.focus()
      })
    }

    const clear = () => {
      onChange('')
      inputRef.current?.focus()
    }

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
          {label}
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <ScanBarcode
              aria-hidden
              className={`pointer-events-none absolute top-1/2 left-3.5 size-6 -translate-y-1/2 ${
                error ? 'text-destructive' : 'text-primary'
              }`}
            />
            <input
              ref={inputRef}
              id={inputId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              inputMode={manual ? 'text' : 'none'}
              enterKeyHint="go"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              disabled={disabled}
              placeholder={placeholder}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : hint ? hintId : undefined}
              className={`h-touch w-full rounded-lg border-2 bg-card pr-12 pl-12 font-mono text-lg font-semibold tracking-wider text-foreground uppercase transition-colors duration-150 placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400 placeholder:normal-case focus:outline-none disabled:bg-muted ${
                error ? 'border-destructive' : 'border-border-strong focus:border-primary'
              }`}
            />
            {value && !disabled && (
              <button
                type="button"
                onClick={clear}
                aria-label="Borrar código"
                className="absolute top-1/2 right-1 grid size-touch -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors duration-150 hover:text-foreground active:bg-muted"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={toggleManual}
            disabled={disabled}
            aria-pressed={manual}
            aria-label={manual ? 'Ocultar teclado' : 'Escribir código manualmente'}
            className={`grid size-touch shrink-0 place-items-center rounded-lg border-2 transition-colors duration-150 disabled:opacity-60 ${
              manual
                ? 'border-primary bg-primary-soft text-primary'
                : 'border-border-strong bg-card text-muted-foreground hover:bg-muted active:bg-muted'
            }`}
          >
            <Keyboard aria-hidden className="size-6" />
          </button>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="text-sm text-muted-foreground">
              {hint}
            </p>
          )
        )}
      </div>
    )
  },
)

ScanInput.displayName = 'ScanInput'
