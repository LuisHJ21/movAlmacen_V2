import { axiosClient } from '@/api/axiosClient'
import { isAxiosError } from 'axios'
import type { ApiPlanesDiariosResponse, PlanDiario } from '@/interfaces/planDiario.interface'
import { cleanText } from '@/utils/format'

export const planDiarioService = {
  async getActivos(): Promise<PlanDiario[]> {
    try {
      const { data } = await axiosClient.get<ApiPlanesDiariosResponse>('/plandiario')
      const rows = Array.isArray(data) ? data : data.data
      return rows
        .map(
          (p): PlanDiario => ({
            codigo: cleanText(p.codigoPlan),
            descripcion: cleanText(p.descripcion).replace(/\s+/g, ' '),
            especie: cleanText(p.especie),
          }),
        )
        .sort((a, b) => b.codigo.localeCompare(a.codigo))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },
}
