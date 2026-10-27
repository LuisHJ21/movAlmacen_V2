import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  isLoading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-hover',
  secondary: 'border-2 border-border-strong bg-card text-foreground hover:bg-muted active:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted active:bg-muted',
  danger: 'bg-destructive text-white hover:bg-destructive-hover active:bg-destructive-hover',
}

export function Button({
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  icon,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`inline-flex h-touch items-center justify-center gap-2 rounded-lg px-5 font-heading text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? <Loader2 aria-hidden className="size-5 animate-spin" /> : icon}
      {children}
    </button>
  )
}
