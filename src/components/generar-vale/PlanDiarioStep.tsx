import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { OptionList } from '@/components/ui/OptionList'
import type { Movement } from '@/interfaces/movimiento.interface'
import type { PlanDiario } from '@/interfaces/planDiario.interface'
import { planDiarioService } from '@/services/planDiario.service'
import { MovementChip } from './MovementChip'

interface PlanDiarioStepProps {
  movement: Movement
  itemCount: number
  selected: PlanDiario | null
  onConfirm: (plan: PlanDiario) => void
}

export function PlanDiarioStep({ movement, itemCount, selected, onConfirm }: PlanDiarioStepProps) {
  const [planes, setPlanes] = useState<PlanDiario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

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
    if (plan) onConfirm(plan)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <MovementChip movement={movement} />
        <p className="text-sm text-muted-foreground">
          El plan se aplica a {itemCount === 1 ? 'el ítem' : `los ${itemCount} ítems`} del vale.
        </p>
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
          selectedKey={selected?.codigo ?? null}
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
