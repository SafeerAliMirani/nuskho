import { describe, it, expect } from 'vitest'
import { dayKey, CLINIC_DAY_SHIFT } from './safety'

/**
 * The clinical day ends at 4 am, not midnight.
 *
 * A famous doctor's evening runs past twelve. If the day flipped at midnight,
 * the queue would empty mid-sitting and each room's tokens would restart at 1
 * while a family in the waiting room holds receipt 1 from eleven o'clock.
 * These tests pin the boundary so a refactor can never quietly put midnight
 * back.
 */

const at = (y: number, mo: number, d: number, h: number, mi = 0) =>
  new Date(y, mo - 1, d, h, mi).getTime()

describe('the clinical day', () => {
  it('keeps an evening that crosses midnight as ONE day', () => {
    const eleven = dayKey(at(2026, 8, 5, 23, 0))
    const halfOne = dayKey(at(2026, 8, 6, 1, 30))
    const nearlyFour = dayKey(at(2026, 8, 6, 3, 59))
    expect(halfOne).toBe(eleven)
    expect(nearlyFour).toBe(eleven)
  })

  it('starts the next day at 4 am, not at midnight', () => {
    const lateNight = dayKey(at(2026, 8, 6, 3, 59))
    const morning = dayKey(at(2026, 8, 6, 4, 1))
    expect(morning).not.toBe(lateNight)
  })

  it('treats an ordinary afternoon as its own calendar day', () => {
    expect(dayKey(at(2026, 8, 5, 17, 0))).toBe(new Date(2026, 7, 5).toDateString())
  })

  it('shifts by exactly four hours everywhere', () => {
    expect(CLINIC_DAY_SHIFT).toBe(4 * 3600 * 1000)
  })
})
