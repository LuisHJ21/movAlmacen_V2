import { axiosClient } from '@/api/axiosClient'
import { isAxiosError } from 'axios'
import type {
  ApiUbicacionesResponse,
  ApiUbicacionFiltroResponse,
  UbicacionOpcion,
} from '@/interfaces/ubicacion.interface'
import { cleanText, toNumber } from '@/utils/format'

export const ubicacionService = {
  /**
   * Opciones del siguiente nivel con su disponibilidad.
   * filtro: código armado hasta ahora (admite varios separados por coma, ej. "C1,P1").
   * La API responde 404 (ubicacion_not_found) si no hay: se devuelve [].
   */
  async filtrar(filtro: string, nivel: number): Promise<UbicacionOpcion[]> {
    try {
      const { data } = await axiosClient.get<ApiUbicacionFiltroResponse>('/ubicacion/filtro', {
        params: { filtro, nivel },
      })
      if (!data.success) throw new Error('No fue posible obtener las ubicaciones')
      return data.data.map(
        (u): UbicacionOpcion => ({
          codigo: cleanText(u.codRack),
          total: toNumber(u.totalUbic),
          disponibles: toNumber(u.dispUbic),
        }),
      )
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },

  /**
   * Ubicaciones finales (profundidad) que pueden recibir el pallet: libres o multipallet.
   * La API busca por "contiene" (LIKE '%filtro%'): se dejan solo las que empiezan con el código armado.
   */
  async finales(prefijo: string, largo: number): Promise<UbicacionOpcion[]> {
    try {
      const { data } = await axiosClient.get<ApiUbicacionesResponse>('/ubicacion', { params: { filtro: prefijo } })
      if (!data.success) throw new Error('No fue posible obtener las ubicaciones')
      return data.data
        .map(
          (u): UbicacionOpcion => ({
            codigo: cleanText(u.codRack),
            total: 1,
            disponibles: 1,
            multiple: cleanText(u.flagMulti) === '1',
          }),
        )
        .filter((u) => u.codigo.startsWith(prefijo) && u.codigo.length === largo)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },
}
