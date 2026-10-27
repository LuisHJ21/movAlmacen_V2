/** Parámetro tipoMov de la API: I = ingreso, S = salida, '' = ambos */
export type MovementTypeFilter = 'I' | 'S' | ''

/** Tipo de movimiento tal como lo devuelve la API */
export type MovementKind = 'ING' | 'SAL'

/** Respuesta de GET /almacen/tipo-movimiento (claves ya en camelCase, ver utils/mapper) */
export interface ApiMovementTypesResponse {
  success: boolean
  data: Array<{
    codMov: string
    tipoMov: MovementKind
    nomMov: string
    claseMov: string
    fContabiliza: '0' | '1'
    fRef: '0' | '1'
    /** '1': cada ítem del vale lleva plan diario (null si el movimiento no está en TIPO_MOV_PLAN_DIARIO) */
    fSolcitaPlan: '0' | '1' | null
  }>
}

export interface Movement {
  codigo: string
  tipo: MovementKind
  nombre: string
  clase: string
  /** fContabiliza = '1' */
  contabiliza: boolean
  /** fRef = '1': requiere documento de referencia */
  requiereReferencia: boolean
  /** fSolcitaPlan = '1': se elige un plan diario por cada ítem del vale */
  solicitaPlan: boolean
}
