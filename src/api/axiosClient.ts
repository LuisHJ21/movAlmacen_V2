import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/interfaces/auth.interface'
import { storageService } from '@/services/storage.service'
import { camelizeKeys } from '@/utils/mapper'

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost/movalmacen/api2',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = storageService.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosClient.interceptors.response.use(
  (response) => {
    response.data = camelizeKeys(response.data)
    return response
  },
  (error: AxiosError) => {
    if (error.response) error.response.data = camelizeKeys(error.response.data)
    if (error.response?.status === 401 && !error.config?.url?.endsWith('/login')) {
      storageService.clearSession()
      window.location.assign(`${import.meta.env.BASE_URL}login`)
    }
    return Promise.reject(error)
  },
)

export const SAVE_TIMEOUT_MS = 120_000

export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor'
    const data = error.response.data
    const message = data?.error ?? data?.message
    return message ? message.replace(/\r\n?/g, '\n').trim() : fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}
