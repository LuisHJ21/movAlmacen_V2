import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { menuOptions } from '@/components/home/menuOptions'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import ComingSoonPage from '@/pages/ComingSoonPage'

/** Solo usuarios autenticados; si no, redirige al login recordando la ruta */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Solo usuarios sin sesión (ej. login) */
function PublicRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />
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
            {/* Reemplazar por cada página conforme se construya */}
            {menuOptions.map(({ path }) => (
              <Route key={path} path={path} element={<ComingSoonPage />} />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
