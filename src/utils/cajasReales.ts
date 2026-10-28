import type { PalletItem } from '@/interfaces/pallet.interface'

/**
 * Fila del resultado de la simulación (mismo formato que dataItemTransP del sistema web).
 * Los campos de una caja mixta llevan los valores de cada ítem unidos con "|" (ej. lote "202607|202608").
 */
export interface CajaReal {
  lote: string
  traza: string
  fecha: string
  /** Kg con 4 decimales; en una caja mixta, el aporte de cada ítem separado por "|" */
  peso: string
  /** Documento de referencia (orden) del ítem */
  ot: string
  /** Kg sueltos que no completan una caja */
  adicional: string
  /** Lo que aporta cada ítem a la caja, sin unir (para comparar con las etiquetas). Solo en el resultado */
  piezas?: PiezaCaja[]
}

/** Aporte de un ítem a una caja: cada pieza corresponde a una etiqueta de la caja */
export interface PiezaCaja {
  lote: string
  traza: string
  fecha: string
  ot: string
  /** Kg */
  peso: number
}

/** Kg → unidades de 0.0001 kg: se calcula con enteros para no arrastrar errores de punto flotante */
const ESCALA = 10_000
const aUnidades = (kg: number) => Math.round(kg * ESCALA)
const formatearNumero = (unidades: number) => (unidades / ESCALA).toFixed(4)

/** Ítems de /pallet/data → formato de entrada de la simulación */
export const toCajaReal = (i: PalletItem): CajaReal => ({
  lote: i.lote,
  traza: i.traza,
  fecha: i.fecha,
  peso: String(i.peso),
  ot: i.referencia?.nroOrden ?? '',
  adicional: String(i.adicional),
})

type Campo = 'lote' | 'traza' | 'fecha' | 'ot'

const pieza = (item: CajaReal, unidades: number): PiezaCaja => ({
  lote: item.lote,
  traza: item.traza,
  fecha: item.fecha,
  ot: item.ot,
  peso: unidades / ESCALA,
})

/**
 * Une un campo de las piezas de una caja mixta como el sistema web: el primero siempre; los intermedios
 * solo si cambian respecto al anterior; el último siempre.
 */
function unirCampo(piezas: CajaReal[], campo: Campo): string {
  return piezas
    .map((p, i) => {
      if (i === 0 || i === piezas.length - 1) return (i === 0 ? '' : '|') + p[campo]
      return piezas[i - 1][campo] === p[campo] ? '' : `|${p[campo]}`
    })
    .join('')
}

/** Caja formada por piezas de varios ítems; completa: adicional '0', incompleta: adicional = kg que tiene */
function cajaMixta(piezas: { item: CajaReal; unidades: number }[], completa: boolean): CajaReal {
  const items = piezas.map((p) => p.item)
  const total = piezas.reduce((s, p) => s + p.unidades, 0)
  return {
    lote: unirCampo(items, 'lote'),
    traza: unirCampo(items, 'traza'),
    fecha: unirCampo(items, 'fecha'),
    ot: unirCampo(items, 'ot'),
    peso: piezas.map((p) => formatearNumero(p.unidades)).join('|'),
    adicional: completa ? '0' : formatearNumero(total),
    piezas: piezas.map((p) => pieza(p.item, p.unidades)),
  }
}

/**
 * Simula las cajas reales del pallet recorriendo sus ítems en orden y llenando cajas de pesoUnd:
 * - las cajas completas de un ítem van en una fila (peso = kg de esas cajas);
 * - el sobrante de un ítem abre una caja que se completa con peso de los ítems siguientes (caja mixta);
 * - lo que al final no completa una caja queda como caja incompleta (peso '0' y el sobrante en adicional;
 *   si tiene piezas de varios ítems, peso lleva cada aporte y adicional el total).
 * Cada kilo entra en una sola caja: la suma del resultado es igual a la de los ítems.
 * Basada en obtenerCajasReales del sistema web, que perdía peso cuando el sobrante no alcanzaba a
 * completarse o cuando ítems pequeños se sumaban a una caja mixta.
 */
