import { describe, expect, it } from 'vitest'
import {
  formatLocalDate,
  formatLocalDateTime,
  isValidCalendarDate,
  isValidLocalDateTime,
  localDateKey,
  parseLocalDate,
  parseLocalDateTime,
  todayLocalDate,
  todayLocalDateTime,
} from './date'

describe('calendar date helpers', () => {
  it('parses YYYY-MM-DD as a local calendar day', () => {
    const date = parseLocalDate('2026-11-24')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(10)
    expect(date?.getDate()).toBe(24)
  })

  it('rejects malformed and rolled-over dates', () => {
    expect(isValidCalendarDate('2026-11-24')).toBe(true)
    expect(isValidCalendarDate('2026-02-30')).toBe(false)
    expect(isValidCalendarDate('24-11-2026')).toBe(false)
    expect(isValidCalendarDate('')).toBe(false)
  })

  it('formats a calendar day without shifting timezone', () => {
    expect(formatLocalDate('2026-11-24', 'en-US')).toBe('Nov 24, 2026')
    expect(formatLocalDate('bad-value')).toBe('bad-value')
  })

  it('returns today as a local calendar day', () => {
    expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(isValidCalendarDate(todayLocalDate())).toBe(true)
  })
})

describe('local datetime helpers (amended D-009)', () => {
  it('parses datetime-local values without applying a timezone shift', () => {
    const date = parseLocalDateTime('2026-11-24T20:45')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(10)
    expect(date?.getDate()).toBe(24)
    expect(date?.getHours()).toBe(20)
    expect(date?.getMinutes()).toBe(45)
    expect(date?.getSeconds()).toBe(0)
  })

  it('rejects malformed, rolled-over, and out-of-range times', () => {
    expect(isValidLocalDateTime('2026-11-24T08:30')).toBe(true)
    expect(isValidLocalDateTime('2026-11-24T08:30:15')).toBe(true)
    expect(isValidLocalDateTime('2026-02-30T08:30')).toBe(false)
    expect(isValidLocalDateTime('2026-11-24T24:00')).toBe(false)
    expect(isValidLocalDateTime('2026-11-24T08:60')).toBe(false)
    expect(isValidLocalDateTime('2026-11-24')).toBe(false)
  })

  it('formats local date/time and derives the local calendar-day key', () => {
    expect(formatLocalDateTime('2026-11-24T20:45', 'en-US')).toContain('Nov 24, 2026')
    expect(formatLocalDateTime('2026-11-24T20:45', 'en-US')).toContain('8:45')
    expect(formatLocalDateTime('bad-value')).toBe('bad-value')
    expect(localDateKey('2026-11-24T20:45')).toBe('2026-11-24')
    expect(localDateKey('bad-value')).toBe('')
  })

  it('returns a datetime-local value for the current local minute', () => {
    expect(todayLocalDateTime()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(isValidLocalDateTime(todayLocalDateTime())).toBe(true)
  })
})
