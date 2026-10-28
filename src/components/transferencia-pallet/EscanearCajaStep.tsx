import { useEffect, useRef, useState } from 'react'
import { Package, PackageOpen, Tag } from 'lucide-react'
import { getApiErrorMessage } from '@/api/axiosClient'
import { ScanInput } from '@/components/ui/ScanInput'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import type { EtiquetaCaja } from '@/interfaces/caja.interface'
import { cajaService } from '@/services/caja.service'
import type { TipoCajaEscaneo } from '@/utils/validarCaja'

interface EscanearCajaStepProps {
  /** Peso de una caja completa, ya formateado (para la ayuda de "caja de saldo") */
  pesoUnd: string
  /** Cantidades de etiquetas que tienen las cajas reales de cada tipo (ver cantidadesDisponibles) */
  cantidades: Record<TipoCajaEscaneo, number[]>
  /** Se llama con la etiqueta leída, el tipo de caja y cuántas etiquetas tiene la caja */
  onLeida: (tipo: TipoCajaEscaneo, etiquetas: number, etiqueta: EtiquetaCaja) => void
}

/**
 * Escanear una caja del pallet origen: el operador indica si es completa o de saldo y cuántas etiquetas
 * tiene (una caja mixta lleva una por cada ítem), y escanea el QR de una sola de ellas.
 */
export function EscanearCajaStep({ pesoUnd, cantidades, onLeida }: EscanearCajaStepProps) {
  const [tipo, setTipo] = useState<TipoCajaEscaneo>(cantidades.completa.length > 0 ? 'completa' : 'saldo')
  const opciones = cantidades[tipo]
  const [cantidad, setCantidad] = useState(opciones[0] ?? 1)
  const [qr, setQr] = useState('')
  const [leyendo, setLeyendo] = useState(false)
  const [error, setError] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Tras un error, el código queda seleccionado para que la siguiente lectura lo reemplace
  useEffect(() => {
    if (error && !leyendo) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [error, leyendo])

  const cambiarTipo = (nuevo: TipoCajaEscaneo) => {
    setTipo(nuevo)
    // La cantidad elegida se mantiene si existe en el nuevo tipo
    if (!cantidades[nuevo].includes(cantidad)) setCantidad(cantidades[nuevo][0] ?? 1)
    inputRef.current?.focus()
  }

  const leer = async () => {
    const codigo = qr.trim()
    if (!codigo || leyendo) return
    setLeyendo(true)
    setError(undefined)
    try {
      const etiqueta = await cajaService.leer(codigo)
      setQr('')
      onLeida(tipo, cantidad, etiqueta)
    } catch (err) {
      setError(getApiErrorMessage(err, 'No fue posible leer la etiqueta'))
    } finally {
      setLeyendo(false)
    }
  }

  const tipoOptions: SegmentOption<TipoCajaEscaneo>[] = [
    { value: 'completa', label: 'Caja completa', Icon: Package, disabled: cantidades.completa.length === 0 || leyendo },
    { value: 'saldo', label: 'Caja de saldo', Icon: PackageOpen, disabled: cantidades.saldo.length === 0 || leyendo },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-4">
      <div className="space-y-4">
        <SegmentedControl
          label="Tipo de caja"
          options={tipoOptions}
          value={tipo}
          onChange={cambiarTipo}
          hint={tipo === 'saldo' ? `No llega a ${pesoUnd}: es la caja con el sobrante.` : undefined}
        />

        {/* Solo se ofrecen las cantidades de etiquetas que tienen las cajas reales del origen */}
        {opciones.length > 1 && (
          <fieldset className="space-y-1.5">
            <legend className="flex items-center gap-1.5 text-sm font-semibold">
              <Tag aria-hidden className="size-4 text-primary" />
              Etiquetas en la caja
            </legend>
            <div className="flex flex-wrap gap-2">
              {opciones.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setCantidad(n)
                    inputRef.current?.focus()
                  }}
                  disabled={leyendo}
                  aria-pressed={cantidad === n}
                  className={`h-touch min-w-touch rounded-lg border-2 px-4 font-heading text-lg font-bold transition-colors duration-150 ${
                    cantidad === n
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border-strong bg-card text-foreground hover:bg-muted active:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Más de una si la caja junta varios ítems. Escanea solo una.</p>
          </fieldset>
        )}

        <ScanInput
          ref={inputRef}
          label="Etiqueta de la caja"
          value={qr}
          onChange={(v) => {
            setQr(v)
            setError(undefined)
          }}
          onSubmit={() => void leer()}
          placeholder={leyendo ? 'Leyendo etiqueta…' : 'Escanea el QR de la etiqueta'}
          hint={
            cantidad > 1
              ? `Caja de ${cantidad} etiquetas: escanea cualquiera de ellas`
              : 'Lote, traza, fecha y OT se leen del QR'
          }
          error={error}
          disabled={leyendo}
        />
      </div>
    </div>
  )
}
