import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { AlertCircle, Eye, EyeOff, type LucideIcon } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: LucideIcon
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, type = 'text', id, className = '', ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              aria-hidden
              className={`pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 ${
                error ? 'text-destructive' : 'text-muted-foreground'
              }`}
            />
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={`h-touch w-full rounded-lg border-2 bg-card text-base text-foreground transition-colors duration-150 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-muted ${
              Icon ? 'pl-11' : 'pl-3.5'
            } ${isPassword ? 'pr-14' : 'pr-3.5'} ${
              error ? 'border-destructive focus:border-destructive' : 'border-border-strong focus:border-primary'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              className="absolute top-0 right-0 grid h-touch w-touch place-items-center rounded-r-lg text-muted-foreground transition-colors duration-150 hover:text-foreground active:bg-muted"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
