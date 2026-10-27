import { axiosClient } from '@/api/axiosClient'
import type { ApiTransferenciaResponse, TransferenciaRequest } from '@/interfaces/transferencia.interface'
import { cleanText } from '@/utils/format'

export interface TransferenciaGuardada {
  /** Vale de salida del almacén origen */
  valeSalida: string
  /** Vale de ingreso al almacén destino */
  valeIngreso: string
}

export const transferenciaService = {
  /** Registra la transferencia. Lanza error si la API responde con error o success = false. */
  async create(payload: TransferenciaRequest): Promise<TransferenciaGuardada> {
    const { data } = await axiosClient.post<ApiTransferenciaResponse>('/transferencia', payload)
    if (!data?.success) throw new Error(data?.message ?? 'No fue posible registrar la transferencia')
    const [valeSalida = '', valeIngreso = ''] = (data.vales ?? []).map(cleanText)
    return { valeSalida, valeIngreso }
  },
}
