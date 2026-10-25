import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { menuOptions } from '@/components/home/menuOptions'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import ComingSoonPage from '@/pages/ComingSoonPage'
import GenerarValePage from '@/pages/GenerarValePage'

/** Rutas del menú que ya tienen página propia */
const builtPaths = ['/generar-vale']

/** Solo usuarios autenticados; si no, redirige al login recordando la ruta */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Solo usuarios sin sesión (ej. login). Al iniciar sesión vuelve a la ruta que se intentó abrir. */
function PublicRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  return isAuthenticated ? <Navigate to={from} replace /> : <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/generar-vale" element={<GenerarValePage />} />
            {/* Opciones aún sin página */}
            {menuOptions
              .filter(({ path }) => !builtPaths.includes(path))
              .map(({ path }) => (
                <Route key={path} path={path} element={<ComingSoonPage />} />
              ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
