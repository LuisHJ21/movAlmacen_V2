import { CalendarDays, ChevronRight, Pencil } from 'lucide-react'
import type { PlanDiario } from '@/interfaces/planDiario.interface'

interface PlanDiarioFieldProps {
  plan: PlanDiario | null
  /** Sin plan al intentar guardar: se marca en rojo */
  pendiente?: boolean
  onPick: () => void
}

/** Plan diario del vale (uno por operación, se aplica a todos los ítems): tocar abre la lista para elegirlo */
export function PlanDiarioField({ plan, pendiente = false, onPick }: PlanDiarioFieldProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={plan ? `Plan diario del vale: ${plan.codigo}. Cambiar` : 'Elegir plan diario del vale'}
      className={`flex min-h-touch w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left shadow-sm transition-colors duration-150 ${
        plan
          ? 'border-primary-border bg-card hover:bg-primary-soft active:border-primary'
          : pendiente
            ? 'border-dashed border-destructive bg-destructive-soft'
            : 'border-dashed border-primary/60 bg-primary-soft hover:bg-primary/10'
      }`}
    >
      <span
        aria-hidden
        className={`grid size-11 shrink-0 place-items-center rounded-lg ${
          plan ? 'bg-primary text-on-primary' : pendiente ? 'bg-white text-destructive' : 'bg-white text-primary'
        }`}
      >
        <CalendarDays className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">Plan diario · para todos los ítems</span>
        {plan ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="truncate font-mono text-base font-bold">{plan.codigo}</span>
              {plan.especie && (
                <span className="shrink-0 rounded bg-primary-muted px-1.5 font-mono text-xs font-bold text-primary-hover">
                  {plan.especie}
                </span>
              )}
            </span>
            {plan.descripcion && <span className="block truncate text-sm text-muted-foreground">{plan.descripcion}</span>}
          </>
        ) : (
          <span className={`block font-heading text-base font-semibold ${pendiente ? 'text-destructive' : 'text-primary-hover'}`}>
            Elegir plan diario
          </span>
        )}
      </span>
      {plan ? (
        <Pencil aria-hidden className="size-5 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight aria-hidden className={`size-5 shrink-0 ${pendiente ? 'text-destructive' : 'text-primary'}`} />
      )}
    </button>
  )
}
