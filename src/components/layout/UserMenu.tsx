import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const { user, logout } = useAuth()
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
        aria-label={`Menú de usuario: ${user.fullName}`}
        className="grid size-touch place-items-center rounded-full transition-opacity duration-150 active:opacity-80"
      >
        <Avatar name={user.fullName} />
      </button>

      {open && (
        <div
          id="user-menu"
          role="menu"
          aria-label="Opciones de usuario"
          className="absolute top-full right-0 z-20 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-stone-900/10"
        >
          <div className="flex flex-col items-center gap-3 px-5 pt-6 pb-5 text-center">
            <Avatar name={user.fullName} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-semibold text-foreground">{user.fullName}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {user.username} · {user.profile}
              </p>
            </div>
          </div>
          <div className="border-t border-border p-2">
            <button
              ref={logoutRef}
              type="button"
              role="menuitem"
              onClick={logout}
              className="flex h-touch w-full items-center justify-center gap-2 rounded-lg font-heading font-semibold text-destructive transition-colors duration-150 hover:bg-destructive-soft active:bg-destructive-soft"
            >
              <LogOut aria-hidden className="size-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
