/** Cuerpo de POST /transferencia: genera un vale de salida (origen) y uno de ingreso (destino) */
export interface TransferenciaRequest {
  usuario: string
  pallet: string
  detalles: TransferenciaDetalleRequest[]
  /** "YYYY-MM-DDTHH:mm" en hora local: fecha y hora en que se cargó la transferencia */
  fechaReg: string
  almOrigen: string
  almDestino: string
  observaciones: string
  /** Id del formulario del vale de ingreso (ver generateFormId) */
  idFormI: string
  /** Id del formulario del vale de salida (ver generateFormId) */
  idFormS: string
  /** Ubicación del pallet en el destino (ej. "C4D01106"); '' si el destino no maneja ubicaciones */
  ubicacion: string
}

/** Un ítem del pallet (todos se transfieren) */
export interface TransferenciaDetalleRequest {
  codArt: string
  item: string
  /** Kilos con hasta 4 decimales, como texto */
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

/** Respuesta de POST /transferencia: { success: true, vales: [valeSalida, valeIngreso] } */
export interface ApiTransferenciaResponse {
  success: boolean
  message?: string
  vales?: string[]
}
