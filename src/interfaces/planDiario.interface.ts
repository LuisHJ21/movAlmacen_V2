export interface PlanDiario {
  codigo: string
  descripcion: string
  especie: string
}

export interface ApiPlanDiario {
  codigoPlan: string
  flagEstado: string
  especie: string | null
  descripcion: string | null
}

export type ApiPlanesDiariosResponse = ApiPlanDiario[] | { success: boolean; data: ApiPlanDiario[] }
