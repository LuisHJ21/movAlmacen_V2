import { PARTES_UBICACION, separarCodigoUbicacion } from '@/utils/ubicacion'

interface CodigoUbicacionProps {
  /** Código armado hasta ahora (ej. "C1D01") */
  codigo: string
  /** Resalta la casilla del paso en curso */
  pasoActual?: number
  size?: 'md' | 'lg'
  /** Si se indica, las partes elegidas se pueden tocar para volver a elegirlas */
  onEditar?: (indice: number) => void
  /** Partes que se eligieron solas (única opción): no se pueden cambiar */
  automaticas?: boolean[]
}

/**
 * Código de ubicación por partes (Código · Lado · Col. · Nivel · Prof.); las casillas vacías aún no se eligen.
 * Con onEditar, tocar una parte elegida vuelve a ese paso para corregirla.
 */
export function CodigoUbicacion({ codigo, pasoActual, size = 'md', onEditar, automaticas = [] }: CodigoUbicacionProps) {
  const partes = separarCodigoUbicacion(codigo)

  return (
    <ol aria-label={`Ubicación ${codigo || 'sin elegir'}`} className="grid grid-cols-[2fr_1.4fr_2fr_1.4fr_2fr] gap-1.5">
      {PARTES_UBICACION.map(({ parte, etiqueta, titulo }, index) => {
        const valor = partes[index]
        const actual = index === pasoActual
        const editable = !!onEditar && !!valor && !automaticas[index]
        const casilla = `grid w-full place-items-center rounded-lg border-2 font-mono font-bold tracking-wider transition-colors duration-150 ${
          size === 'lg' ? 'h-14 text-2xl' : 'h-11 text-lg'
        } ${
          valor
            ? `border-primary bg-primary text-on-primary ${editable ? 'hover:bg-primary-hover active:bg-primary-hover' : ''}`
            : actual
              ? 'border-dashed border-primary bg-primary-soft text-primary'
              : 'border-dashed border-border-strong bg-card text-stone-300'
        }`
        return (
          <li key={parte} className="min-w-0 text-center">
            {editable ? (
              <button
                type="button"
                onClick={() => onEditar(index)}
                aria-label={`Cambiar ${titulo.toLowerCase()} (${valor})`}
                className={casilla}
              >
                {valor}
              </button>
            ) : (
              <span className={casilla}>{valor ?? (actual ? '?' : '–')}</span>
            )}
            <span
              className={`mt-0.5 block truncate text-xs ${actual ? 'font-bold text-primary' : 'text-muted-foreground'}`}
            >
              {etiqueta}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
