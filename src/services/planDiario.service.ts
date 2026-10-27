import type { PlanDiario, PlanDiarioQuery } from '@/interfaces/planDiario.interface'

export const planDiarioService = {
  /** Planes diarios disponibles para el movimiento y el artículo */
  // TODO: conectar al endpoint de planes diarios cuando esté listo
  async getDisponibles(_query: PlanDiarioQuery): Promise<PlanDiario[]> {
    throw new Error('Aún no está disponible la consulta de planes diarios')
  },
}
