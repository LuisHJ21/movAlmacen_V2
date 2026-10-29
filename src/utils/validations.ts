import type { LoginCredentials } from '@/interfaces/auth.interface'

export type LoginErrors = Partial<Record<'usuario' | 'clave', string>>

export function validateLogin({ usuario, clave }: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {}

  if (!usuario.trim()) errors.usuario = 'Ingresa tu usuario'
  if (!clave) errors.clave = 'Ingresa tu contraseña'

  return errors
}

export function normalizeScanCode(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

export const PALLET_CODE_PATTERN = /^[A-Z0-9]{2}\d{8}$/
export const PALLET_CODE_LENGTH = 10

export function validatePalletCode(code: string): string | undefined {
  if (!code) return 'Escanea o escribe el código del pallet'
  if (code.length !== PALLET_CODE_LENGTH) return `El código debe tener ${PALLET_CODE_LENGTH} caracteres`
  if (!PALLET_CODE_PATTERN.test(code)) return 'Formato inválido: 2 letras o números + 8 dígitos'
  return undefined
}
