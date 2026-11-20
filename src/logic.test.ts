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
    expect(() => readBackup(text(f))).toThrow(/a visit has no id, patient, lines or date/)
  })
  it('refuses a patient with no number', () => {
    const f = { ...ok, patients: [{ id: 'p1', name: 'Wazir Ali' }] }
    expect(() => readBackup(text(f))).toThrow(/a patient has no id, name or number/)
  })
  it('refuses a prescription line with no dose object', () => {
    const f = { ...ok, visits: [{ id: 'v1', patientId: 'p1', createdAt: 1, lines: [{ drugId: 'd1' }] }] }
    expect(() => readBackup(text(f))).toThrow(/a prescription line has no medicine or dose/)
  })
  it('accepts a whole file', () => {
    const f = { ...ok,
      patients: [{ id: 'p1', name: 'Wazir Ali', num: 18, createdAt: 1 }],
      visits: [{ id: 'v1', patientId: 'p1', createdAt: 1, lines: [{ drugId: 'd1', dose: { m: 1, d: 0, n: 0 }, meal: 'after', days: 3 }] }] }
    expect(() => readBackup(text(f))).not.toThrow()
  })
})

/**
 * ONE REFUSAL, ONE TEST, ONE SENTENCE. (Found 10 Nov.)
 *
 * The three refusals above each assert `/damaged/`, which every shape check
 * in readBackup says, and every fixture carries a good magic, a good version
 * and empty medicines and sets. So the magic check, the version check, the
 * medicine check, the set check and the "is it even a list" check could each
 * be deleted and nothing here would notice.
 *
 * Each case below is a whole, valid file with exactly ONE thing wrong, and it
 * asserts the sentence that belongs to that one thing. `whole` is read first,
 * so a fixture that was refused for some other reason cannot pass as a
 * refusal of the fault it was written for.
 *
 * What is at stake is the clinic's own tables: a file that fails here writes
 * nothing, and a file wrongly let through writes rows that every count, day
 * summary and print path then throws on, with no way to find which row.
 */
