import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { OptionList } from '@/components/ui/OptionList'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { PlanDiario } from '@/interfaces/planDiario.interface'
import type { ValeLine } from '@/interfaces/vale.interface'
import { planDiarioService } from '@/services/planDiario.service'
import { MovementChip } from './MovementChip'

interface PlanDiarioStepProps {
  palletCode: string
  articleCode: string
  movement: Movement
  line: ValeLine
  /** Otros ítems del vale que aún no tienen plan */
  sinPlan: number
  /** aplicarATodos: usar el mismo plan en los ítems que aún no tienen uno */
  onConfirm: (plan: PlanDiario, aplicarATodos: boolean) => void
}

/** Elegir el plan diario de un ítem del vale. Tocar un plan lo asigna y regresa al resumen. */
export function PlanDiarioStep({ palletCode, articleCode, movement, line, sinPlan, onConfirm }: PlanDiarioStepProps) {
  const [planes, setPlanes] = useState<PlanDiario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [aplicarATodos, setAplicarATodos] = useState(false)

  const cargar = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    try {
      setPlanes(await planDiarioService.getActivos())
    } catch (err) {
      setError(getApiErrorMessage(err, 'No fue posible consultar los planes diarios'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const handleSelect = (codigo: string) => {
    const plan = planes.find((p) => p.codigo === codigo)
    if (plan) onConfirm(plan, aplicarATodos)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        {/* Ítem al que se asigna el plan */}
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
          <span className="rounded-lg bg-primary px-2 py-1 font-heading text-sm font-bold text-on-primary">#{line.item}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm font-semibold">{palletCode}</p>
            <p className="truncate text-xs text-muted-foreground">
              Lote {line.lote || '—'} · {articleCode}
            </p>
          </div>
        </div>
        <MovementChip movement={movement} />

        {sinPlan > 0 && !error && !isLoading && planes.length > 0 && (
          <label className="flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border-2 border-border bg-card px-3 py-2">
            <input
              type="checkbox"
              checked={aplicarATodos}
              onChange={(e) => setAplicarATodos(e.target.checked)}
              className="size-5 shrink-0 accent-primary"
            />
            <span className="text-sm leading-snug">
              Usar el mismo plan en {sinPlan === 1 ? 'el otro ítem' : `los otros ${sinPlan} ítems`} sin plan
            </span>
          </label>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <OptionList
          legend="Plan diario"
          name="plan-diario"
          items={planes.map((p) => ({
            key: p.codigo,
            badge: p.codigo,
            title: p.descripcion || p.codigo,
            meta: p.especie ? `Especie ${p.especie}` : undefined,
            searchText: p.especie,
          }))}
          selectedKey={line.planDiario?.codigo ?? null}
          onSelect={handleSelect}
          isLoading={isLoading}
          error={error}
          onRetry={() => void cargar()}
          emptyMessage="No hay planes diarios activos."
          badgePlacement="top"
          searchPlaceholder="Buscar plan"
        />
      </div>
    </div>
  )
}
