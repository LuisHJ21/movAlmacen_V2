import { valeService } from '@/services/vale.service'
import { useAsync } from './useAsync'

export function useValeDetail(valeNumber: string, enabled = true) {
  const { data, ...rest } = useAsync(
    () => (enabled ? valeService.getDetail(valeNumber) : Promise.resolve([])),
    [valeNumber, enabled],
    'No fue posible cargar el detalle del vale',
  )
  return { lines: data ?? [], ...rest }
}
