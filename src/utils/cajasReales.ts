import type { PalletItem } from '@/interfaces/pallet.interface'

export interface CajaReal {
  lote: string
  traza: string
  fecha: string
  peso: string
  ot: string
  adicional: string
  piezas?: PiezaCaja[]
}

export interface PiezaCaja {
  lote: string
  traza: string
  fecha: string
  ot: string
  peso: number
}

/** Kg → unidades de 0.0001 kg: se calcula con enteros para no arrastrar errores de punto flotante */
const ESCALA = 10_000
const aUnidades = (kg: number) => Math.round(kg * ESCALA)
const formatearNumero = (unidades: number) => (unidades / ESCALA).toFixed(4)

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
  const conPeso = items.filter((i) => aUnidades(parseFloat(i.peso)) > 0)
  if (caja <= 0) return conPeso.map((i) => ({ ...i, adicional: '0' }))

  const resultado: CajaReal[] = []
  let abierta: { item: CajaReal; unidades: number }[] = []
  let enAbierta = 0

  for (const item of conPeso) {
    let resto = aUnidades(parseFloat(item.peso))

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

    const completas = Math.floor(resto / caja) * caja
    if (completas > 0) {
      resultado.push({ ...item, peso: formatearNumero(completas), adicional: '0', piezas: [pieza(item, caja)] })
    }

    const sobrante = resto - completas
    if (sobrante > 0) {
      abierta = [{ item, unidades: sobrante }]
      enAbierta = sobrante
    }
  }

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

export interface ResumenCaja {
  tipo: 'completas' | 'mixta' | 'incompleta'
  cajas: number
  peso: number
  aportes: number[]
  lotes: string[]
  trazas: string[]
  fechas: string[]
  piezas: PiezaCaja[]
}

const distintos = (valor: string) => [...new Set(valor.split('|').filter(Boolean))]

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
    return { ...base, tipo: adicional > 0 ? 'incompleta' : 'mixta', cajas: 1, peso, aportes }
  }
  if (aportes[0] === 0 && adicional > 0) {
    return { ...base, tipo: 'incompleta', cajas: 1, peso: adicional, aportes: [adicional] }
  }
  return { ...base, tipo: 'completas', cajas: pesoUnd > 0 ? Math.round(aportes[0] / pesoUnd) : 0, peso: aportes[0], aportes }
}
