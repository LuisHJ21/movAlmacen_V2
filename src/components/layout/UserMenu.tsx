import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { usuario: user, cerrarSesion: logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const logoutRef = useRef<HTMLButtonElement>(null)

  // Al abrir: foco en la acción; al tocar fuera o con Escape: cierra y regresa el foco
  useEffect(() => {
    if (!open) return
    logoutRef.current?.focus()

    const handlePointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        aria-label={`Menú de usuario: ${user.nombre}`}
        className="grid size-touch place-items-center rounded-full transition-opacity duration-150 focus-visible:outline-white active:opacity-80"
      >
        <Avatar name={user.nombre} />
      </button>

      {open && (
        <div
          id="user-menu"
          role="menu"
          aria-label="Opciones de usuario"
          className="absolute top-full right-0 z-20 mt-1 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-stone-900/15"
        >
          {/* Usuario en una fila: iniciales + nombre + usuario y perfil */}
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Avatar name={user.nombre} neutral />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm leading-tight font-semibold text-foreground">{user.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{user.usuario}</span> · {user.perfil}
              </p>
            </div>
          </div>
          {/* Fila de menú (no botón): lo único con color es el texto rojo de salir */}
          <button
            ref={logoutRef}
            type="button"
            role="menuitem"
            onClick={logout}
            className="flex h-touch w-full items-center gap-2.5 border-t border-border px-3 text-left font-heading text-sm font-semibold text-destructive transition-colors duration-150 hover:bg-destructive-soft active:bg-destructive-soft"
          >
            <span className="grid size-11 shrink-0 place-items-center">
              <LogOut aria-hidden className="size-5" />
            </span>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
