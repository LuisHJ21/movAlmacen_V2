export interface User {
  username: string
  fullName: string
  profile: string
}

export interface LoginCredentials {
  username: string
  password: string
  remember: boolean
}

/** Respuesta cruda de POST /login */
export interface ApiLoginResponse {
  success: boolean
  data: {
    COD_USR: string
    NOMBRE: string
    PERFIL: string
  }
  access_token: string
  token_type: string
  expires_in: number
}

/** Error devuelto por la API: { error, code } */
export interface ApiError {
  error?: string
  code?: string
  message?: string
}

export interface LoginResult {
  token: string
  user: User
  /** Fecha de expiración del token en milisegundos (epoch) */
  expiresAt: number
}

export interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}
