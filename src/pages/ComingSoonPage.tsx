import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import { menuOptions } from '@/components/home/menuOptions'

// Página temporal para las opciones del menú que aún no se construyen
export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const option = menuOptions.find((o) => o.path === pathname)

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Construction aria-hidden className="size-8" />
      </span>
      <h1 className="mt-4 text-xl font-bold">{option?.label}</h1>
      <p className="mt-1 text-muted-foreground">Esta opción está en construcción.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-touch items-center gap-2 rounded-lg border-2 border-border-strong bg-card px-5 font-heading font-semibold text-foreground transition-colors duration-150 hover:bg-muted active:bg-muted"
      >
        <ArrowLeft aria-hidden className="size-5" />
        Volver al inicio
      </Link>
    </div>
  )
}
