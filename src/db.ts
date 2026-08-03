import Dexie, { type Table } from 'dexie'
import type { Patient, Visit, Drug, VisitStatus, Fee, RxSet, RxLine } from './types'
import { profile } from './profile'
import { highWater, noteIssued } from './safety'

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
    super('nuskho')
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

const startOfToday = () => new Date(new Date().toDateString()).getTime()

export async function todaysVisits(): Promise<Visit[]> {
  const from = startOfToday()
  const v = await db.visits.where('createdAt').above(from).toArray()
  return v.sort((a, b) => a.token - b.token)
}

/** Token counter resets each session. */
export async function nextToken(): Promise<number> {
  const v = await todaysVisits()
  return v.reduce((m, x) => Math.max(m, x.token), 0) + 1
}

/* ---------------------------------------------------------------- patient code
   Four digits plus a Luhn check digit. The check digit is the point: a
   mistyped number fails loudly instead of quietly opening the wrong patient's
   history in front of a doctor who is trusting the screen. */

function luhn(d: string): number {
  let sum = 0, dbl = true
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48
    if (dbl) { n *= 2; if (n > 9) n -= 9 }
    sum += n; dbl = !dbl
  }
  return (10 - (sum % 10)) % 10
}

export function patientCode(num: number): string {
  const b = String(num).padStart(4, '0')
  return b + luhn(b)
}

/** Returns the patient number, or null if the code is malformed or mistyped. */
export function parseCode(code: string): number | null {
  const c = code.replace(/\D/g, '')
  if (c.length !== 5) return null
  const b = c.slice(0, 4)
  if (luhn(b) !== Number(c[4])) return null
  return Number(b)
}

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

/** The doctor reduces a fee already collected. The counter owes the difference. */
export async function grantDiscount(id: string, newAmount: number, note?: string) {
  const v = await db.visits.get(id)
  if (!v?.fee) return
  const back = Math.max(0, v.fee.amount - Math.max(0, newAmount))
  await db.visits.update(id, {
    fee: { ...v.fee, refund: back || undefined, refundNote: note?.trim() || undefined,
           refundedAt: undefined, state: newAmount === 0 ? 'waived' : v.fee.state },
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
  }
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
