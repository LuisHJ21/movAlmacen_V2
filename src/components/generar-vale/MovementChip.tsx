import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import type { Movement } from '@/interfaces/movimiento.interface'
import { toSentenceCase } from '@/utils/format'

export function MovementChip({ movement }: { movement: Movement }) {
  const Icon = movement.tipo === 'ING' ? ArrowDownToLine : ArrowUpFromLine
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Icon aria-hidden className="size-5 shrink-0 text-primary" />
      <span className="font-mono font-bold">{movement.codigo}</span>
      <span className="min-w-0 truncate text-sm text-muted-foreground">{toSentenceCase(movement.nombre)}</span>
    </div>
  )
}
