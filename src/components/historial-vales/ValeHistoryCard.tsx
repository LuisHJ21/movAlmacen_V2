import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpFromLine, ChevronRight, FileText } from 'lucide-react'
import type { ValeHistoryItem } from '@/interfaces/vale.interface'
import { formatTime, toSentenceCase } from '@/utils/format'

export function valeKindIcon(vale: ValeHistoryItem) {
  return vale.tipo === 'ING' ? ArrowDownToLine : vale.tipo === 'SAL' ? ArrowUpFromLine : FileText
}

export function ValeHistoryCard({ vale }: { vale: ValeHistoryItem }) {
  const Icon = valeKindIcon(vale)
  const reference = [vale.tipoReferencia, vale.nroReferencia].filter(Boolean).join(' ')

  return (
    <Link
      to={`/historial-vales/${encodeURIComponent(vale.nroVale)}`}
      state={{ vale }}
      aria-label={`Vale ${vale.nroVale}${vale.activo ? '' : ', anulado'}. Ver detalle`}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150 ${
        vale.activo
          ? 'border-border bg-card hover:border-primary-border active:bg-muted'
          : 'border-destructive/30 bg-destructive-soft/40 active:bg-destructive-soft'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center self-start rounded-lg ${
          vale.activo ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        <Icon aria-hidden className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-base font-bold ${vale.activo ? '' : 'text-muted-foreground line-through'}`}>
            {vale.nroVale}
          </span>
          {!vale.activo && (
            <span className="rounded-md bg-destructive px-1.5 py-0.5 text-xs font-bold text-white uppercase">
              Anulado
            </span>
          )}
          {vale.fecha && (
            <time dateTime={vale.fecha.toISOString()} className="ml-auto shrink-0 font-mono text-sm text-muted-foreground">
              {formatTime(vale.fecha)}
            </time>
          )}
        </div>
        <p className="truncate text-sm font-semibold">{toSentenceCase(vale.nombreMovimiento)}</p>
        <p className="truncate text-sm text-muted-foreground">
          {reference && <span className="font-mono">{reference}</span>}
          {reference && vale.almacen && ' · '}
          {vale.almacen}
        </p>
      </div>

      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
