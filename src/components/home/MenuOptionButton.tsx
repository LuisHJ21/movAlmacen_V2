import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { MenuOption } from './menuOptions'

export type MenuTone = 'operacion' | 'consulta' | 'anulacion'

interface MenuOptionButtonProps extends MenuOption {
  tone: MenuTone
}

const toneClasses: Record<MenuTone, { card: string; barra: string; icono: string; flecha: string; marca: string }> = {
  operacion: {
    card: 'border-primary-border/70 bg-primary-soft hover:border-primary-border active:border-primary',
    barra: 'bg-primary',
    icono: 'bg-primary',
    flecha: 'bg-primary-muted text-primary',
    marca: 'text-primary/10',
  },
  consulta: {
    card: 'border-primary-border/70 bg-primary-soft hover:border-primary-border active:border-primary',
    barra: 'bg-primary',
    icono: 'bg-primary',
    flecha: 'bg-primary-muted text-primary',
    marca: 'text-primary/10',
  },
  anulacion: {
    card: 'border-destructive-border/70 bg-destructive-soft hover:border-destructive-border active:border-destructive',
    barra: 'bg-destructive',
    icono: 'bg-destructive',
    flecha: 'bg-destructive-muted text-destructive',
    marca: 'text-destructive/10',
  },
}

/**
 * Tarjeta de opción en tono suave: barra de color a la izquierda, ícono sólido, título y descripción,
 * flecha en círculo claro y el ícono como ilustración tenue en la esquina.
 */
export function MenuOptionButton({ label, description, path, Icon, tone }: MenuOptionButtonProps) {
  const t = toneClasses[tone]

  return (
    <Link
      to={path}
      className={`group relative isolate flex h-full min-h-24 items-center gap-2 overflow-hidden rounded-xl border py-3 pr-2 pl-3.5 shadow-sm transition-[border-color,transform] duration-150 active:scale-[0.98] ${t.card}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${t.barra}`} />
      {/* Ilustración tenue en la esquina inferior derecha */}
      <Icon aria-hidden strokeWidth={1.5} className={`absolute -right-2 -bottom-3 -z-10 size-20 ${t.marca}`} />

      <span className={`grid size-11 shrink-0 place-items-center self-start rounded-xl text-white shadow-sm ${t.icono}`}>
        <Icon aria-hidden className="size-6" strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1 self-start">
        <span className="block font-heading text-base leading-tight font-bold tracking-tight text-foreground">{label}</span>
        <span className="mt-1 block text-sm leading-snug text-muted-foreground">{description}</span>
      </span>

      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full transition-transform duration-150 group-hover:translate-x-0.5 ${t.flecha}`}
      >
        <ChevronRight aria-hidden className="size-4" strokeWidth={2.5} />
      </span>
    </Link>
  )
}
