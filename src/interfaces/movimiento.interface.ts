/** Parámetro tipoMov de la API: I = ingreso, S = salida, '' = ambos */
export type MovementTypeFilter = 'I' | 'S' | ''

/** Tipo de movimiento tal como lo devuelve la API */
export type MovementKind = 'ING' | 'SAL'

/** Respuesta cruda de GET /almacen/tipo-movimiento */
export interface ApiMovementTypesResponse {
  success: boolean
  data: Array<{
    COD_MOV: string
    TIPO_MOV: MovementKind
    NOM_MOV: string
    CLASE_MOV: string
    F_CONTABILIZA: '0' | '1'
    F_REF: '0' | '1'
  }>
}

export interface Movement {
  code: string
  kind: MovementKind
  name: string
  movementClass: string
  /** F_CONTABILIZA = '1' */
  posts: boolean
  /** F_REF = '1': requiere documento de referencia */
  requiresReference: boolean
}
