import { useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, Check, Inbox, RotateCcw, Search, X } from 'lucide-react'
import { Button } from './Button'

export interface OptionItem {
  key: string
  /** Código corto en monoespaciada (ej. "S08", "ALPTC1") */
  badge?: string
  title: string
  /** Línea secundaria (ej. saldo, almacén) */
  meta?: ReactNode
  /** Texto adicional para la búsqueda */
  searchText?: string
}

interface OptionListProps {
  legend: string
  name: string
  items: OptionItem[]
  selectedKey: string | null
  onSelect: (key: string) => void
  isLoading?: boolean
  error?: string
  onRetry?: () => void
  /** Mensaje cuando la consulta no devolvió elementos */
  emptyMessage?: string
  /** Muestra el buscador a partir de esta cantidad de elementos */
  searchThreshold?: number
  searchPlaceholder?: string
  /** side: código a la izquierda (códigos cortos) · top: código sobre el título (códigos largos) */
  badgePlacement?: 'side' | 'top'
}

/**
 * Lista de selección única que ocupa el alto libre y se desplaza internamente.
 * Incluye estados de carga, error con reintento, vacío y buscador.
 */
export function OptionList({
  legend,
  name,
  items,
  selectedKey,
  onSelect,
  isLoading = false,
  error,
  onRetry,
  emptyMessage = 'No hay opciones disponibles.',
  searchThreshold = 8,
  searchPlaceholder = 'Buscar',
  badgePlacement = 'side',
}: OptionListProps) {
  const [query, setQuery] = useState('')
  const showSearch = items.length >= searchThreshold

  const visible = useMemo(() => {
    const q = query?.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      [item.title, item.badge, item.searchText].some((text) => text?.toLowerCase().includes(q)),
    )
  }, [items, query])

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label={`Cargando ${legend.toLowerCase()}`} className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-touch animate-pulse rounded-lg bg-border" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="m-auto flex flex-col items-center gap-3 text-center">
        <AlertCircle aria-hidden className="size-8 text-destructive" />
        <p className="text-foreground">{error}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} icon={<RotateCcw aria-hidden className="size-5" />}>
            Reintentar
          </Button>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="m-auto flex flex-col items-center gap-2 text-center text-muted-foreground">
        <Inbox aria-hidden className="size-8" />
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <fieldset className="flex min-h-0 flex-1 flex-col">
      <legend className="mb-1.5 text-sm font-semibold text-foreground">{legend}</legend>

      {showSearch && (
        <div className="relative mb-2">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            enterKeyHint="search"
            className="h-touch w-full rounded-lg border-2 border-border-strong bg-card pr-12 pl-10 text-base transition-colors duration-150 placeholder:text-stone-400 focus:border-primary focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute top-0 right-0 grid size-touch place-items-center text-muted-foreground"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      )}

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2">
        {visible.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">Sin resultados para “{query}”.</p>
        ) : (
          <ul className="space-y-2">
            {visible.map((item) => {
              const isSelected = selectedKey === item.key
              const badge = item.badge && (
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-sm font-bold ${
                    isSelected ? 'bg-primary text-on-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )
              return (
                <li key={item.key}>
                  <label
                    className={`relative flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring ${
                      isSelected ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:bg-muted active:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={item.key}
                      checked={isSelected}
                      onChange={() => onSelect(item.key)}
                      className="sr-only"
                    />
                    {badgePlacement === 'side' && badge}
                    <span className="min-w-0 flex-1">
                      {badgePlacement === 'top' && badge && <span className="mb-1 inline-block">{badge}</span>}
                      <span className="block leading-snug font-medium">{item.title}</span>
                      {item.meta && <span className="block text-sm text-muted-foreground">{item.meta}</span>}
                    </span>
                    {isSelected && <Check aria-hidden className="size-5 shrink-0 text-primary" />}
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </fieldset>
  )
}
