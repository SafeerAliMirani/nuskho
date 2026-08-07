import Dexie, { type Table } from 'dexie'
import type { Patient, Visit, Drug, VisitStatus, Fee, RxSet, RxLine } from './types'
import { profile } from './profile'
import { FIRST_DOCTOR } from './doctors'
import { highWater, noteIssued, tokenHighWater, noteToken, CLINIC_DAY_SHIFT } from './safety'
import { isDemo } from './version'
import { chargesFor, chargeTotal } from './testfees'
import { INSTANT } from './data/vitals'

// Everything is written the moment it changes. Load-shedding is normal here:
// power will cut mid-session and reopening Chrome must lose nothing.
class NuskhoDB extends Dexie {
  patients!: Table<Patient, string>
  visits!: Table<Visit, string>
  /** medicines the doctor typed himself — his list, not the shared catalogue */
  drugs!: Table<Drug, string>
  /** rolling local snapshots, three deep */
  snapshots!: Table<{ at: number; blob: string }, number>
  /** medicine sets the doctor named himself */
  sets!: Table<RxSet, string>

  constructor() {
    // The practice copy gets its OWN database, and this is not tidiness.
    // A doctor is shown the demo on his laptop, likes it, and later installs
    // the real thing on the same machine. If they shared a store, his practice
    // patients — typed to see what happens, half-real, wrong — would be sitting
    // in the clinic he then starts trusting. Separate names make that
    // impossible rather than unlikely.
    super(isDemo ? 'nuskho-practice' : 'nuskho')
    this.version(1).stores({
      patients: 'id, name, phone, createdAt, num',
      visits: 'id, patientId, createdAt, status, token',
      drugs: 'id, brand, pending',
    })
    // v2: outcomes other than 'done', the fee, city, and archived medicines.
    // Existing rows upgrade in place — a clinic mid-pilot loses nothing.
    this.version(2).stores({
      patients: 'id, name, phone, createdAt, num, city',
      visits: 'id, patientId, createdAt, status, token, closedAt',
      drugs: 'id, brand, pending, archived, verified',
    })
    // v3: a rolling local snapshot. It survives a crash or a bad restore, not a
    // dead disk — only an exported file does that.
    this.version(3).stores({
      patients: 'id, name, phone, createdAt, num, city',
      visits: 'id, patientId, createdAt, status, token, closedAt',
      drugs: 'id, brand, pending, archived, verified',
      snapshots: 'at',
    })
    // v4: sets the doctor saves himself
    this.version(4).stores({
      patients: 'id, name, phone, createdAt, num, city',
      visits: 'id, patientId, createdAt, status, token, closedAt',
      drugs: 'id, brand, pending, archived, verified',
      snapshots: 'at',
      sets: 'id, name, createdAt',
    })
  }
}

export const db = new NuskhoDB()

/** Crockford-ish sortable id. No dependency, no collisions in a clinic. */
export function uid(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  ).toUpperCase()
}

/** When the clinical day began: 4 am, so an evening that runs past midnight
 *  stays ONE day — same rule as safety.ts dayKey, or tokens would disagree
 *  with the queue about what "today" means. */
const startOfToday = () =>
  new Date(new Date(Date.now() - CLINIC_DAY_SHIFT).toDateString()).getTime() + CLINIC_DAY_SHIFT

export async function todaysVisits(): Promise<Visit[]> {
  const from = startOfToday()
  const v = await db.visits.where('createdAt').above(from).toArray()
  return v.sort((a, b) => a.token - b.token)
}

/**
 * Token counter resets each day.
 *
 * The high-water mark is kept outside the restorable set for the same reason
 * the patient number's is: a restore rewinds the table while the families it
 * rewound past are still holding the receipts. Two people answering to "eight"
 * in a full waiting room is the loudest bug this app can have.
 *
 * In a building with several rooms each room counts from one, because that is
 * how the corridor already works: "token 12 for Room 2". So the counter, and
 * its high-water guard, are per doctor when a doctor is named. The solo clinic
 * passes nothing and keeps the numbering it has always had.
 */
export async function nextToken(doctorId?: string): Promise<number> {
  const v = await todaysVisits()
  const mine = doctorId ? v.filter(x => (x.doctorId ?? FIRST_DOCTOR) === doctorId) : v
  const fromTable = mine.reduce((m, x) => Math.max(m, x.token), 0)
  const n = Math.max(fromTable, tokenHighWater(undefined, doctorId)) + 1
  noteToken(n, undefined, doctorId)
  return n
}

