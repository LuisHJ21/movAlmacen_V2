/** Respuesta cruda de GET /almacen */
export interface ApiWarehousesResponse {
  success: boolean
  data: Array<{
    ALMACEN: string
    DESC_ALMACEN: string
    /** Ubicaciones separadas por coma (ej. "C1,P1"); vacío si no tiene */
    COD_UBICACION: string
    SALDO: string
  }>
}

export interface Warehouse {
  code: string
  description: string
  locations: string[]
  balance: number
}

/** Respuesta cruda de GET /references */
export interface ApiReferencesResponse {
  success: boolean
  data: Array<{
    NRO_ORDEN: string
    DESCRIPCION: string
    TIPO_DOC: string
    RESTANTE: string
    ALMACEN: string
    NRO_MOV: string
    COD_ART: string
    OT_PLAN: string
  }>
}

export interface ReferenceDocument {
  orderNumber: string
  description: string
  docType: string
  /** null cuando la referencia viene de los datos del pallet (no trae restante) */
  remaining: number | null
  warehouse: string
  movementNumber: string
  articleCode: string
  plannedOrder: string
}

/** Respuesta cruda de GET /almacen/matriz */
export interface ApiMatricesResponse {
  success: boolean
  data: Array<{
    GRP_CNTBL: string
    COD_SUB_CAT: string
    MATRIZ: string
    DESCRIPCION: string
  }>
}

/** Matriz contable del movimiento para el artículo */
export interface Matrix {
  code: string
  description: string
  accountingGroup: string
  subCategory: string
}
