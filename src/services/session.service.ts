import type { LoginResult } from '@/interfaces/auth.interface'
import { authService } from './auth.service'
import { storageService } from './storage.service'

const RENEW_MARGIN_MS = 15 * 60 * 1000

let renewing: Promise<void> | null = null
let cappedAt: number | null = null

/**
 * Sesión deslizante: tras cada respuesta de la API (actividad), si el token está por vencer
 * se pide uno nuevo una sola vez. Sin actividad el token vence y se vuelve a iniciar sesión.
 * Un 401 de /refresh (usuario desactivado o token vencido) lo maneja el interceptor de axios.
 */
export function renewSessionIfNeeded(onRenewed: (result: LoginResult) => void): void {
  const expiresAt = storageService.getExpiresAt()
  if (!expiresAt || renewing || cappedAt === expiresAt) return
  if (expiresAt - Date.now() > RENEW_MARGIN_MS) return

  renewing = authService
    .refresh()
    .then((result) => {
      if (result.expiraEn - expiresAt < 60 * 1000) cappedAt = result.expiraEn
      storageService.updateSession(result)
      onRenewed(result)
    })
    .catch(() => undefined)
    .finally(() => {
      renewing = null
    })
}
