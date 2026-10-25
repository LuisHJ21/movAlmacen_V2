import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { ArrowRight, ScanBarcode } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScanInput } from '@/components/ui/ScanInput'
import { normalizeScanCode, validatePalletCode } from '@/utils/validations'

interface ScanPalletStepProps {
  /** Recibe el código ya normalizado y con formato válido */
  onScanned: (palletCode: string) => void | Promise<void>
  isLoading?: boolean
  /** Error devuelto al verificar el pallet (ej. no existe) */
  serverError?: string
  /** Se llama al editar el código, para limpiar el error del servidor */
  onCodeChange?: () => void
  title?: string
  description?: string
  submitLabel?: string
}

export function ScanPalletStep({
  onScanned,
  isLoading = false,
  serverError,
  onCodeChange,
  title = 'Escanea el pallet',
  description = 'Apunta el lector al código de barras de la etiqueta del pallet.',
  submitLabel = 'Continuar',
}: ScanPalletStepProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Tras un error del servidor: selecciona el código para que la siguiente lectura lo reemplace
  useEffect(() => {
    if (serverError && !isLoading) {
      // El campo estuvo deshabilitado durante la consulta y perdió el foco
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [serverError, isLoading])

  const submit = async () => {
    if (isLoading) return
    const normalized = normalizeScanCode(code)
    const validation = validatePalletCode(normalized)
    setCode(normalized)
    setError(validation)
    if (validation) {
      inputRef.current?.select()
      return
    }
    await onScanned(normalized)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void submit()
  }

  // Tocar un área vacía devuelve el foco al campo para que el lector pueda escribir
  const keepFocus = (e: MouseEvent<HTMLFormElement>) => {
    const target = e.target as HTMLElement
    if (!target.closest('input, button, a, label')) inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} onClick={keepFocus} noValidate className="flex flex-1 flex-col px-4 pt-8 pb-4">
      <div className="flex flex-col items-center text-center">
        <span className="relative grid size-24 place-items-center rounded-full bg-primary-soft text-primary">
          <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-primary/10 [animation-duration:2s]" />
          <ScanBarcode aria-hidden className="relative size-12" strokeWidth={1.5} />
        </span>
        <h2 className="mt-5 text-xl font-bold">{title}</h2>
        <p className="mt-1 max-w-xs text-muted-foreground">{description}</p>
      </div>

      <div className="mt-8">
        <ScanInput
          ref={inputRef}
          label="Código de pallet"
          value={code}
          onChange={(value) => {
            setCode(value)
            setError(undefined)
            onCodeChange?.()
          }}
          onSubmit={() => void submit()}
          hint="2 letras o números + 8 dígitos · ej. PA00000001"
          error={error ?? serverError}
          disabled={isLoading}
        />
      </div>

      <div className="mt-auto pt-6">
        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={!code.trim()}
          icon={isLoading ? undefined : <ArrowRight aria-hidden className="size-5" />}
          className="flex-row-reverse"
        >
          {isLoading ? 'Verificando pallet…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
