import { axiosClient } from '@/api/axiosClient'
import type {
  ApiPalletDataResponse,
  ApiPalletInfoResponse,
  ApiPalletVerifyResponse,
  Pallet,
  PalletData,
  PalletInfo,
  PalletInfoItem,
  PalletItem,
} from '@/interfaces/pallet.interface'
import { cleanOptional, cleanText, parseApiDateTime, toNumber } from '@/utils/format'

export const palletService = {
  /** Verifica que el pallet exista. La API responde 404 (pallet_not_found) si no existe. */
  async verify(code: string): Promise<Pallet> {
    const { data } = await axiosClient.get<ApiPalletVerifyResponse>('/pallet/verify', {
      params: { pallet: code },
    })

    if (!data.success) throw new Error('No fue posible verificar el pallet')

    // La API devuelve campos con espacios de relleno (ej. "C3I04401            ") o en null
    const p = data.data
    return {
      codigo: cleanText(p.numPallet),
      bultos: toNumber(p.numBulto),
      peso: toNumber(p.peso),
      estado: cleanText(p.estado),
      ubicacion: cleanOptional(p.ubicaccion),
      almacen: cleanOptional(p.almacen),
      articulos: [...new Set((p.articulos ?? []).map(cleanText).filter(Boolean))],
    }
  },

  /** Ítems disponibles del pallet para el movimiento y artículo */
  async getData(palletCode: string, movementCode: string, articleCode: string): Promise<PalletData> {
    const { data } = await axiosClient.get<ApiPalletDataResponse>('/pallet/data', {
      params: { pallet: palletCode, tipoMov: movementCode, codart: articleCode },
    })

    if (!data.success) throw new Error('No fue posible obtener los datos del pallet')

    const article = Array.isArray(data.data.dataArticulo) ? null : data.data.dataArticulo

    return {
      articulo: article && {
        codigo: cleanText(article.codigo),
        descripcion: cleanText(article.desc),
        unidad: cleanText(article.und),
        pesoUnidad: toNumber(article.pesoUnd),
      },
      items: (data.data.dataItems ?? []).map((i): PalletItem => ({
        item: cleanText(i.item),
        codArticulo: cleanText(i.codArt),
        descripcion: cleanText(i.descArt),
        bultos: toNumber(i.bultos),
        peso: toNumber(i.peso),
        fecha: cleanText(i.fecha),
        lote: cleanText(i.lote),
        traza: cleanText(i.traza),
        unidad: cleanText(i.und),
        pesoUnidad: toNumber(i.pesoUnd),
        referencia: cleanText(i.referencia?.nro)
          ? {
              nroOrden: cleanText(i.referencia.nro),
              descripcion: cleanText(i.referencia.desc),
              tipoDoc: cleanText(i.referencia.tipo),
              restante: null,
              almacen: cleanText(i.referencia.almacen),
              nroMov: cleanText(i.referencia.nroMov),
              codArticulo: cleanText(i.codArt),
              otPlan: '',
            }
          : null,
      })),
    }
  },

  /** Información y trazabilidad del pallet. La API responde 404 (pallet_not_found) si no existe. */
  async getInfo(code: string): Promise<PalletInfo> {
    const { data } = await axiosClient.get<ApiPalletInfoResponse>('/pallet/info', { params: { pallet: code } })

    if (!data.success) throw new Error('No fue posible obtener la información del pallet')
    const p = data.data

    return {
      codigo: cleanText(p.numPallet),
      bultos: toNumber(p.numBulto),
      peso: toNumber(p.peso),
      activo: cleanText(p.flagEstado) !== '0',
      usuarioRegistro: cleanText(p.codUsuario),
      fechaRegistro: parseApiDateTime(cleanText(p.fechRegistro)),
      observacion: cleanText(p.observacion),
      items: (p.detalles ?? []).map((i): PalletInfoItem => ({
        item: cleanText(i.item),
        codArticulo: cleanText(i.codArticulo),
        descripcion: cleanText(i.descripcion),
        bultos: toNumber(i.numBultos),
        peso: toNumber(i.peso),
        pesoOriginal: toNumber(i.pesoOriginal),
        lote: cleanText(i.lote),
        traza: cleanText(i.codTraza),
        fechaProduccion: parseApiDateTime(cleanText(i.fechProdu)),
        fechaRegistro: parseApiDateTime(cleanText(i.fechRegist)),
        usuarioRegistro: cleanText(i.codUsuario),
        codParte: cleanText(i.codParte),
        descParte: cleanText(i.descParte),
        especie: cleanText(i.especie),
        nroVale: cleanText(i.nroVale),
        codMovimiento: cleanText(i.tipoMov),
        nombreMovimiento: cleanText(i.descTipoMov),
        tipoReferencia: cleanText(i.tipoRefer),
        referencia: cleanText(i.refer),
      })),
    }
  },
}
