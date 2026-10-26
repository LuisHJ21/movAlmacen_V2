import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Ruta del botón regresar (por defecto, el inicio) */
  backTo?: string
  /** Si se indica, regresar ejecuta esta acción (ej. paso anterior) en lugar de navegar */
  onBack?: () => void
  /** Texto accesible del botón regresar cuando se usa onBack */
  backLabel?: string
  /** Acción a la derecha (ej. Cancelar) */
  action?: ReactNode
}

const backClass =
  'grid size-touch shrink-0 place-items-center rounded-lg text-foreground transition-colors duration-150 hover:bg-muted active:bg-muted'

/** Cabecera de pantalla de operación: regresar + título + paso actual + acción opcional */
export function PageHeader({ title, subtitle, backTo = '/', onBack, backLabel = 'Paso anterior', action }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-2 py-2">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label={backLabel} className={backClass}>
          <ArrowLeft aria-hidden className="size-6" />
        </button>
      ) : (
        <Link to={backTo} aria-label="Regresar" className={backClass}>
          <ArrowLeft aria-hidden className="size-6" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg leading-tight font-bold">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
