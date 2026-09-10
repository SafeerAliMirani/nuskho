import { describe as group, it, expect } from 'vitest'
import type { Patient, Visit } from './types'
import {
  cleanPatch, changedFields, refusal, correct, describe, describeOld,
  printedNote, printedCount, whoFor, MAX_CORRECTIONS,
} from './patient'
import { slipDataFor } from './rx'
import { printedStamp } from './rx'

const pt = (over: Partial<Patient> = {}): Patient => ({
  id: 'p1', num: 214, name: 'Wazeer Ali', createdAt: 1, ...over,
})

group('what counts as a change', () => {
  it('a typo corrected is one change and nothing else', () => {
    const p = pt({ age: '34', city: 'Larkana' })
    expect(changedFields(p, { name: 'Wazir Ali', age: '34', city: 'Larkana' }))
      .toEqual({ name: 'Wazir Ali' })
  })

  it('pressing save without touching anything changes nothing', () => {
    const p = pt({ age: '34' })
    expect(changedFields(p, { name: 'Wazeer Ali', age: '34' })).toEqual({})
    expect(refusal(p, { name: 'Wazeer Ali', age: '34' })).toBe('Nothing was changed.')
  })

  it('an empty box and an absent field are the same absence', () => {
    // the desk opens the box on a patient with no age, types nothing, saves
    expect(changedFields(pt(), { age: '', phone: '', city: '', sex: '' })).toEqual({})
  })

  it('a field left out of the patch is left alone, not cleared', () => {
    const p = pt({ age: '34', city: 'Dokri' })
    expect(changedFields(p, { name: 'Wazir Ali' })).toEqual({ name: 'Wazir Ali' })
  })

  it('the cleaners apply here as at every other door', () => {
    // "231321" printed on a real slip once. It may not get in this way either.
    expect(cleanPatch({ age: '231321' }).age).toBe('')
    expect(cleanPatch({ name: '  Wazir   Ali  ' }).name).toBe('Wazir Ali')
    // the hyphen goes, one space survives as a space: a desk writes it that way
    expect(cleanPatch({ phone: '0300-123 4567' }).phone).toBe('0300123 4567')
    expect(cleanPatch({ sex: 'X' as 'M' }).sex).toBe('')
  })

  it('a name cannot be emptied', () => {
    expect(refusal(pt(), { name: '   ' })).toMatch(/needs a name/)
    expect(refusal(pt(), { name: 'Wazir Ali' })).toBe(null)
  })
})

group('the correction itself', () => {
  it('keeps the old details and writes the new ones', () => {
    const p = pt({ age: '34', sex: 'M' })
    const r = correct(p, { name: 'Wazir Ali', sex: 'F' }, 'Token counter', 1000)!
    expect(r.next.name).toBe('Wazir Ali')
    expect(r.next.sex).toBe('F')
    expect(r.correction).toEqual({ at: 1000, by: 'Token counter', was: { name: 'Wazeer Ali', sex: 'M' } })
    // the age was not touched, so it is not in the log pretending it was
    expect(r.correction.was.age).toBeUndefined()
  })

  it('clearing a field stores an absence, not an empty string', () => {
    const p = pt({ age: '34', phone: '03001234567' })
    const r = correct(p, { age: '', phone: '' }, 'Compounder')!
    expect(r.next.age).toBeUndefined()
    expect(r.next.phone).toBeUndefined()
    expect(r.correction.was).toEqual({ age: '34', phone: '03001234567' })
  })

  it('the number is never touched, whatever is sent', () => {
    const r = correct(pt(), { name: 'Wazir Ali', num: 999 } as never, 'Doctor')!
    expect(r.next.num).toBe(214)
  })

  it('answers null rather than logging an empty correction', () => {
    expect(correct(pt({ age: '34' }), { age: '34' }, 'Doctor')).toBe(null)
  })

  it('the log is bounded, and it is the oldest that goes', () => {
    let p = pt()
    for (let i = 0; i < MAX_CORRECTIONS + 5; i++) {
      p = correct(p, { name: `Name ${i}` }, 'Token counter', 1000 + i)!.next
    }
    expect(p.corrections!.length).toBe(MAX_CORRECTIONS)
    expect(p.corrections![0].at).toBe(1000 + 5)
    expect(p.corrections![p.corrections!.length - 1].at).toBe(1000 + MAX_CORRECTIONS + 4)
  })

  it('says what is about to happen in words', () => {
    const p = pt({ age: '34' })
    expect(describe(p, { name: 'Wazir Ali', age: '' }))
      .toBe('name Wazeer Ali to Wazir Ali, age 34 to nothing')
    expect(describe(pt(), { sex: 'F' })).toBe('man or woman nothing to woman')
  })

  it('reads an old correction back the other way round', () => {
    expect(describeOld({ at: 1, by: 'Doctor', was: { name: 'Wazeer Ali' } }))
      .toBe('name was Wazeer Ali')
  })
})

