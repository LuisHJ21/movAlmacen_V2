import type { ReferenceDocument } from './almacen.interface'
import type { Pallet } from './pallet.interface'

/** Línea del detalle del vale (un ítem del pallet) */
export interface ValeLine {
  item: string
  palletCode: string
  trace: string
  lot: string
  reference: ReferenceDocument | null
  /** Peso de 1 unidad (bulto) en kg */
  unitWeight: number
  packages: number
  /** Kg que sobran después de los bultos completos */
  extraKg: number
  /** Disponibles en el pallet: tope para las salidas */
  availablePackages: number
  availableWeight: number
}

/** Pallet incluido en el vale con su detalle */
export interface ValePalletGroup {
  pallet: Pallet
  /** Ítems incluidos en el vale */
  lines: ValeLine[]
  /** Todos los ítems no vacíos del pallet (para volver a agregar los excluidos) */
  pool: ValeLine[]
}

export type ValeLineErrors = Partial<Record<'packages' | 'extraKg' | 'weight', string>>
