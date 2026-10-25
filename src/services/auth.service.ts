import { axiosClient } from '@/api/axiosClient'
import type { ApiLoginResponse, LoginCredentials, LoginResult } from '@/interfaces/auth.interface'

export const authService = {
  async login({ username, password }: LoginCredentials): Promise<LoginResult> {
    const { data } = await axiosClient.post<ApiLoginResponse>('/login', {
      usuario: username,
      clave: password,
    })

    if (!data.success || !data.access_token) throw new Error('No fue posible iniciar sesión')

    return {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      user: {
        username: data.data.COD_USR,
        fullName: data.data.NOMBRE,
        profile: data.data.PERFIL,
      },
    }
  },
}
