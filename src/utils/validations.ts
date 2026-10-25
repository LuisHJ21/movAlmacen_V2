import type { LoginCredentials } from '@/interfaces/auth.interface'

export type LoginErrors = Partial<Record<'username' | 'password', string>>

export function validateLogin({ username, password }: LoginCredentials): LoginErrors {
  const errors: LoginErrors = {}

  if (!username.trim()) errors.username = 'Ingresa tu usuario'
  if (!password) errors.password = 'Ingresa tu contraseña'

  return errors
}
