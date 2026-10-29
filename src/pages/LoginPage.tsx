import { useLocation, useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/login/LoginForm'
import { Logo } from '@/components/ui/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-card px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <header className="mb-10">
          <Logo variant="stacked" />
          <h1 className="sr-only">Iniciar sesión en MovAlmacén</h1>
        </header>

        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
      </div>
    </main>
  )
}
