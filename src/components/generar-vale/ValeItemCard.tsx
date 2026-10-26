import { useId, type ReactNode } from 'react'
import { AlertCircle, FileText, Layers, Lock, Package, ScanBarcode, Trash2, Weight, type LucideIcon } from 'lucide-react'
import { DecimalInput } from '@/components/ui/DecimalInput'
import { NumberStepper } from '@/components/ui/NumberStepper'
import type { ValeLine, ValeLineErrors } from '@/interfaces/vale.interface'
import { formatQuantity, formatWeight } from '@/utils/format'
import { lineWeight } from '@/utils/vale'

interface ValeItemCardProps {
  line: ValeLine
  matrixCode: string | null
  /** Salidas: bultos y kg adicionales editables */
  editable: boolean
  errors?: ValeLineErrors
  onChange?: (changes: Partial<Pick<ValeLine, 'bultos' | 'kgAdicional'>>) => void
  /** Salidas: quitar el ítem del vale. Si no se pasa, no hay botón (ingresos) */
  onRemove?: () => void
  /** Motivo por el que no se puede quitar (ej. último ítem del pallet inicial) */
  removeDisabledReason?: string
}

type Tone = 'primary' | 'success'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
}

/** Dato con ícono en recuadro suave: etiqueta arriba, valor (o control) abajo */
function Field({
  Icon,
  label,
  hint,
  tone = 'primary',
  children,
}: {
  Icon: LucideIcon
  label: string
  hint?: string
  tone?: Tone
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 gap-2.5 py-2.5">
      <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-lg ${toneClasses[tone]}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">
          {label}
          {hint && <span className="text-stone-400"> {hint}</span>}
        </dt>
        <dd className="truncate font-heading text-base font-semibold text-foreground">{children}</dd>
      </div>
    </div>
  )
}

/** Detalle de un ítem del pallet */
export function ValeItemCard({
  line,
  matrixCode,
  editable,
  errors = {},
  onChange,
  onRemove,
  removeDisabledReason,
}: ValeItemCardProps) {
  const id = useId()
  const weight = lineWeight(line)
  const errorText = errors.bultos ?? errors.kgAdicional ?? errors.peso
  const hasError = !!errorText

  return (
    <article
      aria-label={`Ítem ${line.item}`}
      className={`overflow-hidden rounded-xl border bg-card shadow-sm ${
        hasError ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
      }`}
    >
      {/* Cabecera: ítem, lote y peso */}
      <header
        className={`flex items-center gap-2.5 bg-primary text-on-primary ${onRemove ? 'py-1 pr-1 pl-3' : 'px-3 py-2.5'}`}
      >
        <span className="rounded-lg bg-white/15 px-2 py-1 font-heading text-sm font-bold">#{line.item}</span>
        <span className="min-w-0 truncate font-heading text-lg font-semibold">Lote {line.lote || '—'}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1">
          <Weight aria-hidden className="size-4" />
          <span className="font-heading font-bold whitespace-nowrap">{formatWeight(weight)}</span>
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={!!removeDisabledReason}
            title={removeDisabledReason}
            aria-label={removeDisabledReason ?? `Quitar ítem ${line.item} del vale`}
            className="grid size-touch shrink-0 place-items-center rounded-lg transition-colors duration-150 hover:bg-white/15 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Trash2 aria-hidden className="size-5" />
          </button>
        )}
      </header>

      <dl className="divide-y divide-border px-3">
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="pr-2.5">
            <Field Icon={FileText} label="Doc. referencia" hint={line.referencia?.tipoDoc}>
              {line.referencia?.nroOrden ?? '—'}
            </Field>
          </div>
          <div className="pl-2.5">
            <Field Icon={Layers} label="Matriz">
              {matrixCode ?? 'No aplica'}
            </Field>
          </div>
        </div>

        <Field Icon={ScanBarcode} label="Trazabilidad">
          {line.traza || '—'}
        </Field>

        {editable ? (
          // Salida: controles debajo de cada etiqueta para que quepan a 400px
          <div className="grid grid-cols-2 gap-2.5 py-2.5">
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package aria-hidden className="size-4 text-primary" />
                Bultos <span className="text-stone-400">/ {line.bultosDisponibles}</span>
              </p>
              <NumberStepper
                label={`Bultos del ítem ${line.item}`}
                value={line.bultos}
                min={0}
                max={line.bultosDisponibles}
                invalid={!!errors.bultos || !!errors.peso}
                describedBy={hasError ? `${id}-error` : undefined}
                onChange={(packages) => onChange?.({ bultos: packages })}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Weight aria-hidden className="size-4 text-success" />
                KG adicional <span className="text-stone-400">/ {formatQuantity(line.pesoUnidad)}</span>
              </p>
              <DecimalInput
                label={`KG adicional del ítem ${line.item}`}
                value={line.kgAdicional}
                suffix="kg"
                invalid={!!errors.kgAdicional || !!errors.peso}
                describedBy={hasError ? `${id}-error` : undefined}
                onChange={(extraKg) => onChange?.({ kgAdicional: extraKg })}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="pr-2.5">
              <Field Icon={Package} label="Bultos">
                {line.bultos}
              </Field>
            </div>
            <div className="pl-2.5">
              <Field Icon={Weight} label="KG adicional" tone="success">
                {formatQuantity(line.kgAdicional)}
              </Field>
            </div>
          </div>
        )}
      </dl>

      {/* Pie: aviso de solo lectura o error de validación */}
      {errorText ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm font-medium text-destructive"
        >
          <AlertCircle aria-hidden className="size-4 shrink-0" />
          {errorText}
        </p>
      ) : (
        !editable && (
          <p className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm font-medium text-primary-hover">
            <Lock aria-hidden className="size-4 shrink-0" />
            Ingreso: el ítem no se puede editar
          </p>
        )
      )}
    </article>
  )
}