export { patientCode, parseCode, codeLength } from './code'
import { parseCode } from './code'

/**
 * The next patient number.
 *
 * Never reuse one. That number is printed on a slip and IS the patient's card,
 * so two people holding the same number is two people sharing an identity. The
 * table alone is not enough: restoring last night's backup rewinds it while the
 * families who were given today's numbers are still holding the paper. So the
 * high-water mark is kept outside the restorable set and only ever rises.
 * A gap in the numbering costs nothing.
 */
export async function nextPatientNum(): Promise<number> {
  const last = await db.patients.orderBy('num').last()
  const n = Math.max((last?.num ?? 0), highWater()) + 1
  noteIssued(n)
  return n
}

export const findByCode = (code: string) => {
  const n = parseCode(code)
  return n === null ? Promise.resolve(undefined) : db.patients.where('num').equals(n).first()
}

/** Same medicine, however it was spelled when it was entered. */
const drugKey = (d: Drug) =>
  `${d.brand} ${d.strength}`.toLowerCase().replace(/\s+/g, '').replace(/[.,-]/g, '')

/**
 * All medicines this doctor can prescribe.
 *
 * Our sample list is a STARTER, not a permanent addition. Once he has been
 * through setup, his list is whatever is in the database and nothing else —
 * otherwise "AUGMENTIN 625 mg" (ours) and "AUGMENTIN 625mg" (his) both appear
 * as separate chips, the duplicate guard cannot see they are the same medicine,
 * and both can land on one prescription.
 */
export async function doctorDrugs(seed: Drug[]): Promise<Drug[]> {
  const all = await db.drugs.toArray()
  const own = all.filter(d => !d.archived)     // archived leaves the picker, never the record
  const list = profile().ready ? own : [...seed, ...own]

  const byKey = new Map<string, Drug>()
  const seenId = new Set<string>()
  for (const d of list) {
    if (seenId.has(d.id)) continue
    seenId.add(d.id)
    // his own record always wins over ours: it is spelled the way he writes it
    const k = drugKey(d)
    if (!byKey.has(k) || !byKey.get(k)!.id.startsWith('own_')) byKey.set(k, d)
  }
  return [...byKey.values()]
}

/** How often he has actually prescribed each drug — the grid sorts by this. */
export async function usageCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  await db.visits.each(v => v.lines.forEach(l => { out[l.drugId] = (out[l.drugId] ?? 0) + 1 }))
  return out
}

/** Last visit summary for the doctor's screen. Never printed on the slip. */
export async function lastVisit(patientId: string, exceptVisitId?: string) {
  const vs = (await db.visits.where('patientId').equals(patientId).toArray())
    .filter(v => v.id !== exceptVisitId && v.printedAt)
    .sort((a, b) => b.createdAt - a.createdAt)
  return vs[0]
}


/* ---------------------------------------------------------------- medicines */

/** Loose enough to catch "AUGMENTIN 625MG" vs "Augmentin 625 mg". */
export const normDrug = (brand: string, strength = '') =>
  `${brand} ${strength}`.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Medicines already on his list that look like what he is about to add.
 * Shown BEFORE the add, because one tap on an existing chip is the only thing
 * that stops the same drug existing under four spellings.
 */
export function similarDrugs(brand: string, strength: string, all: Drug[]): Drug[] {
  const key = normDrug(brand, strength)
  const nameOnly = brand.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!nameOnly) return []
  return all.filter(d => {
    if (d.archived) return false
    const k = normDrug(d.brand, d.strength)
    if (k === key) return true
    const n = d.brand.toLowerCase().replace(/[^a-z0-9]/g, '')
    return n === nameOnly || (n.length > 3 && nameOnly.length > 3
      && (n.startsWith(nameOnly) || nameOnly.startsWith(n)))
  })
}

/** Never deleted: a prescription in someone's hand may name it. */
export async function archiveDrug(id: string) {
  await db.drugs.update(id, { archived: true })
}

export async function unarchiveDrug(id: string) {
  await db.drugs.update(id, { archived: false })
}

/* ------------------------------------------------------------------- visits */

/** End a visit without a prescription. The token stops waiting; nothing is deleted. */
export async function closeVisit(id: string, status: VisitStatus, note?: string) {
  await db.visits.update(id, { status, closedAt: Date.now(), closeNote: note?.trim() || undefined })
}

