/** Respuesta de GET /almacen (claves ya en camelCase, ver utils/mapper) */
export interface ApiWarehousesResponse {
  success: boolean
  data: Array<{
    almacen: string
    descAlmacen: string
    /** Ubicaciones separadas por coma (ej. "C1,P1"); vacío si no tiene */
    codUbicacion: string
    saldo: string
  }>
}

export interface Warehouse {
  codigo: string
  descripcion: string
  ubicaciones: string[]
  saldo: number
}

/** Respuesta de GET /references (claves ya en camelCase, ver utils/mapper) */
export interface ApiReferencesResponse {
  success: boolean
  data: Array<{
    nroOrden: string
    descripcion: string
    tipoDoc: string
    restante: string
    almacen: string
    nroMov: string
    codArt: string
    otPlan: string
  }>
}

export interface ReferenceDocument {
  nroOrden: string
  descripcion: string
  tipoDoc: string
  /** null cuando la referencia viene de los datos del pallet (no trae restante) */
  restante: number | null
  almacen: string
  nroMov: string
  codArticulo: string
  otPlan: string
}

/** Respuesta de GET /almacen/matriz (claves ya en camelCase, ver utils/mapper) */
export interface ApiMatricesResponse {
  success: boolean
  data: Array<{
    grpCntbl: string
    codSubCat: string
    matriz: string
    descripcion: string
  }>
}

/** Matriz contable del movimiento para el artículo */
export interface Matrix {
  codigo: string
  descripcion: string
  grupoContable: string
  subCategoria: string
}
