import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/interfaces/auth.interface'
import { storageService } from '@/services/storage.service'
import { camelizeKeys } from '@/utils/mapper'

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost/movalmacen/api2',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta el token a cada petición
axiosClient.interceptors.request.use((config) => {
  const token = storageService.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Las respuestas (también las de error) llegan con claves en MAYÚSCULAS_SNAKE: se pasan a camelCase.
// Sesión expirada: limpia y regresa al login
axiosClient.interceptors.response.use(
  (response) => {
    response.data = camelizeKeys(response.data)
    return response
  },
  (error: AxiosError) => {
    if (error.response) error.response.data = camelizeKeys(error.response.data)
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/login')) {
      storageService.clearSession()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

/** Extrae un mensaje legible de un error de la API */
export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor'
    const data = error.response.data
    const message = data?.error ?? data?.message
    // Los mensajes de Oracle separan líneas con \r: se normalizan a \n (la UI los muestra en líneas)
    return message ? message.replace(/\r\n?/g, '\n').trim() : fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
