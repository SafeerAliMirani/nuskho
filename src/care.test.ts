import { describe, it, expect } from 'vitest'
import { impossible, firstImpossible, flag, isChild, vitalDef, VITALS } from './data/vitals'
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
  it('treats half a blood pressure as impossible, not as a low one', () => {
    expect(impossible(bp, '180/')).toBe(true)
    expect(impossible(bp, '/110')).toBe(true)
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
  it('gives every vital a possible range, so nothing is unguarded by accident', () => {
    for (const d of VITALS) expect(d.pmin != null && d.pmax != null).toBe(true)
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
