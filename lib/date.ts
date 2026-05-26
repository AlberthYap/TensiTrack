import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: id })
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd MMM yyyy, HH:mm', { locale: id })
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: id })
}

export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'HH:mm', { locale: id })
}
