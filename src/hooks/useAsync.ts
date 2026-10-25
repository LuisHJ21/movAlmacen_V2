import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { getApiErrorMessage } from '@/api/axiosClient'

/**
 * Ejecuta una consulta al montar (y cuando cambian deps).
 * Devuelve datos, estado de carga, mensaje de error y reload().
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, errorFallback: string) {
  const [data, setData] = useState<T>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()

  // fn se recrea en cada render; deps decide cuándo volver a consultar
  const run = useCallback(fn, deps)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    try {
      setData(await run())
    } catch (err) {
      setData(undefined)
      setError(getApiErrorMessage(err, errorFallback))
    } finally {
      setIsLoading(false)
    }
  }, [run, errorFallback])

  useEffect(() => {
    void load()
  }, [load])

  return { data, isLoading, error, reload: load }
}
