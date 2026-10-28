import type { CajaEscaneada } from '@/components/transferencia-pallet/CajasEscaneadasList'
import type { TransferPalletDetalle, TransferPalletRequest } from '@/interfaces/transferPallet.interface'

/**
 * Detalle del guardado: kg por OT y traza, sumando las piezas de todas las cajas escaneadas.
 * Una caja completa aporta su peso; una mixta o de saldo, lo que aporta cada ítem.
 */
export function detalleTraslado(cajas: CajaEscaneada[], articulo: string): TransferPalletDetalle[] {
  const porClave = new Map<string, TransferPalletDetalle>()
  for (const p of cajas.flatMap((c) => c.piezas)) {
    const clave = `${p.ot}\u0000${p.traza}`
    const actual = porClave.get(clave) ?? { ot: p.ot, traza: p.traza, peso: 0, articulo }
    actual.peso += p.peso
    porClave.set(clave, actual)
  }
  // Redondeo a 4 decimales para no enviar errores de punto flotante (0.1 + 0.2)
  return [...porClave.values()].map((d) => ({ ...d, peso: Math.round(d.peso * 10_000) / 10_000 }))
}

export function buildTransferPalletRequest(params: {
  palletO: string
  palletD: string
  usuario: string
  articulo: string
  cajas: CajaEscaneada[]
}): TransferPalletRequest {
  return {
    palletO: params.palletO,
    palletD: params.palletD,
    usuario: params.usuario,
    detalle: detalleTraslado(params.cajas, params.articulo),
  }
}
