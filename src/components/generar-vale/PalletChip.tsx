import { Package } from 'lucide-react'
import type { Pallet } from '@/interfaces/pallet.interface'
import { formatCount, formatWeight } from '@/utils/format'

interface PalletChipProps {
  pallet: Pallet
  /** Artículo elegido del pallet */
  articleCode?: string | null
  articleDescription?: string
}

/** Resumen compacto del pallet en curso (pasos 2 en adelante) */
export function PalletChip({ pallet, articleCode, articleDescription }: PalletChipProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-3">
        <Package aria-hidden className="size-5 shrink-0 text-primary" />
        <span className="font-mono font-bold tracking-wider">{pallet.codigo}</span>
        <span className="ml-auto text-sm whitespace-nowrap text-muted-foreground">
          {formatCount(pallet.bultos)} bultos · {formatWeight(pallet.peso)}
        </span>
      </div>
      {articleCode && (
        <p className="mt-0.5 truncate pl-8 text-sm text-muted-foreground">
          Art. <span className="font-mono font-semibold text-foreground">{articleCode}</span>
          {articleDescription && ` · ${articleDescription}`}
        </p>
      )}
    </div>
  )
}
