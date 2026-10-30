import type { MovementKind } from './movimiento.interface'
import type { ReferenceDocument } from './almacen.interface'
import type { Pallet } from './pallet.interface'

export interface ValeLine {
  item: string
  codPallet: string
  traza: string
  lote: string
  referencia: ReferenceDocument | null
  pesoUnidad: number
  bultos: number
  kgAdicional: number
  bultosDisponibles: number
  pesoDisponible: number
}

export interface ValePalletGroup {
  pallet: Pallet
  lineas: ValeLine[]
  disponibles: ValeLine[]
}

export interface ValeRequest {
  tMov: string
  tipoRef: string
  referencia: string
  fechaReg: string
  almacen: string
  observaciones: string
  recepcionado: string
  idForm: string
  usuario: string
  detalles: ValeDetalleRequest[]
}

export interface ValeDetalleRequest {
  referencia: { tipo: string; nro: string; almacen: string; nroMov: string }
  codArt: string
  peso: string
  matriz: string
  lote: string
  planDiario: string
}

export interface ApiValeResponse {
  success: boolean
  message?: string
  nroVale?: string
}

export type ValeLineErrors = Partial<Record<'bultos' | 'kgAdicional' | 'peso', string>>

export interface ApiValeHistoryResponse {
  success: boolean
  data: Array<{
    nroVale: string
    flagEstado: '0' | '1'
    fecha: string
    descTipoMov: string
    codUsr: string
    tipoRefer: string | null
    nroRefer: string | null
    fecIngreso: string
    almacen: string | null
  }>
}

export interface ValeHistoryItem {
  nroVale: string
  activo: boolean
  fecha: Date | null
  nombreMovimiento: string
  tipo: MovementKind | null
  tipoReferencia: string
  nroReferencia: string
  almacen: string
}

export interface ValeHistoryQuery {
  usuario: string
  desde: string
  hasta: string
}

export interface ApiValeDetailResponse {
  success: boolean
  data: Array<{
    codOrigen: string
    tipoDoc: string
    nroVale: string
    nroMov: string
    codArt: string
    descArt: string
    und: string
    cantProcesada: string
    cantProcUnd2: string
    precioUnit: string
    origenMovProy: string | null
    nroMovProy: string | null
    operSec: string | null
    cencos: string | null
    cntaPrsp: string | null
    flagUnd2: string | null
    matriz: string | null
    flagSaldoLibre: string | null
    centroBenef: string | null
    nroReservacion: string | null
    itemReservacion: string | null
    observaciones: string | null
  }>
}

export interface ValeDetailLine {
  nroMov: string
  codArticulo: string
  descArticulo: string
  unidad: string
  cantidad: number
  precioUnitario: number
  movProyectado: string
  centroCosto: string
  cuentaPresupuestal: string
  matriz: string
  observaciones: string
}
