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
      .map((m): Movement => ({
        codigo: cleanText(m.codMov),
        tipo: m.tipoMov,
        nombre: cleanText(m.nomMov),
        clase: cleanText(m.claseMov),
        contabiliza: cleanText(m.fContabiliza) === '1',
        requiereReferencia: cleanText(m.fRef) === '1',
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
  },

  /** Matrices contables del movimiento para el artículo; [] si la API responde 404 (matriz_not_found) */
  async getMatrices(movementCode: string, articleCode: string): Promise<Matrix[]> {
    try {
      const { data } = await axiosClient.get<ApiMatricesResponse>('/almacen/matriz', {
        params: { tipoMov: movementCode, codArt: articleCode },
      })
      if (!data.success) throw new Error('No fue posible obtener la matriz')
      return data.data.map((m): Matrix => ({
        codigo: cleanText(m.matriz),
        descripcion: cleanText(m.descripcion).replace(/\s+/g, ' '),
        grupoContable: cleanText(m.grpCntbl),
        subCategoria: cleanText(m.codSubCat),
      }))
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return []
      throw err
    }
  },

  async getWarehouses(): Promise<Warehouse[]> {
    const { data } = await axiosClient.get<ApiWarehousesResponse>('/almacen')

    if (!data.success) throw new Error('No fue posible obtener los almacenes')

    return data.data.map((w): Warehouse => ({
      codigo: cleanText(w.almacen),
      descripcion: cleanText(w.descAlmacen),
      ubicaciones: cleanText(w.codUbicacion).split(',').map(cleanText).filter(Boolean),
      saldo: toNumber(w.saldo),
    }))
  },

  /** Documentos de referencia. La API responde 404 (references_not_found) si no hay. */
  async getReferences({ articleCode, movementCode, docNumber = '' }: ReferenceQuery): Promise<ReferenceDocument[]> {
    const { data } = await axiosClient.get<ApiReferencesResponse>('/references', {
      params: { codArt: articleCode, movAlm: movementCode, nroDoc: docNumber },
    })

    if (!data.success) throw new Error('No fue posible obtener los documentos de referencia')

    // La API devuelve campos con espacios de relleno (ej. "OT  ") y algunos en null (ej. otPlan)
    return data.data.map((r): ReferenceDocument => ({
      nroOrden: cleanText(r.nroOrden),
      descripcion: cleanText(r.descripcion),
      tipoDoc: cleanText(r.tipoDoc),
      restante: toNumber(r.restante),
      almacen: cleanText(r.almacen),
      nroMov: cleanText(r.nroMov),
      codArticulo: cleanText(r.codArt),
      otPlan: cleanText(r.otPlan),
    }))
  },
}
