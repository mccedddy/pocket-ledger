/**
 * Local date/time helpers for amended D-009. Values are wall-clock date and
 * time with no timezone offset: parse them into local Date objects before
 * formatting or grouping, so no UTC shift is introduced.
 */

export function todayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Value for a datetime-local input: current local date and minute. */
export function todayLocalDateTime(): string {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${todayLocalDate()}T${hours}:${minutes}`
}

/** Parses YYYY-MM-DD as a local calendar day, rejecting rollover dates. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function isValidCalendarDate(value: string): boolean {
  return parseLocalDate(value) !== null
}

/** Parses YYYY-MM-DDTHH:mm (optionally with seconds) as a local date/time. */
export function parseLocalDateTime(value: string): Date | null {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return null

  const day = parseLocalDate(match[1])
  const hour = Number(match[2])
  const minute = Number(match[3])
  const second = match[4] === undefined ? 0 : Number(match[4])
  if (!day || hour > 23 || minute > 59 || second > 59) return null

  day.setHours(hour, minute, second, 0)
  return day
}

export function isValidLocalDateTime(value: string): boolean {
  return parseLocalDateTime(value) !== null
}

/** Key used to group records by their local calendar day. */
export function localDateKey(value: string): string {
  const day = value.slice(0, 10)
  return isValidCalendarDate(day) ? day : ''
}

export function formatLocalDate(value: string, locale?: string): string {
  const date = parseLocalDate(value)
  if (!date) return value
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatLocalDateTime(value: string, locale?: string): string {
  const date = parseLocalDateTime(value)
  if (!date) return value
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** Time-only form for compact rows that already sit under a day summary. */
export function formatLocalTime(value: string, locale?: string): string {
  const date = parseLocalDateTime(value)
  if (!date) return value
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
