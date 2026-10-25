import { axiosClient } from '@/api/axiosClient'
import type {
  ApiPalletDataResponse,
  ApiPalletVerifyResponse,
  Pallet,
  PalletData,
} from '@/interfaces/pallet.interface'
import { cleanOptional, cleanText, toNumber } from '@/utils/format'

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
      code: cleanText(p.NUM_PALLET),
      packages: toNumber(p.NUM_BULTO),
      weight: toNumber(p.PESO),
      status: cleanText(p.ESTADO),
      location: cleanOptional(p.UBICACCION),
      warehouse: cleanOptional(p.ALMACEN),
      articles: [...new Set((p.ARTICULOS ?? []).map(cleanText).filter(Boolean))],
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
      article: article && {
        code: cleanText(article.codigo),
        description: cleanText(article.desc),
        unit: cleanText(article.und),
        unitWeight: toNumber(article.pesoUnd),
      },
      items: (data.data.dataItems ?? []).map((i) => ({
        item: cleanText(i.item),
        articleCode: cleanText(i.codArt),
        description: cleanText(i.descArt),
        packages: toNumber(i.bultos),
        weight: toNumber(i.peso),
        date: cleanText(i.fecha),
        lot: cleanText(i.lote),
        trace: cleanText(i.traza),
        unit: cleanText(i.und),
        unitWeight: toNumber(i.pesoUnd),
        reference: cleanText(i.referencia?.nro)
          ? {
              orderNumber: cleanText(i.referencia.nro),
              description: cleanText(i.referencia.desc),
              docType: cleanText(i.referencia.tipo),
              remaining: null,
              warehouse: cleanText(i.referencia.almacen),
              movementNumber: cleanText(i.referencia.nroMov),
              articleCode: cleanText(i.codArt),
              plannedOrder: '',
            }
          : null,
      })),
    }
  },
}
