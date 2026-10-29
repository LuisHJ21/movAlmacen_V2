import type { LoginResult, User } from '@/interfaces/auth.interface'

const TOKEN_KEY = 'movalmacen.token'
const USER_KEY = 'movalmacen.usuario'
const EXPIRES_KEY = 'movalmacen.expiresAt'

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

  getExpiresAt(): number | null {
    return Number(read(EXPIRES_KEY)) || null
  },

  updateSession({ token, usuario: user, expiraEn: expiresAt }: LoginResult): void {
    try {
      const storage = localStorage.getItem(TOKEN_KEY) !== null ? localStorage : sessionStorage
      storage.setItem(TOKEN_KEY, token)
      storage.setItem(USER_KEY, JSON.stringify(user))
      storage.setItem(EXPIRES_KEY, String(expiresAt))
    } catch {
      return
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
      return
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
      return
    }
  },
}
