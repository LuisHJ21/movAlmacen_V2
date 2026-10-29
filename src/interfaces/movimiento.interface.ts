export type MovementTypeFilter = 'I' | 'S' | ''

export type MovementKind = 'ING' | 'SAL'

export interface ApiMovementTypesResponse {
  success: boolean
  data: Array<{
    codMov: string
    tipoMov: MovementKind
    nomMov: string
    claseMov: string
    fContabiliza: '0' | '1'
    fRef: '0' | '1'
    fSolcitaPlan: '0' | '1' | null
  }>
}

export interface Movement {
  codigo: string
  tipo: MovementKind
  nombre: string
  clase: string
  contabiliza: boolean
  requiereReferencia: boolean
  solicitaPlan: boolean
}
