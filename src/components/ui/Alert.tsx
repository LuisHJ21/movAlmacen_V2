import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type AlertType = 'error' | 'success' | 'info'

interface AlertProps {
  type?: AlertType
  children: ReactNode
  onClose?: () => void
}

const styles: Record<AlertType, { box: string; Icon: typeof Info }> = {
  error: { box: 'border-destructive bg-destructive-soft text-red-800', Icon: AlertCircle },
  success: { box: 'border-success bg-success-soft text-success', Icon: CheckCircle2 },
  info: { box: 'border-primary bg-muted text-foreground', Icon: Info },
}

export function Alert({ type = 'info', children, onClose }: AlertProps) {
  const { box, Icon } = styles[type]
  return (
    <div role="alert" className={`flex items-center gap-3 rounded-lg border-l-4 py-1 pl-3 text-sm font-medium ${box}`}>
      <Icon aria-hidden className="size-5 shrink-0" />
      {/* pre-line: respeta los saltos de línea de los mensajes de la API */}
      <div className="flex-1 py-2 whitespace-pre-line">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar mensaje"
          className="grid size-touch shrink-0 place-items-center rounded-lg opacity-70 transition-opacity duration-150 hover:opacity-100"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  )
}
