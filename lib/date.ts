import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Parse input ke Date object dengan safety handling.
 * Mengembalikan null untuk string invalid atau Date invalid (mis. NaN).
 * Memanggil site tidak akan crash karena invalid date — caller bisa
 * fallback string kosong atau tampilkan placeholder.
 */
function safeParseDate(date: string | Date | null | undefined): Date | null {
  if (date == null) return null
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return null
  if (!isValid(dateObj)) return null
  return dateObj
}

export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = 'dd MMM yyyy'
): string {
  const dateObj = safeParseDate(date)
  if (!dateObj) return '-'
  return format(dateObj, formatStr, { locale: id })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const dateObj = safeParseDate(date)
  if (!dateObj) return '-'
  return format(dateObj, 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  const dateObj = safeParseDate(date)
  if (!dateObj) return '-'
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: id })
}

export function formatTime(date: string | Date | null | undefined): string {
  const dateObj = safeParseDate(date)
  if (!dateObj) return '-'
  return format(dateObj, 'HH:mm', { locale: id })
}
