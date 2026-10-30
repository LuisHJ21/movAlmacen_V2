import { SAVE_TIMEOUT_MS, axiosClient } from '@/api/axiosClient'
import type { ApiTransferenciaResponse, TransferenciaRequest } from '@/interfaces/transferencia.interface'
import { cleanText } from '@/utils/format'

export interface TransferenciaGuardada {
  valeSalida: string
  valeIngreso: string
}

export const transferenciaService = {
  async create(payload: TransferenciaRequest): Promise<TransferenciaGuardada> {
    const { data } = await axiosClient.post<ApiTransferenciaResponse>('/transferencia', payload, {
      timeout: SAVE_TIMEOUT_MS,
    })
    if (!data?.success) throw new Error(data?.message ?? 'No fue posible registrar la transferencia')
    const [valeSalida = '', valeIngreso = ''] = (data.vales ?? []).map(cleanText)
    return { valeSalida, valeIngreso }
  },
}