export async function setFee(id: string, fee: Fee | undefined) {
  await db.visits.update(id, { fee })
}

/** The doctor reduces a fee. What that MEANS depends on whether the money was
 *  ever taken: a collected fee produces a refund the counter owes back; a fee
 *  still due simply becomes a smaller debt. Computing a "refund" of money that
 *  was never collected made the drawer count itself short. */
export async function grantDiscount(id: string, newAmount: number, note?: string) {
  const v = await db.visits.get(id)
  if (!v?.fee) return
  const want = Math.max(0, newAmount)
  if (v.fee.state === 'due') {
    // nothing was collected, so nothing can be owed back: the debt shrinks
    await db.visits.update(id, {
      fee: { ...v.fee, amount: want, refund: undefined, refundedAt: undefined,
             refundNote: note?.trim() || undefined,
             state: want === 0 ? 'waived' : 'due' },
    })
    return
  }
  if (v.fee.amount === 0) return   // free from the start: nothing to reduce
  const back = Math.max(0, v.fee.amount - want)
  await db.visits.update(id, {
    // cancelling a full waive puts the state back to paid: the money was
    // collected and is being kept, so calling it waived was a lie in figures
    fee: { ...v.fee, refund: back || undefined, refundNote: note?.trim() || undefined,
           refundedAt: undefined, state: back === v.fee.amount ? 'waived' : 'paid' },
  })
}

export async function markRefunded(id: string) {
  const v = await db.visits.get(id)
  if (!v?.fee) return
  await db.visits.update(id, { fee: { ...v.fee, refundedAt: Date.now() } })
}

/** Patients who are owed money and have not collected it yet. */
export const owedRefund = (v: Visit) => !!v.fee?.refund && !v.fee.refundedAt

/** The day, as the doctor's panel will eventually count it. */
export async function daySummary(visits: Visit[]) {
  const by = (s: VisitStatus) => visits.filter(v => v.status === s).length
  const fees = visits.map(v => v.fee).filter(Boolean) as Fee[]
  return {
    total: visits.length,
    printed: visits.filter(v => v.printedAt).length,
    waiting: by('waiting'),
    seen: by('seen'),
    left: by('left'),
    cancelled: by('cancelled'),
    referred: by('referred'),
    collected: fees.filter(f => f.state !== 'due').reduce((a, f) => a + f.amount, 0)
             - fees.reduce((a, f) => a + (f.refundedAt ? (f.refund ?? 0) : 0), 0),
    toRefund: fees.filter(f => f.refund && !f.refundedAt).reduce((a, f) => a + (f.refund ?? 0), 0),
    refundCount: fees.filter(f => f.refund && !f.refundedAt).length,
    waived: fees.filter(f => f.state === 'waived').length,
    due: fees.filter(f => f.state === 'due').reduce((a, f) => a + f.amount, 0),
    unrecorded: visits.filter(v => !v.fee && v.status !== 'waiting').length,

    /* Tests done in the clinic, kept apart from the consultation fee in every
       figure. A clinic that cannot tell the two apart cannot tell whether the
       strip machine pays for itself. Owed until the compounder marks it taken,
       because money nobody collected must never look collected. */
    testsTaken: visits.filter(v => v.testsPaidAt)
                      .reduce((a, v) => a + chargeTotal(chargesFor(v.vitals, INSTANT)), 0),
    testsOwed: visits.filter(v => !v.testsPaidAt)
                     .reduce((a, v) => a + chargeTotal(chargesFor(v.vitals, INSTANT)), 0),
    testsOwedCount: visits.filter(v => !v.testsPaidAt && chargesFor(v.vitals, INSTANT).length).length,
  }
}

/** The compounder took the money for the tests, outside the room, after. */
export async function markTestsPaid(visitId: string): Promise<void> {
  await db.visits.update(visitId, { testsPaidAt: Date.now() })
}


/* ------------------------------------------------------------------- sets */

export const listSets = () => db.sets.orderBy('name').toArray()

/** Saved from a prescription he has just written, under a name he types. */
export async function saveSet(name: string, lines: RxLine[]): Promise<void> {
  const clean = lines.map(l => ({ drugId: l.drugId, dose: { ...l.dose }, meal: l.meal, days: l.days }))
  if (!name.trim() || !clean.length) return
  await db.sets.put({ id: uid(), name: name.trim(), createdAt: Date.now(), lines: clean })
}

export const deleteSet = (id: string) => db.sets.delete(id)
