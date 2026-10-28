/** Cuerpo de POST /transferPallet: cajas escaneadas que pasan del pallet origen al destino */
export interface TransferPalletRequest {
  palletO: string
  palletD: string
  usuario: string
  detalle: TransferPalletDetalle[]
}

/** Kg de una traza y OT que se trasladan (suma de las piezas escaneadas con esa traza y OT) */
export interface TransferPalletDetalle {
  ot: string
  traza: string
  /** Kg con hasta 4 decimales */
  peso: number
  articulo: string
}

/** Respuesta de POST /transferPallet */
export interface ApiTransferPalletResponse {
  success: boolean
  message?: string
}
