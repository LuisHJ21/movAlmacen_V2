import type { Warehouse } from '@/interfaces/almacen.interface'
import type { Pallet, PalletItem, TipoTransferencia } from '@/interfaces/pallet.interface'
import type { TransferenciaRequest } from '@/interfaces/transferencia.interface'
import { roundKg, toApiDateTime } from './vale'

/**
 * tipo de /pallet/datatransfer: '1' si el almacén origen no tiene códigos de ubicación,
 * el destino es el almacén actual del pallet y el pallet tiene ubicación asignada; si no, '0'.
 * Es el pallet que se arma en varios días: los ítems nuevos pasan por el temporal (sin ubicaciones)
 * y se agregan al pallet en su almacén actual, manteniendo su ubicación.
 */
export function tipoTransferencia(origen: Warehouse, destino: Warehouse, pallet: Pallet): TipoTransferencia {
  return origen.ubicaciones.length === 0 && destino.codigo === pallet.almacen && !!pallet.ubicacion ? '1' : '0'
}

interface BuildTransferenciaRequestParams {
  date: Date
  formIdSalida: string
  formIdIngreso: string
  usuario: string
  pallet: Pallet
  origen: Warehouse
  destino: Warehouse
  items: PalletItem[]
  ubicacion: string
  observaciones?: string
}

export function buildTransferenciaRequest({
  date,
  formIdSalida,
  formIdIngreso,
  usuario,
  pallet,
  origen,
  destino,
  items,
  ubicacion,
  observaciones = '',
}: BuildTransferenciaRequestParams): TransferenciaRequest {
  return {
    usuario,
    pallet: pallet.codigo,
    detalles: items.map((item) => ({
      codArt: item.codArticulo,
      item: item.item,
      peso: String(roundKg(item.peso)),
      fecha: item.fecha,
      lote: item.lote,
      traza: item.traza,
      numPallet: pallet.codigo,
      pesoUnd: String(item.pesoUnidad),
      loteOrg: item.lote,
      loteDest: item.lote,
      matriz: '',
    })),
    fechaReg: toApiDateTime(date),
    almOrigen: origen.codigo,
    almDestino: destino.codigo,
    observaciones,
    idFormI: formIdIngreso,
    idFormS: formIdSalida,
    ubicacion,
  }
}
