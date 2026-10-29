import { axiosClient } from '@/api/axiosClient'
import type { ApiLeerCajaResponse, EtiquetaCaja } from '@/interfaces/caja.interface'
import { cleanText } from '@/utils/format'

export const cajaService = {
  async leer(qr: string): Promise<EtiquetaCaja> {
    const { data } = await axiosClient.post<ApiLeerCajaResponse>('/caja/leer', { qr })
    if (!data.success) throw new Error('No fue posible leer la etiqueta')
    const e = data.data
    return {
      codArt: cleanText(e.codArt),
      ot: cleanText(e.ot),
      fecha: cleanText(e.fecha),
      traza: cleanText(e.traza),
      lote: cleanText(e.lote),
    }
  },
}
