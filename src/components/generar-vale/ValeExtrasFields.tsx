import { useId } from 'react'
import { UserCheck } from 'lucide-react'
import { Input } from '@/components/ui/Input'

interface ValeExtrasFieldsProps {
  recepcionado: string
  observaciones: string
  onRecepcionadoChange: (value: string) => void
  onObservacionesChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ValeExtrasFields({
  recepcionado,
  observaciones,
  onRecepcionadoChange,
  onObservacionesChange,
  disabled = false,
  className = '',
}: ValeExtrasFieldsProps) {
  const obsId = useId()

  return (
    <section aria-label="Datos adicionales del vale" className={`space-y-3 rounded-xl border border-border bg-card p-4 ${className}`}>
      <p className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
        Datos adicionales <span className="font-normal tracking-normal normal-case">(opcional)</span>
      </p>

      <Input
        label="Recepcionado por"
        icon={UserCheck}
        value={recepcionado}
        onChange={(e) => onRecepcionadoChange(e.target.value.toUpperCase())}
        maxLength={100}
        autoComplete="off"
        disabled={disabled}
        placeholder="Nombre de quien recibe"
      />

      <div className="space-y-1.5">
        <label htmlFor={obsId} className="block text-sm font-semibold text-foreground">
          Observaciones
        </label>
        <textarea
          id={obsId}
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value.toUpperCase())}
          maxLength={250}
          rows={3}
          disabled={disabled}
          placeholder="Notas del vale"
          className="w-full resize-none rounded-lg border-2 border-border-strong bg-card px-3.5 py-2.5 text-base text-foreground transition-colors duration-150 placeholder:text-stone-400 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted"
        />
        <p className="text-right text-xs text-muted-foreground">{observaciones.length}/250</p>
      </div>
    </section>
  )
}
