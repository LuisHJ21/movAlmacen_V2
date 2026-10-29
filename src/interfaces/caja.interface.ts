export interface EtiquetaCaja {
  codArt: string
  ot: string
  fecha: string
  traza: string
  lote: string
}

export interface ApiLeerCajaResponse {
  success: boolean
  data: EtiquetaCaja & {
    cifrado: boolean
  }
}
