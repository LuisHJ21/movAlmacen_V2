import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { MenuOption } from './menuOptions'

/** Tarjeta sólida: naranja para operaciones, roja para anulaciones */
export function MenuOptionButton({ label, description, path, Icon, destructive }: MenuOption) {
  return (
    <Link
      to={path}
      className={`flex min-h-18 items-center gap-4 rounded-xl border px-4 py-3 text-on-primary transition-colors duration-150 sm:min-h-20 ${
        destructive
          ? 'border-destructive-hover bg-destructive hover:bg-destructive-hover active:bg-destructive-hover'
          : 'border-primary-hover bg-primary hover:bg-primary-hover active:bg-primary-hover'
      }`}
    >
      <Icon aria-hidden className="size-7 shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-[1.0625rem] leading-snug font-bold tracking-tight sm:text-lg">
          {label}
        </span>
        <span className="mt-0.5 block text-sm text-white/90">{description}</span>
      </span>
      <ArrowRight aria-hidden className="size-6 shrink-0" />
    </Link>
  )
}
