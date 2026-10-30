import { SAVE_TIMEOUT_MS, axiosClient } from '@/api/axiosClient'
import { isAxiosError } from 'axios'
import type {
  ApiValeDetailResponse,
  ApiValeHistoryResponse,
  ApiValeResponse,
  ValeDetailLine,
  ValeHistoryItem,
  ValeHistoryQuery,
  ValeRequest,
} from '@/interfaces/vale.interface'
import { cleanText, parseApiDateTime, toNumber } from '@/utils/format'

export const valeService = {
  async create(payload: ValeRequest): Promise<ApiValeResponse> {
    const { data } = await axiosClient.post<ApiValeResponse>('/vale', payload, { timeout: SAVE_TIMEOUT_MS })
    if (data && data.success === false) throw new Error(data.message ?? 'No fue posible guardar el vale')
    return data
  },

  async getHistory({ usuario: username, desde: from, hasta: to }: ValeHistoryQuery): Promise<ValeHistoryItem[]> {
    try {
      const { data } = await axiosClient.get<ApiValeHistoryResponse>('/vale', {
        params: { usuario: username, fechIni: from, fechFin: to },
      })
      if (!data.success) throw new Error('No fue posible obtener el historial de vales')

      return data.data
        .map((v): ValeHistoryItem => {
          const movementName = cleanText(v.descTipoMov)
          return {
            nroVale: cleanText(v.nroVale),
            activo: cleanText(v.flagEstado) !== '0',
            fecha: parseApiDateTime(cleanText(v.fecha)),
            nombreMovimiento: movementName,
            tipo: movementName.startsWith('INGRESO') ? 'ING' : movementName.startsWith('SALIDA') ? 'SAL' : null,
            tipoReferencia: cleanText(v.tipoRefer),
            nroReferencia: cleanText(v.nroRefer),
            almacen: cleanText(v.almacen),
          }
        })
        .sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },

  async getDetail(valeNumber: string): Promise<ValeDetailLine[]> {
    try {
      const { data } = await axiosClient.get<ApiValeDetailResponse>('/vale/detalle', { params: { vale: valeNumber } })
      if (!data.success) throw new Error('No fue posible obtener el detalle del vale')

      return data.data.map((d): ValeDetailLine => ({
        nroMov: cleanText(d.nroMov),
        codArticulo: cleanText(d.codArt),
        descArticulo: cleanText(d.descArt),
        unidad: cleanText(d.und),
        cantidad: toNumber(d.cantProcesada),
        precioUnitario: toNumber(d.precioUnit),
        movProyectado: [cleanText(d.origenMovProy), cleanText(d.nroMovProy)].filter(Boolean).join('-'),
        centroCosto: cleanText(d.cencos),
        cuentaPresupuestal: cleanText(d.cntaPrsp),
        matriz: cleanText(d.matriz),
        observaciones: cleanText(d.observaciones),
      }))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },
}
