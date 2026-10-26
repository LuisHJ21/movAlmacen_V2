import { valeService } from '@/services/vale.service'
import { useAsync } from './useAsync'

/** Detalle del vale. Con enabled = false (ej. vale anulado) no consulta la API. */
export function useValeDetail(valeNumber: string, enabled = true) {
  const { data, ...rest } = useAsync(
    () => (enabled ? valeService.getDetail(valeNumber) : Promise.resolve([])),
    [valeNumber, enabled],
    'No fue posible cargar el detalle del vale',
  )
  return { lines: data ?? [], ...rest }
}
