import { formatDistanceToNow, isValid, parseISO, format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  formatAppDate,
  formatAppDateTime,
  formatAppTime,
} from '@/lib/timezone'

/**
 * Parse input ke Date object dengan safety handling.
 * Mengembalikan null untuk string invalid atau Date invalid (mis. NaN).
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
  if (formatStr === 'dd MMM yyyy') return formatAppDate(dateObj)
  return format(dateObj, formatStr, { locale: id })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  const dateObj = safeParseDate(date)
  return dateObj ? formatAppDateTime(dateObj) : '-'
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  const dateObj = safeParseDate(date)
  if (!dateObj) return '-'
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: id })
}

export function formatTime(date: string | Date | null | undefined): string {
  const dateObj = safeParseDate(date)
  return dateObj ? formatAppTime(dateObj) : '-'
}
