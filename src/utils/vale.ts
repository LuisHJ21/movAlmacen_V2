import type { ReferenceDocument } from '@/interfaces/almacen.interface'
import type { MovementKind } from '@/interfaces/movimiento.interface'
import type { PalletItem } from '@/interfaces/pallet.interface'
import type { ValeLine, ValeLineErrors, ValePalletGroup } from '@/interfaces/vale.interface'

/** Redondea a 2 decimales evitando errores de punto flotante (0.1 + 0.2) */
export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

/** KG adicional: sobrante de peso total / peso unitario (ej. 59.98 / 20 → 19.98) */
export function calcExtraKg(totalKg: number, unitWeight: number): number {
  if (unitWeight <= 0) return round2(totalKg)
  return round2(totalKg - Math.floor(round2(totalKg / unitWeight)) * unitWeight)
}

/** Peso de la línea: bultos completos + kg adicionales */
export function lineWeight(line: Pick<ValeLine, 'packages' | 'unitWeight' | 'extraKg'>): number {
  return round2(line.packages * line.unitWeight + line.extraKg)
}

/** Ítem sin bultos ni peso: no aporta al vale y se oculta */
export const isEmptyItem = (item: Pick<PalletItem, 'packages' | 'weight'>) => item.packages === 0 && item.weight === 0

/**
 * Construye las líneas del vale a partir de los ítems del pallet (sin los vacíos).
 * Referencia: en ingresos la de cada ítem (viene del pallet); en salidas la elegida por el operador.
 */
export function buildValeLines(
  items: PalletItem[],
  palletCode: string,
  movementKind: MovementKind,
  selectedReference: ReferenceDocument | null,
): ValeLine[] {
  return items.filter((i) => !isEmptyItem(i)).map((i) => ({
    item: i.item,
    palletCode,
    trace: i.trace,
    lot: i.lot,
    reference: movementKind === 'ING' ? (i.reference ?? selectedReference) : selectedReference,
    unitWeight: i.unitWeight,
    packages: i.packages,
    extraKg: calcExtraKg(i.weight, i.unitWeight),
    availablePackages: i.packages,
    availableWeight: i.weight,
  }))
}

/** Reglas de edición en salidas: no se puede sacar más de lo disponible */
export function validateValeLine(line: ValeLine): ValeLineErrors {
  const errors: ValeLineErrors = {}
  if (!Number.isInteger(line.packages) || line.packages < 0) errors.packages = 'Bultos inválidos'
  else if (line.packages > line.availablePackages) errors.packages = `Máximo ${line.availablePackages}`

  if (!Number.isFinite(line.extraKg) || line.extraKg < 0) errors.extraKg = 'Kg inválidos'
  else if (line.unitWeight > 0 && line.extraKg >= line.unitWeight)
    errors.extraKg = `Debe ser menor a ${line.unitWeight} kg`

  if (!errors.packages && !errors.extraKg && lineWeight(line) > round2(line.availableWeight))
    errors.weight = `Supera el peso disponible (${line.availableWeight} kg)`
  return errors
}

/** Almacén del vale: el elegido directamente (F_REF=0) o el de la referencia (F_REF=1) */
export function getValeWarehouse(warehouseCode: string | null | undefined, reference: ReferenceDocument | null): string | null {
  return (warehouseCode ?? reference?.warehouse ?? '').trim().toUpperCase() || null
}

/** El pallet pertenece al almacén del vale (si el vale no tiene almacén, no se restringe) */
export function palletInWarehouse(palletWarehouse: string | null, valeWarehouse: string | null): boolean {
  if (!valeWarehouse) return true
  return (palletWarehouse ?? '').trim().toUpperCase() === valeWarehouse
}

/** Ítems del pallet que no están en el vale (ordenados como en el pallet) */
export const excludedLines = (group: ValePalletGroup) =>
  group.pool.filter((p) => !group.lines.some((l) => l.item === p.item))

/** Inserta ítems respetando el orden original del pallet */
export function mergeLines(group: ValePalletGroup, added: ValeLine[]): ValeLine[] {
  const included = new Set([...group.lines, ...added].map((l) => l.item))
  return group.pool
    .filter((p) => included.has(p.item))
    .map((p) => group.lines.find((l) => l.item === p.item) ?? added.find((a) => a.item === p.item) ?? p)
}

export const isValeLineValid = (line: ValeLine) => Object.keys(validateValeLine(line)).length === 0

export function valeTotals(lines: ValeLine[]) {
  return {
    packages: lines.reduce((sum, l) => sum + l.packages, 0),
    weight: round2(lines.reduce((sum, l) => sum + lineWeight(l), 0)),
  }
}
