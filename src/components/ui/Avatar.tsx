import { getInitials } from '@/utils/format'

type Size = 'sm' | 'lg'

const sizes: Record<Size, string> = {
  sm: 'size-11 text-sm',
  lg: 'size-16 text-xl',
}

/** Esfera con las iniciales del usuario */
export function Avatar({ name, size = 'sm' }: { name: string; size?: Size }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full border border-primary-border bg-primary-soft font-heading font-semibold text-primary-hover ${sizes[size]}`}
    >
      {getInitials(name)}
    </span>
  )
}
