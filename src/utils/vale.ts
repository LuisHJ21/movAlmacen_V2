import type { ReferenceDocument } from '@/interfaces/almacen.interface'
import type { Movement, MovementKind } from '@/interfaces/movimiento.interface'
import type { PalletItem } from '@/interfaces/pallet.interface'
import type { ValeLine, ValeLineErrors, ValePalletGroup, ValeRequest } from '@/interfaces/vale.interface'
import { formatWeight, KG_DECIMALS } from './format'

export const roundKg = (value: number) => {
  const factor = 10 ** KG_DECIMALS
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** KG adicional: sobrante de peso total / peso unitario (ej. 59.9848 / 20 → 19.9848) */
export function calcExtraKg(totalKg: number, unitWeight: number): number {
  if (unitWeight <= 0) return roundKg(totalKg)
  return roundKg(totalKg - Math.floor(roundKg(totalKg / unitWeight)) * unitWeight)
}

export function lineWeight(line: Pick<ValeLine, 'bultos' | 'pesoUnidad' | 'kgAdicional'>): number {
  return roundKg(line.bultos * line.pesoUnidad + line.kgAdicional)
}

export const isEmptyItem = (item: Pick<PalletItem, 'bultos' | 'peso'>) => item.bultos === 0 && item.peso === 0

export function buildValeLines(
  items: PalletItem[],
  palletCode: string,
  movementKind: MovementKind,
  selectedReference: ReferenceDocument | null,
): ValeLine[] {
  return items.filter((i) => !isEmptyItem(i)).map((i): ValeLine => ({
    item: i.item,
    codPallet: palletCode,
    traza: i.traza,
    lote: i.lote,
    referencia: movementKind === 'ING' ? (i.referencia ?? selectedReference) : selectedReference,
    pesoUnidad: i.pesoUnidad,
    bultos: i.bultos,
    kgAdicional: calcExtraKg(i.peso, i.pesoUnidad),
    bultosDisponibles: i.bultos,
    pesoDisponible: i.peso,
  }))
}

interface ValeLineRules {
  editable: boolean
}

export function validateValeLine(line: ValeLine, { editable }: ValeLineRules): ValeLineErrors {
  return editable ? validateQuantities(line) : {}
}

function validateQuantities(line: ValeLine): ValeLineErrors {
  const errors: ValeLineErrors = {}
  if (!Number.isInteger(line.bultos) || line.bultos < 0) errors.bultos = 'Bultos inválidos'
  else if (line.bultos > line.bultosDisponibles) errors.bultos = `Máximo ${line.bultosDisponibles}`

  if (!Number.isFinite(line.kgAdicional) || line.kgAdicional < 0) errors.kgAdicional = 'Kg inválidos'
  else if (line.pesoUnidad > 0 && line.kgAdicional >= line.pesoUnidad)
    errors.kgAdicional = `Debe ser menor a ${formatWeight(line.pesoUnidad)}`

  if (!errors.bultos && !errors.kgAdicional && lineWeight(line) > roundKg(line.pesoDisponible))
    errors.peso = `Supera el peso disponible (${formatWeight(line.pesoDisponible)})`
  return errors
}

export function getValeWarehouse(warehouseCode: string | null | undefined, reference: ReferenceDocument | null): string | null {
  return (warehouseCode ?? reference?.almacen ?? '').trim().toUpperCase() || null
}

export function palletInWarehouse(palletWarehouse: string | null, valeWarehouse: string | null): boolean {
  if (!valeWarehouse) return true
  return (palletWarehouse ?? '').trim().toUpperCase() === valeWarehouse
}

export const referenceMatchesPallet = (reference: ReferenceDocument, pallet: { almacen: string | null }) =>
  palletInWarehouse(pallet.almacen, getValeWarehouse(null, reference))

export const excludedLines = (group: ValePalletGroup) =>
  group.disponibles.filter((p) => !group.lineas.some((l) => l.item === p.item))

export function mergeLines(group: ValePalletGroup, added: ValeLine[]): ValeLine[] {
  const included = new Set([...group.lineas, ...added].map((l) => l.item))
  return group.disponibles
    .filter((p) => included.has(p.item))
    .map((p) => group.lineas.find((l) => l.item === p.item) ?? added.find((a) => a.item === p.item) ?? p)
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toApiDateTime(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/**
 * Id del formulario: marca de tiempo de carga del vale y un aleatorio, ambos en base 25
 * (misma lógica que el formulario web de crear vale). Ej. "1i8fj3g2k-5c1h0ab7".
 * Se genera una sola vez por vale para que un reintento de guardado envíe el mismo id.
 */
export function generateFormId(date: Date = new Date()): string {
  const random = parseFloat(Math.random().toFixed(10))
  return `${date.getTime().toString(25)}-${random.toString(25).substring(2)}`
}

interface BuildValeRequestParams {
  date: Date
  formId: string
  movement: Movement
  articleCode: string
  matrixCode: string | null
  warehouseCode: string | null
  reference: ReferenceDocument | null
  username: string
  groups: ValePalletGroup[]
  observations?: string
  planDiarioCode?: string | null
}

export function buildValeRequest({
  date,
  formId,
  movement,
  articleCode,
  matrixCode,
  warehouseCode,
  reference,
  username,
  groups,
  observations = '',
  planDiarioCode = null,
}: BuildValeRequestParams): ValeRequest {
  return {
    tMov: movement.codigo,
    tipoRef: reference?.tipoDoc ?? '',
    referencia: reference?.nroOrden ?? '',
    fechaReg: toApiDateTime(date),
    almacen: warehouseCode ?? '',
    observaciones: observations,
    idForm: formId,
    usuario: username,
    detalles: groups.flatMap((g) =>
      g.lineas.map((line) => ({
        referencia: {
          tipo: line.referencia?.tipoDoc ?? '',
          nro: line.referencia?.nroOrden ?? '',
          almacen: line.referencia?.almacen ?? '',
          nroMov: line.referencia?.nroMov ?? '',
        },
        codArt: articleCode,
        peso: String(lineWeight(line)),
        matriz: matrixCode ?? '',
        lote: line.lote,
        planDiario: planDiarioCode ?? '',
        item:line.item,
        pallet:line.codPallet
      })),
    ),
  }
}

export const isValeLineValid = (line: ValeLine, rules: ValeLineRules) =>
  Object.keys(validateValeLine(line, rules)).length === 0

export function valeTotals(lines: ValeLine[]) {
  return {
    packages: lines.reduce((sum, l) => sum + l.bultos, 0),
    weight: roundKg(lines.reduce((sum, l) => sum + lineWeight(l), 0)),
  }
}
