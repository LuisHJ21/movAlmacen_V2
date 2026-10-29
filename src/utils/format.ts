export const KG_DECIMALS = 4

export const NUMBER_LOCALE = 'en-US'

const weightFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: KG_DECIMALS,
  useGrouping: 'always',
})

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

export function formatShortDateTime(date: Date): string {
  return shortDateTimeFormatter.format(date)
}

export function formatQuantity(value: number): string {
  return weightFormatter.format(value)
}

const countFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: KG_DECIMALS, useGrouping: 'always' })

export function formatCount(value: number): string {
  return countFormatter.format(value)
}

export function cleanText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

export function cleanOptional(value: unknown): string | null {
  return cleanText(value) || null
}

export function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function toSentenceCase(text: string): string {
  const lower = text
    .toLowerCase()
    .split(' ')
    .map((word) => (word.includes('.') ? word.toUpperCase() : word))
    .join(' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null
}

export function parseApiDateTime(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim())
  if (!match) return null
  const [, d, m, y, h = '0', min = '0', s = '0'] = match
  return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s))
}

const dayFormatter = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' })

export function formatDayLabel(date: Date): string {
  const label = dayFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const shortDateFormatter = new Intl.DateTimeFormat('es', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function formatDate(date: Date): string {
  return shortDateFormatter.format(date)
}

export function formatTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}
