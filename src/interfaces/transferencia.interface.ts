export interface TransferenciaRequest {
  usuario: string
  pallet: string
  detalles: TransferenciaDetalleRequest[]
  fechaReg: string
  almOrigen: string
  almDestino: string
  observaciones: string
  idFormI: string
  idFormS: string
  ubicacion: string
}

export interface TransferenciaDetalleRequest {
  codArt: string
  item: string
  peso: string
  fecha: string
  lote: string
  traza: string
  numPallet: string
  pesoUnd: string
  loteOrg: string
  loteDest: string
  matriz: string
}

export interface ApiTransferenciaResponse {
  success: boolean
  message?: string
  vales?: string[]
}
