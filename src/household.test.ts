import { describe, it, expect } from 'vitest'
import type { Patient } from './types'
import { phoneKey, household, sameHousehold, tell } from './household'
import { planMerge, mergeRefusal, joinAlerts, suggestKeep } from './merge'

const pt = (over: Partial<Patient> = {}): Patient => ({
  id: 'p' + Math.random().toString(36).slice(2, 8), num: 1, name: 'Wazir Ali', createdAt: 1, ...over,
})

describe('one phone, however it was typed', () => {
  it('four spellings of one Larkana mobile are one key', () => {
    const k = phoneKey('03001234567')
    expect(phoneKey('0300 1234567')).toBe(k)
    expect(phoneKey('0300-123-4567')).toBe(k)
    expect(phoneKey('+92 300 1234567')).toBe(k)
    expect(phoneKey('923001234567')).toBe(k)
    expect(k).toBe('3001234567')
  })

  it('two different numbers stay different', () => {
    expect(phoneKey('03001234567')).not.toBe(phoneKey('03001234568'))
  })

  it('a half-typed number is no number, so the desk is not shown the clinic', () => {
    expect(phoneKey('03')).toBe('')
    expect(phoneKey('030012')).toBe('')
    expect(phoneKey('')).toBe('')
    expect(phoneKey(undefined)).toBe('')
    expect(household('0300', [pt({ phone: '0300' })])).toEqual([])
  })
})

describe('the household list', () => {
  const elder = pt({ id: 'e', num: 10, name: 'Ghulam Ali', phone: '0300 1234567', age: '61', sex: 'M', createdAt: 100 })
  const wife = pt({ id: 'w', num: 22, name: 'Bibi', phone: '03001234567', age: '55', sex: 'F', createdAt: 200 })
  const child = pt({ id: 'c', num: 31, name: 'Bibi', phone: '+923001234567', age: '6', sex: 'F', createdAt: 300 })
  const other = pt({ id: 'o', num: 40, name: 'Wazir Ali', phone: '03009999999', createdAt: 50 })
  const nophone = pt({ id: 'n', num: 41, name: 'Nobody', createdAt: 10 })

  it('finds the family across every spelling, oldest first, and nobody else', () => {
    const f = household('0300-1234567', [child, other, wife, nophone, elder])
    expect(f.map(p => p.id)).toEqual(['e', 'w', 'c'])
  })

  it('a record folded into another is not a person and is left out', () => {
    const gone = pt({ id: 'g', num: 99, phone: '03001234567', mergedInto: 'e', createdAt: 400 })
    expect(household('03001234567', [elder, gone]).map(p => p.id)).toEqual(['e'])
  })

  it('a patient with no phone is in no household, including his own', () => {
    expect(sameHousehold(nophone, nophone)).toBe(false)
    expect(sameHousehold(elder, wife)).toBe(true)
    expect(sameHousehold(elder, other)).toBe(false)
  })

  it('tells a grandmother from a grandchild with the same name', () => {
    // the check digit is code.ts's business; this only cares that the number is there
    expect(tell(wife)).toMatch(/^Bibi · 0022\d · 55 · woman$/)
    expect(tell(child)).toMatch(/^Bibi · 0031\d · 6 · woman$/)
    expect(tell(pt({ num: 5, name: 'Wazir Ali' }))).toMatch(/^Wazir Ali · 0005\d$/)
  })
})

describe('folding two records into one', () => {
  const a = pt({ id: 'a', num: 10, name: 'Wazir Ali', age: '34', phone: '0300 1234567', createdAt: 100, alert: 'penicillin' })
  const b = pt({ id: 'b', num: 88, name: 'Wazeer Ali', city: 'Dokri', sex: 'M', createdAt: 900, alert: 'Penicillin' })

  it('the survivor fills its blanks and keeps what it had', () => {
    const plan = planMerge(a, b, 'Doctor', 5000)!
    expect(plan.keep.name).toBe('Wazir Ali')       // kept, not overwritten
    expect(plan.keep.age).toBe('34')               // kept
    expect(plan.keep.city).toBe('Dokri')           // filled from the other
    expect(plan.keep.sex).toBe('M')                // filled
    expect(plan.keep.phone).toBe('0300 1234567')   // kept
  })

  it('the other becomes a signpost with its number intact', () => {
    const plan = planMerge(a, b, 'Doctor')!
    expect(plan.gone.mergedInto).toBe('a')
    expect(plan.gone.num).toBe(88)
    expect(plan.gone.name).toBe('Wazeer Ali')
  })

  it('writes the merge on the survivor as a correction that names the number', () => {
    const plan = planMerge(a, b, 'Clinic admin', 5000)!
    const last = plan.keep.corrections![plan.keep.corrections!.length - 1]
    expect(last).toEqual({ at: 5000, by: 'Clinic admin', merged: 88, was: {} })
  })

  it('never loses an allergy: same line kept once, different lines joined', () => {
    expect(joinAlerts('penicillin', 'Penicillin')).toBe('penicillin')
    expect(joinAlerts('penicillin', 'sulfa')).toBe('penicillin / sulfa')
    expect(joinAlerts(undefined, 'sulfa')).toBe('sulfa')
    expect(joinAlerts('', '')).toBeUndefined()
    expect(planMerge(a, b, 'Doctor')!.keep.alert).toBe('penicillin')
  })

  it('refuses the same record, and refuses a signpost on either side', () => {
    expect(mergeRefusal(a, a)).toMatch(/same record/)
    expect(mergeRefusal({ ...a, mergedInto: 'z' }, b)).toMatch(/already folded/)
    expect(mergeRefusal(a, { ...b, mergedInto: 'z' })).toMatch(/already folded/)
    expect(planMerge(a, a, 'Doctor')).toBe(null)
    expect(mergeRefusal(a, b)).toBe(null)
  })

  it('suggests keeping the older number, because it is on more slips', () => {
    expect(suggestKeep(b, a).map(p => p.id)).toEqual(['a', 'b'])
    expect(suggestKeep(a, b).map(p => p.id)).toEqual(['a', 'b'])
  })
})
