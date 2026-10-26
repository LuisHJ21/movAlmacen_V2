import { ubicacionService } from '@/services/ubicacion.service'
import { PARTES_UBICACION } from '@/utils/ubicacion'
import { useAsync } from './useAsync'

const LARGO_CODIGO = PARTES_UBICACION.reduce((sum, p) => sum + p.largo, 0)

/**
 * Opciones de ubicación del nivel indicado para el filtro (código armado hasta ahora).
 * El último nivel (profundidad) usa /ubicacion: solo ubicaciones libres o multipallet.
 */
export function useUbicaciones(filtro: string, nivel: number) {
  const esFinal = nivel === PARTES_UBICACION.length
  const { data, ...rest } = useAsync(
    () =>
      !filtro
        ? Promise.resolve([])
        : esFinal
          ? ubicacionService.finales(filtro, LARGO_CODIGO)
          : ubicacionService.filtrar(filtro, nivel),
    [filtro, nivel, esFinal],
    'No fue posible cargar las ubicaciones',
  )
  return { opciones: data ?? [], ...rest }
}
