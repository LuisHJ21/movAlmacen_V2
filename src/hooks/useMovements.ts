import { almacenService } from '@/services/almacen.service'
import { useAsync } from './useAsync'

/** Carga una vez todos los movimientos (ingresos y salidas) */
export function useMovements() {
  const { data, ...rest } = useAsync(
    () => almacenService.getMovementTypes(''),
    [],
    'No fue posible cargar los movimientos',
  )
  return { movements: data ?? [], ...rest }
}
