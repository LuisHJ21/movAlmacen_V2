import { OptionList } from '@/components/ui/OptionList'
import type { Pallet } from '@/interfaces/pallet.interface'
import { PalletChip } from './PalletChip'

interface ArticleStepProps {
  pallet: Pallet
  initialArticle?: string | null
  onConfirm: (articleCode: string) => void
}

/** Solo aparece cuando el pallet contiene más de un artículo. Tocar un artículo avanza. */
export function ArticleStep({ pallet, initialArticle = null, onConfirm }: ArticleStepProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <PalletChip pallet={pallet} />
        <p className="text-sm text-muted-foreground">
          Este pallet contiene {pallet.articulos.length} artículos. Elige con cuál continuar.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-4">
        <OptionList
          legend="Artículo"
          name="article"
          items={pallet.articulos.map((code) => ({ key: code, title: code }))}
          selectedKey={initialArticle}
          onSelect={onConfirm}
          searchPlaceholder="Buscar artículo"
        />
      </div>
    </div>
  )
}
