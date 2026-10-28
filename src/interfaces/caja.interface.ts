/** Datos de la etiqueta (QR) de una caja: codigo_art|ot|fecha_prod|trazabilidad|lote */
export interface EtiquetaCaja {
  codArt: string
  ot: string
  fecha: string
  traza: string
  lote: string
}

/** Respuesta de POST /caja/leer (claves ya en camelCase, ver utils/mapper) */
export interface ApiLeerCajaResponse {
  success: boolean
  data: EtiquetaCaja & {
    /** El QR venía cifrado y la API lo desencriptó */
    cifrado: boolean
  }
}
