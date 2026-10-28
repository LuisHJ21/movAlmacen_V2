/** Plan diario de producción que se asigna a un ítem del vale (movimientos con fSolcitaPlan = '1') */
export interface PlanDiario {
  /** Parte de producción (COD_PARTE_PRODUCC) */
  codigo: string
  descripcion: string
  /** Especie del plan (ej. "POT") */
  especie: string
}

/** Fila de GET /plandiario (claves ya en camelCase, ver utils/mapper). La API responde 404 (pland_empty) si no hay. */
export interface ApiPlanDiario {
  codigoPlan: string
  flagEstado: string
  especie: string | null
  descripcion: string | null
}

/** GET /plandiario devuelve la lista directa; se acepta también { success, data } */
export type ApiPlanesDiariosResponse = ApiPlanDiario[] | { success: boolean; data: ApiPlanDiario[] }
