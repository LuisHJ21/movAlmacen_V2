import type { ReferenceDocument } from './almacen.interface'

interface ApiPalletHeader {
  numPallet: string
  numBulto: number
  peso: number
  estado: string
  /** La API lo envía con doble "C" */
  ubicaccion: string | null
  almacen: string | null
  /** Códigos de artículo con espacios de relleno (ej. "102006.0006 ") */
  articulos: string[]
}

/** Respuesta de GET /pallet/verify (claves ya en camelCase, ver utils/mapper) */
export interface ApiPalletVerifyResponse {
  success: boolean
  data: ApiPalletHeader
}

export interface Pallet {
  codigo: string
  bultos: number
  /** Peso en kg */
  peso: number
  estado: string
  ubicacion: string | null
  almacen: string | null
  /** Códigos de artículo contenidos en el pallet */
  articulos: string[]
}

/** Respuesta de GET /pallet/data (claves ya en camelCase, ver utils/mapper) */
export interface ApiPalletDataResponse {
  success: boolean
  data: {
    dataItems: Array<{
      visible: boolean
      codArt: string
      item: string
      bultos: string
      peso: string
      fecha: string
      lote: string
      traza: string
      referencia: { tipo: string; nro: string; desc: string; nroMov: string; almacen: string }
      adicional: number
      numPallet: string
      descArt: string
      und: string
      pesoUnd: string
    }>
    /** Llega como [] cuando el artículo no corresponde al pallet */
    dataArticulo: { codigo: string; desc: string; und: string; pesoUnd: string } | []
    dataPallet: ApiPalletHeader
  }
}

export interface PalletItem {
  item: string
  codArticulo: string
  descripcion: string
  bultos: number
  peso: number
  fecha: string
  lote: string
  traza: string
  unidad: string
  pesoUnidad: number
  /** Documento de referencia del ítem; null si viene vacío */
  referencia: ReferenceDocument | null
}

export interface Article {
  codigo: string
  descripcion: string
  unidad: string
  pesoUnidad: number
}

export interface PalletData {
  items: PalletItem[]
  articulo: Article | null
}

/** Respuesta de GET /pallet/info (claves ya en camelCase, ver utils/mapper). La API responde 404 (pallet_not_found) si no existe. */
export interface ApiPalletInfoResponse {
  success: boolean
  data: {
    numPallet: string
    numBulto: string
    peso: string
    codUsuario: string
    /** "19/09/2026" */
    fechRegistro: string
    /** '1' activo, '0' inactivo */
    flagEstado: string
    observacion: string | null
    detalles: Array<{
      item: string
      numBultos: string
      peso: string
      fechProdu: string | null
      lote: string | null
      codTraza: string | null
      fechRegist: string | null
      codUsuario: string | null
      codArticulo: string
      descripcion: string
      codParte: string | null
      descParte: string | null
      nroVale: string | null
      tipoMov: string | null
      descTipoMov: string | null
      tipoRefer: string | null
      refer: string | null
      pesoOriginal: string | null
      /** Especie del plan diario (ej. "POT") */
      especie: string | null
    }>
  }
}

/** Ítem del pallet con su trazabilidad (pallet/info) */
export interface PalletInfoItem {
  item: string
  codArticulo: string
  descripcion: string
  bultos: number
  /** Peso actual en kg */
  peso: number
  /** Peso con el que se registró el ítem */
  pesoOriginal: number
  lote: string
  traza: string
  fechaProduccion: Date | null
  fechaRegistro: Date | null
  usuarioRegistro: string
  /** Parte de producción (ej. PA00000488) y su descripción */
  codParte: string
  descParte: string
  /** Especie del plan diario de producción (ej. POT) */
  especie: string
  /** Vale con el que ingresó el ítem */
  nroVale: string
  codMovimiento: string
  nombreMovimiento: string
  tipoReferencia: string
  referencia: string
}

/** Información completa del pallet (pallet/info) */
export interface PalletInfo {
  codigo: string
  bultos: number
  peso: number
  /** flagEstado = '1' */
  activo: boolean
  usuarioRegistro: string
  fechaRegistro: Date | null
  observacion: string
  items: PalletInfoItem[]
}