describe('each thing a backup file can have wrong is refused by name', () => {
  const whole = () => ({
    magic: 'nuskho.backup', version: 1, kind: 'full', at: 1, profile: {}, paper: {},
    drugs: [{ id: 'd1', brand: 'PANADOL', strength: '500 mg', generic: 'Paracetamol', sd: '', unitSd: '', form: 'tab' }],
    patients: [{ id: 'p1', name: 'Wazir Ali', num: 18, createdAt: 1 }],
    visits: [{ id: 'v1', patientId: 'p1', createdAt: 1, lines: [{ drugId: 'd1', dose: { m: 1, d: 0, n: 0 }, meal: 'after', days: 3 }] }],
    sets: [{ id: 's1', name: 'Fever', lines: [] }],
  })
  const read = (o: unknown) => () => readBackup(JSON.stringify(o))

  it('reads the fixture every case below is cut from, and hands it back unchanged', () => {
    expect(readBackup(JSON.stringify(whole()))).toEqual(whole())
  })

  it('reads a setup file, which carries no patients, visits or sets at all', () => {
    // the file a doctor emails himself. If a missing table were "damaged",
    // the safe file would be the one that could not be restored.
    const { patients: _p, visits: _v, sets: _s, ...setup } = whole()
    expect(read({ ...setup, kind: 'setup' })).not.toThrow()
  })

  it('refuses a file that is not ours', () => {
    // somebody picks the wrong .json off the pen drive. Without this check
    // the rows of another program are measured against our shapes, and
    // whatever happens to fit is written.
    expect(read({ ...whole(), magic: 'someone.else' })).toThrow(/not a Nuskho setup file/)
    const { magic: _m, ...unsigned } = whole()
    expect(read(unsigned)).toThrow(/not a Nuskho setup file/)
    expect(read(null)).toThrow(/not a Nuskho setup file/)
    expect(read([])).toThrow(/not a Nuskho setup file/)
  })

  it('refuses a file from a newer Nuskho than this one', () => {
    // a newer version may mean a field this copy does not know how to keep.
    // Restoring it would drop that field silently and call the restore whole.
    expect(read({ ...whole(), version: 2 })).toThrow(/newer version/)
    expect(read({ ...whole(), version: 1 })).not.toThrow()
  })

  it('calls a file with no version damaged, not newer', () => {
    /* A version that is not a number cannot be compared, so the file is not
       trusted either way: '1' > 1 is false, and without the typeof check it
       walks in. But it used to be refused with "made by a newer version of
       Nuskho", which sends a clinic looking for an update that does not exist
       over a file that is simply broken. The refusal was right and the sentence
       was not. (20 Nov) */
    expect(read({ ...whole(), version: '1' })).toThrow(/damaged/)
    expect(read({ ...whole(), version: '1' })).not.toThrow(/newer version/)
    const { version: _v, ...unversioned } = whole()
    expect(read(unversioned)).toThrow(/damaged/)
  })

  it('refuses a medicine with no name or no id', () => {
    // a medicine with no brand is a blank line on a prescription
    const d = whole().drugs[0]
    const { brand: _b, ...nameless } = d
    const { id: _i, ...idless } = d
    expect(read({ ...whole(), drugs: [nameless] })).toThrow(/a medicine has no id or name/)
    expect(read({ ...whole(), drugs: [idless] })).toThrow(/a medicine has no id or name/)
    expect(read({ ...whole(), drugs: [d, 'PANADOL'] })).toThrow(/a medicine has no id or name/)
  })

  it('refuses a set with no id or no list of lines', () => {
    // a set is tapped once and becomes five lines of a prescription; one
    // whose lines are not a list throws in the doctor's hand, mid-consultation
    expect(read({ ...whole(), sets: [{ name: 'Fever', lines: [] }] })).toThrow(/a set has no id or lines/)
    expect(read({ ...whole(), sets: [{ id: 's1', name: 'Fever' }] })).toThrow(/a set has no id or lines/)
    expect(read({ ...whole(), sets: [{ id: 's1', name: 'Fever', lines: 'PANADOL' }] })).toThrow(/a set has no id or lines/)
  })

  it('refuses a patient whose number could never have been printed on a slip', () => {
    // The number is the only key a returning patient carries, and restore()
    // jumps the clinic's counter past the largest one in the file. Each of
    // these is a different clause of the check, so each can be deleted alone.
    const pt = (num: unknown) => ({ ...whole(), patients: [{ id: 'p1', name: 'Wazir Ali', num, createdAt: 1 }] })
    const no = /a patient has no id, name or number/
    expect(read(pt(-1))).toThrow(no)              // `<= 0`
    expect(read(pt(0))).toThrow(no)               // `<= 0`, at its edge
    expect(read(pt('18'))).toThrow(no)            // typeof
    // NaN CANNOT BE WRITTEN TO A JSON FILE: JSON.stringify turns it into null,
    // so a patient saved with `num: NaN` arrives here as `num: null`. That is
    // the shape a real damaged file has, and it is refused by the typeof.
    expect(JSON.stringify({ num: NaN })).toBe('{"num":null}')
    expect(read(pt(NaN))).toThrow(no)
    expect(read(pt(null))).toThrow(no)
    // What DOES reach the isFinite clause is a number too large to hold:
    // JSON.parse reads 1e999 as Infinity, which is a number and is above
    // zero. Let through, it would be handed to the counter as the high-water
    // mark, and every patient registered afterwards would be number Infinity.
    const huge = JSON.stringify(pt(18)).replace('"num":18', '"num":1e999')
    expect(huge).toContain('"num":1e999')
    expect(() => readBackup(huge)).toThrow(no)
    // and the ordinary one, so this is not a test that patients are refused
    expect(read(pt(18))).not.toThrow()
  })

  it('refuses a table that is not a list, in words, instead of crashing on it', () => {
    // `visits: {}` is what a hand-edited or half-written file looks like.
    // Without the check the loop below it throws "f.visits is not iterable",
    // a TypeError that says nothing about the file and does not promise that
    // nothing was changed. An object and a number are used because a string
    // IS iterable and would be refused later, by a different sentence.
    for (const key of ['drugs', 'patients', 'visits', 'sets']) {
      for (const notAList of [{}, 5, 'PANADOL', null]) {
        let said: unknown
        try { readBackup(JSON.stringify({ ...whole(), [key]: notAList })) } catch (e) { said = e }
        expect(said, `${key}: ${JSON.stringify(notAList)} was accepted`).toBeInstanceOf(Error)
        expect(said, `${key}: ${JSON.stringify(notAList)} crashed instead of being refused`).not.toBeInstanceOf(TypeError)
        expect((said as Error).message).toBe(`That file is damaged: ${key} is not a list. Nothing was changed.`)
      }
    }
  })

  it('says of every damaged file that nothing was changed', () => {
    // the sentence a frightened person at the desk needs, and it is only true
    // because every check runs before a single row is written
    for (const f of [
      { ...whole(), drugs: [{}] }, { ...whole(), patients: [{}] },
      { ...whole(), visits: [{}] }, { ...whole(), sets: [{}] },
    ]) expect(read(f)).toThrow(/^That file is damaged: .+\. Nothing was changed\.$/)
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

import { daySummary } from './db'
import type { Visit } from './types'

/**
 * AN AMENDED SLIP IS A CORRECTION, NOT A SECOND PATIENT. The desk's row used
 * to say "20 tokens" and then list statuses adding up to 22, in one sentence.
 */
describe('the day adds up', () => {
  const v = (p: Partial<Visit>): Visit => ({
    id: Math.random().toString(36), patientId: 'p1', token: 1, status: 'done',
    createdAt: Date.now(), lines: [], tests: [], advice: [], printedAt: Date.now(), ...p,
  })
  it('counts a corrected prescription once, in every column of the same row', async () => {
    const s = await daySummary([
      v({ id: 'a', fee: { amount: 500, state: 'paid', at: Date.now() } }),
      v({ id: 'b', status: 'left', printedAt: undefined }),
      v({ id: 'c', amendsId: 'a' }),          // the correction of a
    ])
    expect(s.total).toBe(2)
    expect(s.printed).toBe(1)
    expect(s.left).toBe(1)
    expect(s.total).toBe(s.printed + s.left + s.waiting + s.seen + s.cancelled + s.referred)
    expect(s.collected).toBe(500)             // not 1000
  })
})
