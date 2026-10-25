// useGrouping 'always': en español 4 cifras no se agrupan por defecto (1039,41 vs 1.039,41)
const weightFormatter = new Intl.NumberFormat('es', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: 'always',
})

/** 59.9848 → "59.98 kg" */
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

/** 99859.7239 → "99 859,72" */
export function formatQuantity(value: number): string {
  return weightFormatter.format(value)
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
