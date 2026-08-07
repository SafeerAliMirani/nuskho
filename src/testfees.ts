/**
 * WHAT THE CLINIC CHARGES FOR A TEST IT DOES ITSELF.
 *
 * Safeer described the evening exactly, so the model follows it exactly rather
 * than inventing a billing system:
 *
 *   "some test like sugar, and hba1c or cholestrol tests happen inside the
 *    doctor room by doctors devices, its happen only when dr see a patient and
 *    feel that this patient need such tests so he ask his compunder, and
 *    compounder do at that time and tell the results to doctor and doctor write
 *    in the prescription while after leaving from room compounder ask patient
 *    to pay 100 RS to 300 RS depending upon the test from patient"
 *
 * Four things follow from that, and every one of them is a design decision:
 *
 *   IT IS ORDERED IN THE ROOM. The charge appears because the doctor asked for
 *   a test and a reading was written down, never because somebody opened a
 *   billing screen. There is no way to bill a test that was not done.
 *
 *   IT IS COLLECTED AFTER, BY THE COMPOUNDER, OUTSIDE THE ROOM. So it is a debt
 *   on the visit until he marks it taken, and the day's figures carry it as
 *   owed until then. Money that was never collected must never look collected.
 *
 *   THE READING PRINTS. THE PRICE DOES NOT. A prescription is a medical
 *   document that a family keeps, shows another doctor and sometimes takes to a
 *   hospital. A number on it should be a clinical number. Safeer chose this.
 *
 *   IT IS SEPARATE FROM THE CONSULTATION FEE, everywhere, in the drawer and in
 *   the figures. A clinic that cannot tell the two apart cannot tell whether
 *   the strip machine pays for itself.
 *
 * Prices belong to the doctor, not to Nuskho: they are `rate`, the same
 * permission as the consultation fee. Blank or zero means that test is free
 * here, and no charge is ever raised for it.
 */

const KEY = 'nuskho.testfees'

export type TestFees = Record<string, number>

export function testFees(): TestFees {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const v = JSON.parse(raw) as Record<string, unknown>
    const out: TestFees = {}
    for (const [k, n] of Object.entries(v)) {
      const a = Math.max(0, Math.floor(Number(n) || 0))
      if (a > 0) out[k] = a
    }
    return out
  } catch { return {} }
}

export function setTestFees(f: TestFees): void {
  try { localStorage.setItem(KEY, JSON.stringify(f)) } catch { /* ignore */ }
}

/** What one test costs here, or 0 for free. */
export const testFee = (key: string): number => testFees()[key] ?? 0

/** Has this clinic priced anything at all? Until it has, none of this shows. */
export const chargesTests = (): boolean => Object.keys(testFees()).length > 0

/* ------------------------------------------------------------- on a visit */

export type Charge = {
  /** the vitals key, so the reading and the charge can never drift apart */
  key: string
  /** what it was called when it was charged, kept so a later price change
   *  cannot rewrite what a patient was actually asked for */
  en: string
  amount: number
}

/**
 * What this visit owes for tests, given the readings the doctor recorded.
 *
 * Derived from the readings rather than stored separately on purpose: a test
 * whose reading is deleted stops being charged, and there is no way to end up
 * with a bill for a test that is not in the record.
 */
export function chargesFor(vitals: Record<string, string> | undefined,
                           defs: { key: string; en: string; kind: string }[]): Charge[] {
  if (!vitals) return []
  const fees = testFees()
  const out: Charge[] = []
  for (const d of defs) {
    if (d.kind !== 'test') continue
    const reading = (vitals[d.key] ?? '').trim()
    if (!reading) continue
    const amount = fees[d.key] ?? 0
    if (amount <= 0) continue
    out.push({ key: d.key, en: d.en, amount })
  }
  return out
}

export const chargeTotal = (c: Charge[]): number => c.reduce((n, x) => n + x.amount, 0)
