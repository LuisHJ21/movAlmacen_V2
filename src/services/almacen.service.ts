import { axiosClient } from '@/api/axiosClient'
import { isAxiosError } from 'axios'
import type {
  ApiMatricesResponse,
  ApiReferencesResponse,
  ApiWarehousesResponse,
  Matrix,
  ReferenceDocument,
  Warehouse,
} from '@/interfaces/almacen.interface'
import type { ApiMovementTypesResponse, Movement, MovementTypeFilter } from '@/interfaces/movimiento.interface'
import { cleanText, toNumber } from '@/utils/format'

export interface ReferenceQuery {
  articleCode: string
  movementCode: string
  /** Solo para ingresos; en salidas va vacío */
  docNumber?: string
}

export const almacenService = {
  /** Movimientos de almacén: 'I' ingresos, 'S' salidas, '' ambos */
  async getMovementTypes(tipoMov: MovementTypeFilter = ''): Promise<Movement[]> {
    const { data } = await axiosClient.get<ApiMovementTypesResponse>('/almacen/tipo-movimiento', {
      params: { tipoMov },
    })

    if (!data.success) throw new Error('No fue posible obtener los movimientos')

    return data.data
      .map((m) => ({
        code: cleanText(m.COD_MOV),
        kind: m.TIPO_MOV,
        name: cleanText(m.NOM_MOV),
        movementClass: cleanText(m.CLASE_MOV),
        posts: cleanText(m.F_CONTABILIZA) === '1',
        requiresReference: cleanText(m.F_REF) === '1',
      }))
      .sort((a, b) => a.code.localeCompare(b.code))
  },

  /** Matrices contables del movimiento para el artículo; [] si la API responde 404 (matriz_not_found) */
  async getMatrices(movementCode: string, articleCode: string): Promise<Matrix[]> {
    try {
      const { data } = await axiosClient.get<ApiMatricesResponse>('/almacen/matriz', {
        params: { tipoMov: movementCode, codArt: articleCode },
      })
      if (!data.success) throw new Error('No fue posible obtener la matriz')
      return data.data.map((m) => ({
        code: cleanText(m.MATRIZ),
        description: cleanText(m.DESCRIPCION).replace(/\s+/g, ' '),
        accountingGroup: cleanText(m.GRP_CNTBL),
        subCategory: cleanText(m.COD_SUB_CAT),
      }))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },

  async getWarehouses(): Promise<Warehouse[]> {
    const { data } = await axiosClient.get<ApiWarehousesResponse>('/almacen')

    if (!data.success) throw new Error('No fue posible obtener los almacenes')

    return data.data.map((w) => ({
      code: cleanText(w.ALMACEN),
      description: cleanText(w.DESC_ALMACEN),
      locations: cleanText(w.COD_UBICACION).split(',').map(cleanText).filter(Boolean),
      balance: toNumber(w.SALDO),
    }))
  },

  /** Documentos de referencia. La API responde 404 (references_not_found) si no hay. */
  async getReferences({ articleCode, movementCode, docNumber = '' }: ReferenceQuery): Promise<ReferenceDocument[]> {
    const { data } = await axiosClient.get<ApiReferencesResponse>('/references', {
      params: { codArt: articleCode, movAlm: movementCode, nroDoc: docNumber },
    })

    if (!data.success) throw new Error('No fue posible obtener los documentos de referencia')

    // La API devuelve campos con espacios de relleno (ej. "OT  ") y algunos en null (ej. OT_PLAN)
    return data.data.map((r) => ({
      orderNumber: cleanText(r.NRO_ORDEN),
      description: cleanText(r.DESCRIPCION),
      docType: cleanText(r.TIPO_DOC),
      remaining: toNumber(r.RESTANTE),
      warehouse: cleanText(r.ALMACEN),
      movementNumber: cleanText(r.NRO_MOV),
      articleCode: cleanText(r.COD_ART),
      plannedOrder: cleanText(r.OT_PLAN),
    }))
  },
}
