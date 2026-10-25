import { useState, type FormEvent } from 'react'
import { OptionList } from '@/components/ui/OptionList'
import type { Pallet } from '@/interfaces/pallet.interface'
import { PalletChip } from './PalletChip'
import { StepFooter } from './StepFooter'

interface ArticleStepProps {
  pallet: Pallet
  initialArticle?: string | null
  onConfirm: (articleCode: string) => void
}

/** Solo aparece cuando el pallet contiene más de un artículo */
export function ArticleStep({ pallet, initialArticle = null, onConfirm }: ArticleStepProps) {
  const [selected, setSelected] = useState<string | null>(initialArticle)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selected) onConfirm(selected)
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 px-4 pt-4">
        <PalletChip pallet={pallet} />
        <p className="text-sm text-muted-foreground">
          Este pallet contiene {pallet.articles.length} artículos. Elige con cuál continuar.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-4">
        <OptionList
          legend="Artículo"
          name="article"
          items={pallet.articles.map((code) => ({ key: code, title: code }))}
          selectedKey={selected}
          onSelect={setSelected}
          searchPlaceholder="Buscar artículo"
        />
      </div>

      <StepFooter disabled={!selected} />
    </form>
  )
}
