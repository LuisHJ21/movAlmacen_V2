import type { ReferenceDocument } from './almacen.interface'

interface ApiPalletHeader {
  NUM_PALLET: string
  NUM_BULTO: number
  PESO: number
  ESTADO: string
  /** La API lo envía con doble "C" */
  UBICACCION: string | null
  ALMACEN: string | null
  /** Códigos de artículo con espacios de relleno (ej. "102006.0006 ") */
  ARTICULOS: string[]
}

/** Respuesta cruda de GET /pallet/verify */
export interface ApiPalletVerifyResponse {
  success: boolean
  data: ApiPalletHeader
}

export interface Pallet {
  code: string
  packages: number
  /** Peso en kg */
  weight: number
  status: string
  location: string | null
  warehouse: string | null
  /** Códigos de artículo contenidos en el pallet */
  articles: string[]
}

/** Respuesta cruda de GET /pallet/data */
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
  articleCode: string
  description: string
  packages: number
  weight: number
  date: string
  lot: string
  trace: string
  unit: string
  unitWeight: number
  /** Documento de referencia del ítem; null si viene vacío */
  reference: ReferenceDocument | null
}

export interface Article {
  code: string
  description: string
  unit: string
  unitWeight: number
}

export interface PalletData {
  items: PalletItem[]
  article: Article | null
}
