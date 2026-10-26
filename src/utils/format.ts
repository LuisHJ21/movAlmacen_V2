/** Kilos: hasta 4 decimales (mínimo 2 para que las cantidades se lean alineadas) */
export const KG_DECIMALS = 4

/** Formato numérico de la app: coma para miles y punto para decimales (1,039.41) */
export const NUMBER_LOCALE = 'en-US'

// useGrouping 'always': agrupa también las cifras de 4 dígitos (1,039.41)
const weightFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: KG_DECIMALS,
  useGrouping: 'always',
})

/** 59.9848 → "59.9848 kg" · 20 → "20.00 kg" · 1000 → "1,000.00 kg" */
export function formatWeight(kg: number): string {
  return `${weightFormatter.format(kg)} kg`
}

const dateTimeFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** → "25/10/2026, 14:35" */
export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date)
}

const shortDateTimeFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** → "25/10, 14:35" (versión compacta para cabeceras) */
export function formatShortDateTime(date: Date): string {
  return shortDateTimeFormatter.format(date)
}

/** 99859.7239 → "99,859.7239" */
export function formatQuantity(value: number): string {
  return weightFormatter.format(value)
}

const countFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: KG_DECIMALS, useGrouping: 'always' })

/** Conteos (bultos): sin decimales de relleno · 1500 → "1,500" · 2.5 → "2.5" */
export function formatCount(value: number): string {
  return countFormatter.format(value)
}

/**
 * Texto de la API a string limpio: null/undefined → '' y sin espacios de relleno
 * (la API devuelve campos como "OT  " o "C3I04401            ", y a veces null).
 */
export function cleanText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

/** Igual que cleanText, pero devuelve null si queda vacío */
export function cleanOptional(value: unknown): string | null {
  return cleanText(value) || null
}

/** Número de la API (puede venir como string o null) → number; inválido → 0 */
export function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * "INGRESO POR REPROCESO - PP.TT" → "Ingreso por reproceso - PP.TT"
 * Mantiene en mayúsculas las abreviaturas con punto.
 */
export function toSentenceCase(text: string): string {
  const lower = text
    .toLowerCase()
    .split(' ')
    .map((word) => (word.includes('.') ? word.toUpperCase() : word))
    .join(' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/** "Luis Herrera" → "LH"; un solo nombre → sus dos primeras letras */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Date → "YYYY-MM-DD" en hora local (valor de un input date y formato de fechas de la API) */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** "YYYY-MM-DD" → Date local a las 00:00; inválido → null */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null
}

/** "26/10/2026 01:09:00" (formato de la API) → Date local; inválido → null */
export function parseApiDateTime(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim())
  if (!match) return null
  const [, d, m, y, h = '0', min = '0', s = '0'] = match
  return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s))
}

const dayFormatter = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' })

/** → "Lunes, 26 de octubre" */
export function formatDayLabel(date: Date): string {
  const label = dayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const shortDateFormatter = new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** → "26/10/2026" */
export function formatDate(date: Date): string {
  return shortDateFormatter.format(date)
}

/** → "14:35" */
export function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}
