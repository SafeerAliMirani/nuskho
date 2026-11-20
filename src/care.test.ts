import { describe, it, expect } from 'vitest'
import { impossible, incomplete, firstImpossible, firstIncomplete, filled, flag, isChild, vitalDef, ALL_VITALS } from './data/vitals'
import { courseCheck } from './course'
import { canBecome } from './db'
import type { RxLine } from './types'

const bp = vitalDef('bp')!
const pulse = vitalDef('pulse')!
const temp = vitalDef('temp')!

/**
 * Batch 23. Everything here is arithmetic or a refusal to guess; nothing in it
 * is a clinical claim, and that is the point.
 */
describe('a reading that is not a reading', () => {
  it('lets a genuinely alarming reading through, because that is the one to print', () => {
    expect(impossible(bp, '190/120')).toBe(false)
    expect(flag(bp, '190/120')).toBe('high')
    expect(impossible(pulse, '150')).toBe(false)
    expect(impossible(temp, '104')).toBe(false)
  })
  it('catches the typo the old code marked as merely unusual', () => {
    expect(impossible(bp, '999/999')).toBe(true)
    expect(impossible(pulse, '1210')).toBe(true)
    expect(impossible(temp, '986')).toBe(true)
  })
  it('refuses a blood pressure when only ONE of its two numbers is a typo', () => {
    // '999/999' above is refused by the upper number alone, so the check on
    // the lower number could be deleted from vitals.ts and that test would
    // still pass. (Found 10 Nov.) Each of these has exactly one bad half, and
    // the other half is an ordinary reading, so each half has to do its own
    // refusing. What prints otherwise is "120/999 mmHg" on a slip, marked
    // "higher than usual" and believed by whoever reads it next.
    expect(impossible(bp, '120/999')).toBe(true)     // lower number too high
    expect(impossible(bp, '999/80')).toBe(true)      // upper number too high
    expect(impossible(bp, '120/8')).toBe(true)       // lower number too low: 80 with a digit dropped
    expect(impossible(bp, '12/80')).toBe(true)       // upper number too low: 120 with a digit dropped
    // and the same four boxes with nothing wrong in them, so this is not a
    // test that a blood pressure is always refused
    expect(impossible(bp, '120/80')).toBe(false)
    expect(firstImpossible({ pulse: '72', bp: '120/999' })?.key).toBe('bp')
    expect(firstImpossible({ pulse: '72', bp: '999/80' })?.key).toBe('bp')
  })
  it('treats half a blood pressure as unfinished, not as impossible and not as a low one', () => {
    // it is what a cuff reading looks like mid-keystroke, and what the old
    // lost-systolic bug left behind. Not shouted about, and not printed.
    expect(impossible(bp, '180/')).toBe(false)
    expect(incomplete(bp, '180/')).toBe(true)
    expect(incomplete(bp, '/110')).toBe(true)
    expect(incomplete(bp, '120/80')).toBe(false)
    expect(incomplete(bp, '')).toBe(false)
    expect(flag(bp, '180/')).toBe('high')          // the half that IS there still reads high
    expect(firstIncomplete({ pulse: '72', bp: '180/' })?.key).toBe('bp')
  })

  it('leaves an unfinished pair off the paper rather than printing "180/"', () => {
    expect(filled({ bp: '180/', pulse: '72' }).map(([d]) => d.key)).toEqual(['pulse'])
    expect(filled({ bp: '120/80' }).map(([d]) => d.key)).toEqual(['bp'])
  })
  it('says nothing about an empty box', () => {
    expect(impossible(bp, '')).toBe(false)
    expect(impossible(pulse, '   ')).toBe(false)
    expect(firstImpossible({})).toBe(null)
    expect(firstImpossible(undefined)).toBe(null)
  })
  it('names the first box that stops the slip', () => {
    expect(firstImpossible({ pulse: '72', bp: '999/999' })?.key).toBe('bp')
  })
  it('leaves the urine strip alone: it is words, not a number', () => {
    expect(impossible(vitalDef('urine')!, 'protein ++')).toBe(false)
  })
})

