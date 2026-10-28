import { getInitials } from '@/utils/format'

type Size = 'sm' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'size-11 text-sm',
  lg: 'size-16 text-xl',
}

/** Esfera con las iniciales del usuario. neutral: gris, para no competir con acciones de color (ej. menú de usuario) */
export function Avatar({ name, size = 'sm', neutral = false }: { name: string; size?: Size; neutral?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border font-heading font-semibold ${
        neutral ? 'border-border bg-muted text-muted-foreground' : 'border-primary-border bg-primary-soft text-primary-hover'
      } ${sizes[size]}`}
    >
      {getInitials(name)}
    </span>
  )
}
