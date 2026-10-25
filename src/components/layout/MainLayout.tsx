import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

/** Estructura de las páginas con sesión: Navbar + contenido */
export function MainLayout() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
