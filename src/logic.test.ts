import { describe, it, expect } from 'vitest'
import { printedStamp, lineIsEmpty } from './rx'
import { readBackup } from './backup'

/**
 * Batch 22: rules that were stated in comments and enforced nowhere.
 */
describe('printing ends a visit in a prescription, whatever ended it before', () => {
  it('stamps printed + done and clears an earlier cancellation', () => {
    const s = printedStamp()
    expect(s.status).toBe('done')
    expect(s.printedAt).toBeGreaterThan(0)
    expect('closedAt' in s && s.closedAt === undefined).toBe(true)
    expect('closeNote' in s && s.closeNote === undefined).toBe(true)
    expect('lines' in s).toBe(false)
  })
  it('carries frozen lines when handed them', () => {
    const l = { drugId: 'x', dose: { m: 1, d: 0, n: 0 }, meal: 'after' as const, days: 3 }
    expect(printedStamp([l]).lines).toEqual([l])
    expect(lineIsEmpty(l)).toBe(false)
  })
})

describe('a backup file is checked before a single row is written', () => {
  const ok = { magic: 'nuskho.backup', version: 1, kind: 'full', profile: {}, paper: {}, drugs: [], patients: [], visits: [], sets: [] }
  const text = (o: unknown) => JSON.stringify(o)
  it('refuses a visit whose lines are not a list', () => {
    const f = { ...ok, visits: [{ id: 'v1', patientId: 'p1', createdAt: 1, lines: 'PANADOL' }] }
    expect(() => readBackup(text(f))).toThrow(/damaged/)
  })
  it('refuses a patient with no number', () => {
    const f = { ...ok, patients: [{ id: 'p1', name: 'Wazir Ali' }] }
    expect(() => readBackup(text(f))).toThrow(/damaged/)
  })
  it('refuses a prescription line with no dose object', () => {
    const f = { ...ok, visits: [{ id: 'v1', patientId: 'p1', createdAt: 1, lines: [{ drugId: 'd1' }] }] }
    expect(() => readBackup(text(f))).toThrow(/damaged/)
  })
  it('accepts a whole file', () => {
    const f = { ...ok,
      patients: [{ id: 'p1', name: 'Wazir Ali', num: 18, createdAt: 1 }],
      visits: [{ id: 'v1', patientId: 'p1', createdAt: 1, lines: [{ drugId: 'd1', dose: { m: 1, d: 0, n: 0 }, meal: 'after', days: 3 }] }] }
    expect(() => readBackup(text(f))).not.toThrow()
  })
})
