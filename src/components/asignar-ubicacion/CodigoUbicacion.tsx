import { PARTES_UBICACION, separarCodigoUbicacion } from '@/utils/ubicacion'

interface CodigoUbicacionProps {
  codigo: string
  pasoActual?: number
  size?: 'md' | 'lg'
  onEditar?: (indice: number) => void
  automaticas?: boolean[]
  variant?: 'solid' | 'soft'
}

export function CodigoUbicacion({
  codigo,
  pasoActual,
  size = 'md',
  onEditar,
  automaticas = [],
  variant = 'solid',
}: CodigoUbicacionProps) {
  const partes = separarCodigoUbicacion(codigo)

  return (
    <ol aria-label={`Ubicación ${codigo || 'sin elegir'}`} className="grid grid-cols-[2fr_1.4fr_2fr_1.4fr_2fr] gap-1.5">
      {PARTES_UBICACION.map(({ parte, etiqueta, titulo }, index) => {
        const valor = partes[index]
        const actual = index === pasoActual
        const editable = !!onEditar && !!valor && !automaticas[index]
        const casilla = `grid w-full place-items-center rounded-lg border-2 font-mono font-bold tracking-wider transition-colors duration-150 ${
          size === 'lg' ? 'h-14 text-2xl' : variant === 'soft' ? 'h-9 text-base' : 'h-11 text-lg'
        } ${
          valor && variant === 'soft'
            ? 'border-border bg-card text-foreground'
            : valor
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
