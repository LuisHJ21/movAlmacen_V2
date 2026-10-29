import type { ParteUbicacion } from '@/interfaces/ubicacion.interface'

export interface ParteUbicacionInfo {
  parte: ParteUbicacion
  titulo: string
  etiqueta: string
  largo: number
  columnas: 2 | 3 | 4
}

export const PARTES_UBICACION: ParteUbicacionInfo[] = [
  { parte: 'codigo', titulo: 'Código de ubicación', etiqueta: 'Código', largo: 2, columnas: 2 },
  { parte: 'lado', titulo: 'Lado', etiqueta: 'Lado', largo: 1, columnas: 2 },
  { parte: 'columna', titulo: 'Columna', etiqueta: 'Col.', largo: 2, columnas: 4 },
  { parte: 'nivel', titulo: 'Nivel', etiqueta: 'Nivel', largo: 1, columnas: 4 },
  { parte: 'profundidad', titulo: 'Profundidad', etiqueta: 'Prof.', largo: 2, columnas: 3 },
]

export const nivelFiltro = (paso: number) => paso + 1

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

export const segmentoNuevo = (codigo: string, prefijo: string) => codigo.slice(prefijo.length)
