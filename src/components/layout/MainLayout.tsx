import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

/**
 * Estructura de las páginas con sesión: Navbar fijo + contenido.
 * Ocupa exactamente la ventana; el contenido se desplaza bajo el Navbar
 * y las páginas pueden usar flex-1 para llenar el alto disponible.
 */
export function MainLayout() {
  return (
    <div className="flex h-full flex-col">
      <Navbar />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