export function obtenerCajasReales(items: CajaReal[], pesoUnd: number): CajaReal[] {
  const caja = aUnidades(pesoUnd)
  const conPeso = items.filter((i) => aUnidades(parseFloat(i.peso)) > 0) // Ítems con peso 0: se omiten
  if (caja <= 0) return conPeso.map((i) => ({ ...i, adicional: '0' }))

  const resultado: CajaReal[] = []
  // Caja abierta: piezas de ítems que aún no suman una caja completa
  let abierta: { item: CajaReal; unidades: number }[] = []
  let enAbierta = 0

  for (const item of conPeso) {
    let resto = aUnidades(parseFloat(item.peso))

    // 1) Completar la caja abierta con peso de este ítem
    if (abierta.length > 0) {
      const toma = Math.min(resto, caja - enAbierta)
      abierta.push({ item, unidades: toma })
      enAbierta += toma
      resto -= toma
      if (enAbierta === caja) {
        resultado.push(cajaMixta(abierta, true))
        abierta = []
        enAbierta = 0
      }
    }
    if (resto === 0) continue

    // 2) Cajas completas de este ítem
    const completas = Math.floor(resto / caja) * caja
    if (completas > 0) {
      // Cajas de un solo ítem: una pieza por caja (todas iguales)
      resultado.push({ ...item, peso: formatearNumero(completas), adicional: '0', piezas: [pieza(item, caja)] })
    }

    // 3) El sobrante abre una caja nueva
    const sobrante = resto - completas
    if (sobrante > 0) {
      abierta = [{ item, unidades: sobrante }]
      enAbierta = sobrante
    }
  }

  // Lo que quedó sin completar: caja incompleta
  if (abierta.length === 1) {
    resultado.push({
      ...abierta[0].item,
      peso: '0',
      adicional: formatearNumero(enAbierta),
      piezas: [pieza(abierta[0].item, enAbierta)],
    })
  } else if (abierta.length > 1) {
    resultado.push(cajaMixta(abierta, false))
  }

  return resultado
}

/** Para mostrar una fila del resultado */
export interface ResumenCaja {
  tipo: 'completas' | 'mixta' | 'incompleta'
  /** Cajas que representa la fila */
  cajas: number
  /** Kg totales de la fila */
  peso: number
  /** Kg que aporta cada ítem (más de uno en las cajas de varios ítems) */
  aportes: number[]
  /** Valores distintos: en la cadena solo se repiten cuando cambian */
  lotes: string[]
  trazas: string[]
  fechas: string[]
  /** Piezas de una caja (en "completas", la de una sola caja): una por etiqueta */
  piezas: PiezaCaja[]
}

const distintos = (valor: string) => [...new Set(valor.split('|').filter(Boolean))]

/** Interpreta una fila: cajas completas de un ítem, caja mixta (completa) o caja incompleta */
export function resumirCaja(caja: CajaReal, pesoUnd: number): ResumenCaja {
  const aportes = caja.peso.split('|').map(Number)
  const adicional = parseFloat(caja.adicional) || 0
  const base = {
    lotes: distintos(caja.lote),
    trazas: distintos(caja.traza),
    fechas: distintos(caja.fecha),
    piezas: caja.piezas ?? [{ lote: caja.lote, traza: caja.traza, fecha: caja.fecha, ot: caja.ot, peso: pesoUnd }],
  }

  if (aportes.length > 1) {
    const peso = aportes.reduce((s, p) => s + p, 0)
    // adicional > 0 en una caja de varios ítems: no llegó a completarse
    return { ...base, tipo: adicional > 0 ? 'incompleta' : 'mixta', cajas: 1, peso, aportes }
  }
  if (aportes[0] === 0 && adicional > 0) {
    return { ...base, tipo: 'incompleta', cajas: 1, peso: adicional, aportes: [adicional] }
  }
  return { ...base, tipo: 'completas', cajas: pesoUnd > 0 ? Math.round(aportes[0] / pesoUnd) : 0, peso: aportes[0], aportes }
}
