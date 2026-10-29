import type { MovementKind } from './movimiento.interface'
import type { ReferenceDocument } from './almacen.interface'
import type { Pallet } from './pallet.interface'

/** Línea del detalle del vale (un ítem del pallet) */
export interface ValeLine {
  item: string
  codPallet: string
  traza: string
  lote: string
  referencia: ReferenceDocument | null
  /** Peso de 1 unidad (bulto) en kg */
  pesoUnidad: number
  bultos: number
  /** Kg que sobran después de los bultos completos */
  kgAdicional: number
  /** Disponibles en el pallet: tope para las salidas */
  bultosDisponibles: number
  pesoDisponible: number
}

/** Pallet incluido en el vale con su detalle */
export interface ValePalletGroup {
  pallet: Pallet
  /** Ítems incluidos en el vale */
  lineas: ValeLine[]
  /** Todos los ítems no vacíos del pallet (para volver a agregar los excluidos) */
  disponibles: ValeLine[]
}

/** Cuerpo de POST /vale */
export interface ValeRequest {
  /** Código del movimiento (ej. "S07") */
  tMov: string
  /** Tipo de documento de la referencia del vale (ej. "OV", "OT"; '' si no aplica) */
  tipoRef: string
  /** Número de la orden de referencia del vale ('' si no aplica) */
  referencia: string
  /** "YYYY-MM-DDTHH:mm" en hora local: fecha y hora en que se cargó el vale */
  fechaReg: string
  almacen: string
  observaciones: string
  idForm: string
  usuario: string
  detalles: ValeDetalleRequest[]
}

export interface ValeDetalleRequest {
  referencia: { tipo: string; nro: string; almacen: string; nroMov: string }
  codArt: string
  /** Kilos con hasta 4 decimales, como texto */
  peso: string
  matriz: string
  lote: string
  /** Código del plan diario: se elige uno por vale y va en cada ítem ('' si el movimiento no lo solicita) */
  planDiario: string
}

/** Respuesta de POST /vale (claves ya en camelCase, ver utils/mapper). Ej. { success: true, message: "Vale generado correctamente", nroVale: "PA00141961" } */
export interface ApiValeResponse {
  success: boolean
  message?: string
  /** Número del vale generado */
  nroVale?: string
}

export type ValeLineErrors = Partial<Record<'bultos' | 'kgAdicional' | 'peso', string>>

/** Respuesta de GET /vale (claves ya en camelCase, ver utils/mapper). La API responde 404 (vale_history_error) si no hay vales. */
export interface ApiValeHistoryResponse {
  success: boolean
  data: Array<{
    nroVale: string
    /** '1' activo, '0' anulado */
    flagEstado: '0' | '1'
    /** "26/10/2026 01:09:00" */
    fecha: string
    descTipoMov: string
    codUsr: string
    tipoRefer: string | null
    nroRefer: string | null
    /** "26-OCT-26" */
    fecIngreso: string
    almacen: string | null
  }>
}

/** Vale del historial */
export interface ValeHistoryItem {
  nroVale: string
  /** flagEstado = '1'; '0' es anulado */
  activo: boolean
  /** Fecha y hora de registro; null si la API la envía en otro formato */
  fecha: Date | null
  nombreMovimiento: string
  /** Deducido del nombre del movimiento ("INGRESO ..." / "SALIDA ...") */
  tipo: MovementKind | null
  tipoReferencia: string
  nroReferencia: string
  almacen: string
}

export interface ValeHistoryQuery {
  usuario: string
  /** "YYYY-MM-DD" */
  desde: string
  /** "YYYY-MM-DD" */
  hasta: string
}

/** Respuesta de GET /vale/detalle (claves ya en camelCase, ver utils/mapper). La API responde 404 (vale_detail_not_found) si no hay detalle. */
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

/** Línea del detalle de un vale registrado */
export interface ValeDetailLine {
  nroMov: string
  codArticulo: string
  descArticulo: string
  unidad: string
  cantidad: number
  precioUnitario: number
  /** Movimiento proyectado (referencia), ej. "PA-803666"; '' si no tiene */
  movProyectado: string
  centroCosto: string
  cuentaPresupuestal: string
  matriz: string
  observaciones: string
}
