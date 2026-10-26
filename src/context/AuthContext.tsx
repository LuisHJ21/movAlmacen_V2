import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { axiosClient } from '@/api/axiosClient'
import type { AuthContextValue, LoginCredentials, User } from '@/interfaces/auth.interface'
import { authService } from '@/services/auth.service'
import { renewSessionIfNeeded } from '@/services/session.service'
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
      storageService.saveSession(result, credentials.recordar)
      setToken(result.token)
      setUser(result.usuario)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cada respuesta de la API cuenta como actividad: renueva el token si está por vencer
  useEffect(() => {
    if (!token) return
    const interceptor = axiosClient.interceptors.response.use((response) => {
      if (!/\/(login|refresh)$/.test(response.config.url ?? '')) {
        renewSessionIfNeeded((result) => {
          setToken(result.token)
          setUser(result.usuario)
        })
      }
      return response
    })
    return () => axiosClient.interceptors.response.eject(interceptor)
  }, [token])

  const logout = useCallback(() => {
    storageService.clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ usuario: user, token, autenticado: !!token && !!user, cargando: isLoading, iniciarSesion: login, cerrarSesion: logout }),
    [user, token, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
