import type { ParteUbicacion } from '@/interfaces/ubicacion.interface'

export interface ParteUbicacionInfo {
  parte: ParteUbicacion
  /** Título del paso */
  titulo: string
  /** Etiqueta corta para el código armado */
  etiqueta: string
  /** Caracteres que ocupa en el código */
  largo: number
  /** Columnas de la grilla de opciones */
  columnas: 2 | 3 | 4
}

/**
 * Formato del código de ubicación, ej. C4I03204:
 * C4 código (ubicación física del almacén) · I lado · 03 columna · 2 nivel (fila) · 04 profundidad
 */
export const PARTES_UBICACION: ParteUbicacionInfo[] = [
  { parte: 'codigo', titulo: 'Código de ubicación', etiqueta: 'Código', largo: 2, columnas: 2 },
  { parte: 'lado', titulo: 'Lado', etiqueta: 'Lado', largo: 1, columnas: 2 },
  { parte: 'columna', titulo: 'Columna', etiqueta: 'Col.', largo: 2, columnas: 4 },
  { parte: 'nivel', titulo: 'Nivel', etiqueta: 'Nivel', largo: 1, columnas: 4 },
  { parte: 'profundidad', titulo: 'Profundidad', etiqueta: 'Prof.', largo: 2, columnas: 3 },
]

/** Nivel de /ubicacion/filtro para el paso de índice `paso` (0 = código): siempre partes elegidas + 1 */
export const nivelFiltro = (paso: number) => paso + 1

/** "C4I03204" → ["C4", "I", "03", "2", "04"] (solo las partes presentes) */
export function separarCodigoUbicacion(codigo: string): string[] {
  const partes: string[] = []
  let inicio = 0
  for (const { largo } of PARTES_UBICACION) {
    const parte = codigo.slice(inicio, inicio + largo)
    if (!parte) break
    partes.push(parte)
    inicio += largo
  }
  return partes
}

/** Parte que agrega una opción respecto al código ya armado (ej. "C1D01" sobre "C1D" → "01") */
export const segmentoNuevo = (codigo: string, prefijo: string) => codigo.slice(prefijo.length)
