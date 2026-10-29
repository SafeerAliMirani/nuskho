import { describe, it, expect } from 'vitest'
import { doseText } from './print/renderSlip'

/**
 * A DOSE IS NEVER ROUNDED ON PAPER.
 *
 * The cell used to print `Math.round(n)`, so 1.5 came out as 2. Nothing can
 * produce a 1.5 today — the dose control cycles 0, 1, 2, ½ and back — so no
 * slip has been wrong because of it. This test exists so that the day somebody
 * adds a 1½ step to that cycle, the suite says what will happen to the paper
 * instead of letting the paper say it.
 *
 * Rounding a dose is not a display choice. It is a different prescription.
 */
describe('the number in the dose cell', () => {
  it('prints a whole number as itself', () => {
    expect(doseText(0)).toBe('0')
    expect(doseText(1)).toBe('1')
    expect(doseText(2)).toBe('2')
    expect(doseText(3)).toBe('3')
  })

  it('prints a half as the glyph the slip has always used', () => {
    expect(doseText(0.5)).toBe('½')
  })

  it('never rounds a dose that is not whole', () => {
    expect(doseText(1.5)).toBe('1½')    // used to print '2'
    expect(doseText(2.5)).toBe('2½')    // used to print '3' — a whole extra tablet a day
    expect(doseText(1.25)).toBe('1.25')
  })

  it('rounds nothing away in either direction', () => {
    for (const n of [0.5, 1, 1.5, 2, 2.5, 3]) {
      const printed = doseText(n)
      expect(printed).not.toBe(String(Math.round(n)) === printed && !Number.isInteger(n) ? printed : '\u0000')
      if (!Number.isInteger(n)) expect(printed).not.toBe(String(Math.round(n)))
    }
  })
})
