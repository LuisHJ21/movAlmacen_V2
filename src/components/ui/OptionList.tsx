import { useId, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, Check, ChevronRight, Inbox, Loader2, RotateCcw, Search, X } from 'lucide-react'
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
  /** No se puede elegir (ej. almacén sin ubicaciones) */
  disabled?: boolean
}

interface OptionListProps {
  legend: string
  /** Identifica la lista (data-list), útil para pruebas */
  name: string
  items: OptionItem[]
  /** Opción elegida antes (se resalta al regresar a este paso) */
  selectedKey: string | null
  /** Se llama al tocar una opción: el paso avanza de inmediato */
  onSelect: (key: string) => void
  /** Opción tocada que está procesándose (muestra un indicador de carga) */
  pendingKey?: string | null
  /** Bloquea las opciones (ej. mientras se procesa una) */
  disabled?: boolean
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
 * Lista de elección única: tocar una opción la elige y avanza (sin botón Continuar).
 * Ocupa el alto libre y se desplaza internamente.
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
  pendingKey = null,
  disabled = false,
}: OptionListProps) {
  const legendId = useId()
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
    <div data-list={name} className="flex min-h-0 flex-1 flex-col">
      <p id={legendId} className="mb-1.5 text-sm font-semibold text-foreground">
        {legend}
      </p>

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
          <ul aria-labelledby={legendId} className="space-y-2">
            {visible.map((item) => {
              const isSelected = selectedKey === item.key
              const isPending = pendingKey === item.key
              const badge = item.badge && (
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-sm font-bold ${
                    isSelected || isPending ? 'bg-primary text-on-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    data-key={item.key}
                    onClick={() => onSelect(item.key)}
                    disabled={disabled || item.disabled}
                    aria-current={isSelected ? 'true' : undefined}
                    aria-busy={isPending || undefined}
                    className={`flex min-h-touch w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-colors duration-150 ${item.disabled ? 'disabled:cursor-not-allowed' : 'disabled:cursor-wait'} ${
                      isSelected || isPending
                        ? 'border-primary bg-primary-soft'
                        : 'border-border bg-card hover:bg-muted active:border-primary active:bg-primary-soft disabled:opacity-60'
                    }`}
                  >
                    {badgePlacement === 'side' && badge}
                    <span className="min-w-0 flex-1">
                      {badgePlacement === 'top' && badge && <span className="mb-1 inline-block">{badge}</span>}
                      <span className="block leading-snug font-medium">{item.title}</span>
                      {item.meta && <span className="block text-sm text-muted-foreground">{item.meta}</span>}
                    </span>
                    {isPending ? (
                      <Loader2 aria-hidden className="size-5 shrink-0 animate-spin text-primary" />
                    ) : isSelected ? (
                      <Check aria-hidden className="size-5 shrink-0 text-primary" />
                    ) : (
                      <ChevronRight aria-hidden className="size-5 shrink-0 text-stone-400" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
