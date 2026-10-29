export interface TransferPalletRequest {
  palletO: string
  palletD: string
  usuario: string
  detalle: TransferPalletDetalle[]
}

export interface TransferPalletDetalle {
  ot: string
  traza: string
  peso: number
  articulo: string
}

export interface ApiTransferPalletResponse {
  success: boolean
  message?: string
}
