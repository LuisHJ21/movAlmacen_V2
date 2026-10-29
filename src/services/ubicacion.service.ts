import { axiosClient } from '@/api/axiosClient'
import { isAxiosError } from 'axios'
import type {
  ApiAsignarUbicacionResponse,
  AsignarUbicacionRequest,
  ApiUbicacionesResponse,
  ApiUbicacionFiltroResponse,
  UbicacionOpcion,
} from '@/interfaces/ubicacion.interface'
import { cleanText, toNumber } from '@/utils/format'

export const ubicacionService = {
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

  async asignar(payload: AsignarUbicacionRequest): Promise<void> {
    const { data } = await axiosClient.post<ApiAsignarUbicacionResponse>('/ubicacion', payload)
    if (!data?.success) throw new Error(data?.message ?? 'No fue posible asignar la ubicación')
  },
}
