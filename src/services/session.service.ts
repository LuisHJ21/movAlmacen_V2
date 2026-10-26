import type { LoginResult } from '@/interfaces/auth.interface'
import { authService } from './auth.service'
import { storageService } from './storage.service'

/** Se renueva cuando al token le quedan menos de 15 minutos */
const RENEW_MARGIN_MS = 15 * 60 * 1000

let renewing: Promise<void> | null = null
/**
 * Vencimiento que la API ya no extiende: llegó al tope de sesión (JWT_MAX_SESSION).
 * Evita pedir /refresh en cada petición durante los últimos minutos.
 */
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
      // Si el vencimiento casi no avanzó, la API llegó al tope: no se vuelve a intentar con este token
      if (result.expiraEn - expiresAt < 60 * 1000) cappedAt = result.expiraEn
      storageService.updateSession(result)
      onRenewed(result)
    })
    .catch(() => {
      /* Error de red: se reintenta con la siguiente petición */
    })
    .finally(() => {
      renewing = null
    })
}
