import type { LoginCredentials } from '@/interfaces/auth.interface'
import type { MovementKind } from '@/interfaces/movimiento.interface'
import type { Pallet } from '@/interfaces/pallet.interface'

export type LoginErrors = Partial<Record<'username' | 'password', string>>

export function validateLogin({ username, password }: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {}

  if (!username.trim()) errors.username = 'Ingresa tu usuario'
  if (!password) errors.password = 'Ingresa tu contraseña'

  return errors
}

/** Normaliza lo leído por el lector: sin espacios ni saltos y en mayúsculas */
export function normalizeScanCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

/** Código de pallet: 2 alfanuméricos + 8 dígitos (ej. PA00000001) */
export const PALLET_CODE_PATTERN = /^[A-Z0-9]{2}\d{8}$/
export const PALLET_CODE_LENGTH = 10

/**
 * Tipo de movimiento permitido para un pallet:
 * - Con almacén y ubicación → ya está en almacén: solo salida
 * - En cualquier otro caso → solo ingreso
 */
export function getAllowedMovementKind(pallet: Pallet): MovementKind {
  return pallet.warehouse && pallet.location ? 'SAL' : 'ING'
}

export function validatePalletCode(code: string): string | undefined {
  if (!code) return 'Escanea o escribe el código del pallet'
  if (code.length !== PALLET_CODE_LENGTH) return `El código debe tener ${PALLET_CODE_LENGTH} caracteres`
  if (!PALLET_CODE_PATTERN.test(code)) return 'Formato inválido: 2 letras o números + 8 dígitos'
  return undefined
}
