import { describe, expect, it } from 'vitest'
import { formatLocalDate, isValidCalendarDate, parseLocalDate, todayLocalDate } from './date'

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
