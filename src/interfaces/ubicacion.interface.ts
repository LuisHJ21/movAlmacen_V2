/** Respuesta de GET /ubicacion/filtro (claves ya en camelCase, ver utils/mapper). La API responde 404 si no hay ubicaciones. */
export interface ApiUbicacionFiltroResponse {
  success: boolean
  data: Array<{
    /** Código armado hasta el nivel consultado (ej. "C1D01") */
    codRack: string
    totalUbic: string
    dispUbic: string
    porcentaje: number
  }>
}

/** Respuesta de GET /ubicacion (claves ya en camelCase): ubicaciones finales libres o multipallet. 404 si no hay. */
export interface ApiUbicacionesResponse {
  success: boolean
  data: Array<{
    /** Código completo (ej. "C4I08101") */
    codRack: string
    origenRack: string
    /** '1': admite varios pallets (aparece aunque ya tenga pallets) */
    flagMulti: string
  }>
}

/** Opción de un paso de la ubicación con su disponibilidad */
export interface UbicacionOpcion {
  /** Código armado hasta este paso (ej. "C1D01") */
  codigo: string
  /** Ubicaciones (posiciones finales) que contiene */
  total: number
  /** Posiciones libres */
  disponibles: number
  /** Ubicación final para varios pallets (FLAG_MULTI = 1) */
  multiple?: boolean
}

/** Partes del código de ubicación, en orden: C4 · I · 03 · 2 · 04 */
export type ParteUbicacion = 'codigo' | 'lado' | 'columna' | 'nivel' | 'profundidad'
