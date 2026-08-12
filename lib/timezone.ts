/**
 * Application timezone.
 *
 * The app is intended for Indonesian users, so calendar dates and displayed
 * times use Asia/Jakarta rather than the server's timezone (usually UTC).
 */
export const APP_TIME_ZONE = 'Asia/Jakarta'

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function parseParts(date: Date): ZonedParts {
  const values = Object.fromEntries(
    partsFormatter.formatToParts(date).map(({ type, value }) => [type, value])
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    millisecond: date.getUTCMilliseconds(),
  }
}

function parseDate(value: string | Date | number): Date | null {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Return the calendar date in Asia/Jakarta as YYYY-MM-DD. */
export function getAppDateKey(value: string | Date | number = new Date()): string {
  const date = parseDate(value)
  if (!date) return ''
  const parts = parseParts(date)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

/** Return the Asia/Jakarta hour (0-23) for an instant. */
export function getAppHour(value: string | Date | number): number {
  const date = parseDate(value)
  return date ? parseParts(date).hour : NaN
}

/** Return the current calendar date in Asia/Jakarta. */
export function getAppTodayKey(now: Date = new Date()): string {
  return getAppDateKey(now)
}

/** Add calendar days to an app date key without using the server timezone. */
export function addAppDateDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (![year, month, day].every(Number.isFinite)) return ''
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/**
 * Convert a local date/time in Asia/Jakarta to its UTC instant.
 * This avoids relying on the server's local timezone.
 */
export function differenceAppDateDays(laterDateKey: string, earlierDateKey: string): number {
  const [laterYear, laterMonth, laterDay] = laterDateKey.split('-').map(Number)
  const [earlierYear, earlierMonth, earlierDay] = earlierDateKey.split('-').map(Number)
  const later = Date.UTC(laterYear, laterMonth - 1, laterDay)
  const earlier = Date.UTC(earlierYear, earlierMonth - 1, earlierDay)
  return Math.round((later - earlier) / 86_400_000)
}

export function appDateTimeToUtc(dateKey: string, time = '00:00:00.000'): Date | null {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = time.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/)
  if (!match || !timeMatch) return null

  const [, year, month, day] = match
  const [, hour, minute, second = '0', milliseconds = '0'] = timeMatch
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(milliseconds.padEnd(3, '0'))
  )

  // Determine the timezone offset at the candidate instant. A second pass
  // handles zones whose offset changes around a DST boundary as well.
  let utcMillis = localAsUtc
  for (let i = 0; i < 2; i++) {
    const parts = parseParts(new Date(utcMillis))
    const zonedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      parts.millisecond
    )
    utcMillis = localAsUtc - (zonedAsUtc - utcMillis)
  }

  return new Date(utcMillis)
}

export function getAppDayStartUtc(dateKey: string): string {
  return appDateTimeToUtc(dateKey, '00:00:00.000')?.toISOString() || ''
}

export function getAppDayEndUtc(dateKey: string): string {
  return appDateTimeToUtc(dateKey, '23:59:59.999')?.toISOString() || ''
}

export function getAppDateRangeUtc(startDate?: string, endDate?: string): {
  start?: string
  end?: string
} {
  return {
    ...(startDate ? { start: getAppDayStartUtc(startDate) } : {}),
    ...(endDate ? { end: getAppDayEndUtc(endDate) } : {}),
  }
}

export function getAppMonthRangeUtc(year: number, month: number): {
  start: string
  end: string
} {
  const firstDay = `${year}-${pad(month)}-01`
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const lastDay = addAppDateDays(firstDay, daysInMonth - 1)
  return {
    start: getAppDayStartUtc(firstDay),
    end: getAppDayEndUtc(lastDay),
  }
}

export function getAppRollingRangeUtc(days: number, now: Date = new Date()): {
  start: string
  end: string
  startDateKey: string
  endDateKey: string
} {
  const endDateKey = getAppDateKey(now)
  const startDateKey = addAppDateDays(endDateKey, -(days - 1))
  return {
    start: getAppDayStartUtc(startDateKey),
    end: now.toISOString(),
    startDateKey,
    endDateKey,
  }
}

export function getAppPeriodRangesUtc(periodDays: number, now: Date = new Date()): {
  current: { start: string; end: string }
  previous: { start: string; end: string }
} {
  const currentStartKey = addAppDateDays(getAppDateKey(now), -periodDays)
  const previousStartKey = addAppDateDays(currentStartKey, -periodDays)
  const currentStart = getAppDayStartUtc(currentStartKey)
  return {
    current: { start: currentStart, end: now.toISOString() },
    previous: {
      start: getAppDayStartUtc(previousStartKey),
      end: new Date(new Date(currentStart).getTime() - 1).toISOString(),
    },
  }
}

export function formatAppDate(value: string | Date | number): string {
  const date = parseDate(value)
  return date ? dateFormatter.format(date) : '-'
}

export function formatAppDateTime(value: string | Date | number): string {
  const date = parseDate(value)
  return date ? dateTimeFormatter.format(date) : '-'
}

export function formatAppTime(value: string | Date | number): string {
  const date = parseDate(value)
  return date ? timeFormatter.format(date) : '-'
}

/** Format a date key for chart labels, e.g. "15 Jan". */
export function formatAppDateKeyLabel(dateKey: string): string {
  const date = appDateTimeToUtc(dateKey, '12:00:00.000')
  return date ? formatAppDate(date).replace(/\s+\d{4}$/, '') : '-'
}
