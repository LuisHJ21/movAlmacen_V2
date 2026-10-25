import { useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'
import { Lock, LogIn, User } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/api/axiosClient'
import type { LoginCredentials } from '@/interfaces/auth.interface'
import { validateLogin, type LoginErrors } from '@/utils/validations'

interface LoginFormProps {
  onSuccess: () => void
}

type Field = keyof LoginErrors

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoading } = useAuth()
  const [form, setForm] = useState<LoginCredentials>({ username: '', password: '', remember: false })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (name in errors) setErrors((prev) => ({ ...prev, [name]: undefined }))
    setServerError(null)
  }

  // Valida el campo al salir de él
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const field = e.target.name as Field
    setErrors((prev) => ({ ...prev, [field]: validateLogin(form)[field] }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validation = validateLogin(form)
    setErrors(validation)
    if (validation.username) return usernameRef.current?.focus()
    if (validation.password) return passwordRef.current?.focus()

    try {
      await login({ ...form, username: form.username.trim() })
      onSuccess()
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'No fue posible iniciar sesión'))
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {serverError && (
        <Alert type="error" onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      <Input
        ref={usernameRef}
        label="Usuario"
        name="username"
        icon={User}
        placeholder="Ej. jperez"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        value={form.username}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.username}
        disabled={isLoading}
      />

      <Input
        ref={passwordRef}
        label="Contraseña"
        name="password"
        type="password"
        icon={Lock}
        placeholder="Tu contraseña"
        autoComplete="current-password"
        enterKeyHint="go"
        value={form.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        disabled={isLoading}
      />

      <label className="flex h-touch cursor-pointer items-center gap-3 text-base text-foreground select-none">
        <input
          type="checkbox"
          name="remember"
          checked={form.remember}
          onChange={handleChange}
          className="size-5 cursor-pointer rounded accent-primary"
        />
        Recordarme en este equipo
      </label>

      <Button type="submit" fullWidth isLoading={isLoading} icon={<LogIn aria-hidden className="size-5" />}>
        {isLoading ? 'Ingresando…' : 'Iniciar sesión'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Olvidaste tu contraseña? Contacta a tu supervisor.
      </p>
    </form>
  )
}
