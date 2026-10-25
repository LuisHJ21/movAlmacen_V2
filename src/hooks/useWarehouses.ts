import { almacenService } from '@/services/almacen.service'
import { useAsync } from './useAsync'

export function useWarehouses() {
  const { data, ...rest } = useAsync(() => almacenService.getWarehouses(), [], 'No fue posible cargar los almacenes')
  return { warehouses: data ?? [], ...rest }
}