describe('a child is not judged by an adult\'s ranges', () => {
  it('flags a two-year-old\'s ordinary pulse for an adult and not for the child', () => {
    expect(flag(pulse, '120')).toBe('high')
    expect(flag(pulse, '120', '2')).toBe(null)
  })
  it('knows a child from an adult, and an unreadable age from both', () => {
    expect(isChild('2')).toBe(true)
    expect(isChild('11')).toBe(true)
    expect(isChild('12')).toBe(false)
    expect(isChild('45')).toBe(false)
    expect(isChild(undefined)).toBe(false)
    expect(isChild('adult')).toBe(false)
  })
  it('still refuses an impossible reading whatever the age', () => {
    expect(impossible(pulse, '1210')).toBe(true)
  })
  /**
   * THIS LOOP USED TO WALK `VITALS` AND STOP. (Found 10 Nov.)
   *
   * The six tests done in the room, the sugars among them, are in `INSTANT`,
   * and nothing checked them. Take `pmin` and `pmax` off the random sugar and
   * `impossible()` reads it as a text box and waves every number through: a
   * sugar of 99999 mg/dL prints on the slip.
   *
   * The exemption is by KEY and not by "has no range", on purpose. Skipping
   * whatever has no range would exempt exactly the definition this test
   * exists to catch. A new vital is numeric until somebody adds its key here
   * and says why.
   */
  const WORDS_NOT_NUMBERS = ['urine']    // the strip reads "protein ++", "nil"

  it('gives every numeric reading a possible range, the tests done in the room included', () => {
    const numeric = ALL_VITALS.filter(d => !WORDS_NOT_NUMBERS.includes(d.key))
    // the loop must have something to loop over, and must reach the sugars
    expect(numeric.map(d => d.key)).toEqual(expect.arrayContaining(['bp', 'pulse', 'rbs', 'fbs', 'hba1c']))
    for (const d of numeric) {
      expect(d.pmin != null && d.pmax != null, `${d.key} has no possible range`).toBe(true)
      expect(d.pmin!, `${d.key}: the range is upside down`).toBeLessThan(d.pmax!)
      // a pair has a second number, and it needs its own bounds
      if (d.pair) expect(d.pmin2 != null && d.pmax2 != null, `${d.key} has no range for its second number`).toBe(true)
    }
  })

  it('refuses an absurd number in every numeric box, not only in the ones the compounder fills', () => {
    // The same claim asked of the function instead of the table, so a range
    // that is present but ignored fails here too.
    for (const d of ALL_VITALS) {
      if (WORDS_NOT_NUMBERS.includes(d.key)) continue
      expect(impossible(d, d.pair ? '99999/99999' : '99999'), `${d.key} accepted 99999`).toBe(true)
      expect(firstImpossible({ [d.key]: d.pair ? '99999/99999' : '99999' })?.key).toBe(d.key)
    }
    // the one the audit named
    expect(impossible(vitalDef('rbs')!, '99999')).toBe(true)
    expect(impossible(vitalDef('rbs')!, '412')).toBe(false)   // alarming, real, and it prints
  })

  it('exempts only boxes that really are words', () => {
    // An exemption that outlives its reason is a hole. If the urine strip is
    // ever given a numeric range, or is renamed, this says so.
    for (const k of WORDS_NOT_NUMBERS) {
      const d = vitalDef(k)
      expect(d, `${k} is exempted but no longer exists`).toBeDefined()
      expect(d!.pmin == null && d!.pmax == null, `${k} has a range now, so it should not be exempt`).toBe(true)
      expect(impossible(d!, 'protein ++')).toBe(false)
    }
  })
})

describe('reading back the arithmetic the doctor just built', () => {
  const base: RxLine = { drugId: 'd1', dose: { m: 0, d: 0, n: 0 }, meal: 'after', days: 5 }
  const tab = { brand: 'X', strength: '', generic: '', sd: '', sdReviewed: false, unitSd: '', form: 'tab' as const }
  it('says nothing about an ordinary prescription', () => {
    expect(courseCheck({ ...base, dose: { m: 1, d: 0, n: 1 }, days: 5 }, tab)).toBe(null)
  })
  it('reads back a heavy daily count', () => {
    const out = courseCheck({ ...base, dose: { m: 2, d: 2, e: 2, n: 2 }, days: 30 }, tab)
    expect(out).toContain('8 a day')
    expect(out).toContain('240')
  })
  it('reads back a large total even when each day is modest', () => {
    expect(courseCheck({ ...base, dose: { m: 2, d: 2, n: 2 }, days: 25 }, tab)).toContain('150')
  })
  it('catches a daily cap larger than the whole supply', () => {
    const l: RxLine = { ...base, sos: true, sosReason: { en: 'for pain', sd: '' }, supply: 4, sosMax: 6 }
    expect(courseCheck(l, tab)).toContain('less than one day')
  })
  it('says nothing when the cap fits the supply', () => {
    const l: RxLine = { ...base, sos: true, sosReason: { en: 'for pain', sd: '' }, supply: 20, sosMax: 3 }
    expect(courseCheck(l, tab)).toBe(null)
  })
})

describe('which endings can follow which', () => {
  it('will not let a printed prescription be closed as something else', () => {
    expect(canBecome('done', 'left')).toBe(false)
    expect(canBecome('done', 'cancelled')).toBe(false)
    expect(canBecome('done', 'waiting')).toBe(false)
  })
  it('lets a person undo their own reading of the room', () => {
    expect(canBecome('left', 'waiting')).toBe(true)
    expect(canBecome('cancelled', 'waiting')).toBe(true)
    expect(canBecome('seen', 'done')).toBe(true)
  })
  it('is content with a status that has not changed', () => {
    expect(canBecome('done', 'done')).toBe(true)
  })
})
