import { isAxiosError } from 'axios'
import { almacenService, type ReferenceQuery } from '@/services/almacen.service'
import { useAsync } from './useAsync'

export function useReferences({ articleCode, movementCode, docNumber = '' }: ReferenceQuery) {
  const { data, ...rest } = useAsync(
    async () => {
      try {
        const references = await almacenService.getReferences({ articleCode, movementCode, docNumber })
        return references.filter((r) => r.restante === null || r.restante > 0)
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 404) return []
        throw err
      }
    },
    [articleCode, movementCode, docNumber],
    'No fue posible cargar los documentos de referencia',
  )
  return { references: data ?? [], ...rest }
}
