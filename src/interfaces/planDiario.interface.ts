/** Plan diario de producción que se asigna a un ítem del vale (movimientos con fSolcitaPlan = '1') */
export interface PlanDiario {
  codigo: string
  descripcion: string
  /** Especie del plan (ej. "POT") */
  especie?: string
  /** Fecha del plan, ya formateada para mostrar */
  fecha?: string
}

export interface PlanDiarioQuery {
  movementCode: string
  articleCode: string
}
