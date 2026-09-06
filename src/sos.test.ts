import { describe, it, expect } from 'vitest'
import { course } from './course'
import { lineIsEmpty } from './rx'
import { SOS_PREFIX, sosMaxLine, sosReasons } from './data/sos'
import type { RxLine, RxSnap } from './types'

const snap = (form: RxSnap['form']): RxSnap => ({
  brand: 'X', strength: '', generic: '', sd: '', unitSd: '', form,
})
const base: RxLine = { drugId: 'd', dose: { m: 0, d: 0, n: 0 }, meal: 'after', days: 5 }

describe('SOS / when-needed medicines', () => {
  it('counts the supply, not a schedule, whatever the days say', () => {
    const l: RxLine = { ...base, sos: true, supply: 12, days: 5,
      sosReason: { en: 'for pain', sd: 'سور لاءِ' } }
    expect(course(l, snap('tab'))).toEqual({ n: 12, unit: 'tablets' })
  })

  it('an SOS syrup is counted in millilitres', () => {
    expect(course({ ...base, sos: true, supply: 120 }, snap('syr'))).toEqual({ n: 120, unit: 'ml' })
  })

  it('leaves a normal scheduled line exactly as before', () => {
    const l: RxLine = { ...base, dose: { m: 1, d: 0, n: 1 }, days: 5 }
    expect(course(l, snap('tab'))).toEqual({ n: 10, unit: 'tablets' })
  })

  it('judges an SOS line by its reason and its supply, not its empty schedule', () => {
    const pain = { en: 'for pain', sd: 'سور لاءِ' }
    expect(lineIsEmpty({ ...base, sos: true, sosReason: pain, supply: 10 })).toBe(false)
    expect(lineIsEmpty({ ...base, sos: true, supply: 10 })).toBe(true)      // SOS, no reason chosen
    expect(lineIsEmpty({ ...base, sos: true, sosReason: pain })).toBe(true) // SOS, nothing to hand over
    expect(lineIsEmpty({ ...base, sos: true, sosReason: pain, supply: 0 })).toBe(true)
    expect(lineIsEmpty({ ...base })).toBe(true)                     // scheduled, no dose
    expect(lineIsEmpty({ ...base, dose: { m: 1, d: 0, n: 0 } })).toBe(false)
  })

  it('carries the approved Sindhi for the prefix, the reasons and the cap', () => {
    expect(SOS_PREFIX).toBe('جڏهن ضرورت هجي')
    expect(sosReasons.find(r => r.key === 'pain')?.sd).toBe('سور لاءِ')
    expect(sosReasons.length).toBeGreaterThanOrEqual(14)
    expect(sosMaxLine(3)).toContain('3')
  })
})

import { cleanAge, cleanPhone, cleanName, cleanDecimal } from './fields'
describe('one rule for a patient\'s fields at every door', () => {
  it('refuses an impossible age instead of clipping it into a plausible one', () => {
    expect(cleanAge('231321')).toBe('')
    expect(cleanAge('120')).toBe('120')
    expect(cleanAge('121')).toBe('')
    expect(cleanAge('045')).toBe('45')
    expect(cleanAge('7 years')).toBe('7')
  })
  it('keeps a phone to digits, plus and space', () => {
    expect(cleanPhone('0300-123 4567')).toBe('0300123 4567')
    expect(cleanPhone('+92 300 1234567 ext 9')).toBe('+92 300 1234567')
  })
  it('tidies a name without changing it', () => {
    expect(cleanName('  Wazir   Ali ')).toBe('Wazir Ali')
  })
  it('allows one decimal point in a vitals box', () => {
    expect(cleanDecimal('1.2.3')).toBe('1.23')
    expect(cleanDecimal('98.6')).toBe('98.6')
    expect(cleanDecimal('a12')).toBe('12')
  })
})
