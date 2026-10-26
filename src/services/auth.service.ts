import { axiosClient } from '@/api/axiosClient'
import type { ApiLoginResponse, LoginCredentials, LoginResult } from '@/interfaces/auth.interface'

/** Respuesta de /login o /refresh (mismo formato) → sesión de la app */
function toLoginResult(data: ApiLoginResponse, errorMessage: string): LoginResult {
  if (!data.success || !data.accessToken) throw new Error(errorMessage)

  return {
    token: data.accessToken,
    expiraEn: Date.now() + data.expiresIn * 1000,
    usuario: {
      usuario: data.data.codUsr,
      nombre: data.data.nombre,
      perfil: data.data.perfil,
    },
  }
}

export const authService = {
  async login({ usuario: username, clave: password }: LoginCredentials): Promise<LoginResult> {
    const { data } = await axiosClient.post<ApiLoginResponse>('/login', {
      usuario: username,
      clave: password,
    })
    return toLoginResult(data, 'No fue posible iniciar sesión')
  },

  /** Renueva el token vigente (la API identifica al usuario por el propio token) */
  async refresh(): Promise<LoginResult> {
    const { data } = await axiosClient.post<ApiLoginResponse>('/refresh')
    return toLoginResult(data, 'No fue posible renovar la sesión')
  },
}
