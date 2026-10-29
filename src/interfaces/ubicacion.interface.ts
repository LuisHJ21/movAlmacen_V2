export interface ApiUbicacionFiltroResponse {
  success: boolean
  data: Array<{
    codRack: string
    totalUbic: string
    dispUbic: string
    porcentaje: number
  }>
}

export interface ApiUbicacionesResponse {
  success: boolean
  data: Array<{
    codRack: string
    origenRack: string
    flagMulti: string
  }>
}

export interface UbicacionOpcion {
  codigo: string
  total: number
  disponibles: number
  multiple?: boolean
}

export interface AsignarUbicacionRequest {
  codUbicacion: string
  pallet: string
  usuario: string
  almacenDest: string
}

export interface ApiAsignarUbicacionResponse {
  success: boolean
  message?: string
}

export type ParteUbicacion = 'codigo' | 'lado' | 'columna' | 'nivel' | 'profundidad'
