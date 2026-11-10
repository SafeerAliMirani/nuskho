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

/**
 * WHAT EACH OF THESE WOULD HAVE LET THROUGH.
 *
 * Every test below replaces one that passed under a mutation of the thing it
 * names (10 Nov):
 *   - `tell` with the sex hard-coded to "woman": the two fixtures it was given
 *     were both women, and the man was the one patient never handed to it.
 *   - the survivor's blanks: no field was set on BOTH records, so "fills its
 *     blanks and keeps what it had" read the same with the operands swapped,
 *     and the duplicate's age could win. Age is what a child's dose is read off.
 *   - joinAlerts dropping the survivor's own allergy when the folded record had
 *     none — the one direction the five assertions did not cover.
 *   - a merge erasing the correction log it is supposed to join.
 */
describe('the line the desk reads to pick the right member of a family', () => {
  const man = { id: 'm', num: 10, name: 'Ghulam Ali', age: '61', sex: 'M' as const,
                phone: '0300 1234567', createdAt: 1 }
  const woman = { ...man, id: 'w', num: 11, name: 'Sakina', age: '29', sex: 'F' as const }

  it('says man for a man and woman for a woman', () => {
    expect(tell(man)).toContain('man')
    expect(tell(man)).not.toContain('woman')
    expect(tell(woman)).toContain('woman')
  })
})

describe('what a merge must not quietly take away', () => {
  const at = 1_700_000_000_000
  const keep = { id: 'a', num: 18, name: 'Wazir', age: '34', phone: '0300 1234567',
                 city: 'Larkana', alert: 'penicillin', createdAt: 1,
                 corrections: [{ at: 1, by: 'Counter', was: { name: 'Wazeer' } },
                               { at: 2, by: 'Counter', was: { age: '33' } }] }
  const gone = { id: 'b', num: 26, name: 'Wazir Ahmed', age: '43', phone: '0333 0000000',
                 city: 'Naudero', createdAt: 2 }

  it('never lets the folded record overwrite what the survivor already had', () => {
    const plan = planMerge(keep, gone, 'Admin', at)!
    expect(plan.keep.age).toBe('34')            // not the duplicate's 43
    expect(plan.keep.phone).toBe('0300 1234567')
    expect(plan.keep.city).toBe('Larkana')
  })

  it('keeps the corrections it already carried, and adds the merge note to them', () => {
    const plan = planMerge(keep, gone, 'Admin', at)!
    const log = plan.keep.corrections!
    expect(log.length).toBe(3)
    expect(log[0].was.name).toBe('Wazeer')      // the oldest survives the merge
    expect(log[1].was.age).toBe('33')
  })

  it('keeps the survivor\'s allergy when the folded record has none', () => {
    expect(joinAlerts('penicillin', undefined)).toBe('penicillin')
    expect(joinAlerts('penicillin', '')).toBe('penicillin')
    expect(joinAlerts(undefined, 'sulpha')).toBe('sulpha')
    const plan = planMerge(keep, { ...gone, alert: undefined }, 'Admin', at)!
    expect(plan.keep.alert).toBe('penicillin')
  })
})
