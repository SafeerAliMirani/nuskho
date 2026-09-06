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

import { chargesFee, type Profile } from './profile'
import { renderToken } from './print/token'

/**
 * A CLINIC THAT DOES NOT CHARGE. Batch 25.
 *
 * The app worked for one already — a rate of zero writes every visit as waived
 * and nothing breaks — but it showed them a fee box at the door, "Rs 0 taken at
 * the counter" on every prescription, and a page of empty rupee tiles. And
 * "waived" was a lie about what happened: a fee was never asked for.
 */
describe('a clinic that does not charge', () => {
  const p = (noFee?: boolean) => ({ noFee } as Profile)

  it('charges by default, because an unset fee is not a free clinic', () => {
    expect(chargesFee(p(undefined))).toBe(true)
    expect(chargesFee(p(false))).toBe(true)
  })

  it('knows when it has been told', () => {
    expect(chargesFee(p(true))).toBe(false)
  })

  it('leaves the fee row off the token receipt entirely, rather than printing FREE', () => {
    const base = { token: 4, patientName: 'Wazir Ali', patientCode: '00185', at: Date.now() }
    const free = renderToken({ ...base })
    expect(free).not.toContain('tk-fee')
    expect(free).not.toContain('FREE')
    expect(free).toContain('00185')            // the rest of the receipt is untouched
    const charged = renderToken({ ...base, fee: 500, feeState: 'paid' })
    expect(charged).toContain('tk-fee')
    expect(charged).toContain('500')
    const waived = renderToken({ ...base, fee: 0, feeState: 'waived' })
    expect(waived).toContain('FREE')           // a fee that WAS waived still says so
  })
})
