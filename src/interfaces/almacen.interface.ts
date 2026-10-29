export interface ApiWarehousesResponse {
  success: boolean
  data: Array<{
    almacen: string
    descAlmacen: string
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
  restante: number | null
  almacen: string
  nroMov: string
  codArticulo: string
  otPlan: string
}

export interface ApiMatricesResponse {
  success: boolean
  data: Array<{
    grpCntbl: string
    codSubCat: string
    matriz: string
    descripcion: string
  }>
}

export interface Matrix {
  codigo: string
  descripcion: string
  grupoContable: string
  subCategoria: string
}
