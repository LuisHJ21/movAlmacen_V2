export interface User {
  usuario: string
  nombre: string
  perfil: string
}

export interface LoginCredentials {
  usuario: string
  clave: string
  recordar: boolean
}

export interface ApiLoginResponse {
  success: boolean
  data: {
    codUsr: string
    nombre: string
    perfil: string
  }
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface ApiError {
  error?: string
  code?: string
  message?: string
}

export interface LoginResult {
  token: string
  usuario: User
  expiraEn: number
}

export interface AuthContextValue {
  usuario: User | null
  token: string | null
  autenticado: boolean
  cargando: boolean
  iniciarSesion: (credentials: LoginCredentials) => Promise<void>
  cerrarSesion: () => void
}
