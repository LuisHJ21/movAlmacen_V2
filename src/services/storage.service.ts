import type { LoginResult, User } from '@/interfaces/auth.interface'

const TOKEN_KEY = 'movalmacen.token'
// v2: el usuario se guarda con propiedades en español; las sesiones con el formato anterior piden login otra vez
const USER_KEY = 'movalmacen.usuario'
const EXPIRES_KEY = 'movalmacen.expiresAt'

/**
 * "Recordarme" guarda en localStorage; de lo contrario la sesión
 * vive solo en sessionStorage y se pierde al cerrar el navegador.
 */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function isExpired(): boolean {
  const expiresAt = Number(read(EXPIRES_KEY))
  return !expiresAt || Date.now() >= expiresAt
}

export const storageService = {
  /** Devuelve el token solo si no ha expirado */
  getToken(): string | null {
    if (isExpired()) {
      this.clearSession()
      return null
    }
    return read(TOKEN_KEY)
  },

  getUser(): User | null {
    const raw = read(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  },

  /** Vencimiento del token en ms (epoch); null si no hay sesión */
  getExpiresAt(): number | null {
    return Number(read(EXPIRES_KEY)) || null
  },

  /** Reemplaza token, usuario y vencimiento tras renovar, en el mismo almacenamiento ("Recordarme") */
  updateSession({ token, usuario: user, expiraEn: expiresAt }: LoginResult): void {
    try {
      const storage = localStorage.getItem(TOKEN_KEY) !== null ? localStorage : sessionStorage
      storage.setItem(TOKEN_KEY, token)
      storage.setItem(USER_KEY, JSON.stringify(user))
      storage.setItem(EXPIRES_KEY, String(expiresAt))
    } catch {
      /* almacenamiento no disponible */
    }
  },

  saveSession({ token, usuario: user, expiraEn: expiresAt }: LoginResult, remember: boolean): void {
    this.clearSession()
    const storage = remember ? localStorage : sessionStorage
    try {
      storage.setItem(TOKEN_KEY, token)
      storage.setItem(USER_KEY, JSON.stringify(user))
      storage.setItem(EXPIRES_KEY, String(expiresAt))
    } catch {
      /* almacenamiento no disponible */
    }
  },

  clearSession(): void {
    try {
      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem(TOKEN_KEY)
        storage.removeItem(USER_KEY)
        storage.removeItem(EXPIRES_KEY)
      }
    } catch {
      /* almacenamiento no disponible */
    }
  },
}
