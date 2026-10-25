import { ArrowRight } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

interface StepFooterProps {
  disabled: boolean
  label?: string
  isLoading?: boolean
  loadingLabel?: string
  /** Error al continuar (ej. consulta fallida); se muestra sobre el botón */
  error?: string
}

/** Barra inferior fija de cada paso con el botón Continuar (type="submit") */
export function StepFooter({ disabled, label = 'Continuar', isLoading = false, loadingLabel, error }: StepFooterProps) {
  return (
    <div className="space-y-2 border-t border-border bg-card px-4 py-3">
      {error && <Alert type="error">{error}</Alert>}
      <Button
        type="submit"
        fullWidth
        disabled={disabled}
        isLoading={isLoading}
        icon={isLoading ? undefined : <ArrowRight aria-hidden className="size-5" />}
        className="flex-row-reverse"
      >
        {isLoading ? (loadingLabel ?? label) : label}
      </Button>
    </div>
  )
}
