import { useEffect, useId, useRef, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Contenido bajo el título (ej. resumen de lo que se va a confirmar) */
  children?: ReactNode
  Icon?: LucideIcon
  confirmLabel?: string
  cancelLabel?: string
  confirmIcon?: ReactNode
  onConfirm: () => void
  onCancel: () => void
  /** Aviso con un solo botón (confirmLabel); Escape o tocar fuera también lo cierran con onCancel */
  hideCancel?: boolean
  /** destructive: icono en rojo (ej. validación fallida) */
  tone?: 'primary' | 'destructive'
  /** Botón de confirmar en rojo para acciones que descartan algo (ej. cancelar un vale) */
  destructiveConfirm?: boolean
}

/**
 * Diálogo modal de confirmación con el estilo de la app (reemplaza window.confirm).
 * Escape o tocar fuera cancela; el foco inicia en Cancelar para evitar confirmaciones accidentales.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  Icon,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmIcon,
  onConfirm,
  onCancel,
  hideCancel = false,
  tone = 'primary',
  destructiveConfirm = false,
}: ConfirmDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    ;(hideCancel ? confirmRef : cancelRef).current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previous?.focus()
    }
  }, [open, onCancel, hideCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[384px] rounded-2xl bg-card p-5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-full ${
                tone === 'destructive' ? 'bg-destructive-soft text-destructive' : 'bg-primary-soft text-primary'
              }`}
            >
              <Icon aria-hidden className="size-6" />
            </span>
          )}
          <h2 id={titleId} className="pt-2 text-lg leading-snug font-bold">
            {title}
          </h2>
        </div>
        {children && <div className="mt-3">{children}</div>}
        <div className={`mt-5 grid gap-2 ${hideCancel ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!hideCancel && (
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="inline-flex h-touch items-center justify-center rounded-lg border-2 border-border-strong bg-card px-3 font-heading font-semibold text-foreground transition-colors duration-150 hover:bg-muted active:bg-muted"
            >
              {cancelLabel}
            </button>
          )}
          <Button
            ref={confirmRef}
            variant={destructiveConfirm ? 'danger' : 'primary'}
            onClick={onConfirm}
            icon={confirmIcon}
            className="px-3"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