group('the paper already in somebody hand', () => {
  const v = (printed?: boolean): Visit => ({
    id: 'v', patientId: 'p1', token: 1, status: 'done', createdAt: 1,
    lines: [], tests: [], advice: [], ...(printed ? { printedAt: 2 } : {}),
  })

  it('says nothing when nothing has been printed', () => {
    expect(printedCount([v(), v()])).toBe(0)
    expect(printedNote(0)).toBe(null)
  })

  it('counts only printed slips, and says how many', () => {
    expect(printedCount([v(true), v(), v(true)])).toBe(2)
    expect(printedNote(1)).toMatch(/^One prescription/)
    expect(printedNote(2)).toMatch(/^2 prescriptions/)
  })
})

group('a printed slip still never changes', () => {
  const drugs = {}
  const base: Visit = {
    id: 'visit-abcdef', patientId: 'p1', token: 7, status: 'done', createdAt: 1,
    lines: [], tests: [], advice: [],
  }

  it('an unprinted visit reads the live record, exactly as it always did', () => {
    const d = slipDataFor(base, pt({ age: '34', sex: 'M', alert: 'penicillin' }), drugs)
    expect(d.patientName).toBe('Wazeer Ali')
    expect(d.patientAge).toBe('34')
    expect(d.patientAlert).toBe('penicillin')
  })

  it('a printed visit keeps the name it was printed with, after a correction', () => {
    const before = pt({ age: '34', sex: 'M', alert: 'penicillin' })
    // printed on Tuesday
    const stamped = { ...base, ...printedStamp(undefined, whoFor(before)) }
    // corrected on Thursday: the spelling, the age, the allergy
    const after = correct(before, { name: 'Wazir Ali', age: '35' }, 'Token counter')!.next
    const d = slipDataFor(stamped, { ...after, alert: 'penicillin and sulfa' }, drugs)
    expect(d.patientName).toBe('Wazeer Ali')
    expect(d.patientAge).toBe('34')
    expect(d.patientAlert).toBe('penicillin')
    expect(d.patientCode.startsWith('0214')).toBe(true)
  })

  it('a visit printed before the freeze existed still prints, from the record', () => {
    // every slip in the database on the day this shipped has no `who`
    const old = { ...base, printedAt: 2 }
    expect(slipDataFor(old, pt({ age: '34' }), drugs).patientName).toBe('Wazeer Ali')
  })

  it('the snapshot carries only what the paper carries', () => {
    expect(whoFor(pt({ age: '34', sex: 'F', alert: 'aspirin', city: 'Dokri', phone: '0300' })))
      .toEqual({ name: 'Wazeer Ali', num: 214, age: '34', sex: 'F', alert: 'aspirin' })
    // absent stays absent rather than becoming an empty string on the paper
    expect(whoFor(pt())).toEqual({ name: 'Wazeer Ali', num: 214 })
  })
})

group('the same rules over the wire', () => {
  /* The record holder applies a phone's correction through `correct` and
     `refusal`, exactly as the desk does — see applyIntent('fixPatient'). What
     is worth pinning is the shape of the phone's patch, because the doctor's
     screen sends THREE fields and the desk sends five, and the whole reason a
     correction made in the room does not wipe the phone number and the village
     is that an absent key means "leave it alone". */
  it('a correction from the room leaves the desk fields alone', () => {
    const p = pt({ age: '4', phone: '03001234567', city: 'Dokri' })
    const r = correct(p, { name: 'Wazir Ali', age: '34', sex: 'M' }, 'Doctor')!
    expect(r.next.phone).toBe('03001234567')
    expect(r.next.city).toBe('Dokri')
    expect(r.next.age).toBe('34')
    // and the log does not claim they were touched
    expect(r.correction.was).toEqual({ name: 'Wazeer Ali', age: '4' })
  })

  it('a wire value that is not a sex is dropped rather than stored', () => {
    // every intent clips before the rules see it; this is the last line of it
    expect(cleanPatch({ sex: 'yes' as 'M' }).sex).toBe('')
    expect(changedFields(pt({ sex: 'F' }), { sex: 'yes' as 'M' })).toEqual({ sex: '' })
  })

  it('a name of nothing but spaces is refused, whoever sends it', () => {
    expect(refusal(pt(), { name: '  \t ' })).toMatch(/needs a name/)
  })
})
