export const ESTADO_PALLET_ANULADO = '0'

const ESTADOS_PALLET: Record<string, string> = {
  '0': 'Anulado',
  '1': 'Completo',
  '2': 'Incompleto',
  '3': 'Mixto',
  '4': 'Cerrado',
}

export function nombreEstadoPallet(estado: string): string {
  return ESTADOS_PALLET[estado] ?? estado
}
