import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react'
import type { AuthContextValue, LoginCredentials, User } from '@/interfaces/auth.interface'
import { authService } from '@/services/auth.service'
import { storageService } from '@/services/storage.service'

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // El token se lee primero: si expiró, getToken limpia la sesión completa
  const [token, setToken] = useState<string | null>(() => storageService.getToken())
  const [user, setUser] = useState<User | null>(() => storageService.getUser())
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const result = await authService.login(credentials)
      storageService.saveSession(result, credentials.remember)
      setToken(result.token)
      setUser(result.user)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    storageService.clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: !!token && !!user, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
