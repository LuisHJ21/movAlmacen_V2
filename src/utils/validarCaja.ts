import type { EtiquetaCaja } from '@/interfaces/caja.interface'
import type { PiezaCaja, ResumenCaja } from './cajasReales'

export type TipoCajaEscaneo = 'completa' | 'saldo'

/**
 * Fecha → "AAAAMMDD" para comparar la del QR con la de /pallet/data aunque vengan en formatos distintos
 * (2026-07-08, 08/07/2026, 08/07/26, 20260708). Si no se reconoce, se compara tal cual.
 */
export function normalizarFecha(valor: string): string {
  const v = valor.trim()
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}${m[2]}${m[3]}`
  m = v.match(/^(\d{2})[/-](\d{2})[/-](\d{2}|\d{4})\b/)
  if (m) return `${m[3].length === 2 ? `20${m[3]}` : m[3]}${m[2]}${m[1]}`
  if (/^\d{8}$/.test(v)) return v
  return v.toUpperCase()
}

const clave = (x: Pick<PiezaCaja, 'lote' | 'traza' | 'fecha' | 'ot'>) =>
  [x.lote.trim().toUpperCase(), x.traza.trim().toUpperCase(), normalizarFecha(x.fecha), x.ot.trim().toUpperCase()].join('|')

export type ResultadoCaja = { ok: true; fila: number } | { ok: false; titulo: string; motivo: string }

const tipoEsperado = (tipo: TipoCajaEscaneo, etiquetas: number): ResumenCaja['tipo'] =>
  tipo === 'saldo' ? 'incompleta' : etiquetas > 1 ? 'mixta' : 'completas'

export function cantidadesDisponibles(filas: ResumenCaja[]): Record<TipoCajaEscaneo, number[]> {
  const de = (tipos: ResumenCaja['tipo'][]) =>
    [...new Set(filas.filter((f) => tipos.includes(f.tipo)).map((f) => f.piezas.length))].sort((a, b) => a - b)
  return { completa: de(['completas', 'mixta']), saldo: de(['incompleta']) }
}

/**
 * Busca la caja real a la que pertenece una etiqueta, sabiendo cuántas etiquetas tiene la caja:
 * se escanea una sola y se busca una caja formada por esa cantidad de registros que la incluya.
 * - completa con 1 etiqueta → fila de cajas completas con ese lote/traza/fecha/OT;
 * - completa con varias → caja mixta de esa cantidad de piezas, una de ellas con esa etiqueta;
 * - saldo → caja incompleta de esa cantidad de piezas, una de ellas con esa etiqueta.
 * usadas[i]: cajas ya escaneadas de la fila i (no se puede escanear más de las que hay).
 */
export function buscarCaja(
  filas: ResumenCaja[],
  usadas: number[],
  etiqueta: EtiquetaCaja,
  tipo: TipoCajaEscaneo,
  etiquetas: number,
  articulo: string,
): ResultadoCaja {
  if (etiqueta.codArt.trim().toUpperCase() !== articulo.trim().toUpperCase()) {
    return {
      ok: false,
      titulo: 'La caja es de otro artículo',
      motivo: `La etiqueta es del artículo ${etiqueta.codArt}; el pallet origen es del ${articulo}.`,
    }
  }

  const buscada = clave(etiqueta)
  const esperado = tipoEsperado(tipo, etiquetas)
  const coincide = (f: ResumenCaja) =>
    f.tipo === esperado && f.piezas.length === etiquetas && f.piezas.some((p) => clave(p) === buscada)

  const disponible = filas.findIndex((f, i) => coincide(f) && (usadas[i] ?? 0) < f.cajas)
  if (disponible >= 0) return { ok: true, fila: disponible }

  if (filas.some(coincide)) {
    return {
      ok: false,
      titulo: 'Caja ya escaneada',
      motivo: 'Ya se escanearon todas las cajas del origen que llevan esta etiqueta.',
    }
  }

  const conEtiquetas = (n: number) => `${n} ${n === 1 ? 'etiqueta' : 'etiquetas'}`
  const nombre = tipo === 'saldo' ? 'caja de saldo' : 'caja completa'
  const enCajas = [
    ...new Set(
      filas
        .filter((f) => f.piezas.some((p) => clave(p) === buscada))
        .map((f) => `${f.tipo === 'incompleta' ? 'de saldo' : 'completa'} de ${conEtiquetas(f.piezas.length)}`),
    ),
  ]
  return {
    ok: false,
    titulo: 'Caja no encontrada',
    motivo:
      enCajas.length === 0
        ? `No hay una ${nombre} de ${conEtiquetas(etiquetas)} con lote ${etiqueta.lote} y traza ${etiqueta.traza} en el pallet origen.`
        : `No hay una ${nombre} de ${conEtiquetas(etiquetas)} con esta etiqueta. Está en una caja ${enCajas.join(' o en una caja ')}.`,
  }
}
