import type { ValeHistoryQuery } from '@/interfaces/vale.interface'
import { valeService } from '@/services/vale.service'
import { useAsync } from './useAsync'

/** Historial de vales; vuelve a consultar cuando cambia el usuario o el rango */
export function useValeHistory({ usuario: username, desde: from, hasta: to }: ValeHistoryQuery) {
  const { data, ...rest } = useAsync(
    () => valeService.getHistory({ usuario: username, desde: from, hasta: to }),
    [username, from, to],
    'No fue posible cargar el historial de vales',
  )
  return { vales: data ?? [], ...rest }
}
