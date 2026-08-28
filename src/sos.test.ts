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

  it('judges an SOS line by its reason, not its empty schedule', () => {
    expect(lineIsEmpty({ ...base, sos: true, sosReason: { en: 'for pain', sd: 'سور لاءِ' } })).toBe(false)
    expect(lineIsEmpty({ ...base, sos: true })).toBe(true)          // SOS, no reason chosen
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
