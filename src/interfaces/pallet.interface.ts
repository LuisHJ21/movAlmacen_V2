import type { ReferenceDocument } from './almacen.interface'

interface ApiPalletHeader {
  numPallet: string
  numBulto: number
  peso: number
  estado: string
  ubicacion: string | null
  almacen: string | null
  articulos: string[]
}

export interface ApiPalletVerifyResponse {
  success: boolean
  data: ApiPalletHeader
}

export interface Pallet {
  codigo: string
  bultos: number
  peso: number
  estado: string
  ubicacion: string | null
  almacen: string | null
  articulos: string[]
}

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
  adicional: number
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

export interface ApiPalletInfoResponse {
  success: boolean
  data: {
    numPallet: string
    numBulto: string
    peso: string
    codUsuario: string
    fechRegistro: string
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
      especie: string | null
    }>
  }
}

export interface PalletInfoItem {
  item: string
  codArticulo: string
  descripcion: string
  bultos: number
  peso: number
  pesoOriginal: number
  lote: string
  traza: string
  fechaProduccion: Date | null
  fechaRegistro: Date | null
  usuarioRegistro: string
  codParte: string
  descParte: string
  especie: string
  nroVale: string
  codMovimiento: string
  nombreMovimiento: string
  tipoReferencia: string
  referencia: string
}

export interface PalletInfo {
  codigo: string
  bultos: number
  peso: number
  activo: boolean
  usuarioRegistro: string
  fechaRegistro: Date | null
  observacion: string
  items: PalletInfoItem[]
}

export type TipoTransferencia = '0' | '1'
